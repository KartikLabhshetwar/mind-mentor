# Unified Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the segregated multi-tab dashboard with a single ChatGPT-inspired unified chat interface featuring quiz generation, spaced repetition, and performance tracking.

**Architecture:** Three-panel layout — thin left sidebar (chat history), center main chat (streaming + inline structured content), collapsible right context panel (scores, weak topics, plan, resources, memory, streak). Dark mode. Slash commands via popup palette. All existing features (resources, planning, PDF chat, mem0) accessible from one conversation.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, MongoDB/Mongoose, Express, Radix UI, Framer Motion, Lucide icons, ReactMarkdown, eventsource-parser.

**Spec:** `docs/superpowers/specs/2026-05-17-unified-dashboard-design.md`

---

## File Map

### New Files (Create)

| File | Responsibility |
|------|---------------|
| `src/app/(dashboard)/dashboard/page.tsx` | Unified dashboard page — orchestrates three panels |
| `src/components/unified/ChatHistory.tsx` | Left sidebar — conversation list, new chat, user avatar |
| `src/components/unified/ChatArea.tsx` | Center — message list, streaming, inline structured content |
| `src/components/unified/ChatInput.tsx` | Input bar — textarea, send, attach, slash trigger |
| `src/components/unified/CommandPalette.tsx` | Popup command palette on `/` |
| `src/components/unified/ContextPanel.tsx` | Right panel — accordion wrapper |
| `src/components/unified/context/ScoreSection.tsx` | Performance score section |
| `src/components/unified/context/WeakTopicsSection.tsx` | Weak topics + review alerts |
| `src/components/unified/context/StudyPlanSection.tsx` | Active plan progress |
| `src/components/unified/context/ResourcesSection.tsx` | Pinned resources |
| `src/components/unified/context/MemorySection.tsx` | AI memory (mem0) display |
| `src/components/unified/context/StreakSection.tsx` | Study streak + stats |
| `src/components/unified/QuizCard.tsx` | Inline quiz MCQ component |
| `src/components/unified/ResourceCard.tsx` | Inline resource card component |
| `src/components/unified/PlanCard.tsx` | Inline study plan card component |
| `server/models/quizResult.js` | Quiz results MongoDB model |
| `server/routes/quiz.js` | Quiz generate/submit/history routes |
| `server/routes/performance.js` | Performance summary aggregation route |

### Modified Files

| File | Change |
|------|--------|
| `src/app/globals.css` | Add dark mode CSS variables for unified dashboard |
| `src/lib/agent-client.ts` | Refactor `streamChat` — add `ChatEvent` type, extend `ChatContext` |
| `src/app/(dashboard)/layout.tsx` | Add `/dashboard` route awareness (no sidebar for unified page) |
| `server/index.js` | Register quiz and performance routes |
| `server/models/topicMastery.js` | Add quiz-related fields (quizCount, averageScore, etc.) |

---

## Parallel Workstreams

Tasks 1-3 are independent and can run in parallel worktrees. Tasks 4-7 depend on earlier tasks.

```
[Task 1: Dark Mode CSS]──────────────────────────┐
[Task 2: Backend - Quiz Model + Routes]──────────┤
[Task 3: streamChat Refactor]────────────────────┤
                                                  ├──▶ [Task 4: Dashboard Shell + Layout]
                                                  │    ──▶ [Task 5: Chat Area + Command Palette]
                                                  │    ──▶ [Task 6: Context Panel]
                                                  │    ──▶ [Task 7: Quiz Inline UI + Integration]
                                                  │    ──▶ [Task 8: Route Redirects + Polish]
```

---

## Task 1: Dark Mode CSS Variables

**Files:**
- Modify: `src/app/globals.css`

This task adds the dark mode color tokens scoped to the unified dashboard. Does not touch any components.

- [ ] **Step 1: Read current globals.css to understand existing structure**

The file has `:root` with cream/navy/teal theme and a `.dark` class. We add a `.unified-dark` scope for dashboard-specific overrides.

- [ ] **Step 2: Add unified dashboard dark mode variables**

Add after the existing `.dark` block in `globals.css`:

```css
.unified-dark {
  /* Custom tokens used by unified dashboard components */
  --bg-primary: #1a1a1a;
  --bg-secondary: #202123;
  --bg-sidebar: #171717;
  --bg-surface: #2d2d30;
  --bg-surface-hover: #3d3d40;
  --accent: #10a37f;
  --accent-muted: rgba(16, 163, 127, 0.2);
  --text-primary: #ececec;
  --text-secondary: #9a9a9a;
  --text-muted: #666666;
  --border-color: #333333;
  --input-bg: #40414f;
  --error: #ef4444;
  --warning: #f59e0b;

  /* Override shadcn/radix tokens (HSL format without hsl() wrapper) */
  --background: 220 13% 10%;
  --foreground: 0 0% 93%;
  --card: 220 7% 18%;
  --card-foreground: 0 0% 93%;
  --popover: 220 7% 18%;
  --popover-foreground: 0 0% 93%;
  --primary: 160 82% 35%;
  --primary-foreground: 220 13% 10%;
  --secondary: 220 7% 18%;
  --secondary-foreground: 0 0% 93%;
  --muted: 220 7% 22%;
  --muted-foreground: 0 0% 60%;
  --shadcn-accent: 220 7% 22%;
  --accent-foreground: 0 0% 93%;
  --border: 0 0% 20%;
  --input: 0 0% 20%;
  --ring: 160 82% 35%;
}
```

Note: The custom `--accent` (hex green) is used by all unified components via `var(--accent)`. The shadcn token is renamed to `--shadcn-accent` to avoid collision — shadcn's `accent` class in this scope references `hsl(var(--shadcn-accent))`. Since unified components don't use shadcn's accent utility class, this doesn't break anything.

