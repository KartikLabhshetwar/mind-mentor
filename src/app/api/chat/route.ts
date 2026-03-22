import { streamText, convertToModelMessages, UIMessage, tool } from 'ai';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getModel, ModelId } from '@/lib/ai/providers';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { connectMongoDB } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import StudyStats from '@/models/StudyStats';
import PdfDocument from '@/models/PdfDocument';
import { embedText, cosineSimilarity } from '@/lib/ai/embeddings';

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages, conversationId, model: modelId = 'groq' }:
    { messages: UIMessage[]; conversationId?: string; model?: ModelId } = await req.json();

  await connectMongoDB();
  const userId = session.user.id;

  const result = streamText({
    model: getModel(modelId as ModelId),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      generateStudyPlan: tool({
        description: 'Generate a personalized study plan for a subject. Use when the user asks to create a study plan, schedule, or learning roadmap.',
        inputSchema: z.object({
          subject: z.string().describe('The subject to study'),
          durationWeeks: z.number().default(4).describe('Duration in weeks'),
          hoursPerDay: z.number().default(2).describe('Hours available per day'),
          examDate: z.string().optional().describe('Target exam date if any'),
        }),
        execute: async ({ subject, durationWeeks, hoursPerDay, examDate }) => {
          return { subject, durationWeeks, hoursPerDay, examDate: examDate || null, status: 'generated' };
        },
      }),

      searchResources: tool({
        description: 'Search and curate learning resources on a topic. Use when the user asks to find courses, tutorials, videos, or learning materials.',
        inputSchema: z.object({
          topic: z.string().describe('The topic to search resources for'),
          type: z.enum(['all', 'video', 'article', 'course', 'book']).default('all').describe('Type of resource'),
        }),
        execute: async ({ topic, type }) => {
          const tavilyKey = process.env.TAVILY_API_KEY;
          if (!tavilyKey) return { topic, resources: [], error: 'Search API not configured' };

          try {
            const searchQuery = `best ${type === 'all' ? '' : type} resources to learn ${topic} site:coursera.org OR site:khanacademy.org OR site:freecodecamp.org OR site:udemy.com OR site:youtube.com`;
            const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ api_key: tavilyKey, query: searchQuery, max_results: 8 }),
            });
            const data = await response.json();
            return {
              topic,
              resources: (data.results || []).map((r: any) => ({
                title: r.title,
                url: r.url,
                snippet: r.content?.slice(0, 200),
              })),
            };
          } catch {
            return { topic, resources: [], error: 'Search failed' };
          }
        },
      }),

      analyzePDF: tool({
        description: 'Answer a question about an uploaded PDF document. Use when the user asks about content in their uploaded PDF.',
        inputSchema: z.object({
          question: z.string().describe('The question to answer about the PDF'),
          documentId: z.string().describe('The PDF document ID'),
        }),
        execute: async ({ question, documentId }) => {
          try {
            const doc = await PdfDocument.findById(documentId);
            if (!doc) return { error: 'Document not found', documentTitle: '', relevantChunks: [] };

            const queryEmbedding = await embedText(question);
            const chunks = doc.documentChunks
              .filter((c: any) => c.embedding?.length)
              .map((c: any) => ({
                text: c.text,
                page: c.pageNumber,
                similarity: cosineSimilarity(queryEmbedding, c.embedding),
              }))
              .sort((a: any, b: any) => b.similarity - a.similarity)
              .slice(0, 5);

            return {
              documentTitle: doc.title,
              relevantChunks: chunks.map((c: any) => ({ text: c.text, page: c.page })),
            };
          } catch {
            return { error: 'Failed to analyze PDF', documentTitle: '', relevantChunks: [] };
          }
        },
      }),

      getStudyStats: tool({
        description: 'Get user study statistics including streaks, hours, and daily activity.',
        inputSchema: z.object({}),
        execute: async () => {
          const stats = await StudyStats.findOne({ userId });
          if (!stats) return { currentStreak: 0, bestStreak: 0, totalStudyHours: 0, dailySessions: {} };
          return {
            currentStreak: stats.currentStreak || 0,
            bestStreak: stats.bestStreak || 0,
            totalStudyHours: stats.totalStudyHours || 0,
            dailySessions: stats.dailySessions || {},
          };
        },
      }),

      startTimer: tool({
        description: 'Start a pomodoro focus timer. Use when the user wants to start a study/focus session.',
        inputSchema: z.object({
          duration: z.number().default(25).describe('Duration in minutes'),
          type: z.enum(['focus', 'break']).default('focus'),
        }),
        execute: async ({ duration, type }) => {
          return { duration, type, started: true };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
