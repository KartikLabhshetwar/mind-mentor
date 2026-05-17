import { Hono } from "hono";
import Groq from "groq-sdk";
import { Env, AnalysisResult } from "../types/index.js";
import { verifyUserAuth } from "../middleware/auth.js";
import { createMem0Client, getUserMemories, addUserMemory } from "../memory/mem0Client.js";
import { createExpressClient } from "../api/expressClient.js";
import { calculateMasteryScore } from "../intelligence/sm2.js";
import { detectPatterns, StudySession } from "../intelligence/patterns.js";
import { KnowledgeGraph } from "../intelligence/knowledgeGraph.js";

export const analystRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

analystRoutes.use("*", verifyUserAuth);

analystRoutes.post("/analyze", async (c) => {
  const userId = c.get("userId");
  const { type } = await c.req.json<{ type: "full" | "quick" }>();

  const express = createExpressClient(c.env);
  const mem0 = createMem0Client(c.env);
  const groq = new Groq({ apiKey: c.env.GROQ_API_KEY });

  const sessionsData = await express.getStudySessions(userId) as any;
  const masteryData = await express.getTopicMastery(userId) as any[];

  // Pattern detection
  const sessions: StudySession[] = (sessionsData?.sessions || []).map((s: any) => ({
    date: s.date,
    startHour: s.startHour,
    duration: s.duration,
    subject: s.subject,
  }));
  const patterns = detectPatterns(sessions);

  // Build knowledge graph
  const graph = new KnowledgeGraph();
  for (const topic of masteryData || []) {
    graph.addNode({
      id: topic._id || topic.topic,
      topic: topic.topic,
      subject: topic.subject,
      mastery: calculateMasteryScore(
        topic.sm2?.easiness || 2.5,
        topic.sm2?.repetitions || 0,
        daysSince(topic.lastReviewed)
      ),
    });
    for (const prereq of topic.prerequisites || []) {
      graph.addEdge(prereq, topic._id || topic.topic, "prerequisite");
    }
  }

  // Full analysis: infer prerequisites via LLM
  if (type === "full" && graph.getNodes().length > 1) {
    const topics = graph.getNodes().map(n => n.topic);
    const inferredEdges = await inferPrerequisites(groq, topics);
    for (const edge of inferredEdges) {
      const sourceNode = graph.getNodes().find(n => n.topic === edge.from);
      const targetNode = graph.getNodes().find(n => n.topic === edge.to);
      if (sourceNode && targetNode) {
        graph.addEdge(sourceNode.id, targetNode.id, "prerequisite");
      }
    }
  }

  // SM-2 schedule
  const spacedRepetition = (masteryData || []).map((topic: any) => ({
    topic: topic.topic,
    repetitions: topic.sm2?.repetitions || 0,
    easiness: topic.sm2?.easiness || 2.5,
    interval: topic.sm2?.interval || 1,
    nextReview: calculateNextReview(topic.sm2, topic.lastReviewed),
  }));

  // Recommendations
  const recommendations = await generateRecommendations(groq, patterns, graph);

  // Store summary in mem0
  const insightSummary = `Optimal study time: ${patterns.optimalStudyTime}. Avg session: ${patterns.avgSessionDuration}min. Weak topics: ${graph.suggestNext().slice(0, 3).map(n => n.topic).join(", ")}`;
  await addUserMemory(mem0, userId, insightSummary, "learning_pattern");

  const result: AnalysisResult = {
    patterns,
    knowledgeGraph: graph.toJSON(),
    spacedRepetition,
    recommendations,
  };

  return c.json(result);
});

analystRoutes.get("/insights", async (c) => {
  const userId = c.get("userId");
  const mem0 = createMem0Client(c.env);
  const memories = await getUserMemories(mem0, userId, "learning patterns insights analysis");
  return c.json({ memories, cached: true });
});

async function inferPrerequisites(groq: InstanceType<typeof Groq>, topics: string[]): Promise<Array<{ from: string; to: string }>> {
  try {
    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [
        { role: "system", content: "You identify prerequisite relationships between topics. Return valid JSON only, no other text." },
        { role: "user", content: `Given these topics: ${JSON.stringify(topics)}\nIdentify prerequisite relationships. Return: {"edges": [{"from": "topic_a", "to": "topic_b"}]}` },
      ],
      max_tokens: 500,
      temperature: 0.3,
      stream: false,
    });
    const content = completion.choices[0]?.message?.content || '{"edges":[]}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{"edges":[]}');
    return result.edges || [];
  } catch {
    return [];
  }
}

async function generateRecommendations(groq: InstanceType<typeof Groq>, patterns: ReturnType<typeof detectPatterns>, graph: KnowledgeGraph): Promise<string[]> {
  const nextTopics = graph.suggestNext().slice(0, 3);
  const gaps = graph.getNodes().filter(n => n.mastery < 30);

  try {
    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [
        { role: "system", content: "Generate 3-5 concise study recommendations. Return valid JSON only: {\"recommendations\": [\"...\"]}" },
        { role: "user", content: `Study patterns: ${JSON.stringify(patterns)}\nSuggested next: ${nextTopics.map(n => n.topic).join(", ")}\nWeak areas: ${gaps.map(n => n.topic).join(", ")}` },
      ],
      max_tokens: 300,
      temperature: 0.7,
      stream: false,
    });
    const content = completion.choices[0]?.message?.content || '{"recommendations":[]}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{"recommendations":[]}');
    return result.recommendations || [];
  } catch {
    return ["Continue reviewing weak topics", "Maintain your study streak"];
  }
}

function daysSince(date?: string): number {
  if (!date) return 30;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function calculateNextReview(sm2?: { repetitions: number; easiness: number; interval: number }, lastReviewed?: string): Date {
  if (!sm2 || !lastReviewed) return new Date();
  const next = new Date(lastReviewed);
  next.setDate(next.getDate() + sm2.interval);
  return next;
}
