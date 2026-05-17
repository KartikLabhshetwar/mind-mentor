import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import Groq from "groq-sdk";
import { Env } from "../types/index.js";
import { verifyUserAuth } from "../middleware/auth.js";
import { createMem0Client, getUserMemories, addUserMemory } from "../memory/mem0Client.js";
import { createExpressClient } from "../api/expressClient.js";

export const tutorRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

tutorRoutes.use("*", verifyUserAuth);

tutorRoutes.post("/chat", async (c) => {
  const userId = c.get("userId");
  const { message, context } = await c.req.json<{
    message: string;
    context?: { page?: string; subject?: string; command?: string };
  }>();

  const groq = new Groq({ apiKey: c.env.GROQ_API_KEY });
  const mem0 = createMem0Client(c.env);
  const express = createExpressClient(c.env);

  const command = context?.command;
  const commandArg = command && message.startsWith("/")
    ? message.slice(message.indexOf(" ") + 1).trim()
    : message;

  // Handle /resources command — call Tavily via Express backend
  if (command === "resources" && commandArg) {
    return streamSSE(c, async (stream) => {
      try {
        await stream.writeSSE({ data: `Searching for resources on **${commandArg}**...\n\n` });

        const result = await express.curateResources(userId, commandArg);

        if (!result || !result.success) {
          const errorMsg = result?.message || "Failed to find resources. Try again.";
          await stream.writeSSE({ data: errorMsg });
          await stream.writeSSE({ event: "done", data: "" });
          return;
        }

        const resources = result.resources?.resources || [];
        if (resources.length > 0) {
          const items = resources.map((r: { title: string; link: string; description: string }) => ({
            title: r.title,
            url: r.link,
            description: r.description,
          }));
          await stream.writeSSE({ event: "resources", data: JSON.stringify({ items }) });
          await stream.writeSSE({ data: `\n\nFound **${items.length}** resources for "${commandArg}". Click any to open.` });
        } else {
          await stream.writeSSE({ data: "No resources found for that topic. Try a different search term." });
        }

        await stream.writeSSE({ event: "done", data: "" });

        addUserMemory(mem0, userId, `User searched for resources on: "${commandArg}"`, "resource_search");
      } catch (error) {
        console.error("Resource curation error:", error);
        await stream.writeSSE({ data: "Something went wrong while searching for resources." });
        await stream.writeSSE({ event: "done", data: "" });
      }
    });
  }

  // Default: regular chat with mem0 context
  const memories = await getUserMemories(mem0, userId, message);
  const memoryContext = Array.isArray(memories) && memories.length > 0
    ? memories.map((m: any) => m.memory || m.content || "").filter(Boolean).join("\n")
    : "No prior context available for this user.";

  const systemPrompt = `You are Mind Mentor, a personalized AI tutor. You adapt to the user's level and learning style.

What you know about this user:
${memoryContext}

${context?.subject ? `Current subject: ${context.subject}` : ""}
${context?.page ? `User is on page: ${context.page}` : ""}

Instructions:
- Be concise and clear
- Use examples relevant to the user's domain
- Ask follow-up questions to gauge understanding
- If you notice something new about the user (struggles, preferences, breakthroughs), note it naturally`;

  return streamSSE(c, async (stream) => {
    try {
      const completion = await groq.chat.completions.create({
        model: "qwen/qwen3-32b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
      });

      let fullResponse = "";

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          await stream.writeSSE({ data: content });
        }
      }

      await stream.writeSSE({ event: "done", data: "" });

      // Save to mem0 (non-blocking)
      const observation = message.length > 20
        ? `User asked about: "${message.slice(0, 100)}". Discussion covered this topic.`
        : null;
      if (observation) {
        addUserMemory(mem0, userId, observation, "session_context");
      }

      // Extract topics and update mastery (non-blocking)
      extractAndUpdateTopics(groq, express, userId, message, fullResponse).catch(() => {});
    } catch (error) {
      await stream.writeSSE({ event: "error", data: "Failed to generate response" });
    }
  });
});

async function extractAndUpdateTopics(
  groq: InstanceType<typeof Groq>,
  express: ReturnType<typeof createExpressClient>,
  userId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [
        {
          role: "system",
          content: `Extract the main topic(s) discussed in this tutoring exchange. Return valid JSON only, no other text.
Format: {"topics": [{"topic": "specific topic name", "subject": "broad subject area", "quality": 3}]}
- topic: specific concept discussed (e.g. "quadratic equations", "photosynthesis", "recursion")
- subject: broad category (e.g. "Mathematics", "Biology", "Computer Science")
- quality: 0-5 rating of how well the student seems to understand (3 = average, 5 = mastered)
Return empty array if no clear educational topic is discussed.`,
        },
        {
          role: "user",
          content: `Student: ${userMessage.slice(0, 500)}\n\nTutor: ${assistantResponse.slice(0, 500)}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
      stream: false,
    });

    const rawContent = completion.choices[0]?.message?.content || '{"topics":[]}';
    const content = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{"topics":[]}');

    for (const t of result.topics || []) {
      if (!t.topic || !t.subject) continue;
      await express.updateTopicMastery(userId, {
        topic: t.topic,
        subject: t.subject,
        mastery: (t.quality || 3) * 20,
        lastReviewed: new Date().toISOString(),
        quality: t.quality || 3,
      });
    }
  } catch {
    // Non-critical — don't block chat
  }
}
