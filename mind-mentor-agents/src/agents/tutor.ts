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
    context?: { page?: string; subject?: string };
  }>();

  const groq = new Groq({ apiKey: c.env.GROQ_API_KEY });
  const mem0 = createMem0Client(c.env);
  const express = createExpressClient(c.env);

  // Fetch user context from mem0
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

      // Save interaction to mem0 (non-blocking)
      const observation = message.length > 20
        ? `User asked about: "${message.slice(0, 100)}". Discussion covered this topic.`
        : null;
      if (observation) {
        addUserMemory(mem0, userId, observation, "session_context");
      }

      // Persist chat history
      express.saveChatMessage(userId, [
        { role: "user", content: message, timestamp: new Date() },
        { role: "assistant", content: fullResponse, timestamp: new Date() },
      ]);
    } catch (error) {
      await stream.writeSSE({ event: "error", data: "Failed to generate response" });
    }
  });
});
