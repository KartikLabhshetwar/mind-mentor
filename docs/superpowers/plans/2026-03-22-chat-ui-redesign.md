# Mind-Mentor Chat UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform mind-mentor from a multi-page dashboard with Express backend into a single-page ChatGPT/Claude-style learning agent using Vercel AI SDK v6.

**Architecture:** Next.js App Router with `useChat` from `@ai-sdk/react` streaming to `/api/chat` route handler using `streamText`. Multi-provider support (Groq/Claude/OpenAI). shadcn Sidebar for navigation, AI Elements for chat UI, slide-over panels for library/stats.

**Tech Stack:** Next.js 14, Vercel AI SDK v6, @ai-sdk/react, @ai-sdk/groq, @ai-sdk/anthropic, @ai-sdk/openai, @huggingface/inference, shadcn/ui (sidebar, sheet), AI Elements (message, composer, thread), MongoDB/Mongoose, NextAuth, Zustand, Tailwind CSS

---

## File Structure

```
src/
├── app/
│   ├── chat/
│   │   ├── layout.tsx              # Chat layout with sidebar + main area
│   │   ├── page.tsx                # New conversation page
│   │   └── [conversationId]/
│   │       └── page.tsx            # Existing conversation page
│   ├── api/
│   │   └── chat/
│   │       └── route.ts            # AI streaming route handler
│   ├── (auth)/                     # Keep signin/register
│   └── layout.tsx                  # Root layout (keep)
├── components/
│   ├── chat/
│   │   ├── chat-page.tsx           # Main chat client component (useChat)
│   │   ├── chat-thread.tsx         # Message thread with auto-scroll
│   │   ├── chat-message.tsx        # Single message bubble
│   │   ├── chat-composer.tsx       # Input bar with attachments
│   │   └── tool-results/
│   │       ├── study-plan-card.tsx  # Study plan tool result
│   │       ├── resource-grid.tsx   # Resource search tool result
│   │       ├── pdf-response.tsx    # PDF analysis tool result
│   │       ├── stats-widget.tsx    # Study stats tool result
│   │       └── tool-renderer.tsx   # Maps tool names to components
│   ├── sidebar/
│   │   ├── app-sidebar.tsx         # Main sidebar component
│   │   ├── conversation-list.tsx   # Grouped conversation history
│   │   ├── model-selector.tsx      # Model dropdown
│   │   └── sidebar-footer.tsx      # User avatar + settings
│   ├── panels/
│   │   ├── library-panel.tsx       # Slide-over for saved items
│   │   └── stats-panel.tsx         # Slide-over for study stats
│   ├── widgets/
│   │   └── timer-widget.tsx        # Floating pomodoro timer
│   └── ui/                        # shadcn components (existing + new)
│       ├── sidebar.tsx             # shadcn sidebar (new)
│       └── sheet.tsx               # shadcn sheet (new)
├── lib/
│   ├── ai/
│   │   ├── providers.ts           # Multi-provider registry
│   │   ├── tools.ts               # AI tool definitions
│   │   ├── embeddings.ts          # HuggingFace embedding wrapper
│   │   └── system-prompt.ts       # System prompt
│   └── db.ts                      # MongoDB connection (keep)
├── models/
│   ├── Conversation.ts            # New: conversation + messages
│   ├── PdfDocument.ts             # Ported from server/models
│   ├── User.ts                    # Keep, add preferredModel
│   ├── StudyPlan.ts               # Keep
│   ├── StudyStats.ts              # Keep
│   └── CuratedResource.ts         # Keep
└── store/
    └── app-store.ts               # Zustand: sidebar, timer, model state
```

---

## Task 1: Install Dependencies & Setup Shadcn Components

**Files:**
- Modify: `package.json`
- Create: `src/components/ui/sidebar.tsx`
- Create: `src/components/ui/sheet.tsx`

**Parallel group:** Can run independently. No dependencies.

- [ ] **Step 1: Install Vercel AI SDK v6 + providers**

```bash
npm install ai @ai-sdk/react @ai-sdk/groq @ai-sdk/anthropic @ai-sdk/openai
```

- [ ] **Step 2: Install HuggingFace inference for embeddings**

```bash
npm install @huggingface/inference
```

- [ ] **Step 3: Add shadcn sidebar component**

```bash
npx shadcn@latest add sidebar
```

- [ ] **Step 4: Add shadcn sheet component**

```bash
npx shadcn@latest add sheet
```

- [ ] **Step 5: Add AI Elements message component**

```bash
npx ai-elements@latest add message
```

- [ ] **Step 6: Add AI Elements thread component**

```bash
npx ai-elements@latest add thread
```

- [ ] **Step 7: Add AI Elements composer component**

```bash
npx ai-elements@latest add composer
```

- [ ] **Step 8: Verify installation**

Run: `npm run build`
Expected: Build succeeds with new dependencies

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: install AI SDK v6, shadcn sidebar/sheet, AI Elements"
```

---

## Task 2: Database Models (Conversation + PdfDocument Port)

**Files:**
- Create: `src/models/Conversation.ts`
- Create: `src/models/PdfDocument.ts`
- Modify: `src/models/User.ts`

**Parallel group:** Can run independently. No dependencies.

- [ ] **Step 1: Create Conversation model**

Create `src/models/Conversation.ts`:
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface IAttachment {
  type: 'pdf';
  documentId: mongoose.Types.ObjectId;
}

export interface IMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: IToolCall[];
  attachments?: IAttachment[];
  createdAt: Date;
}

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  model: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ToolCallSchema = new Schema({
  toolName: { type: String, required: true },
  args: { type: Schema.Types.Mixed, default: {} },
  result: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

const AttachmentSchema = new Schema({
  type: { type: String, enum: ['pdf'], required: true },
  documentId: { type: Schema.Types.ObjectId, ref: 'PdfDocument' },
}, { _id: false });

const MessageSchema = new Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, default: '' },
  toolCalls: [ToolCallSchema],
  attachments: [AttachmentSchema],
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const ConversationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  model: { type: String, default: 'groq' },
  messages: [MessageSchema],
}, { timestamps: true });

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);
```