- [ ] **Step 3: Verify no CSS conflicts**

Run: `npm run build`
Expected: Build succeeds with no CSS errors.

---

## Task 2: Backend — Quiz Model + Routes + Performance Route

**Files:**
- Create: `server/models/quizResult.js`
- Create: `server/routes/quiz.js`
- Create: `server/routes/performance.js`
- Modify: `server/models/topicMastery.js`
- Modify: `server/index.js`

### Step-by-step:

- [ ] **Step 1: Create QuizResult model**

Create `server/models/quizResult.js`:

```javascript
import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  topic: { type: String, required: true },
  subject: { type: String, default: "" },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    userAnswer: { type: Number, default: null },
    isCorrect: { type: Boolean, default: null },
  }],
  score: { type: Number, default: null },
  totalQuestions: { type: Number, required: true },
  correctCount: { type: Number, default: 0 },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

quizResultSchema.index({ userId: 1, topic: 1 });
quizResultSchema.index({ completedAt: 1 }, { expireAfterSeconds: 86400, partialFilterExpression: { completedAt: null } });

export default mongoose.models.QuizResult || mongoose.model("QuizResult", quizResultSchema);
```

- [ ] **Step 2: Extend TopicMastery model**

Add new fields to `server/models/topicMastery.js` schema:

```javascript
// Add these fields to the existing schema definition
quizCount: { type: Number, default: 0 },
lastQuizDate: { type: Date, default: null },
averageScore: { type: Number, default: null },
```

The SM2 fields (`sm2.nextReview`, `sm2.interval`) already exist and handle spaced repetition. No new review fields needed.

- [ ] **Step 3: Create quiz routes**

Create `server/routes/quiz.js`:

```javascript
import express from "express";
import QuizResult from "../models/quizResult.js";
import TopicMastery from "../models/topicMastery.js";

const router = express.Router();

// Generate quiz — stores skeleton, returns questions
router.post("/generate", async (req, res) => {
  try {
    const { userId, topic, difficulty = "medium", questionCount = 5 } = req.body;
    if (!userId || !topic) return res.status(400).json({ error: "userId and topic required" });

    const quiz = new QuizResult({
      userId,
      topic,
      difficulty,
      totalQuestions: questionCount,
      questions: [],
    });
    await quiz.save();
    res.json({ quizId: quiz._id, topic, difficulty, questionCount });
  } catch (error) {
    console.error("Quiz generate error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

// Submit answers
router.post("/submit", async (req, res) => {
  try {
    const { quizId, answers, questions } = req.body;
    if (!quizId) return res.status(400).json({ error: "quizId required" });

    const quiz = await QuizResult.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    let correctCount = 0;
    const gradedQuestions = questions.map((q, i) => {
      const userAnswer = answers[i]?.answer ?? null;
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return { ...q, userAnswer, isCorrect };
    });

    quiz.questions = gradedQuestions;
    quiz.correctCount = correctCount;
    quiz.score = Math.round((correctCount / quiz.totalQuestions) * 100);
    quiz.completedAt = new Date();
    await quiz.save();

    // Update topic mastery
    const mastery = await TopicMastery.findOne({ userId: quiz.userId, topic: quiz.topic });
    if (mastery) {
      mastery.quizCount = (mastery.quizCount || 0) + 1;
      mastery.lastQuizDate = new Date();
      const prevAvg = mastery.averageScore ?? quiz.score;
      mastery.averageScore = Math.round((prevAvg * (mastery.quizCount - 1) + quiz.score) / mastery.quizCount);

      // Update SM2 based on quiz quality (0-5 scale)
      const quality = Math.round((quiz.score / 100) * 5);
      mastery.sm2.repetitions += 1;
      mastery.sm2.easiness = Math.max(1.3, mastery.sm2.easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (quality < 3) {
        mastery.sm2.repetitions = 0;
        mastery.sm2.interval = 1;
      } else if (mastery.sm2.repetitions === 1) {
        mastery.sm2.interval = 1;
      } else if (mastery.sm2.repetitions === 2) {
        mastery.sm2.interval = 6;
      } else {
        mastery.sm2.interval = Math.round(mastery.sm2.interval * mastery.sm2.easiness);
      }
      mastery.sm2.nextReview = new Date(Date.now() + mastery.sm2.interval * 86400000);
      mastery.lastReviewed = new Date();
      mastery.reviewHistory.push({ date: new Date(), quality });
      await mastery.save();
    }

    res.json({ score: quiz.score, correctCount, totalQuestions: quiz.totalQuestions, results: gradedQuestions });
  } catch (error) {
    console.error("Quiz submit error:", error);
    res.status(500).json({ error: "Failed to submit quiz" });
  }
});

// Quiz history
router.get("/history/:userId", async (req, res) => {
  try {
    const { topic } = req.query;
    const filter = { userId: req.params.userId, completedAt: { $ne: null } };
    if (topic) filter.topic = topic;

    const quizzes = await QuizResult.find(filter).sort({ createdAt: -1 }).limit(20);
    const stats = await QuizResult.aggregate([
      { $match: { ...filter } },
      { $group: { _id: null, average: { $avg: "$score" }, totalTaken: { $sum: 1 } } },
    ]);

    res.json({ quizzes, stats: stats[0] || { average: 0, totalTaken: 0 } });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quiz history" });
  }
});

export default router;
```

- [ ] **Step 4: Create performance route**

Create `server/routes/performance.js`:

```javascript
import express from "express";
import TopicMastery from "../models/topicMastery.js";
import QuizResult from "../models/quizResult.js";

const router = express.Router();

router.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const topics = await TopicMastery.find({ userId }).sort({ mastery: 1 });

    // Overall score
    const overallScore = topics.length > 0
      ? Math.round(topics.reduce((sum, t) => sum + (t.mastery || 0), 0) / topics.length)
      : 0;

    // Weak topics (below 60% or review overdue)
    const now = new Date();
    const weakTopics = topics
      .filter(t => t.mastery < 60 || (t.sm2.nextReview && t.sm2.nextReview < now))
      .map(t => ({
        topic: t.topic,
        subject: t.subject,
        mastery: t.mastery,
        daysSinceReview: t.lastReviewed ? Math.floor((now - t.lastReviewed) / 86400000) : null,
        reviewOverdue: t.sm2.nextReview ? t.sm2.nextReview < now : false,
      }))
      .sort((a, b) => a.mastery - b.mastery);

    // Next reviews
    const nextReviews = topics
      .filter(t => t.sm2.nextReview)
      .map(t => ({ topic: t.topic, nextReview: t.sm2.nextReview }))
      .sort((a, b) => a.nextReview - b.nextReview)
      .slice(0, 5);

    // Streak: count consecutive days with quiz activity
    const recentQuizzes = await QuizResult.find({ userId, completedAt: { $ne: null } })
      .sort({ completedAt: -1 }).limit(100);
    let streak = 0;
    if (recentQuizzes.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);
      const quizDates = new Set(recentQuizzes.map(q => {
        const d = new Date(q.completedAt); d.setHours(0, 0, 0, 0);
        return d.getTime();
      }));
      while (quizDates.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    res.json({ overallScore, topics, weakTopics, nextReviews, streak });
  } catch (error) {
    console.error("Performance summary error:", error);
    res.status(500).json({ error: "Failed to fetch performance summary" });
  }
});

export default router;
```

- [ ] **Step 5: Create user auth middleware**

The existing `agentAuth.js` checks `x-agent-secret` (service-to-service). Need a new user-facing middleware that validates Bearer tokens from the frontend.

Create `server/middleware/userAuth.js`:

```javascript
import jwt from 'jsonwebtoken';

export function validateUserAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    req.userId = decoded.sub || decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
```

- [ ] **Step 6: Register new routes in server/index.js**

Add imports alongside existing route imports:

```javascript
import quizRouter from './routes/quiz.js';
import performanceRouter from './routes/performance.js';
import { validateUserAuth } from './middleware/userAuth.js';
```

Add route registration alongside existing `app.use` calls:

```javascript
app.use('/api/quiz', validateUserAuth, quizRouter);
app.use('/api/performance', validateUserAuth, performanceRouter);
```

- [ ] **Step 6: Verify server starts**

Run: `cd server && node index.js`
Expected: Server starts without errors, new routes accessible.

---

## Task 3: Refactor streamChat in agent-client.ts

**Files:**
- Modify: `src/lib/agent-client.ts`

- [ ] **Step 1: Add ChatEvent type and update streamChat signature**

Replace the `streamChat` function in `src/lib/agent-client.ts` with:

```typescript
import { createParser } from "eventsource-parser";

export interface ChatContext {
  page?: string;
  subject?: string;
  command?: string;
  topic?: string;
  pdfId?: string;
}

export interface ChatEvent {
  type: "text" | "quiz" | "resources" | "plan";
  data: string;
}

export async function streamChat(
  message: string,
  token: string,
  context: ChatContext,
  onEvent: (event: ChatEvent) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  try {
    const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8787";
    const response = await fetch(`${agentUrl}/agents/tutor/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) {
      onError(`Agent error: ${response.status}`);
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const parser = createParser((event) => {
      if (event.type === "event") {
        if (event.event === "done") {
          onDone();
          return;
        }
        if (event.event === "error") {
          onError(event.data);
          return;
        }

        const eventType = (event.event || "text") as ChatEvent["type"];
        if (["text", "quiz", "resources", "plan"].includes(eventType)) {
          onEvent({ type: eventType, data: event.data });
        } else {
          onEvent({ type: "text", data: event.data });
        }
      }
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onDone();
        break;
      }
      parser.feed(decoder.decode(value));
    }
  } catch {
    onError("Connection failed");
  }
}
```

- [ ] **Step 2: Update ChatWidget to use new signature**

File: `src/components/chat/ChatWidget.tsx`

Replace the `streamChat` call (around line 32-50). Change the 4th argument from `(chunk) => {...}` to:

```typescript
await streamChat(
  message,
  session.token,
  { page: pathname },
  (event) => {
    if (event.type === "text") {
      assistantMessage += event.data;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
        return updated;
      });
    }
  },
  () => setIsStreaming(false),
  (error) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { role: "assistant", content: `Error: ${error}` };
      return updated;
    });
    setIsStreaming(false);
  }
);
```

- [ ] **Step 2b: Update ChatPage to use new signature**

File: `src/app/(dashboard)/chat/page.tsx`

Same change — replace the `streamChat` call's 4th argument:

```typescript
await streamChat(
  message,
  session.token,
  { page: "/chat" },
  (event) => {
    if (event.type === "text") {
      assistantMessage += event.data;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
        return updated;
      });
    }
  },
  () => setIsStreaming(false),
  () => setIsStreaming(false)
);
```

Both files MUST be updated atomically with Step 1. If either still uses the old `onChunk` signature, TypeScript will error.

- [ ] **Step 3: Verify existing chat still works**

Run: `npm run dev`
Navigate to `/chat`. Send a message. Verify streaming still works.

---

## Task 4: Dashboard Shell + Layout

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/unified/ChatHistory.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

Depends on: Task 1 (CSS variables)

- [ ] **Step 1: Create ChatHistory sidebar component**

Create `src/components/unified/ChatHistory.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Plus, MessageSquare, LogOut, Settings, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Conversation {
  _id: string;
  messages: { role: string; content: string; timestamp: string }[];
  createdAt: string;
}