- [ ] **Step 2: Port PdfDocument model from server**

Create `src/models/PdfDocument.ts` — port from `server/models/pdfDocument.js`, add `conversationId` field:
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentChunk {
  text: string;
  pageNumber: number;
  embedding?: number[];
}

export interface IPdfDocument extends Document {
  userId: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  title: string;
  pdfData: string; // base64
  pageCount: number;
  documentChunks: IDocumentChunk[];
  createdAt: Date;
}

const DocumentChunkSchema = new Schema({
  text: { type: String, required: true },
  pageNumber: { type: Number, required: true },
  embedding: [Number],
}, { _id: false });

const PdfDocumentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', index: true },
  title: { type: String, required: true },
  pdfData: { type: String, required: true },
  pageCount: { type: Number, default: 0 },
  documentChunks: [DocumentChunkSchema],
}, { timestamps: true });

export default mongoose.models.PdfDocument ||
  mongoose.model<IPdfDocument>('PdfDocument', PdfDocumentSchema);
```

- [ ] **Step 3: Add preferredModel to User model**

Modify `src/models/User.ts` — add `preferredModel` field:
```typescript
preferredModel: { type: String, default: 'groq', enum: ['groq', 'anthropic', 'openai'] },
```

- [ ] **Step 4: Commit**

```bash
git add src/models/Conversation.ts src/models/PdfDocument.ts src/models/User.ts
git commit -m "feat: add Conversation model, port PdfDocument, add preferredModel to User"
```

---

## Task 3: AI Provider Registry & System Prompt

**Files:**
- Create: `src/lib/ai/providers.ts`
- Create: `src/lib/ai/system-prompt.ts`
- Create: `src/lib/ai/embeddings.ts`

**Parallel group:** Can run independently. No dependencies.

- [ ] **Step 1: Create multi-provider registry**

Create `src/lib/ai/providers.ts`:
```typescript
import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createGroq();
const anthropic = createAnthropic();
const openai = createOpenAI();

export const models = {
  groq: groq('llama-3.3-70b-versatile'),
  anthropic: anthropic('claude-sonnet-4-20250514'),
  openai: openai('gpt-4o'),
} as const;

export type ModelId = keyof typeof models;

export function getModel(id: ModelId) {
  return models[id];
}
```

- [ ] **Step 2: Create system prompt**

Create `src/lib/ai/system-prompt.ts` — port and unify prompts from `server/services/aiService.js` and `server/services/pdfService.js`:
```typescript
export const SYSTEM_PROMPT = `You are Mind-Mentor, an AI-powered learning assistant. You help students learn effectively by:

1. **Answering Questions**: Provide clear, well-structured explanations on any topic
2. **Creating Study Plans**: Generate personalized study schedules with weekly breakdowns
3. **Finding Resources**: Search and curate learning resources from top educational platforms
4. **Analyzing Documents**: Help users understand uploaded PDFs by answering questions about their content
5. **Tracking Progress**: Help users monitor their study streaks and sessions

You have access to tools for these tasks. Use them when the user's request matches a tool's purpose.

Guidelines:
- Be encouraging and supportive
- Break complex topics into digestible parts
- Use markdown formatting for readability
- When creating study plans, consider the user's timeline and pace
- When analyzing PDFs, cite specific page numbers and excerpts
- Suggest follow-up questions to deepen understanding`;
```

- [ ] **Step 3: Create HuggingFace embedding wrapper**

Create `src/lib/ai/embeddings.ts`:
```typescript
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN);

export async function embedText(text: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: text,
  });
  return Array.from(result as number[]);
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(texts.map(embedText));
  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/
git commit -m "feat: add AI provider registry, system prompt, and embedding utils"
```

---

## Task 4: AI Tools (Study Plan, Resources, PDF, Stats, Timer)

**Files:**
- Create: `src/lib/ai/tools.ts`

**Depends on:** Task 2 (models), Task 3 (providers, embeddings)

- [ ] **Step 1: Create tools file with all tool definitions**

Create `src/lib/ai/tools.ts`:
```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import StudyPlan from '@/models/StudyPlan';
import CuratedResource from '@/models/CuratedResource';
import StudyStats from '@/models/StudyStats';
import PdfDocument from '@/models/PdfDocument';
import { embedText, cosineSimilarity } from './embeddings';