interface ChatHistoryProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectConversation: (id: string | null) => void;
  activeConversationId: string | null;
}

export function ChatHistory({ isCollapsed, onToggleCollapse, onSelectConversation, activeConversationId }: ChatHistoryProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistory = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/chat/history/${session.user.id}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch { /* silent */ }
  }, [session?.user?.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const getTitle = (conv: Conversation) => {
    const firstMsg = conv.messages.find(m => m.role === "user");
    if (!firstMsg) return "New Chat";
    return firstMsg.content.slice(0, 40) + (firstMsg.content.length > 40 ? "..." : "");
  };

  const filtered = conversations.filter(c =>
    !searchQuery || getTitle(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupByDate = (convs: Conversation[]) => {
    const groups: Record<string, Conversation[]> = {};
    const now = new Date();
    convs.forEach(c => {
      const d = new Date(c.createdAt);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      const label = diff === 0 ? "Today" : diff === 1 ? "Yesterday" : diff < 7 ? "This Week" : "Older";
      (groups[label] ??= []).push(c);
    });
    return groups;
  };

  const groups = groupByDate(filtered);

  return (
    <div className={cn(
      "flex flex-col h-full bg-[var(--bg-sidebar)] text-[var(--text-primary)] transition-all duration-300",
      isCollapsed ? "w-16" : "w-60"
    )}>
      {/* New Chat + Collapse */}
      <div className="p-3 flex items-center gap-2">
        <button
          onClick={() => onSelectConversation(null)}
          className={cn(
            "flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors",
            isCollapsed ? "p-2" : "flex-1 px-3 py-2"
          )}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span className="text-sm">New Chat</span>}
        </button>
        <button onClick={onToggleCollapse} className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
          {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 bg-[var(--bg-surface)] rounded-lg px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none flex-1"
            />
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {Object.entries(groups).map(([label, convs]) => (
          <div key={label}>
            {!isCollapsed && <p className="text-xs text-[var(--text-muted)] px-2 py-1">{label}</p>}
            {convs.map(conv => (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg text-sm transition-colors",
                  isCollapsed ? "p-2 justify-center" : "px-3 py-2",
                  activeConversationId === conv._id
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                )}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate text-left">{getTitle(conv)}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* User section */}
      <div className={cn("p-3 border-t border-[var(--border-color)]", isCollapsed && "flex flex-col items-center gap-2")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-[var(--bg-surface)] text-xs">{session?.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate flex-1">{session?.user?.name || "User"}</span>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="p-1.5 rounded hover:bg-[var(--bg-surface)]">
              <LogOut className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
          </div>
        ) : (
          <>
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-[var(--bg-surface)] text-xs">{session?.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="p-1.5 rounded hover:bg-[var(--bg-surface)]">
              <LogOut className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create dashboard page shell**

Create `src/app/(dashboard)/dashboard/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ChatHistory } from "@/components/unified/ChatHistory";
import { cn } from "@/lib/utils";
import { PanelRight } from "lucide-react";

export default function UnifiedDashboard() {
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  return (
    <div className="unified-dark h-screen flex bg-[var(--bg-primary)] overflow-hidden">
      {/* Left Sidebar */}
      <div className="hidden md:block">
        <ChatHistory
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSelectConversation={setActiveConversationId}
          activeConversationId={activeConversationId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)]">
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">Mind Mentor</h1>
          <button
            onClick={() => setContextPanelOpen(!contextPanelOpen)}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <PanelRight className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Chat content placeholder — replaced in Task 5 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] flex items-center justify-center mx-auto">
              <span className="text-2xl">🎓</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">What would you like to learn?</h2>
            <p className="text-sm text-[var(--text-secondary)]">Ask anything, generate quizzes, find resources, or plan your studies.</p>
          </div>
        </div>

        {/* Input placeholder — replaced in Task 5 */}
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto bg-[var(--input-bg)] rounded-xl px-4 py-3 text-[var(--text-muted)] text-sm">
            Type / for commands...
          </div>
        </div>
      </div>

      {/* Right Context Panel placeholder — replaced in Task 6 */}
      {contextPanelOpen && (
        <div className="hidden lg:block w-72 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Context panel loading...</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update dashboard layout to handle unified page**

Modify `src/app/(dashboard)/layout.tsx` — the unified dashboard page uses its own layout, not the standard sidebar layout. Check if the current path is `/dashboard` and skip the DashboardNav:

```tsx
"use client"

import { DashboardNav } from "@/components/dashboard/DashboardNav"
import { ChatWidget } from "@/components/chat/ChatWidget"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  // Unified dashboard has its own layout
  if (pathname === "/dashboard") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row">
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#191919] z-50">
          <DashboardNav className="h-full" />
        </div>
        <div className={cn(
          "hidden md:block fixed left-0 h-screen transition-all duration-300",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}>
          <DashboardNav
            className="h-full"
            onCollapse={setIsSidebarCollapsed}
          />
        </div>
        <div className={cn(
          "w-full transition-all duration-300",
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64",
          "pb-16 md:pb-0"
        )}>
          <main className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
```

- [ ] **Step 4: Verify shell renders**

Run: `npm run dev`
Navigate to `/dashboard`. Verify: dark background, left sidebar with history, center placeholder, right panel placeholder.

---

## Task 5: Chat Area + Command Palette + Input

**Files:**
- Create: `src/components/unified/ChatArea.tsx`
- Create: `src/components/unified/ChatInput.tsx`
- Create: `src/components/unified/CommandPalette.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

Depends on: Task 3 (streamChat refactor), Task 4 (dashboard shell)

- [ ] **Step 1: Create CommandPalette component**

Create `src/components/unified/CommandPalette.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FileUp, BookOpen, Brain, HelpCircle, BarChart3, ClipboardList, RefreshCw } from "lucide-react";

interface Command {
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  action: string;
}

const commands: Command[] = [
  { name: "/quiz", description: "Generate a quiz on any topic", icon: ClipboardList, action: "quiz" },
  { name: "/resources", description: "Find learning resources", icon: Brain, action: "resources" },
  { name: "/plan", description: "Create or view study plan", icon: BookOpen, action: "plan" },
  { name: "/pdf", description: "Upload and chat with PDF", icon: FileUp, action: "pdf" },
  { name: "/review", description: "Review weak topics (spaced repetition)", icon: RefreshCw, action: "review" },
  { name: "/explain", description: "Explain a concept simply", icon: HelpCircle, action: "explain" },
  { name: "/score", description: "View your performance", icon: BarChart3, action: "score" },
];

interface CommandPaletteProps {
  query: string;
  onSelect: (command: Command) => void;
  onClose: () => void;
}

export function CommandPalette({ query, onSelect, onClose }: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = commands.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && filtered[selectedIndex]) { e.preventDefault(); onSelect(filtered[selectedIndex]); }
      else if (e.key === "Escape") { onClose(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div ref={ref} className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden z-50 max-w-3xl mx-auto">
      {filtered.map((cmd, i) => (
        <button
          key={cmd.name}
          onClick={() => onSelect(cmd)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
            i === selectedIndex ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          <cmd.icon className={`h-5 w-5 ${i === selectedIndex ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
          <div>
            <span className="text-sm font-medium text-[var(--text-primary)]">{cmd.name}</span>
            <span className="text-xs text-[var(--text-muted)] ml-2">{cmd.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create ChatInput component**

Create `src/components/unified/ChatInput.tsx`:

```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip } from "lucide-react";
import { CommandPalette } from "./CommandPalette";

interface ChatInputProps {
  onSend: (message: string, command?: string) => void;
  onFileUpload?: (file: File) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, onFileUpload, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith("/")) {
      setShowPalette(true);
      setPaletteQuery(val);
    } else {
      setShowPalette(false);
    }

    // Auto-resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  };

  const handleSubmit = useCallback(() => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
    setShowPalette(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !showPalette) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCommandSelect = (cmd: { name: string; action: string }) => {
    if (cmd.action === "pdf") {
      fileRef.current?.click();
      setInput("");
    } else {
      setInput(cmd.name + " ");
    }
    setShowPalette(false);
    textareaRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) onFileUpload(file);
    e.target.value = "";
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="relative max-w-3xl mx-auto">
        {showPalette && (
          <CommandPalette
            query={paletteQuery}
            onSelect={handleCommandSelect}
            onClose={() => setShowPalette(false)}
          />
        )}

        <div className="flex items-end gap-2 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] focus-within:border-[var(--accent)] transition-colors">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-3 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input type="file" ref={fileRef} accept=".pdf" className="hidden" onChange={handleFileChange} />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Mind Mentor... (type / for commands)"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm py-3 resize-none outline-none max-h-[200px]"
          />

          <button
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className="p-3 text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ChatArea component**

Create `src/components/unified/ChatArea.tsx`:

```tsx
"use client";

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { QuizCard } from "./QuizCard";

export interface MessageContent {
  type: "text" | "quiz" | "resources" | "plan";
  data: string;
}

export interface Message {
  role: "user" | "assistant";
  content: MessageContent[];
}

function stripThinkingTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*/g, "").trim();
}

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  onQuizSubmit?: (quizId: string, answers: { questionIndex: number; answer: number }[]) => void;
}

export function ChatArea({ messages, isStreaming, onQuizSubmit }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderContent = (content: MessageContent, idx: number) => {
    switch (content.type) {
      case "quiz":
        try {
          const quizData = JSON.parse(content.data);
          return <QuizCard key={idx} quiz={quizData} onSubmit={onQuizSubmit} />;
        } catch {
          return null;
        }
      case "resources":
        try {
          const resources = JSON.parse(content.data);
          return (
            <div key={idx} className="grid gap-2 mt-2">
              {resources.items?.map((r: { title: string; url: string; description: string }, i: number) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="block bg-[var(--bg-surface)] rounded-lg p-3 hover:bg-[var(--bg-surface-hover)] transition-colors border border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--accent)]">{r.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{r.description}</p>
                </a>
              ))}
            </div>
          );
        } catch { return null; }
      case "plan":
        try {
          const plan = JSON.parse(content.data);
          return (
            <div key={idx} className="bg-[var(--bg-surface)] rounded-lg p-4 mt-2 border border-[var(--border-color)]">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{plan.name || "Study Plan"}</h4>
              {plan.weeks?.map((w: { title: string; tasks: string[] }, i: number) => (
                <div key={i} className="mb-2">
                  <p className="text-xs font-medium text-[var(--accent)]">{w.title}</p>
                  <ul className="text-xs text-[var(--text-secondary)] ml-4 list-disc">
                    {w.tasks?.map((t: string, j: number) => <li key={j}>{t}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          );
        } catch { return null; }
      default: {
        const text = stripThinkingTags(content.data);
        if (!text) return null;
        return (
          <div key={idx} className="prose prose-sm prose-invert max-w-none
            prose-p:my-1.5 prose-p:leading-relaxed
            prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
            prose-strong:text-[var(--accent)] prose-strong:font-semibold
            prose-code:text-[var(--accent)] prose-code:bg-[var(--bg-surface)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
            prose-pre:bg-[var(--bg-surface)] prose-pre:border prose-pre:border-[var(--border-color)] prose-pre:rounded-lg
            prose-li:my-0.5 prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
          ">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        );
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">What would you like to learn?</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md">
              Ask anything, generate quizzes with /quiz, find resources with /resources, or create study plans with /plan.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["Quiz me on calculus", "Find resources for data structures", "Create a study plan for finals"].map(s => (
                <button key={s} className="text-xs px-3 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-[var(--accent-muted)] flex-shrink-0 flex items-center justify-center mt-1">
                <span className="text-sm">🎓</span>
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                : ""
            }`}>
              {msg.content.map((c, idx) => renderContent(c, idx))}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-muted)] flex-shrink-0 flex items-center justify-center">
              <span className="text-sm animate-pulse">🎓</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create QuizCard component**

Create `src/components/unified/QuizCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizData {
  id?: string;
  topic?: string;
  questions: QuizQuestion[];
}

interface QuizCardProps {
  quiz: QuizData;
  onSubmit?: (quizId: string, answers: { questionIndex: number; answer: number }[]) => void;
}

export function QuizCard({ quiz, onSubmit }: QuizCardProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const question = quiz.questions[currentQ];
  const isAnswered = answers[currentQ] !== null;

  const handleSelect = (optionIdx: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onSubmit && quiz.id) {
      onSubmit(quiz.id, answers.map((a, i) => ({ questionIndex: i, answer: a ?? -1 })));
    }
  };

  const score = submitted
    ? answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length
    : 0;

  if (submitted) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-color)] mt-2">
        <div className="text-center mb-4">
          <p className="text-2xl font-bold text-[var(--accent)]">{score}/{quiz.questions.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {score === quiz.questions.length ? "Perfect score!" : score >= quiz.questions.length * 0.7 ? "Good job!" : "Keep practicing!"}
          </p>
        </div>
        <div className="space-y-3">
          {quiz.questions.map((q, i) => (
            <div key={i} className="flex items-start gap-2">
              {answers[i] === q.correctAnswer
                ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                : <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              }
              <p className="text-xs text-[var(--text-secondary)]">{q.question}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-color)] mt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--text-muted)]">Question {currentQ + 1}/{quiz.questions.length}</span>
        {quiz.topic && <span className="text-xs text-[var(--accent)] bg-[var(--accent-muted)] px-2 py-0.5 rounded-full">{quiz.topic}</span>}
      </div>

      <p className="text-sm font-medium text-[var(--text-primary)] mb-4">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border ${
              answers[currentQ] === i
                ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text-primary)]"
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-30"
        >
          Previous
        </button>

        {currentQ < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={!isAnswered}
            className="px-4 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white disabled:opacity-30"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={answers.some(a => a === null)}
            className="px-4 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white disabled:opacity-30"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wire components into dashboard page**

Update `src/app/(dashboard)/dashboard/page.tsx` to replace placeholders with real components. Import `ChatArea`, `ChatInput`, wire up `streamChat` with event handling, manage message state with the new `MessageContent` type:

Replace the chat content placeholder and input placeholder with:
- `<ChatArea messages={messages} isStreaming={isStreaming} onQuizSubmit={handleQuizSubmit} />`
- `<ChatInput onSend={handleSend} onFileUpload={handleFileUpload} disabled={isStreaming} />`

Add state management: `messages` as `Message[]`, `isStreaming`, `handleSend` that calls `streamChat` with `onEvent`, parsing events into `MessageContent[]`.

Full orchestration logic:

```tsx
const handleSend = useCallback(async (message: string) => {
  if (!session?.token) return;

  const command = message.startsWith("/") ? message.split(" ")[0].slice(1) : undefined;
  const userMsg: Message = { role: "user", content: [{ type: "text", data: message }] };
  setMessages(prev => [...prev, userMsg]);
  setIsStreaming(true);

  const assistantContent: MessageContent[] = [];
  let currentText = "";
  setMessages(prev => [...prev, { role: "assistant", content: [] }]);

  await streamChat(
    message,
    session.token,
    { page: "/dashboard", command },
    (event) => {
      if (event.type === "text") {
        currentText += event.data;
        const textContent = { type: "text" as const, data: currentText };
        const newContent = [...assistantContent.filter(c => c.type !== "text"), textContent];
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: newContent };
          return updated;
        });
      } else {
        assistantContent.push(event);
        const textContent = currentText ? [{ type: "text" as const, data: currentText }] : [];
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: [...textContent, ...assistantContent.filter(c => c.type !== "text")] };
          return updated;
        });
      }
    },
    () => setIsStreaming(false),
    () => setIsStreaming(false)
  );
}, [session]);
```

- [ ] **Step 6: Verify chat works end-to-end**

Run: `npm run dev`
Navigate to `/dashboard`. Type a message. Verify streaming response renders. Type `/` and verify command palette appears. Test keyboard navigation.

---

## Task 6: Context Panel (Right Side)

**Files:**
- Create: `src/components/unified/ContextPanel.tsx`
- Create: `src/components/unified/context/ScoreSection.tsx`
- Create: `src/components/unified/context/WeakTopicsSection.tsx`
- Create: `src/components/unified/context/StudyPlanSection.tsx`
- Create: `src/components/unified/context/ResourcesSection.tsx`
- Create: `src/components/unified/context/MemorySection.tsx`
- Create: `src/components/unified/context/StreakSection.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

Depends on: Task 2 (backend routes), Task 4 (dashboard shell)

- [ ] **Step 1: Create ScoreSection**

Create `src/components/unified/context/ScoreSection.tsx`:

```tsx
"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface ScoreSectionProps {
  overallScore: number;
  topics: { topic: string; mastery: number }[];
}

export function ScoreSection({ overallScore, topics }: ScoreSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold text-[var(--accent)]">{overallScore}%</span>
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          {overallScore >= 60 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
          <span>Overall</span>
        </div>
      </div>
      <div className="space-y-2">
        {topics.slice(0, 5).map(t => (
          <div key={t.topic}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--text-secondary)] truncate">{t.topic}</span>
              <span className="text-[var(--text-muted)]">{t.mastery}%</span>
            </div>
            <div className="h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${t.mastery}%`,
                  backgroundColor: t.mastery >= 70 ? "var(--accent)" : t.mastery >= 40 ? "var(--warning)" : "var(--error)"
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create WeakTopicsSection**

Create `src/components/unified/context/WeakTopicsSection.tsx`:

```tsx
"use client";

import { AlertTriangle } from "lucide-react";

interface WeakTopic {
  topic: string;
  mastery: number;
  daysSinceReview: number | null;
  reviewOverdue: boolean;
}

interface WeakTopicsSectionProps {
  weakTopics: WeakTopic[];
  onReview: (topic: string) => void;
}

export function WeakTopicsSection({ weakTopics, onReview }: WeakTopicsSectionProps) {
  if (weakTopics.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">No weak topics. Keep it up!</p>;
  }

  return (
    <div className="space-y-2">
      {weakTopics.slice(0, 5).map(t => (
        <div key={t.topic} className="flex items-center justify-between bg-[var(--bg-surface)] rounded-lg p-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${t.reviewOverdue ? "text-[var(--error)]" : "text-[var(--warning)]"}`} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{t.topic}</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {t.mastery}% mastery{t.daysSinceReview !== null ? ` · ${t.daysSinceReview}d ago` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => onReview(t.topic)}
            className="text-[10px] px-2 py-1 rounded bg-[var(--accent-muted)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors flex-shrink-0"
          >
            Review
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create StudyPlanSection**

Create `src/components/unified/context/StudyPlanSection.tsx`:

```tsx
"use client";

import { CheckSquare, Square, Clock } from "lucide-react";

interface StudyPlanSectionProps {
  plan: {
    name: string;
    progress: number;
    tasks: { title: string; completed: boolean }[];
    nextDeadline?: string;
  } | null;
}

export function StudyPlanSection({ plan }: StudyPlanSectionProps) {
  if (!plan) {
    return <p className="text-xs text-[var(--text-muted)]">No active study plan. Use /plan to create one.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-[var(--text-primary)]">{plan.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${plan.progress}%` }} />
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">{plan.progress}%</span>
        </div>
      </div>
      {plan.nextDeadline && (
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--warning)]">
          <Clock className="h-3 w-3" />
          <span>Deadline: {new Date(plan.nextDeadline).toLocaleDateString()}</span>
        </div>
      )}
      <div className="space-y-1.5">
        {plan.tasks.slice(0, 4).map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            {t.completed
              ? <CheckSquare className="h-3.5 w-3.5 text-[var(--accent)]" />
              : <Square className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            }
            <span className={`text-xs ${t.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-secondary)]"}`}>{t.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ResourcesSection, MemorySection, StreakSection**

Create `src/components/unified/context/ResourcesSection.tsx`:

```tsx
"use client";

import { ExternalLink, FileText } from "lucide-react";

interface Resource {
  title: string;
  url?: string;
  type: "link" | "pdf";
}

interface ResourcesSectionProps {
  resources: Resource[];
}

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  if (resources.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">No pinned resources yet.</p>;
  }

  return (
    <div className="space-y-1.5">
      {resources.slice(0, 5).map((r, i) => (
        <a key={i} href={r.url || "#"} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors group">
          {r.type === "pdf" ? <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" /> : <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
          <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--accent)] truncate">{r.title}</span>
        </a>
      ))}
    </div>
  );
}
```

Create `src/components/unified/context/MemorySection.tsx`:

```tsx
"use client";

import { Brain, X } from "lucide-react";

interface Memory {
  id: string;
  text: string;
}

interface MemorySectionProps {
  memories: Memory[];
  onDelete?: (id: string) => void;
}

export function MemorySection({ memories, onDelete }: MemorySectionProps) {
  if (memories.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">No memories yet. Chat to build your profile.</p>;
  }

  return (
    <div className="space-y-1.5">
      {memories.map(m => (
        <div key={m.id} className="flex items-start gap-2 bg-[var(--bg-surface)] rounded-lg p-2.5 group">
          <Brain className="h-3.5 w-3.5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[var(--text-secondary)] flex-1">{m.text}</p>
          {onDelete && (
            <button onClick={() => onDelete(m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="h-3 w-3 text-[var(--text-muted)] hover:text-[var(--error)]" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

Create `src/components/unified/context/StreakSection.tsx`:

```tsx
"use client";

import { Flame } from "lucide-react";

interface StreakSectionProps {
  streak: number;
  todayQuestions: number;
}

export function StreakSection({ streak, todayQuestions }: StreakSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Flame className={`h-5 w-5 ${streak > 0 ? "text-orange-500" : "text-[var(--text-muted)]"}`} />
          <span className="text-lg font-bold text-[var(--text-primary)]">{streak}</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">day streak</span>
      </div>
      <div className="text-xs text-[var(--text-secondary)]">
        <span className="font-medium text-[var(--text-primary)]">{todayQuestions}</span> questions answered today
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create ContextPanel wrapper with accordion sections**

Create `src/components/unified/ContextPanel.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreSection } from "./context/ScoreSection";
import { WeakTopicsSection } from "./context/WeakTopicsSection";
import { StudyPlanSection } from "./context/StudyPlanSection";
import { ResourcesSection } from "./context/ResourcesSection";
import { MemorySection } from "./context/MemorySection";
import { StreakSection } from "./context/StreakSection";

interface ContextPanelProps {
  onTriggerCommand: (command: string) => void;
}

function AccordionSection({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-[var(--border-color)] last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        {title}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export function ContextPanel({ onTriggerCommand }: ContextPanelProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/performance/summary/${session.user.id}`);
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
  }, [session?.user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-0">
      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Study Dashboard</h3>

      <AccordionSection title="Performance" defaultOpen>
        <ScoreSection
          overallScore={data?.overallScore ?? 0}
          topics={(data?.topics ?? []).map((t: any) => ({ topic: t.topic, mastery: t.mastery }))}
        />
      </AccordionSection>

      <AccordionSection title="Weak Topics" defaultOpen>
        <WeakTopicsSection
          weakTopics={data?.weakTopics ?? []}
          onReview={(topic) => onTriggerCommand(`/review ${topic}`)}
        />
      </AccordionSection>

      <AccordionSection title="Study Plan">
        <StudyPlanSection plan={null} />
      </AccordionSection>

      <AccordionSection title="Resources">
        <ResourcesSection resources={[]} />
      </AccordionSection>

      <AccordionSection title="AI Memory">
        <MemorySection memories={[]} />
      </AccordionSection>

      <AccordionSection title="Streak">
        <StreakSection streak={data?.streak ?? 0} todayQuestions={0} />
      </AccordionSection>
    </div>
  );
}
```

- [ ] **Step 6: Wire ContextPanel into dashboard page**

Update `src/app/(dashboard)/dashboard/page.tsx`: replace the context panel placeholder with `<ContextPanel onTriggerCommand={handleTriggerCommand} />`.

Add the handler function inside the component:

```tsx
const handleTriggerCommand = useCallback((command: string) => {
  handleSend(command);
}, [handleSend]);
```

And in the JSX, replace the context panel placeholder:

```tsx
{contextPanelOpen && (
  <div className="hidden lg:block w-72 border-l border-[var(--border-color)] bg-[var(--bg-secondary)]">
    <ContextPanel onTriggerCommand={handleTriggerCommand} />
  </div>
)}
```

- [ ] **Step 7: Verify context panel renders**

Run: `npm run dev`. Navigate to `/dashboard`. Verify right panel shows accordion sections. Toggle collapse. Verify data loads from performance API.

---

## Task 7: Quiz Integration + End-to-End Flow

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/components/unified/ChatArea.tsx`

Depends on: Task 2 (quiz routes), Task 5 (chat area)

- [ ] **Step 1: Wire quiz submission to backend**

In the dashboard page, add `handleQuizSubmit` function:

```tsx
const handleQuizSubmit = async (quizId: string, answers: { questionIndex: number; answer: number }[]) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, answers }),
    });
    if (res.ok) {
      const result = await res.json();
      // Refresh context panel data
      // Add score summary to chat
    }
  } catch { /* handle error */ }
};
```

Pass this to `<ChatArea onQuizSubmit={handleQuizSubmit} />`.

- [ ] **Step 2: Test full quiz flow**

1. Navigate to `/dashboard`
2. Type `/quiz calculus`
3. Verify command palette shows, enter sends to agent
4. If agent returns quiz event → QuizCard renders inline
5. Answer questions, submit → score shows
6. Context panel updates with new score

- [ ] **Step 3: Test resource and plan flows**

1. Type `/resources data structures` → verify resource cards render
2. Type `/plan linear algebra finals` → verify plan card renders
3. Verify natural language also works: "find me some resources on algorithms"

---

## Task 8: Route Redirects + Polish

**Files:**
- Modify: `src/components/dashboard/DashboardNav.tsx`
- Modify: `src/middleware.ts`

Depends on: All previous tasks

- [ ] **Step 1: Add /dashboard to DashboardNav**

Add a "Dashboard" nav item to the "General" section in DashboardNav, above Home:

```typescript
{
  label: 'Dashboard',
  icon: MessageSquare,
  href: '/dashboard',
  badge: 'New',
},
```

- [ ] **Step 2: Add redirects for old routes (optional)**

In `src/middleware.ts`, add redirect rules for `/chat` → `/dashboard`, `/insights` → `/dashboard`. Keep other pages functional since they still work standalone.

- [ ] **Step 3: Mobile responsive check**

Test at 768px width:
- Sidebar hidden
- Chat full-width
- Context panel accessible via toggle button
- Input usable with virtual keyboard

- [ ] **Step 4: Polish pass**

- Empty states for all context panel sections
- Loading skeletons for async data
- Error boundaries for structured content parsing
- Smooth transitions on panel collapse/expand
- Focus management for command palette

- [ ] **Step 5: Final build check**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors and no warnings.

---

## Parallelism Strategy

For worktree-based parallel execution:

| Worktree | Tasks | Branch |
|----------|-------|--------|
| `wt-css` | Task 1 | `feat/unified-dark-css` |
| `wt-backend` | Task 2 | `feat/quiz-backend` |
| `wt-stream` | Task 3 | `feat/stream-refactor` |
| Main | Tasks 4-8 (sequential) | `feat/unified-dashboard` |

Tasks 1-3 run in parallel worktrees. Merge all into `feat/unified-dashboard` before starting Task 4. Tasks 4-8 are sequential (each builds on prior).