export const aiTools = {
  generateStudyPlan: tool({
    description: 'Generate a personalized study plan for a subject. Use when the user asks to create a study plan, schedule, or learning roadmap.',
    inputSchema: z.object({
      subject: z.string().describe('The subject to study'),
      durationWeeks: z.number().default(4).describe('Duration in weeks'),
      hoursPerDay: z.number().default(2).describe('Hours available per day'),
      examDate: z.string().optional().describe('Target exam date if any'),
    }),
  }),

  searchResources: tool({
    description: 'Search and curate learning resources on a topic. Use when the user asks to find courses, tutorials, videos, or learning materials.',
    inputSchema: z.object({
      topic: z.string().describe('The topic to search resources for'),
      type: z.enum(['all', 'video', 'article', 'course', 'book']).default('all').describe('Type of resource'),
    }),
  }),

  analyzePDF: tool({
    description: 'Answer a question about an uploaded PDF document. Use when the user asks about content in their uploaded PDF.',
    inputSchema: z.object({
      question: z.string().describe('The question to answer about the PDF'),
      documentId: z.string().describe('The PDF document ID'),
    }),
  }),

  summarizePDF: tool({
    description: 'Summarize an uploaded PDF document. Use when the user asks for a summary of their PDF.',
    inputSchema: z.object({
      documentId: z.string().describe('The PDF document ID'),
    }),
  }),

  getStudyStats: tool({
    description: 'Get the user study statistics including streaks, hours, and daily activity. Use when the user asks about their progress or stats.',
    inputSchema: z.object({}),
  }),

  startTimer: tool({
    description: 'Start a pomodoro focus timer. Use when the user wants to start a study/focus session.',
    inputSchema: z.object({
      duration: z.number().default(25).describe('Duration in minutes'),
      type: z.enum(['focus', 'break']).default('focus'),
    }),
  }),

  saveItem: tool({
    description: 'Save a study plan or resource collection. Use when the user asks to save something.',
    inputSchema: z.object({
      itemType: z.enum(['studyPlan', 'resource']),
      itemId: z.string(),
    }),
  }),
};
```

Note: Tools are defined without `execute` functions here — they are server-executed in the route handler where we have access to the session and DB. The route handler will provide the execute logic.

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/tools.ts
git commit -m "feat: define AI SDK tools for study plans, resources, PDF, stats, timer"
```

---

## Task 5: Chat API Route Handler

**Files:**
- Create: `src/app/api/chat/route.ts`

**Depends on:** Task 3 (providers), Task 4 (tools)

- [ ] **Step 1: Create the streaming chat route handler**

Create `src/app/api/chat/route.ts`:
```typescript
import { streamText, convertToModelMessages, UIMessage, tool } from 'ai';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getModel, ModelId } from '@/lib/ai/providers';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import dbConnect from '@/lib/db';
import Conversation from '@/models/Conversation';
import StudyPlan from '@/models/StudyPlan';
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

  await dbConnect();
  const userId = session.user.id;

  const result = streamText({
    model: getModel(modelId),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      generateStudyPlan: tool({
        description: 'Generate a personalized study plan for a subject.',
        inputSchema: z.object({
          subject: z.string(),
          durationWeeks: z.number().default(4),
          hoursPerDay: z.number().default(2),
          examDate: z.string().optional(),
        }),
        execute: async ({ subject, durationWeeks, hoursPerDay, examDate }) => {
          // The LLM will generate the plan content in its response
          // We just structure the metadata
          return {
            subject,
            durationWeeks,
            hoursPerDay,
            examDate: examDate || null,
            status: 'generated',
          };
        },
      }),

      searchResources: tool({
        description: 'Search and curate learning resources on a topic.',
        inputSchema: z.object({
          topic: z.string(),
          type: z.enum(['all', 'video', 'article', 'course', 'book']).default('all'),
        }),
        execute: async ({ topic, type }) => {
          // Use Tavily API for web search
          const tavilyKey = process.env.TAVILY_API_KEY;
          if (!tavilyKey) return { resources: [], error: 'Search API not configured' };

          const searchQuery = `best ${type === 'all' ? '' : type} resources to learn ${topic} site:coursera.org OR site:khanacademy.org OR site:freecodecamp.org OR site:udemy.com OR site:youtube.com`;
          const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: searchQuery,
              max_results: 8,
            }),
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
        },
      }),

      analyzePDF: tool({
        description: 'Answer a question about an uploaded PDF document.',
        inputSchema: z.object({
          question: z.string(),
          documentId: z.string(),
        }),
        execute: async ({ question, documentId }) => {
          const doc = await PdfDocument.findById(documentId);
          if (!doc) return { error: 'Document not found' };

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
            relevantChunks: chunks.map((c: any) => ({
              text: c.text,
              page: c.page,
            })),
          };
        },
      }),

      getStudyStats: tool({
        description: 'Get user study statistics.',
        inputSchema: z.object({}),
        execute: async () => {
          const stats = await StudyStats.findOne({ userId });
          if (!stats) return { streak: 0, totalHours: 0, sessions: {} };
          return {
            currentStreak: stats.currentStreak || 0,
            bestStreak: stats.bestStreak || 0,
            totalStudyHours: stats.totalStudyHours || 0,
            dailySessions: stats.dailySessions || {},
          };
        },
      }),

      startTimer: tool({
        description: 'Start a pomodoro focus timer.',
        inputSchema: z.object({
          duration: z.number().default(25),
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
```

- [ ] **Step 2: Verify the route compiles**

Run: `npx tsc --noEmit src/app/api/chat/route.ts` or `npm run build`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add streaming chat API route with multi-provider tools"
```

---

## Task 6: Shadcn Sidebar with Conversation History

**Files:**
- Create: `src/components/sidebar/app-sidebar.tsx`
- Create: `src/components/sidebar/conversation-list.tsx`
- Create: `src/components/sidebar/model-selector.tsx`
- Create: `src/components/sidebar/sidebar-footer.tsx`

**Depends on:** Task 1 (shadcn sidebar installed)

- [ ] **Step 1: Create model selector**

Create `src/components/sidebar/model-selector.tsx`:
```typescript
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModelId } from '@/lib/ai/providers';

interface ModelSelectorProps {
  value: ModelId;
  onChange: (value: ModelId) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ModelId)}>
      <SelectTrigger className="w-full bg-[#2D4D69] border-[#497D74] text-[#D5EBE7]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#27445D] border-[#497D74]">
        <SelectItem value="groq" className="text-[#D5EBE7]">Groq (Llama 3.3)</SelectItem>
        <SelectItem value="anthropic" className="text-[#D5EBE7]">Claude (Sonnet)</SelectItem>
        <SelectItem value="openai" className="text-[#D5EBE7]">GPT-4o</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: Create conversation list**

Create `src/components/sidebar/conversation-list.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
}

interface ConversationListProps {
  conversations: Conversation[];
}

function groupByDate(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 Days', items: [] },
    { label: 'Older', items: [] },
  ];

  conversations.forEach((c) => {
    const date = new Date(c.createdAt);
    if (date >= today) groups[0].items.push(c);
    else if (date >= yesterday) groups[1].items.push(c);
    else if (date >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  });

  return groups.filter((g) => g.items.length > 0);
}

export function ConversationList({ conversations }: ConversationListProps) {
  const params = useParams();
  const activeId = params?.conversationId;

  const groups = groupByDate(conversations);

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {groups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 mb-1 text-xs font-medium text-[#8AC7C0] uppercase tracking-wider">
            {group.label}
          </p>
          {group.items.map((conv) => (
            <Link
              key={conv._id}
              href={`/chat/${conv._id}`}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                'hover:bg-[#2D4D69]',
                activeId === conv._id
                  ? 'bg-[#335775] text-white'
                  : 'text-[#A3D3CD]'
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">{conv.title}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create sidebar footer**

Create `src/components/sidebar/sidebar-footer.tsx`:
```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SidebarFooter() {
  const { data: session } = useSession();

  return (
    <div className="p-3 border-t border-[#335775]">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-[#2D4D69] transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#497D74] flex items-center justify-center text-white text-sm font-medium">
            {session?.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-sm text-[#D5EBE7] truncate">
            {session?.user?.name || 'User'}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-[#27445D] border-[#497D74]">
          <DropdownMenuItem className="text-[#D5EBE7]">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[#D5EBE7]"
            onClick={() => signOut({ callbackUrl: '/signin' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

- [ ] **Step 4: Create main app sidebar**

Create `src/components/sidebar/app-sidebar.tsx`:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Plus, BookOpen, BarChart3, Timer } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter as ShadcnSidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ConversationList } from './conversation-list';
import { ModelSelector } from './model-selector';
import { SidebarFooter } from './sidebar-footer';
import { ModelId } from '@/lib/ai/providers';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  conversations: Array<{ _id: string; title: string; createdAt: string }>;
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  onOpenLibrary: () => void;
  onOpenStats: () => void;
  onOpenTimer: () => void;
}

export function AppSidebar({
  conversations,
  selectedModel,
  onModelChange,
  onOpenLibrary,
  onOpenStats,
  onOpenTimer,
}: AppSidebarProps) {
  const router = useRouter();

  return (
    <Sidebar className="bg-[#27445D] border-r border-[#335775]">
      <SidebarHeader className="p-3 space-y-3">
        <Button
          onClick={() => router.push('/chat')}
          className="w-full bg-[#497D74] hover:bg-[#538B81] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <ModelSelector value={selectedModel} onChange={onModelChange} />
      </SidebarHeader>

      <SidebarContent>
        <ConversationList conversations={conversations} />
      </SidebarContent>

      <ShadcnSidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenLibrary} className="text-[#A3D3CD] hover:bg-[#2D4D69]">
                  <BookOpen className="h-4 w-4" />
                  <span>My Library</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenStats} className="text-[#A3D3CD] hover:bg-[#2D4D69]">
                  <BarChart3 className="h-4 w-4" />
                  <span>Stats</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenTimer} className="text-[#A3D3CD] hover:bg-[#2D4D69]">
                  <Timer className="h-4 w-4" />
                  <span>Timer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarFooter />
      </ShadcnSidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar/
git commit -m "feat: add ChatGPT-style sidebar with conversation history and model selector"
```

---

## Task 7: Chat UI Components (Thread, Message, Composer, Tool Renderer)

**Files:**
- Create: `src/components/chat/chat-thread.tsx`
- Create: `src/components/chat/chat-message.tsx`
- Create: `src/components/chat/chat-composer.tsx`
- Create: `src/components/chat/tool-results/tool-renderer.tsx`
- Create: `src/components/chat/tool-results/study-plan-card.tsx`
- Create: `src/components/chat/tool-results/resource-grid.tsx`
- Create: `src/components/chat/tool-results/pdf-response.tsx`
- Create: `src/components/chat/tool-results/stats-widget.tsx`

**Depends on:** Task 1 (AI Elements installed)

- [ ] **Step 1: Create tool result components**

Create `src/components/chat/tool-results/study-plan-card.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudyPlanCardProps {
  data: {
    subject: string;
    durationWeeks: number;
    hoursPerDay: number;
    examDate?: string;
    status: string;
  };
}

export function StudyPlanCard({ data }: StudyPlanCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-[#FBFAF8] border border-[#D5EBE7] rounded-xl p-4 my-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#497D74]" />
          <h3 className="font-lexend font-semibold text-[#27445D]">
            Study Plan: {data.subject}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[#497D74]">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <button onClick={() => setExpanded(!expanded)} className="text-[#497D74]">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 text-sm text-[#335775] space-y-1">
          <p><strong>Duration:</strong> {data.durationWeeks} weeks</p>
          <p><strong>Daily Hours:</strong> {data.hoursPerDay}h</p>
          {data.examDate && <p><strong>Exam Date:</strong> {data.examDate}</p>}
        </div>
      )}
    </div>
  );
}
```

Create `src/components/chat/tool-results/resource-grid.tsx`:
```typescript
'use client';

import { ExternalLink, Video, FileText, GraduationCap, BookOpen } from 'lucide-react';

interface Resource {
  title: string;
  url: string;
  snippet?: string;
}

interface ResourceGridProps {
  data: {
    topic: string;
    resources: Resource[];
  };
}

function getIcon(url: string) {
  if (url.includes('youtube')) return <Video className="h-4 w-4 text-red-500" />;
  if (url.includes('coursera') || url.includes('udemy')) return <GraduationCap className="h-4 w-4 text-blue-500" />;
  return <FileText className="h-4 w-4 text-[#497D74]" />;
}

export function ResourceGrid({ data }: ResourceGridProps) {
  return (
    <div className="my-2">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-5 w-5 text-[#497D74]" />
        <h3 className="font-lexend font-semibold text-[#27445D]">
          Resources: {data.topic}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {data.resources.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 bg-[#FBFAF8] border border-[#D5EBE7] rounded-lg hover:border-[#71BBB2] transition-colors"
          >
            <div className="mt-0.5">{getIcon(r.url)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#27445D] truncate">{r.title}</p>
              {r.snippet && <p className="text-xs text-[#538B81] line-clamp-2 mt-1">{r.snippet}</p>}
            </div>
            <ExternalLink className="h-3 w-3 text-[#8AC7C0] shrink-0 mt-1" />
          </a>
        ))}
      </div>
    </div>
  );
}
```

Create `src/components/chat/tool-results/pdf-response.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface PdfResponseProps {
  data: {
    documentTitle: string;
    relevantChunks: Array<{ text: string; page: number }>;
  };
}

export function PdfResponse({ data }: PdfResponseProps) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="bg-[#FBFAF8] border border-[#D5EBE7] rounded-xl p-4 my-2">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 text-[#497D74]" />
        <span className="text-sm font-medium text-[#27445D]">{data.documentTitle}</span>
      </div>
      <button
        onClick={() => setShowSources(!showSources)}
        className="flex items-center gap-1 text-xs text-[#497D74] hover:text-[#335775]"
      >
        {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {data.relevantChunks.length} sources
      </button>
      {showSources && (
        <div className="mt-2 space-y-2">
          {data.relevantChunks.map((chunk, i) => (
            <div key={i} className="text-xs bg-[#EFE9D5]/50 p-2 rounded border border-[#D5EBE7]">
              <span className="font-medium text-[#497D74]">Page {chunk.page}:</span>{' '}
              <span className="text-[#335775]">{chunk.text.slice(0, 200)}...</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `src/components/chat/tool-results/stats-widget.tsx`:
```typescript
'use client';

import { Flame, Clock, Trophy } from 'lucide-react';

interface StatsWidgetProps {
  data: {
    currentStreak: number;
    bestStreak: number;
    totalStudyHours: number;
  };
}

export function StatsWidget({ data }: StatsWidgetProps) {
  return (
    <div className="bg-[#FBFAF8] border border-[#D5EBE7] rounded-xl p-4 my-2">
      <h3 className="font-lexend font-semibold text-[#27445D] mb-3">Your Study Stats</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-[#27445D]">{data.currentStreak}</p>
          <p className="text-xs text-[#538B81]">Day Streak</p>
        </div>
        <div className="text-center">
          <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-[#27445D]">{data.bestStreak}</p>
          <p className="text-xs text-[#538B81]">Best Streak</p>
        </div>
        <div className="text-center">
          <Clock className="h-6 w-6 text-[#497D74] mx-auto mb-1" />
          <p className="text-2xl font-bold text-[#27445D]">{data.totalStudyHours}</p>
          <p className="text-xs text-[#538B81]">Total Hours</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create tool renderer (maps tool names to components)**

Create `src/components/chat/tool-results/tool-renderer.tsx`:
```typescript
'use client';

import { Loader2 } from 'lucide-react';
import { StudyPlanCard } from './study-plan-card';
import { ResourceGrid } from './resource-grid';
import { PdfResponse } from './pdf-response';
import { StatsWidget } from './stats-widget';

interface ToolRendererProps {
  toolName: string;
  state: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export function ToolRenderer({ toolName, state, input, output }: ToolRendererProps) {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#538B81] py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>
          {toolName === 'generateStudyPlan' && `Creating study plan for ${(input as any)?.subject || '...'}...`}
          {toolName === 'searchResources' && `Searching resources for ${(input as any)?.topic || '...'}...`}
          {toolName === 'analyzePDF' && 'Analyzing document...'}
          {toolName === 'getStudyStats' && 'Fetching your stats...'}
          {toolName === 'startTimer' && 'Starting timer...'}
          {!['generateStudyPlan', 'searchResources', 'analyzePDF', 'getStudyStats', 'startTimer'].includes(toolName) && 'Working...'}
        </span>
      </div>
    );
  }

  if (state === 'output-error') {
    return <p className="text-sm text-red-500 py-2">Tool error occurred. Please try again.</p>;
  }

  if (state === 'output-available' && output) {
    switch (toolName) {
      case 'generateStudyPlan':
        return <StudyPlanCard data={output as any} />;
      case 'searchResources':
        return <ResourceGrid data={output as any} />;
      case 'analyzePDF':
        return <PdfResponse data={output as any} />;
      case 'getStudyStats':
        return <StatsWidget data={output as any} />;
      case 'startTimer':
        return null; // Timer is handled by the floating widget via Zustand
      default:
        return <pre className="text-xs bg-[#EFE9D5] p-2 rounded">{JSON.stringify(output, null, 2)}</pre>;
    }
  }

  return null;
}
```

- [ ] **Step 3: Create chat message component**

Create `src/components/chat/chat-message.tsx`:
```typescript
'use client';

import { UIMessage } from 'ai';
import { User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { ToolRenderer } from './tool-results/tool-renderer';

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    const text = message.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as any).text)
      .join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3 px-4 py-6', isUser ? 'bg-transparent' : 'bg-[#FBFAF8]/50')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-[#27445D]' : 'bg-[#497D74]'
      )}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div key={i} className="prose prose-sm max-w-none text-[#27445D]">
                <ReactMarkdown>{part.text}</ReactMarkdown>
              </div>
            );
          }

          // Handle tool parts — they have type 'tool-<toolName>'
          if (part.type.startsWith('tool-')) {
            const toolName = part.type.replace('tool-', '');
            return (
              <ToolRenderer
                key={i}
                toolName={toolName}
                state={(part as any).state}
                input={(part as any).input}
                output={(part as any).output}
              />
            );
          }

          return null;
        })}
      </div>

      {!isUser && (
        <button
          onClick={handleCopy}
          className="self-start mt-1 text-[#8AC7C0] hover:text-[#497D74] transition-colors"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create chat thread**

Create `src/components/chat/chat-thread.tsx`:
```typescript
'use client';

import { UIMessage } from 'ai';
import { useEffect, useRef } from 'react';
import { ChatMessage } from './chat-message';
import { Loader2 } from 'lucide-react';

interface ChatThreadProps {
  messages: UIMessage[];
  status: string;
}

export function ChatThread({ messages, status }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="font-lexend text-2xl font-bold text-[#27445D] mb-2">
            Mind Mentor
          </h2>
          <p className="text-[#538B81] text-sm">
            Ask me anything — I can help you study, create plans, find resources, and analyze documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {status === 'submitted' && (
          <div className="flex gap-3 px-4 py-6">
            <div className="w-8 h-8 rounded-full bg-[#497D74] flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[#538B81]">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create chat composer**

Create `src/components/chat/chat-composer.tsx`:
```typescript
'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatComposerProps {
  onSend: (text: string, files?: File[]) => void;
  disabled: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!input.trim() && files.length === 0) return;
    onSend(input.trim(), files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="border-t border-[#D5EBE7] bg-[#FBFAF8] px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {files.length > 0 && (
          <div className="flex gap-2 mb-2">
            {files.map((f, i) => (
              <span key={i} className="text-xs bg-[#D5EBE7] text-[#27445D] px-2 py-1 rounded-full">
                {f.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 bg-white border border-[#BCDFD9] rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#71BBB2]">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[#8AC7C0] hover:text-[#497D74] transition-colors pb-1"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-[#27445D] placeholder:text-[#8AC7C0]',
              'focus:outline-none text-sm leading-6'
            )}
          />
          <Button
            onClick={handleSubmit}
            disabled={disabled || (!input.trim() && files.length === 0)}
            size="icon"
            className="bg-[#497D74] hover:bg-[#538B81] text-white rounded-full h-8 w-8 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-center text-[#A3D3CD] mt-2">
          Mind Mentor can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/
git commit -m "feat: add chat UI components — thread, message, composer, tool renderers"
```

---

## Task 8: Main Chat Page (useChat Integration)

**Files:**
- Create: `src/components/chat/chat-page.tsx`
- Create: `src/app/chat/layout.tsx`
- Create: `src/app/chat/page.tsx`
- Create: `src/app/chat/[conversationId]/page.tsx`
- Create: `src/store/app-store.ts`

**Depends on:** Task 5 (API route), Task 6 (sidebar), Task 7 (chat components)

- [ ] **Step 1: Create Zustand app store**

Create `src/store/app-store.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelId } from '@/lib/ai/providers';

interface AppStore {
  selectedModel: ModelId;
  setSelectedModel: (model: ModelId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  libraryOpen: boolean;
  setLibraryOpen: (open: boolean) => void;
  statsOpen: boolean;
  setStatsOpen: (open: boolean) => void;
  timerActive: boolean;
  timerDuration: number;
  timerType: 'focus' | 'break';
  startTimer: (duration: number, type: 'focus' | 'break') => void;
  stopTimer: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      selectedModel: 'groq',
      setSelectedModel: (model) => set({ selectedModel: model }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      libraryOpen: false,
      setLibraryOpen: (open) => set({ libraryOpen: open }),
      statsOpen: false,
      setStatsOpen: (open) => set({ statsOpen: open }),
      timerActive: false,
      timerDuration: 25,
      timerType: 'focus',
      startTimer: (duration, type) => set({ timerActive: true, timerDuration: duration, timerType: type }),
      stopTimer: () => set({ timerActive: false }),
    }),
    { name: 'mind-mentor-store' }
  )
);
```

- [ ] **Step 2: Create main chat page client component**

Create `src/components/chat/chat-page.tsx`:
```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ChatThread } from './chat-thread';
import { ChatComposer } from './chat-composer';
import { useAppStore } from '@/store/app-store';

interface ChatPageProps {
  conversationId?: string;
  initialMessages?: any[];
}

export function ChatPage({ conversationId, initialMessages }: ChatPageProps) {
  const selectedModel = useAppStore((s) => s.selectedModel);

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId, model: selectedModel },
    }),
  });

  const handleSend = (text: string, files?: File[]) => {
    // TODO: Handle file uploads — upload PDF first, then send message with documentId
    sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F4ED]">
      <ChatThread messages={messages} status={status} />
      <ChatComposer onSend={handleSend} disabled={status !== 'ready'} />
    </div>
  );
}
```

- [ ] **Step 3: Create chat layout**

Create `src/app/chat/layout.tsx`:
```typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { SidebarProvider } from '@/components/ui/sidebar';
import dbConnect from '@/lib/db';
import Conversation from '@/models/Conversation';
import { ChatLayout } from '@/components/chat/chat-layout';

export default async function ChatRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  await dbConnect();
  const conversations = await Conversation.find({ userId: session.user.id })
    .select('title createdAt')
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  const serialized = conversations.map((c: any) => ({
    _id: c._id.toString(),
    title: c.title,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <SidebarProvider>
      <ChatLayout conversations={serialized}>
        {children}
      </ChatLayout>
    </SidebarProvider>
  );
}
```

Create `src/components/chat/chat-layout.tsx`:
```typescript
'use client';

import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { LibraryPanel } from '@/components/panels/library-panel';
import { StatsPanel } from '@/components/panels/stats-panel';
import { TimerWidget } from '@/components/widgets/timer-widget';
import { useAppStore } from '@/store/app-store';

interface ChatLayoutProps {
  conversations: Array<{ _id: string; title: string; createdAt: string }>;
  children: React.ReactNode;
}

export function ChatLayout({ conversations, children }: ChatLayoutProps) {
  const {
    selectedModel, setSelectedModel,
    libraryOpen, setLibraryOpen,
    statsOpen, setStatsOpen,
    timerActive,
  } = useAppStore();

  return (
    <div className="flex h-screen w-full">
      <AppSidebar
        conversations={conversations}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenTimer={() => useAppStore.getState().startTimer(25, 'focus')}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      <LibraryPanel open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <StatsPanel open={statsOpen} onClose={() => setStatsOpen(false)} />
      {timerActive && <TimerWidget />}
    </div>
  );
}
```

- [ ] **Step 4: Create chat pages**

Create `src/app/chat/page.tsx`:
```typescript
import { ChatPage } from '@/components/chat/chat-page';

export default function NewChatPage() {
  return <ChatPage />;
}
```

Create `src/app/chat/[conversationId]/page.tsx`:
```typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Conversation from '@/models/Conversation';
import { ChatPage } from '@/components/chat/chat-page';

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  await dbConnect();
  const conversation = await Conversation.findOne({
    _id: params.conversationId,
    userId: session.user.id,
  }).lean();

  if (!conversation) redirect('/chat');

  return (
    <ChatPage
      conversationId={params.conversationId}
      initialMessages={(conversation as any).messages || []}
    />
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/store/app-store.ts src/components/chat/chat-page.tsx src/components/chat/chat-layout.tsx src/app/chat/
git commit -m "feat: add main chat page with useChat, layout, sidebar integration"
```

---

## Task 9: Slide-Over Panels (Library + Stats) & Timer Widget

**Files:**
- Create: `src/components/panels/library-panel.tsx`
- Create: `src/components/panels/stats-panel.tsx`
- Create: `src/components/widgets/timer-widget.tsx`

**Parallel group:** Can run in parallel with Task 8

- [ ] **Step 1: Create library panel**

Create `src/components/panels/library-panel.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BookOpen, GraduationCap } from 'lucide-react';

interface LibraryPanelProps {
  open: boolean;
  onClose: () => void;
}

export function LibraryPanel({ open, onClose }: LibraryPanelProps) {
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      // Fetch saved items
      fetch('/api/library').then(r => r.json()).then(data => {
        setStudyPlans(data.studyPlans || []);
        setPdfs(data.pdfs || []);
        setResources(data.resources || []);
      }).catch(() => {});
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-[#FBFAF8] border-l border-[#D5EBE7] w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="font-lexend text-[#27445D]">My Library</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="plans" className="mt-4">
          <TabsList className="bg-[#EFE9D5]">
            <TabsTrigger value="plans"><BookOpen className="h-4 w-4 mr-1" />Plans</TabsTrigger>
            <TabsTrigger value="pdfs"><FileText className="h-4 w-4 mr-1" />PDFs</TabsTrigger>
            <TabsTrigger value="resources"><GraduationCap className="h-4 w-4 mr-1" />Resources</TabsTrigger>
          </TabsList>
          <TabsContent value="plans" className="mt-4 space-y-2">
            {studyPlans.length === 0 && <p className="text-sm text-[#8AC7C0]">No saved study plans yet.</p>}
            {studyPlans.map((plan: any) => (
              <div key={plan._id} className="p-3 bg-white border border-[#D5EBE7] rounded-lg">
                <p className="font-medium text-sm text-[#27445D]">{plan.overview?.subject || 'Study Plan'}</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="pdfs" className="mt-4 space-y-2">
            {pdfs.length === 0 && <p className="text-sm text-[#8AC7C0]">No uploaded PDFs yet.</p>}
            {pdfs.map((pdf: any) => (
              <div key={pdf._id} className="p-3 bg-white border border-[#D5EBE7] rounded-lg">
                <p className="font-medium text-sm text-[#27445D]">{pdf.title}</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="resources" className="mt-4 space-y-2">
            {resources.length === 0 && <p className="text-sm text-[#8AC7C0]">No saved resources yet.</p>}
            {resources.map((res: any) => (
              <div key={res._id} className="p-3 bg-white border border-[#D5EBE7] rounded-lg">
                <p className="font-medium text-sm text-[#27445D]">{res.topic}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Create stats panel**

Create `src/components/panels/stats-panel.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Flame, Clock, Trophy, CalendarDays } from 'lucide-react';

interface StatsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function StatsPanel({ open, onClose }: StatsPanelProps) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetch('/api/users/stats').then(r => r.json()).then(setStats).catch(() => {});
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-[#FBFAF8] border-l border-[#D5EBE7] w-[400px]">
        <SheetHeader>
          <SheetTitle className="font-lexend text-[#27445D]">Study Stats</SheetTitle>
        </SheetHeader>
        {stats ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-[#D5EBE7] rounded-xl p-4 text-center">
                <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#27445D]">{stats.currentStreak || 0}</p>
                <p className="text-xs text-[#538B81]">Current Streak</p>
              </div>
              <div className="bg-white border border-[#D5EBE7] rounded-xl p-4 text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#27445D]">{stats.bestStreak || 0}</p>
                <p className="text-xs text-[#538B81]">Best Streak</p>
              </div>
              <div className="bg-white border border-[#D5EBE7] rounded-xl p-4 text-center col-span-2">
                <Clock className="h-8 w-8 text-[#497D74] mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#27445D]">{stats.totalStudyHours || 0}</p>
                <p className="text-xs text-[#538B81]">Total Study Hours</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8AC7C0] mt-4">Loading...</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: Create timer widget**

Create `src/components/widgets/timer-widget.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, Pause, Play } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

export function TimerWidget() {
  const { timerDuration, timerType, stopTimer } = useAppStore();
  const [secondsLeft, setSecondsLeft] = useState(timerDuration * 60);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (secondsLeft <= 0) {
      stopTimer();
      return;
    }
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, paused, stopTimer]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="fixed bottom-6 right-6 bg-[#27445D] text-white rounded-full px-4 py-2 flex items-center gap-3 shadow-lg z-50">
      <span className="text-xs uppercase text-[#8AC7C0]">{timerType}</span>
      <span className="font-mono text-lg font-bold">
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </span>
      <button onClick={() => setPaused(!paused)} className="text-[#A3D3CD] hover:text-white">
        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </button>
      <button onClick={stopTimer} className="text-[#A3D3CD] hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/panels/ src/components/widgets/
git commit -m "feat: add library panel, stats panel, and floating timer widget"
```

---

## Task 10: Cleanup — Remove Old Backend & Dashboard Pages

**Files:**
- Delete: `/server` directory
- Delete: `src/app/(protected)/home`
- Delete: `src/app/(protected)/notes`
- Delete: `src/app/(protected)/pdf`
- Delete: `src/app/(protected)/study-plan`
- Delete: `src/app/(protected)/resources`
- Delete: `src/app/(protected)/timer`
- Delete: `src/app/(protected)/profile`
- Delete: `src/lib/api-client.ts`
- Delete: `docker-compose.yml`, `render.yaml`
- Modify: `package.json` — remove backend deps

**Parallel group:** Should run after Tasks 1-9 are complete

- [ ] **Step 1: Remove server directory**

```bash
rm -rf server/
```

- [ ] **Step 2: Remove old protected route pages**

```bash
rm -rf src/app/\(protected\)/home
rm -rf src/app/\(protected\)/notes
rm -rf src/app/\(protected\)/pdf
rm -rf src/app/\(protected\)/study-plan
rm -rf src/app/\(protected\)/resources
rm -rf src/app/\(protected\)/timer
rm -rf src/app/\(protected\)/profile
```

- [ ] **Step 3: Remove api-client and deployment configs**

```bash
rm -f src/lib/api-client.ts
rm -f docker-compose.yml render.yaml server/Dockerfile
```

- [ ] **Step 4: Remove unused backend dependencies from package.json**

Remove from `dependencies`: `@langchain/community`, `@langchain/core`, `langchain`, `@xenova/transformers`, `express`, `cors`, `multer`, `express-rate-limit`, `node-cache` (if they are in the frontend package.json).

- [ ] **Step 5: Update auth redirect to /chat**

Modify `src/lib/auth.ts` — change the default redirect after login from `/home` to `/chat`.

- [ ] **Step 6: Add /api/library route for the library panel**

Create `src/app/api/library/route.ts`:
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import StudyPlan from '@/models/StudyPlan';
import PdfDocument from '@/models/PdfDocument';
import CuratedResource from '@/models/CuratedResource';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  await dbConnect();
  const userId = session.user.id;

  const [studyPlans, pdfs, resources] = await Promise.all([
    StudyPlan.find({ userId }).select('overview isActive createdAt').sort({ createdAt: -1 }).limit(20).lean(),
    PdfDocument.find({ userId }).select('title pageCount createdAt').sort({ createdAt: -1 }).limit(20).lean(),
    CuratedResource.find({ userId }).select('topic createdAt').sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  return Response.json({
    studyPlans: studyPlans.map((p: any) => ({ ...p, _id: p._id.toString() })),
    pdfs: pdfs.map((p: any) => ({ ...p, _id: p._id.toString() })),
    resources: resources.map((r: any) => ({ ...r, _id: r._id.toString() })),
  });
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: remove Express backend and old dashboard pages, add library API"
```

---

## Task Dependency & Parallelism Map

```
Task 1 (deps + shadcn) ──┬──> Task 6 (sidebar)  ──┐
                         │                          │
Task 2 (models)    ──────┼──> Task 4 (tools) ──> Task 5 (API route) ──> Task 8 (chat page)
                         │                          │                        │
Task 3 (providers) ──────┘                          │                        ├──> Task 10 (cleanup)
                                                    │                        │
                         Task 7 (chat UI) ──────────┘                        │
                                                                             │
                         Task 9 (panels + timer) ────────────────────────────┘
```

**Can run in parallel:**
- Group A: Task 1, Task 2, Task 3 (no dependencies)
- Group B: Task 6, Task 7 (depend on Task 1 only)
- Group C: Task 9 (depends on Task 1 only)
- Sequential: Task 4 → Task 5 → Task 8 → Task 10
