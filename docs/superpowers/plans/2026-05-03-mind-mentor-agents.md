# Mind Mentor Multi-Agent Learning System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three AI agents (tutor, scheduler, analyst) to Mind Mentor that personalize learning through memory, spaced repetition, and email reminders.

**Architecture:** Hono-based Cloudflare Workers service with three agent endpoints sharing a mem0 Cloud memory layer. Communicates with existing Express backend via authenticated API calls. Frontend gets a chat widget, insights dashboard, and reminder settings.

**Tech Stack:** Hono (CF Workers), Groq (qwen/qwen3-32b), mem0ai SDK, Resend + React Email, react-force-graph-2d, recharts, eventsource-parser

**Spec:** `docs/superpowers/specs/2026-05-03-mind-mentor-learning-agent-design.md`

---

## File Structure

### New: `mind-mentor-agents/` (Cloudflare Workers project)

```
mind-mentor-agents/
├── src/
│   ├── index.ts                    # Hono app entry point, route registration
│   ├── middleware/
│   │   └── auth.ts                 # JWT verification + CORS
│   ├── agents/
│   │   ├── tutor.ts                # Tutor agent: chat + SSE streaming
│   │   ├── scheduler.ts           # Scheduler agent: cron + email dispatch
│   │   └── analyst.ts             # Analyst agent: patterns + SM-2 + graph
│   ├── memory/
│   │   └── mem0Client.ts          # mem0 Cloud SDK wrapper
│   ├── email/
│   │   ├── resendClient.ts        # Resend SDK wrapper
│   │   └── templates/
│   │       ├── dailyReminder.tsx   # Daily study reminder template
│   │       ├── streakWarning.tsx   # Streak at risk template
│   │       ├── weeklyDigest.tsx    # Weekly progress digest template
│   │       ├── spacedRepetition.tsx # Topic review alert template
│   │       └── milestone.tsx       # Achievement celebration template
│   ├── intelligence/
│   │   ├── sm2.ts                  # SM-2 spaced repetition algorithm
│   │   ├── knowledgeGraph.ts      # Topic graph operations
│   │   └── patterns.ts            # Study pattern detection
│   ├── api/
│   │   └── expressClient.ts       # Authenticated calls to Express backend
│   └── types/
│       └── index.ts                # Shared TypeScript types
├── tests/
│   ├── sm2.test.ts
│   ├── patterns.test.ts
│   └── knowledgeGraph.test.ts
├── wrangler.toml
├── tsconfig.json
├── package.json
└── vitest.config.ts
```

### Modified: Existing Express backend (`server/`)

```
server/
├── middleware/
│   └── agentAuth.js               # NEW: validate X-Agent-Secret header
├── routes/
│   ├── analytics.js               # NEW: study session + topic analytics
│   ├── reminders.js               # NEW: reminder preferences CRUD
│   ├── chatHistory.js             # NEW: chat history persistence
│   └── webhooks.js                # NEW: Resend webhook handler
├── models/
│   ├── reminderPreferences.js     # NEW: reminder prefs schema
│   ├── chatHistory.js             # NEW: chat message schema
│   └── topicMastery.js            # NEW: SM-2 + mastery schema
└── index.js                        # MODIFY: register new routes
```

### Modified: Next.js frontend (`src/`)

```
src/
├── app/(dashboard)/
│   ├── chat/
│   │   └── page.tsx               # NEW: dedicated chat page
│   ├── insights/
│   │   ├── page.tsx               # NEW: insights overview
│   │   └── knowledge-graph/
│   │       └── page.tsx           # NEW: interactive topic graph
│   └── settings/
│       └── reminders/
│           └── page.tsx           # NEW: reminder configuration
├── components/
│   ├── chat/
│   │   ├── ChatWidget.tsx         # NEW: floating chat button + panel
│   │   ├── ChatMessages.tsx       # NEW: message list renderer
│   │   └── ChatInput.tsx          # NEW: message input with quick actions
│   ├── insights/
│   │   ├── MasteryRadar.tsx       # NEW: radar chart for topic mastery
│   │   ├── StudyHeatmap.tsx       # NEW: study pattern heatmap
│   │   ├── VelocityChart.tsx      # NEW: learning velocity line chart
│   │   ├── WeakSpots.tsx          # NEW: weak topics with progress bars
│   │   ├── ReadinessGauge.tsx     # NEW: predicted readiness gauge
│   │   └── KnowledgeGraph.tsx     # NEW: force-directed graph viewer
│   └── settings/
│       └── ReminderSettings.tsx   # NEW: reminder form component
├── lib/
│   └── agent-client.ts           # NEW: SSE streaming client for agents
└── middleware.ts                   # MODIFY: add new protected routes
```

---

## Task 1: Agent Project Scaffold

**Files:**
- Create: `mind-mentor-agents/package.json`
- Create: `mind-mentor-agents/tsconfig.json`
- Create: `mind-mentor-agents/wrangler.toml`
- Create: `mind-mentor-agents/vitest.config.ts`
- Create: `mind-mentor-agents/src/index.ts`
- Create: `mind-mentor-agents/src/types/index.ts`

- [ ] **Step 1: Create agent project directory**

```bash
mkdir -p mind-mentor-agents/src/{agents,middleware,memory,email/templates,intelligence,api,types}
mkdir -p mind-mentor-agents/tests
```

- [ ] **Step 2: Create package.json**

Create `mind-mentor-agents/package.json`:
```json
{
  "name": "mind-mentor-agents",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.4.0",
    "groq-sdk": "^0.5.0",
    "mem0ai": "^0.1.0",
    "resend": "^3.2.0",
    "@react-email/components": "^0.0.19",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "jose": "^5.6.0"
  },
  "devDependencies": {
    "wrangler": "^3.60.0",
    "typescript": "^5.5.0",
    "vitest": "^1.6.0",
    "@cloudflare/workers-types": "^4.20240529.0",
    "@types/react": "^18.3.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

Create `mind-mentor-agents/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create wrangler.toml**

Create `mind-mentor-agents/wrangler.toml`:
```toml
name = "mind-mentor-agents"
main = "src/index.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[triggers]
crons = ["0 * * * *"]

[vars]
EXPRESS_BACKEND_URL = "https://mind-mentor-api.onrender.com"
```

- [ ] **Step 5: Create vitest config**

Create `mind-mentor-agents/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 6: Create types file**

Create `mind-mentor-agents/src/types/index.ts`:
```typescript
export interface Env {
  GROQ_API_KEY: string;
  MEM0_API_KEY: string;
  RESEND_API_KEY: string;
  AGENT_SERVICE_SECRET: string;
  NEXTAUTH_SECRET: string;
  EXPRESS_BACKEND_URL: string;
}

export interface UserContext {
  userId: string;
  preferences?: string[];
  weakTopics?: string[];
  strongTopics?: string[];
  studyPatterns?: string[];
}

export interface TopicNode {
  id: string;
  topic: string;
  subject: string;
  mastery: number;
}

export interface TopicEdge {
  source: string;
  target: string;
  type: "prerequisite" | "related";
}

export interface SM2Data {
  topic: string;
  repetitions: number;
  easiness: number;
  interval: number;
  nextReview: Date;
}

export interface AnalysisResult {
  patterns: {
    optimalStudyTime: string;
    avgSessionDuration: number;
    learningVelocity: Record<string, number>;
    fatigueThreshold: number;
  };
  knowledgeGraph: {
    nodes: TopicNode[];
    edges: TopicEdge[];
  };
  spacedRepetition: SM2Data[];
  recommendations: string[];
}

export interface ReminderPreferences {
  userId: string;
  timezone: string;
  dailyReminder: { enabled: boolean; time: string };
  streakWarning: { enabled: boolean; hoursBeforeMidnight: number };
  weeklyDigest: { enabled: boolean; day: string };
  spacedRepetition: { enabled: boolean; intensity: "aggressive" | "balanced" | "relaxed" };
  email: string;
  maxEmailsPerDay: number;
}
```

- [ ] **Step 7: Create Hono entry point with CORS + routing**

Create `mind-mentor-agents/src/index.ts`:
```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./types/index.js";
import { tutorRoutes } from "./agents/tutor.js";
import { schedulerRoutes } from "./agents/scheduler.js";
import { analystRoutes } from "./agents/analyst.js";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: [
    "https://mind-mentor-pearl.vercel.app",
    "https://mind-mentor.kartiklabhshetwar.me",
    "https://www.mind-mentor.ink",
    "https://mind-mentor.ink",
    "http://localhost:3000",
  ],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  credentials: true,
}));

app.get("/health", (c) => c.json({ status: "ok", agents: ["tutor", "scheduler", "analyst"] }));

app.route("/agents/tutor", tutorRoutes);
app.route("/agents/scheduler", schedulerRoutes);
app.route("/agents/analyst", analystRoutes);

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Hourly cron — scheduler agent checks for reminders to send
    const schedulerApp = new Hono<{ Bindings: Env }>();
    // Will be implemented in Task 7
  },
};
```

- [ ] **Step 8: Install dependencies and verify build**

```bash
cd mind-mentor-agents
npm install
npx tsc --noEmit
```

- [ ] **Step 9: Test local dev server**

```bash
npx wrangler dev --port 3583
# In another terminal:
curl http://localhost:3583/health
# Expected: {"status":"ok","agents":["tutor","scheduler","analyst"]}
```

- [ ] **Step 10: Commit**

```bash
git add mind-mentor-agents/
git commit -m "feat: scaffold Hono-based agent project on Cloudflare Workers"
```

---

## Task 2: Auth Middleware + mem0 Client

**Files:**
- Create: `mind-mentor-agents/src/middleware/auth.ts`
- Create: `mind-mentor-agents/src/memory/mem0Client.ts`
- Create: `mind-mentor-agents/src/api/expressClient.ts`

- [ ] **Step 1: Create JWT auth middleware**

Create `mind-mentor-agents/src/middleware/auth.ts`:
```typescript
import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { Env } from "../types/index.js";

export async function verifyUserAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization token" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(c.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;
    if (!userId) {
      return c.json({ error: "Invalid token: missing user ID" }, 401);
    }
    c.set("userId", userId);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
```

- [ ] **Step 2: Create mem0 client wrapper**

Create `mind-mentor-agents/src/memory/mem0Client.ts`:
```typescript
import MemoryClient from "mem0ai";
import { Env } from "../types/index.js";

export function createMem0Client(env: Env) {
  return new MemoryClient({ apiKey: env.MEM0_API_KEY });
}

export async function getUserMemories(client: MemoryClient, userId: string, query: string) {
  try {
    const results = await client.search(query, { user_id: userId });
    return results;
  } catch (error) {
    console.error("mem0 search error:", error);
    return [];
  }
}

export async function addUserMemory(client: MemoryClient, userId: string, content: string, category: string) {
  try {
    await client.add(
      [{ role: "system", content }],
      { user_id: userId, metadata: { category } }
    );
  } catch (error) {
    console.error("mem0 add error:", error);
  }
}
```

- [ ] **Step 3: Create Express API client**

Create `mind-mentor-agents/src/api/expressClient.ts`:
```typescript
import { Env } from "../types/index.js";

export function createExpressClient(env: Env) {
  const baseUrl = env.EXPRESS_BACKEND_URL;
  const headers = {
    "Content-Type": "application/json",
    "X-Agent-Secret": env.AGENT_SERVICE_SECRET,
  };

  return {
    async getStudySessions(userId: string) {
      const res = await fetch(`${baseUrl}/api/analytics/sessions/${userId}`, { headers });
      if (!res.ok) return null;
      return res.json();
    },

    async getTopicMastery(userId: string) {
      const res = await fetch(`${baseUrl}/api/topics/mastery/${userId}`, { headers });
      if (!res.ok) return [];
      return res.json();
    },

    async updateTopicMastery(userId: string, data: unknown) {
      const res = await fetch(`${baseUrl}/api/topics/mastery`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, ...data as object }),
      });
      return res.ok;
    },

    async getReminderPreferences(userId: string) {
      const res = await fetch(`${baseUrl}/api/reminders/preferences/${userId}`, { headers });
      if (!res.ok) return null;
      return res.json();
    },

    async saveChatMessage(userId: string, messages: unknown[]) {
      await fetch(`${baseUrl}/api/chat/history`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, messages }),
      });
    },
  };
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd mind-mentor-agents
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add mind-mentor-agents/src/middleware/ mind-mentor-agents/src/memory/ mind-mentor-agents/src/api/
git commit -m "feat: add auth middleware, mem0 client, and Express API client"
```

---

## Task 3: SM-2 Algorithm (TDD)

**Files:**
- Create: `mind-mentor-agents/src/intelligence/sm2.ts`
- Create: `mind-mentor-agents/tests/sm2.test.ts`

- [ ] **Step 1: Write failing tests for SM-2**

Create `mind-mentor-agents/tests/sm2.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { calculateSM2, SM2Input, SM2Result } from "../src/intelligence/sm2.js";

describe("SM-2 Algorithm", () => {
  it("first review with perfect quality (5) gives 1-day interval", () => {
    const input: SM2Input = { repetitions: 0, easiness: 2.5, interval: 0, quality: 5 };
    const result = calculateSM2(input);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.easiness).toBeGreaterThanOrEqual(2.5);
  });

  it("second review with quality 4 gives 6-day interval", () => {
    const input: SM2Input = { repetitions: 1, easiness: 2.5, interval: 1, quality: 4 };
    const result = calculateSM2(input);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it("third review multiplies interval by easiness factor", () => {
    const input: SM2Input = { repetitions: 2, easiness: 2.5, interval: 6, quality: 4 };
    const result = calculateSM2(input);
    expect(result.interval).toBe(15); // Math.round(6 * 2.5)
    expect(result.repetitions).toBe(3);
  });

  it("quality below 3 resets repetitions and interval", () => {
    const input: SM2Input = { repetitions: 5, easiness: 2.5, interval: 30, quality: 2 };
    const result = calculateSM2(input);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("easiness factor never drops below 1.3", () => {
    const input: SM2Input = { repetitions: 1, easiness: 1.3, interval: 1, quality: 0 };
    const result = calculateSM2(input);
    expect(result.easiness).toBe(1.3);
  });

  it("quality 5 increases easiness", () => {
    const input: SM2Input = { repetitions: 3, easiness: 2.5, interval: 15, quality: 5 };
    const result = calculateSM2(input);
    expect(result.easiness).toBeGreaterThan(2.5);
  });

  it("quality 3 slightly decreases easiness", () => {
    const input: SM2Input = { repetitions: 3, easiness: 2.5, interval: 15, quality: 3 };
    const result = calculateSM2(input);
    expect(result.easiness).toBeLessThan(2.5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd mind-mentor-agents
npx vitest run tests/sm2.test.ts
# Expected: FAIL — module not found
```

- [ ] **Step 3: Implement SM-2 algorithm**

Create `mind-mentor-agents/src/intelligence/sm2.ts`:
```typescript
export interface SM2Input {
  repetitions: number;
  easiness: number;
  interval: number;
  quality: number; // 0-5
}

export interface SM2Result {
  repetitions: number;
  easiness: number;
  interval: number;
  nextReview: Date;
}

export function calculateSM2(input: SM2Input): SM2Result {
  const { repetitions, easiness, interval, quality } = input;

  let newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEasiness = Math.max(1.3, newEasiness);

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEasiness);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    easiness: Math.round(newEasiness * 100) / 100,
    interval: newInterval,
    nextReview,
  };
}

export function calculateMasteryScore(
  easiness: number,
  reviewCount: number,
  daysSinceLastReview: number
): number {
  const easinessNormalized = (easiness / 2.5) * 100;
  const reviewNormalized = (Math.min(reviewCount, 10) / 10) * 100;
  const recencyScore = 100 * Math.exp(-0.1 * daysSinceLastReview);

  return Math.round(
    easinessNormalized * 0.4 +
    reviewNormalized * 0.3 +
    recencyScore * 0.3
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd mind-mentor-agents
npx vitest run tests/sm2.test.ts
# Expected: all 7 tests PASS
```

- [ ] **Step 5: Commit**

```bash
git add mind-mentor-agents/src/intelligence/sm2.ts mind-mentor-agents/tests/sm2.test.ts
git commit -m "feat: implement SM-2 spaced repetition algorithm with tests"
```

---

## Task 4: Pattern Detection + Knowledge Graph

**Files:**
- Create: `mind-mentor-agents/src/intelligence/patterns.ts`
- Create: `mind-mentor-agents/src/intelligence/knowledgeGraph.ts`
- Create: `mind-mentor-agents/tests/patterns.test.ts`
- Create: `mind-mentor-agents/tests/knowledgeGraph.test.ts`

- [ ] **Step 1: Write pattern detection tests**

Create `mind-mentor-agents/tests/patterns.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { detectPatterns, StudySession } from "../src/intelligence/patterns.js";

describe("Pattern Detection", () => {
  const sessions: StudySession[] = [
    { date: "2026-05-01", startHour: 19, duration: 45 },
    { date: "2026-05-02", startHour: 20, duration: 50 },
    { date: "2026-05-03", startHour: 19, duration: 40 },
    { date: "2026-05-04", startHour: 19, duration: 55 },
    { date: "2026-05-05", startHour: 20, duration: 30 },
  ];

  it("detects optimal study time from most common hour", () => {
    const result = detectPatterns(sessions);
    expect(result.optimalStudyTime).toBe("19:00-20:00");
  });

  it("calculates average session duration", () => {
    const result = detectPatterns(sessions);
    expect(result.avgSessionDuration).toBe(44);
  });

  it("detects fatigue threshold from duration decline", () => {
    const longSessions: StudySession[] = [
      { date: "2026-05-01", startHour: 19, duration: 90 },
      { date: "2026-05-02", startHour: 19, duration: 60 },
      { date: "2026-05-03", startHour: 19, duration: 45 },
    ];
    const result = detectPatterns(longSessions);
    expect(result.fatigueThreshold).toBeLessThanOrEqual(60);
  });

  it("returns defaults for empty sessions", () => {
    const result = detectPatterns([]);
    expect(result.optimalStudyTime).toBe("unknown");
    expect(result.avgSessionDuration).toBe(0);
  });
});
```

- [ ] **Step 2: Implement pattern detection**

Create `mind-mentor-agents/src/intelligence/patterns.ts`:
```typescript
export interface StudySession {
  date: string;
  startHour: number;
  duration: number;
  subject?: string;
}

export interface PatternResult {
  optimalStudyTime: string;
  avgSessionDuration: number;
  fatigueThreshold: number;
  learningVelocity: Record<string, number>;
}

export function detectPatterns(sessions: StudySession[]): PatternResult {
  if (sessions.length === 0) {
    return { optimalStudyTime: "unknown", avgSessionDuration: 0, fatigueThreshold: 60, learningVelocity: {} };
  }

  // Find most common study hour
  const hourCounts: Record<number, number> = {};
  let totalDuration = 0;

  for (const session of sessions) {
    hourCounts[session.startHour] = (hourCounts[session.startHour] || 0) + 1;
    totalDuration += session.duration;
  }

  const peakHour = Number(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]);
  const optimalStudyTime = `${peakHour}:00-${peakHour + 1}:00`;
  const avgSessionDuration = Math.round(totalDuration / sessions.length);

  // Fatigue threshold: median of sessions sorted by duration
  const sorted = [...sessions].sort((a, b) => a.duration - b.duration);
  const fatigueThreshold = sorted[Math.floor(sorted.length / 2)].duration;

  // Learning velocity: topics per week per subject
  const subjectDays: Record<string, Set<string>> = {};
  for (const session of sessions) {
    if (session.subject) {
      if (!subjectDays[session.subject]) subjectDays[session.subject] = new Set();
      subjectDays[session.subject].add(session.date);
    }
  }

  const learningVelocity: Record<string, number> = {};
  for (const [subject, days] of Object.entries(subjectDays)) {
    learningVelocity[subject] = Math.round((days.size / 7) * 10) / 10;
  }

  return { optimalStudyTime, avgSessionDuration, fatigueThreshold, learningVelocity };
}
```

- [ ] **Step 3: Run pattern tests**

```bash
cd mind-mentor-agents
npx vitest run tests/patterns.test.ts
# Expected: PASS
```

- [ ] **Step 4: Write knowledge graph tests**

Create `mind-mentor-agents/tests/knowledgeGraph.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { KnowledgeGraph } from "../src/intelligence/knowledgeGraph.js";

describe("Knowledge Graph", () => {
  it("adds nodes and edges", () => {
    const graph = new KnowledgeGraph();
    graph.addNode({ id: "js-basics", topic: "JavaScript Basics", subject: "JavaScript", mastery: 80 });
    graph.addNode({ id: "react", topic: "React", subject: "JavaScript", mastery: 30 });
    graph.addEdge("js-basics", "react", "prerequisite");

    expect(graph.getNodes()).toHaveLength(2);
    expect(graph.getEdges()).toHaveLength(1);
  });

  it("finds prerequisites for a topic", () => {
    const graph = new KnowledgeGraph();
    graph.addNode({ id: "arrays", topic: "Arrays", subject: "DSA", mastery: 90 });
    graph.addNode({ id: "dp", topic: "Dynamic Programming", subject: "DSA", mastery: 20 });
    graph.addNode({ id: "recursion", topic: "Recursion", subject: "DSA", mastery: 50 });
    graph.addEdge("arrays", "dp", "prerequisite");
    graph.addEdge("recursion", "dp", "prerequisite");

    const prereqs = graph.getPrerequisites("dp");
    expect(prereqs).toHaveLength(2);
    expect(prereqs.map(n => n.id)).toContain("arrays");
    expect(prereqs.map(n => n.id)).toContain("recursion");
  });

  it("identifies weak prerequisites (gaps)", () => {
    const graph = new KnowledgeGraph();
    graph.addNode({ id: "closures", topic: "Closures", subject: "JS", mastery: 25 });
    graph.addNode({ id: "hooks", topic: "React Hooks", subject: "React", mastery: 10 });
    graph.addEdge("closures", "hooks", "prerequisite");

    const gaps = graph.findGaps("hooks", 50);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].id).toBe("closures");
  });

  it("suggests next topics based on mastery", () => {
    const graph = new KnowledgeGraph();
    graph.addNode({ id: "a", topic: "A", subject: "X", mastery: 90 });
    graph.addNode({ id: "b", topic: "B", subject: "X", mastery: 20 });
    graph.addNode({ id: "c", topic: "C", subject: "X", mastery: 0 });
    graph.addEdge("a", "b", "prerequisite");
    graph.addEdge("b", "c", "prerequisite");

    const next = graph.suggestNext();
    expect(next[0].id).toBe("b"); // prerequisite met, low mastery
  });
});
```

- [ ] **Step 5: Implement knowledge graph**

Create `mind-mentor-agents/src/intelligence/knowledgeGraph.ts`:
```typescript
import { TopicNode, TopicEdge } from "../types/index.js";

export class KnowledgeGraph {
  private nodes: Map<string, TopicNode> = new Map();
  private edges: TopicEdge[] = [];

  addNode(node: TopicNode) {
    this.nodes.set(node.id, node);
  }

  addEdge(source: string, target: string, type: "prerequisite" | "related") {
    this.edges.push({ source, target, type });
  }

  getNodes(): TopicNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): TopicEdge[] {
    return [...this.edges];
  }

  getPrerequisites(topicId: string): TopicNode[] {
    const prereqIds = this.edges
      .filter(e => e.target === topicId && e.type === "prerequisite")
      .map(e => e.source);
    return prereqIds.map(id => this.nodes.get(id)!).filter(Boolean);
  }

  findGaps(topicId: string, minMastery: number): TopicNode[] {
    const prereqs = this.getPrerequisites(topicId);
    return prereqs.filter(node => node.mastery < minMastery);
  }

  suggestNext(): TopicNode[] {
    const candidates: TopicNode[] = [];

    for (const node of this.nodes.values()) {
      if (node.mastery >= 80) continue; // already mastered
      const prereqs = this.getPrerequisites(node.id);
      const allPrereqsMet = prereqs.every(p => p.mastery >= 60);
      if (allPrereqsMet || prereqs.length === 0) {
        candidates.push(node);
      }
    }

    return candidates.sort((a, b) => a.mastery - b.mastery);
  }

  toJSON() {
    return { nodes: this.getNodes(), edges: this.getEdges() };
  }

  static fromJSON(data: { nodes: TopicNode[]; edges: TopicEdge[] }): KnowledgeGraph {
    const graph = new KnowledgeGraph();
    for (const node of data.nodes) graph.addNode(node);
    for (const edge of data.edges) graph.addEdge(edge.source, edge.target, edge.type);
    return graph;
  }
}
```

- [ ] **Step 6: Run all intelligence tests**

```bash
cd mind-mentor-agents
npx vitest run
# Expected: all tests PASS
```

- [ ] **Step 7: Commit**

```bash
git add mind-mentor-agents/src/intelligence/ mind-mentor-agents/tests/
git commit -m "feat: implement pattern detection and knowledge graph with tests"
```

---

## Task 5: Tutor Agent

**Files:**
- Create: `mind-mentor-agents/src/agents/tutor.ts`

- [ ] **Step 1: Implement tutor agent with SSE streaming**

Create `mind-mentor-agents/src/agents/tutor.ts`:
```typescript
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import Groq from "groq-sdk";
import { Env } from "../types/index.js";
import { verifyUserAuth } from "../middleware/auth.js";
import { createMem0Client, getUserMemories, addUserMemory } from "../memory/mem0Client.js";
import { createExpressClient } from "../api/expressClient.js";

export const tutorRoutes = new Hono<{ Bindings: Env }>();

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
  const memoryContext = memories.length > 0
    ? memories.map((m: { memory?: string }) => m.memory || "").join("\n")
    : "No prior context available for this user.";

  // Build system prompt
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
      const observation = extractObservation(message, fullResponse);
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

function extractObservation(question: string, answer: string): string | null {
  if (question.length < 20) return null;
  return `User asked about: "${question.slice(0, 100)}". Discussion covered this topic.`;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd mind-mentor-agents
npx tsc --noEmit
```

- [ ] **Step 3: Test locally with wrangler dev**

```bash
npx wrangler dev --port 3583
# Test with curl (will fail auth without real JWT, but verifies routing):
curl -X POST http://localhost:3583/agents/tutor/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"message":"hello"}'
# Expected: 401 error (auth working correctly)
```

- [ ] **Step 4: Commit**

```bash
git add mind-mentor-agents/src/agents/tutor.ts
git commit -m "feat: implement tutor agent with SSE streaming and mem0 context"
```

---

## Task 6: Analyst Agent

**Files:**
- Create: `mind-mentor-agents/src/agents/analyst.ts`

- [ ] **Step 1: Implement analyst agent**

Create `mind-mentor-agents/src/agents/analyst.ts`:
```typescript
import { Hono } from "hono";
import Groq from "groq-sdk";
import { Env, AnalysisResult } from "../types/index.js";
import { verifyUserAuth } from "../middleware/auth.js";
import { createMem0Client, getUserMemories, addUserMemory } from "../memory/mem0Client.js";
import { createExpressClient } from "../api/expressClient.js";
import { calculateSM2, calculateMasteryScore } from "../intelligence/sm2.js";
import { detectPatterns, StudySession } from "../intelligence/patterns.js";
import { KnowledgeGraph } from "../intelligence/knowledgeGraph.js";

export const analystRoutes = new Hono<{ Bindings: Env }>();

analystRoutes.use("*", verifyUserAuth);

analystRoutes.post("/analyze", async (c) => {
  const userId = c.get("userId");
  const { type } = await c.req.json<{ type: "full" | "quick" }>();

  const express = createExpressClient(c.env);
  const mem0 = createMem0Client(c.env);
  const groq = new Groq({ apiKey: c.env.GROQ_API_KEY });

  // Fetch raw data from Express
  const sessionsData = await express.getStudySessions(userId);
  const masteryData = await express.getTopicMastery(userId);

  // Pattern detection
  const sessions: StudySession[] = (sessionsData?.sessions || []).map((s: { date: string; startHour: number; duration: number; subject?: string }) => ({
    date: s.date,
    startHour: s.startHour,
    duration: s.duration,
    subject: s.subject,
  }));
  const patterns = detectPatterns(sessions);

  // Build knowledge graph from mastery data
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

  // If full analysis, use LLM to infer missing prerequisite edges
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
  const spacedRepetition = (masteryData || []).map((topic: { topic: string; sm2?: { repetitions: number; easiness: number; interval: number }; lastReviewed?: string }) => ({
    topic: topic.topic,
    repetitions: topic.sm2?.repetitions || 0,
    easiness: topic.sm2?.easiness || 2.5,
    interval: topic.sm2?.interval || 1,
    nextReview: calculateNextReview(topic.sm2, topic.lastReviewed),
  }));

  // Generate recommendations via LLM
  const recommendations = await generateRecommendations(groq, patterns, graph);

  // Store insights in mem0
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

analystRoutes.get("/insights/:userId", async (c) => {
  const userId = c.get("userId");
  const mem0 = createMem0Client(c.env);
  const memories = await getUserMemories(mem0, userId, "learning patterns insights analysis");
  return c.json({ memories, cached: true });
});

async function inferPrerequisites(groq: Groq, topics: string[]): Promise<Array<{ from: string; to: string }>> {
  try {
    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [
        { role: "system", content: "You identify prerequisite relationships between topics. Return JSON only." },
        { role: "user", content: `Given these topics: ${JSON.stringify(topics)}\nIdentify prerequisite relationships. Return: {"edges": [{"from": "topic_a", "to": "topic_b"}]}` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3,
    });
    const result = JSON.parse(completion.choices[0]?.message?.content || '{"edges":[]}');
    return result.edges || [];
  } catch {
    return [];
  }
}

async function generateRecommendations(groq: Groq, patterns: ReturnType<typeof detectPatterns>, graph: KnowledgeGraph): Promise<string[]> {
  const nextTopics = graph.suggestNext().slice(0, 3);
  const gaps = graph.getNodes().filter(n => n.mastery < 30);

  try {
    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [
        { role: "system", content: "Generate 3-5 concise study recommendations. Return JSON: {\"recommendations\": [\"...\"]}" },
        { role: "user", content: `Study patterns: ${JSON.stringify(patterns)}\nSuggested next: ${nextTopics.map(n => n.topic).join(", ")}\nWeak areas: ${gaps.map(n => n.topic).join(", ")}` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.7,
    });
    const result = JSON.parse(completion.choices[0]?.message?.content || '{"recommendations":[]}');
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
  if (!sm2 || !lastReviewed) {
    return new Date(); // due now
  }
  const next = new Date(lastReviewed);
  next.setDate(next.getDate() + sm2.interval);
  return next;
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd mind-mentor-agents && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add mind-mentor-agents/src/agents/analyst.ts
git commit -m "feat: implement analyst agent with SM-2, patterns, and knowledge graph"
```

---

## Task 7: Scheduler Agent + Email Templates

**Files:**
- Create: `mind-mentor-agents/src/agents/scheduler.ts`
- Create: `mind-mentor-agents/src/email/resendClient.ts`
- Create: `mind-mentor-agents/src/email/templates/dailyReminder.tsx`
- Create: `mind-mentor-agents/src/email/templates/streakWarning.tsx`
- Create: `mind-mentor-agents/src/email/templates/weeklyDigest.tsx`
- Create: `mind-mentor-agents/src/email/templates/spacedRepetition.tsx`
- Create: `mind-mentor-agents/src/email/templates/milestone.tsx`

- [ ] **Step 1: Create Resend client**

Create `mind-mentor-agents/src/email/resendClient.ts`:
```typescript
import { Resend } from "resend";
import { Env } from "../types/index.js";

export function createResendClient(env: Env) {
  return new Resend(env.RESEND_API_KEY);
}

export async function sendEmail(
  resend: Resend,
  to: string,
  subject: string,
  html: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Mind Mentor <reminders@mind-mentor.ink>",
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}
```

- [ ] **Step 2: Create email templates**

Create `mind-mentor-agents/src/email/templates/dailyReminder.tsx`:
```typescript
export function dailyReminderHtml(data: { name: string; subject: string; topic: string; suggestedDuration: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">Time to Study, ${data.name}!</h2>
      <p>Today's focus: <strong>${data.topic}</strong> in ${data.subject}</p>
      <p>Suggested duration: ${data.suggestedDuration}</p>
      <a href="https://mind-mentor.ink/home" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">Start Studying</a>
      <p style="color: #666; margin-top: 24px; font-size: 12px;">— Mind Mentor AI</p>
    </div>`;
}
```

Create `mind-mentor-agents/src/email/templates/streakWarning.tsx`:
```typescript
export function streakWarningHtml(data: { name: string; streak: number; hoursLeft: number }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #f59e0b;">Your ${data.streak}-Day Streak is at Risk!</h2>
      <p>${data.name}, you have <strong>${data.hoursLeft} hours</strong> left to study today and keep your streak alive.</p>
      <p>Even a 10-minute session counts!</p>
      <a href="https://mind-mentor.ink/timer" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">Quick Study Session</a>
      <p style="color: #666; margin-top: 24px; font-size: 12px;">— Mind Mentor AI</p>
    </div>`;
}
```

Create `mind-mentor-agents/src/email/templates/weeklyDigest.tsx`:
```typescript
export function weeklyDigestHtml(data: { name: string; totalHours: number; sessionsCount: number; streak: number; topTopics: string[]; recommendations: string[] }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">Weekly Progress Report</h2>
      <p>Hey ${data.name}, here's your week in review:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>${data.totalHours}h</strong> studied across <strong>${data.sessionsCount}</strong> sessions</p>
        <p>Current streak: <strong>${data.streak} days</strong></p>
        <p>Top topics: ${data.topTopics.join(", ")}</p>
      </div>
      <h3>Recommendations for next week:</h3>
      <ul>${data.recommendations.map(r => `<li>${r}</li>`).join("")}</ul>
      <a href="https://mind-mentor.ink/insights" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Full Insights</a>
    </div>`;
}
```

Create `mind-mentor-agents/src/email/templates/spacedRepetition.tsx`:
```typescript
export function spacedRepetitionHtml(data: { name: string; topic: string; daysSince: number; subject: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">Time to Review: ${data.topic}</h2>
      <p>${data.name}, it's been <strong>${data.daysSince} days</strong> since you last reviewed this topic in ${data.subject}.</p>
      <p>Spaced repetition research shows reviewing now maximizes long-term retention.</p>
      <a href="https://mind-mentor.ink/chat" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">Review with AI Tutor</a>
      <p style="color: #666; margin-top: 24px; font-size: 12px;">— Mind Mentor AI</p>
    </div>`;
}
```

Create `mind-mentor-agents/src/email/templates/milestone.tsx`:
```typescript
export function milestoneHtml(data: { name: string; achievement: string; nextGoal: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #8b5cf6;">🎉 Achievement Unlocked!</h2>
      <p>Congratulations ${data.name}!</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="font-size: 18px; font-weight: bold;">${data.achievement}</p>
      </div>
      <p>Next goal: <strong>${data.nextGoal}</strong></p>
      <a href="https://mind-mentor.ink/insights" style="display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">View Progress</a>
    </div>`;
}
```

- [ ] **Step 3: Implement scheduler agent**

Create `mind-mentor-agents/src/agents/scheduler.ts`:
```typescript
import { Hono } from "hono";
import { Env, ReminderPreferences } from "../types/index.js";
import { verifyUserAuth } from "../middleware/auth.js";
import { createExpressClient } from "../api/expressClient.js";
import { createResendClient, sendEmail } from "../email/resendClient.js";
import { createMem0Client, getUserMemories } from "../memory/mem0Client.js";
import { dailyReminderHtml } from "../email/templates/dailyReminder.js";
import { streakWarningHtml } from "../email/templates/streakWarning.js";
import { spacedRepetitionHtml } from "../email/templates/spacedRepetition.js";
import { weeklyDigestHtml } from "../email/templates/weeklyDigest.js";
import { milestoneHtml } from "../email/templates/milestone.js";

export const schedulerRoutes = new Hono<{ Bindings: Env }>();

schedulerRoutes.use("*", verifyUserAuth);

schedulerRoutes.post("/configure", async (c) => {
  const userId = c.get("userId");
  const preferences = await c.req.json<ReminderPreferences>();
  const express = createExpressClient(c.env);

  const res = await fetch(`${c.env.EXPRESS_BACKEND_URL}/api/reminders/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Agent-Secret": c.env.AGENT_SERVICE_SECRET,
    },
    body: JSON.stringify({ userId, ...preferences }),
  });

  if (!res.ok) return c.json({ error: "Failed to save preferences" }, 500);
  return c.json({ success: true });
});

schedulerRoutes.get("/status/:userId", async (c) => {
  const userId = c.get("userId");
  const express = createExpressClient(c.env);
  const prefs = await express.getReminderPreferences(userId);
  return c.json({ preferences: prefs, nextCheck: "within 1 hour" });
});

// Called by cron trigger
export async function runSchedulerCron(env: Env) {
  const express = createExpressClient(env);
  const resend = createResendClient(env);
  const mem0 = createMem0Client(env);

  // Fetch all users with reminders enabled
  const res = await fetch(`${env.EXPRESS_BACKEND_URL}/api/reminders/active-users`, {
    headers: {
      "Content-Type": "application/json",
      "X-Agent-Secret": env.AGENT_SERVICE_SECRET,
    },
  });

  if (!res.ok) return;
  const { users } = await res.json() as { users: Array<{ userId: string; email: string; name: string; preferences: ReminderPreferences }> };

  const now = new Date();

  for (const user of users) {
    const { userId, email, name, preferences } = user;
    const userHour = getCurrentHourInTimezone(preferences.timezone);

    // Daily reminder
    if (preferences.dailyReminder.enabled) {
      const reminderHour = parseInt(preferences.dailyReminder.time.split(":")[0]);
      if (userHour === reminderHour) {
        const memories = await getUserMemories(mem0, userId, "current study subject topic");
        const topic = extractTopicFromMemories(memories);
        await sendEmail(resend, email, `Time to study: ${topic}`,
          dailyReminderHtml({ name, subject: topic, topic, suggestedDuration: "45 minutes" })
        );
      }
    }

    // Streak warning
    if (preferences.streakWarning.enabled) {
      const hoursLeft = 24 - userHour;
      if (hoursLeft <= preferences.streakWarning.hoursBeforeMidnight) {
        const sessions = await express.getStudySessions(userId);
        const studiedToday = sessions?.todayCount > 0;
        if (!studiedToday && sessions?.currentStreak > 0) {
          await sendEmail(resend, email, `Your ${sessions.currentStreak}-day streak is at risk!`,
            streakWarningHtml({ name, streak: sessions.currentStreak, hoursLeft })
          );
        }
      }
    }

    // Weekly digest (Sunday evening)
    if (preferences.weeklyDigest.enabled && now.getDay() === 0 && userHour === 18) {
      const sessions = await express.getStudySessions(userId);
      const memories = await getUserMemories(mem0, userId, "recommendations weekly progress");
      await sendEmail(resend, email, "Your Weekly Learning Report",
        weeklyDigestHtml({
          name,
          totalHours: sessions?.weeklyHours || 0,
          sessionsCount: sessions?.weeklyCount || 0,
          streak: sessions?.currentStreak || 0,
          topTopics: sessions?.topTopics || [],
          recommendations: extractRecommendations(memories),
        })
      );
    }
  }
}

function getCurrentHourInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone });
    return parseInt(formatter.format(now));
  } catch {
    return new Date().getUTCHours();
  }
}

function extractTopicFromMemories(memories: unknown[]): string {
  if (!memories || memories.length === 0) return "your current subject";
  const first = memories[0] as { memory?: string };
  return first.memory?.slice(0, 50) || "your current subject";
}

function extractRecommendations(memories: unknown[]): string[] {
  return ["Continue your current study plan", "Review weak topics identified this week"];
}
```

- [ ] **Step 4: Update index.ts to wire cron handler**

Update `mind-mentor-agents/src/index.ts` — replace the scheduled export:
```typescript
import { runSchedulerCron } from "./agents/scheduler.js";

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runSchedulerCron(env));
  },
};
```

- [ ] **Step 5: Verify compiles**

```bash
cd mind-mentor-agents && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add mind-mentor-agents/src/agents/scheduler.ts mind-mentor-agents/src/email/
git commit -m "feat: implement scheduler agent with cron and 5 email templates"
```

---

## Task 8: Express Backend — New Routes

**Files:**
- Create: `server/middleware/agentAuth.js`
- Create: `server/routes/analytics.js`
- Create: `server/routes/reminders.js`
- Create: `server/routes/chatHistory.js`
- Create: `server/routes/webhooks.js`
- Create: `server/models/reminderPreferences.js`
- Create: `server/models/chatHistory.js`
- Create: `server/models/topicMastery.js`
- Modify: `server/index.js`

- [ ] **Step 1: Create agent auth middleware**

Create `server/middleware/agentAuth.js`:
```javascript
export function validateAgentAuth(req, res, next) {
  const secret = req.headers["x-agent-secret"];
  if (secret !== process.env.AGENT_SERVICE_SECRET) {
    return res.status(401).json({ error: "Unauthorized agent call" });
  }
  next();
}
```

- [ ] **Step 2: Create new MongoDB models**

Create `server/models/reminderPreferences.js`:
```javascript
import mongoose from "mongoose";

const reminderPreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  timezone: { type: String, default: "Asia/Kolkata" },
  dailyReminder: { enabled: { type: Boolean, default: true }, time: { type: String, default: "19:00" } },
  streakWarning: { enabled: { type: Boolean, default: true }, hoursBeforeMidnight: { type: Number, default: 3 } },
  weeklyDigest: { enabled: { type: Boolean, default: true }, day: { type: String, default: "sunday" } },
  spacedRepetition: { enabled: { type: Boolean, default: true }, intensity: { type: String, enum: ["aggressive", "balanced", "relaxed"], default: "balanced" } },
  email: { type: String, required: true },
  maxEmailsPerDay: { type: Number, default: 2 },
  consecutiveIgnored: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.ReminderPreferences || mongoose.model("ReminderPreferences", reminderPreferencesSchema);
```

Create `server/models/chatHistory.js`:
```javascript
import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  messages: [{
    role: { type: String, enum: ["user", "assistant"] },
    content: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.models.ChatHistory || mongoose.model("ChatHistory", chatHistorySchema);
```

Create `server/models/topicMastery.js`:
```javascript
import mongoose from "mongoose";

const topicMasterySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  topic: { type: String, required: true },
  subject: { type: String, required: true },
  mastery: { type: Number, default: 0 },
  sm2: {
    repetitions: { type: Number, default: 0 },
    easiness: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    nextReview: Date,
  },
  prerequisites: [String],
  lastReviewed: Date,
  reviewHistory: [{ date: Date, quality: Number }],
}, { timestamps: true });

topicMasterySchema.index({ userId: 1, topic: 1 }, { unique: true });

export default mongoose.models.TopicMastery || mongoose.model("TopicMastery", topicMasterySchema);
```

- [ ] **Step 3: Create analytics route**

Create `server/routes/analytics.js`:
```javascript
import express from "express";
import { validateAgentAuth } from "../middleware/agentAuth.js";
import mongoose from "mongoose";

const router = express.Router();
router.use(validateAgentAuth);

router.get("/sessions/:userId", async (req, res) => {
  try {
    const StudyStats = mongoose.models.StudyStats || mongoose.model("StudyStats");
    const stats = await StudyStats.findOne({ userId: req.params.userId });
    if (!stats) return res.json({ sessions: [], currentStreak: 0, weeklyHours: 0, weeklyCount: 0, todayCount: 0, topTopics: [] });

    const today = new Date().toISOString().split("T")[0];
    const todaySession = stats.dailySessions?.get(today);

    res.json({
      sessions: Array.from(stats.dailySessions?.entries() || []).map(([date, data]) => ({
        date,
        startHour: data.sessions?.[0]?.startTime ? new Date(data.sessions[0].startTime).getHours() : 19,
        duration: data.totalDuration || 0,
      })),
      currentStreak: stats.currentStreak || 0,
      bestStreak: stats.bestStreak || 0,
      weeklyHours: Math.round((stats.totalStudyHours || 0) * 10) / 10,
      weeklyCount: stats.completedSessions || 0,
      todayCount: todaySession?.count || 0,
      topTopics: [],
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.get("/topics/:userId", async (req, res) => {
  try {
    const TopicMastery = mongoose.models.TopicMastery;
    const topics = await TopicMastery.find({ userId: req.params.userId });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

export default router;
```

- [ ] **Step 4: Create reminders route**

Create `server/routes/reminders.js`:
```javascript
import express from "express";
import { validateAgentAuth } from "../middleware/agentAuth.js";
import ReminderPreferences from "../models/reminderPreferences.js";

const router = express.Router();
router.use(validateAgentAuth);

router.post("/preferences", async (req, res) => {
  try {
    const { userId, ...prefs } = req.body;
    const result = await ReminderPreferences.findOneAndUpdate(
      { userId },
      { userId, ...prefs },
      { upsert: true, new: true }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

router.get("/preferences/:userId", async (req, res) => {
  try {
    const prefs = await ReminderPreferences.findOne({ userId: req.params.userId });
    res.json(prefs || { enabled: false });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.get("/active-users", async (req, res) => {
  try {
    const User = mongoose.models.User;
    const prefs = await ReminderPreferences.find({ "dailyReminder.enabled": true });
    const userIds = prefs.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds } }, "name email");

    const result = prefs.map(pref => {
      const user = users.find(u => u._id.toString() === pref.userId.toString());
      return { userId: pref.userId, email: pref.email || user?.email, name: user?.name || "Student", preferences: pref };
    });

    res.json({ users: result });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch active users" });
  }
});

import mongoose from "mongoose";
export default router;
```

- [ ] **Step 5: Create chat history route**

Create `server/routes/chatHistory.js`:
```javascript
import express from "express";
import { validateAgentAuth } from "../middleware/agentAuth.js";
import ChatHistory from "../models/chatHistory.js";

const router = express.Router();
router.use(validateAgentAuth);

router.get("/:userId", async (req, res) => {
  try {
    const history = await ChatHistory.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, messages } = req.body;
    let existing = await ChatHistory.findOne({ userId }).sort({ createdAt: -1 });

    if (existing && (Date.now() - existing.createdAt.getTime()) < 30 * 60 * 1000) {
      existing.messages.push(...messages);
      await existing.save();
      return res.json(existing);
    }

    const chatHistory = new ChatHistory({ userId, messages });
    await chatHistory.save();
    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ error: "Failed to save chat history" });
  }
});

export default router;
```

- [ ] **Step 6: Create topic mastery route**

Create `server/routes/topicMastery.js`:
```javascript
import express from "express";
import { validateAgentAuth } from "../middleware/agentAuth.js";
import TopicMastery from "../models/topicMastery.js";

const router = express.Router();
router.use(validateAgentAuth);

router.get("/:userId", async (req, res) => {
  try {
    const topics = await TopicMastery.find({ userId: req.params.userId });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mastery" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, topic, subject, sm2, mastery, prerequisites, lastReviewed, quality } = req.body;
    const result = await TopicMastery.findOneAndUpdate(
      { userId, topic },
      {
        userId, topic, subject, mastery,
        sm2, prerequisites, lastReviewed,
        $push: quality != null ? { reviewHistory: { date: new Date(), quality } } : {},
      },
      { upsert: true, new: true }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update mastery" });
  }
});

export default router;
```

- [ ] **Step 7: Create webhooks route**

Create `server/routes/webhooks.js`:
```javascript
import express from "express";
import ReminderPreferences from "../models/reminderPreferences.js";

const router = express.Router();

router.post("/resend", async (req, res) => {
  // In production, verify Svix signature here
  const { type, data } = req.body;

  try {
    if (type === "email.opened" || type === "email.clicked") {
      await ReminderPreferences.updateOne(
        { email: data.to?.[0] || data.to },
        { $set: { consecutiveIgnored: 0 } }
      );
    }
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
```

- [ ] **Step 8: Register all new routes in server/index.js**

Add to `server/index.js` after existing route registrations:
```javascript
import analyticsRouter from './routes/analytics.js';
import remindersRouter from './routes/reminders.js';
import chatHistoryRouter from './routes/chatHistory.js';
import topicMasteryRouter from './routes/topicMastery.js';
import webhooksRouter from './routes/webhooks.js';

// New agent-facing routes
app.use('/api/analytics', analyticsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/chat/history', chatHistoryRouter);
app.use('/api/topics/mastery', topicMasteryRouter);
app.use('/api/webhooks', webhooksRouter);
```

- [ ] **Step 9: Add AGENT_SERVICE_SECRET to .env**

Add to `server/.env`:
```
AGENT_SERVICE_SECRET=your-random-secret-here
```

- [ ] **Step 10: Test Express server starts**

```bash
cd server && npm run dev
# Verify no startup errors
curl http://localhost:8000/
# Expected: {"status":"ok","message":"Mind Mentor API is running"}
```

- [ ] **Step 11: Commit**

```bash
git add server/middleware/ server/routes/ server/models/reminderPreferences.js server/models/chatHistory.js server/models/topicMastery.js server/index.js
git commit -m "feat: add Express backend routes for agent communication"
```

---

## Task 9: Frontend — Agent Client + Chat Widget

**Files:**
- Create: `src/lib/agent-client.ts`
- Create: `src/components/chat/ChatWidget.tsx`
- Create: `src/components/chat/ChatMessages.tsx`
- Create: `src/components/chat/ChatInput.tsx`
- Create: `src/app/(dashboard)/chat/page.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create agent SSE client**

Create `src/lib/agent-client.ts`:
```typescript
import { createParser } from "eventsource-parser";

export async function streamChat(
  message: string,
  token: string,
  context: { page?: string; subject?: string },
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_AGENT_URL}/agents/tutor/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, context }),
  });

  if (!response.ok) {
    onError("Failed to connect to tutor agent");
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
      if (event.data) {
        onChunk(event.data);
      }
    }
  });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(decoder.decode(value));
  }
}

export async function getInsights(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_URL}/agents/analyst/insights/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function triggerAnalysis(token: string, type: "full" | "quick") {
  const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_URL}/agents/analyst/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function configureReminders(token: string, preferences: unknown) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_URL}/agents/scheduler/configure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(preferences),
  });
  return res.ok;
}
```

- [ ] **Step 2: Create ChatMessages component**

Create `src/components/chat/ChatMessages.tsx`:
```typescript
"use client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessages({ messages, isStreaming }: { messages: Message[]; isStreaming: boolean }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
            msg.role === "user" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-100"
          }`}>
            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="bg-zinc-800 rounded-lg px-4 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create ChatInput component**

Create `src/components/chat/ChatInput.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

const quickActions = [
  "What should I study next?",
  "Quiz me on my weak topics",
  "Explain my current topic simply",
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="border-t border-zinc-800 p-4">
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => onSend(action)}
            disabled={disabled}
            className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 whitespace-nowrap disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your tutor anything..."
          disabled={disabled}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button type="submit" disabled={disabled || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          Send
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create ChatWidget component**

Create `src/components/chat/ChatWidget.tsx`:
```typescript
"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { streamChat } from "@/lib/agent-client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleSend = useCallback(async (message: string) => {
    if (!session?.user) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsStreaming(true);

    let assistantMessage = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat(
      message,
      (session as unknown as { token: string }).token || "",
      { page: pathname },
      (chunk) => {
        assistantMessage += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
          return updated;
        });
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
  }, [session, pathname]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-105"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-6 w-[380px] h-[500px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col z-50">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h3 className="font-semibold text-zinc-100">Mind Mentor Tutor</h3>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <ChatMessages messages={messages} isStreaming={isStreaming} />
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: Create dedicated chat page**

Create `src/app/(dashboard)/chat/page.tsx`:
```typescript
"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { streamChat } from "@/lib/agent-client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { data: session } = useSession();

  const handleSend = useCallback(async (message: string) => {
    if (!session?.user) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsStreaming(true);

    let assistantMessage = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat(
      message,
      (session as unknown as { token: string }).token || "",
      { page: "/chat" },
      (chunk) => {
        assistantMessage += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
          return updated;
        });
      },
      () => setIsStreaming(false),
      () => setIsStreaming(false)
    );
  }, [session]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <h1 className="text-2xl font-bold text-zinc-100 mb-4">AI Tutor</h1>
      <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <ChatMessages messages={messages} isStreaming={isStreaming} />
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Add ChatWidget to dashboard layout**

Modify `src/app/(dashboard)/layout.tsx` — add ChatWidget import and render:
```typescript
import { ChatWidget } from "@/components/chat/ChatWidget"

// Add inside the return, after </main>:
<ChatWidget />
```

- [ ] **Step 7: Install frontend dependencies**

```bash
npm install eventsource-parser recharts react-force-graph-2d
```

- [ ] **Step 8: Update middleware matcher**

Modify `src/middleware.ts` — add new routes to matcher:
```typescript
export const config = {
  matcher: [
    "/",
    "/register",
    "/signin",
    "/home",
    "/study-plan",
    "/resources",
    "/timer",
    "/analytics",
    "/settings",
    "/settings/reminders",
    "/profile",
    "/chat",
    "/insights",
    "/insights/knowledge-graph",
  ],
};
```

- [ ] **Step 9: Verify frontend builds**

```bash
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/lib/agent-client.ts src/components/chat/ src/app/\(dashboard\)/chat/ src/app/\(dashboard\)/layout.tsx src/middleware.ts package.json package-lock.json
git commit -m "feat: add chat widget with SSE streaming and dedicated chat page"
```

---

## Task 10: Frontend — Insights Dashboard

**Files:**
- Create: `src/app/(dashboard)/insights/page.tsx`
- Create: `src/app/(dashboard)/insights/knowledge-graph/page.tsx`
- Create: `src/components/insights/MasteryRadar.tsx`
- Create: `src/components/insights/StudyHeatmap.tsx`
- Create: `src/components/insights/VelocityChart.tsx`
- Create: `src/components/insights/WeakSpots.tsx`
- Create: `src/components/insights/KnowledgeGraph.tsx`

- [ ] **Step 1: Create insights overview page**

Create `src/app/(dashboard)/insights/page.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasteryRadar } from "@/components/insights/MasteryRadar";
import { StudyHeatmap } from "@/components/insights/StudyHeatmap";
import { VelocityChart } from "@/components/insights/VelocityChart";
import { WeakSpots } from "@/components/insights/WeakSpots";
import { triggerAnalysis } from "@/lib/agent-client";
import PacmanLoader from "react-spinners/PacmanLoader";

export default function InsightsPage() {
  const { data: session } = useSession();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const fetchInsights = async () => {
      const data = await triggerAnalysis((session as any).token || "", "quick");
      setInsights(data);
      setLoading(false);
    };
    fetchInsights();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PacmanLoader color="#6366f1" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Learning Insights</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Topic Mastery</CardTitle></CardHeader>
          <CardContent>
            <MasteryRadar nodes={insights?.knowledgeGraph?.nodes || []} />
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Study Patterns</CardTitle></CardHeader>
          <CardContent>
            <StudyHeatmap patterns={insights?.patterns} />
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Learning Velocity</CardTitle></CardHeader>
          <CardContent>
            <VelocityChart velocity={insights?.patterns?.learningVelocity || {}} />
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Weak Spots</CardTitle></CardHeader>
          <CardContent>
            <WeakSpots nodes={insights?.knowledgeGraph?.nodes || []} />
          </CardContent>
        </Card>
      </div>
      {insights?.recommendations && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle className="text-zinc-100">Recommendations</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-zinc-300 flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">&#8226;</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create MasteryRadar component**

Create `src/components/insights/MasteryRadar.tsx`:
```typescript
"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

interface Node { topic: string; mastery: number; }

export function MasteryRadar({ nodes }: { nodes: Node[] }) {
  const data = nodes.slice(0, 8).map(n => ({ topic: n.topic, mastery: n.mastery }));

  if (data.length === 0) {
    return <p className="text-zinc-500 text-sm">No mastery data yet. Start studying to see insights.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="topic" tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <Radar name="Mastery" dataKey="mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Create StudyHeatmap component**

Create `src/components/insights/StudyHeatmap.tsx`:
```typescript
"use client";

interface Props {
  patterns?: { optimalStudyTime: string; avgSessionDuration: number; fatigueThreshold: number };
}

export function StudyHeatmap({ patterns }: Props) {
  if (!patterns) {
    return <p className="text-zinc-500 text-sm">Not enough data to show patterns yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-zinc-400 text-sm">Best time to study</span>
        <span className="text-zinc-100 font-medium">{patterns.optimalStudyTime}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-zinc-400 text-sm">Average session</span>
        <span className="text-zinc-100 font-medium">{patterns.avgSessionDuration} min</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-zinc-400 text-sm">Fatigue threshold</span>
        <span className="text-zinc-100 font-medium">{patterns.fatigueThreshold} min</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create VelocityChart component**

Create `src/components/insights/VelocityChart.tsx`:
```typescript
"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function VelocityChart({ velocity }: { velocity: Record<string, number> }) {
  const data = Object.entries(velocity).map(([subject, rate]) => ({ subject, rate }));

  if (data.length === 0) {
    return <p className="text-zinc-500 text-sm">Study more subjects to see velocity data.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8 }} />
        <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Topics/week" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 5: Create WeakSpots component**

Create `src/components/insights/WeakSpots.tsx`:
```typescript
"use client";

interface Node { topic: string; mastery: number; subject: string; }

export function WeakSpots({ nodes }: { nodes: Node[] }) {
  const weakTopics = nodes.filter(n => n.mastery < 50).sort((a, b) => a.mastery - b.mastery).slice(0, 5);

  if (weakTopics.length === 0) {
    return <p className="text-zinc-500 text-sm">No weak spots detected. Great job!</p>;
  }

  return (
    <div className="space-y-3">
      {weakTopics.map((topic) => (
        <div key={topic.topic} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-300">{topic.topic}</span>
            <span className="text-zinc-500">{topic.mastery}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${topic.mastery}%`,
                background: topic.mastery < 20 ? "#ef4444" : topic.mastery < 40 ? "#f59e0b" : "#eab308",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create Knowledge Graph page**

Create `src/app/(dashboard)/insights/knowledge-graph/page.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { triggerAnalysis } from "@/lib/agent-client";
import PacmanLoader from "react-spinners/PacmanLoader";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function KnowledgeGraphPage() {
  const { data: session } = useSession();
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const fetch = async () => {
      const data = await triggerAnalysis((session as any).token || "", "quick");
      if (data?.knowledgeGraph) {
        setGraphData({
          nodes: data.knowledgeGraph.nodes.map((n: any) => ({
            id: n.id,
            name: n.topic,
            val: Math.max(n.mastery / 10, 1),
            color: n.mastery > 66 ? "#22c55e" : n.mastery > 33 ? "#eab308" : "#ef4444",
            mastery: n.mastery,
          })),
          links: data.knowledgeGraph.edges.map((e: any) => ({
            source: e.source,
            target: e.target,
          })),
        });
      }
      setLoading(false);
    };
    fetch();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PacmanLoader color="#6366f1" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">Knowledge Graph</h1>
      <p className="text-zinc-400 text-sm">Topics colored by mastery: <span className="text-red-400">weak</span> / <span className="text-yellow-400">learning</span> / <span className="text-green-400">strong</span></p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden" style={{ height: "70vh" }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel={(node: any) => `${node.name} (${node.mastery}%)`}
          nodeColor={(node: any) => node.color}
          linkColor={() => "#4b5563"}
          backgroundColor="#09090b"
          nodeRelSize={6}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/app/\(dashboard\)/insights/ src/components/insights/
git commit -m "feat: add insights dashboard with mastery radar, heatmap, velocity chart, and knowledge graph"
```

---

## Task 11: Frontend — Reminder Settings

**Files:**
- Create: `src/app/(dashboard)/settings/reminders/page.tsx`
- Create: `src/components/settings/ReminderSettings.tsx`

- [ ] **Step 1: Create ReminderSettings component**

Create `src/components/settings/ReminderSettings.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { configureReminders } from "@/lib/agent-client";
import { useSession } from "next-auth/react";

interface ReminderPrefs {
  timezone: string;
  dailyReminder: { enabled: boolean; time: string };
  streakWarning: { enabled: boolean; hoursBeforeMidnight: number };
  weeklyDigest: { enabled: boolean; day: string };
  spacedRepetition: { enabled: boolean; intensity: string };
  email: string;
}

export function ReminderSettings() {
  const { data: session } = useSession();
  const [prefs, setPrefs] = useState<ReminderPrefs>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dailyReminder: { enabled: true, time: "19:00" },
    streakWarning: { enabled: true, hoursBeforeMidnight: 3 },
    weeklyDigest: { enabled: true, day: "sunday" },
    spacedRepetition: { enabled: true, intensity: "balanced" },
    email: session?.user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await configureReminders((session as any).token || "", prefs);
    setSaving(false);
    if (success) setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Daily Reminder */}
      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
        <div>
          <p className="text-zinc-100 font-medium">Daily Study Reminder</p>
          <p className="text-zinc-400 text-sm">Get reminded to study at your preferred time</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={prefs.dailyReminder.time}
            onChange={(e) => setPrefs({ ...prefs, dailyReminder: { ...prefs.dailyReminder, time: e.target.value } })}
            className="bg-zinc-700 border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100"
          />
          <input
            type="checkbox"
            checked={prefs.dailyReminder.enabled}
            onChange={(e) => setPrefs({ ...prefs, dailyReminder: { ...prefs.dailyReminder, enabled: e.target.checked } })}
            className="w-4 h-4"
          />
        </div>
      </div>

      {/* Streak Warning */}
      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
        <div>
          <p className="text-zinc-100 font-medium">Streak Warning</p>
          <p className="text-zinc-400 text-sm">Alert when your streak is at risk</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={prefs.streakWarning.hoursBeforeMidnight}
            onChange={(e) => setPrefs({ ...prefs, streakWarning: { ...prefs.streakWarning, hoursBeforeMidnight: Number(e.target.value) } })}
            className="bg-zinc-700 border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100"
          >
            <option value={2}>2h before</option>
            <option value={3}>3h before</option>
            <option value={4}>4h before</option>
          </select>
          <input
            type="checkbox"
            checked={prefs.streakWarning.enabled}
            onChange={(e) => setPrefs({ ...prefs, streakWarning: { ...prefs.streakWarning, enabled: e.target.checked } })}
            className="w-4 h-4"
          />
        </div>
      </div>

      {/* Weekly Digest */}
      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
        <div>
          <p className="text-zinc-100 font-medium">Weekly Digest</p>
          <p className="text-zinc-400 text-sm">Get a weekly progress summary</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={prefs.weeklyDigest.day}
            onChange={(e) => setPrefs({ ...prefs, weeklyDigest: { ...prefs.weeklyDigest, day: e.target.value } })}
            className="bg-zinc-700 border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100"
          >
            <option value="sunday">Sunday</option>
            <option value="saturday">Saturday</option>
            <option value="monday">Monday</option>
          </select>
          <input
            type="checkbox"
            checked={prefs.weeklyDigest.enabled}
            onChange={(e) => setPrefs({ ...prefs, weeklyDigest: { ...prefs.weeklyDigest, enabled: e.target.checked } })}
            className="w-4 h-4"
          />
        </div>
      </div>

      {/* Spaced Repetition */}
      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
        <div>
          <p className="text-zinc-100 font-medium">Spaced Repetition Alerts</p>
          <p className="text-zinc-400 text-sm">Reminders to review topics at optimal intervals</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={prefs.spacedRepetition.intensity}
            onChange={(e) => setPrefs({ ...prefs, spacedRepetition: { ...prefs.spacedRepetition, intensity: e.target.value } })}
            className="bg-zinc-700 border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100"
          >
            <option value="relaxed">Relaxed</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
          <input
            type="checkbox"
            checked={prefs.spacedRepetition.enabled}
            onChange={(e) => setPrefs({ ...prefs, spacedRepetition: { ...prefs.spacedRepetition, enabled: e.target.checked } })}
            className="w-4 h-4"
          />
        </div>
      </div>

      {/* Email */}
      <div className="p-4 bg-zinc-800 rounded-lg">
        <label className="text-zinc-100 font-medium block mb-2">Email Address</label>
        <input
          type="email"
          value={prefs.email}
          onChange={(e) => setPrefs({ ...prefs, email: e.target.value })}
          className="w-full bg-zinc-700 border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100"
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create settings page**

Create `src/app/(dashboard)/settings/reminders/page.tsx`:
```typescript
import { ReminderSettings } from "@/components/settings/ReminderSettings";

export default function RemindersSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Reminder Settings</h1>
      <ReminderSettings />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/settings/ src/components/settings/
git commit -m "feat: add reminder settings page with all notification preferences"
```

---

## Task 12: Navigation Update + DashboardNav

**Files:**
- Modify: `src/components/dashboard/DashboardNav.tsx`

- [ ] **Step 1: Add new nav items to DashboardNav**

Add these nav items to the existing navigation (find the nav items array in `DashboardNav.tsx`):
```typescript
{ name: "Chat", href: "/chat", icon: MessageSquare },
{ name: "Insights", href: "/insights", icon: BarChart3 },
{ name: "Settings", href: "/settings/reminders", icon: Settings },
```

Import the icons from lucide-react:
```typescript
import { MessageSquare, BarChart3, Settings } from "lucide-react";
```

- [ ] **Step 2: Verify navigation renders**

```bash
npm run dev
# Open http://localhost:3000/home — verify new nav items appear
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/DashboardNav.tsx
git commit -m "feat: add chat, insights, and settings to dashboard navigation"
```

---

## Task 13: Integration Testing + Deploy

**Files:**
- Modify: `mind-mentor-agents/wrangler.toml` (add secrets)
- Create: `.env.example` (document all env vars needed)

- [ ] **Step 1: Set wrangler secrets**

```bash
cd mind-mentor-agents
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put MEM0_API_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put AGENT_SERVICE_SECRET
npx wrangler secret put NEXTAUTH_SECRET
```

- [ ] **Step 2: Deploy CF Workers**

```bash
cd mind-mentor-agents
npx wrangler deploy
# Note the deployed URL
```

- [ ] **Step 3: Add NEXT_PUBLIC_AGENT_URL to Vercel**

```bash
# Add to .env.local for local dev:
echo "NEXT_PUBLIC_AGENT_URL=https://mind-mentor-agents.<your-subdomain>.workers.dev" >> .env.local
# Also add to Vercel dashboard env vars
```

- [ ] **Step 4: Add AGENT_SERVICE_SECRET to Express server**

Add to Render environment variables (or wherever Express is deployed):
```
AGENT_SERVICE_SECRET=<same-value-as-wrangler-secret>
```

- [ ] **Step 5: End-to-end test**

```bash
# 1. Start local dev
npm run dev  # Next.js
cd server && npm run dev  # Express
cd mind-mentor-agents && npx wrangler dev  # CF Workers

# 2. Test flow:
# - Sign in
# - Navigate to /chat
# - Send a message → verify streaming response
# - Navigate to /insights → verify data loads
# - Navigate to /settings/reminders → save preferences
# - Check mem0 dashboard → verify memories stored
```

- [ ] **Step 6: Run all agent tests**

```bash
cd mind-mentor-agents && npm test
```

- [ ] **Step 7: Frontend build verification**

```bash
npm run build
# Should pass with no errors
```

- [ ] **Step 8: Commit any final fixes**

```bash
git add -A
git commit -m "feat: integration testing and deployment configuration"
```

---

## Task 14: Demo Data Seeder

**Files:**
- Create: `scripts/seed-demo.ts`

- [ ] **Step 1: Create demo seeder script**

Create `scripts/seed-demo.ts`:
```typescript
// Run with: npx tsx scripts/seed-demo.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  const userId = process.argv[2];
  if (!userId) { console.error("Usage: npx tsx scripts/seed-demo.ts <userId>"); process.exit(1); }

  // Seed 30 days of study sessions
  const StudyStats = mongoose.model("StudyStats");
  const TopicMastery = mongoose.model("TopicMastery");
  
  const subjects = ["JavaScript", "React", "Data Structures", "Algorithms"];
  const topics = [
    { topic: "Variables & Types", subject: "JavaScript", mastery: 85, easiness: 2.6, repetitions: 5 },
    { topic: "Functions & Closures", subject: "JavaScript", mastery: 70, easiness: 2.4, repetitions: 3 },
    { topic: "Async/Await", subject: "JavaScript", mastery: 45, easiness: 2.1, repetitions: 2 },
    { topic: "Components", subject: "React", mastery: 60, easiness: 2.3, repetitions: 3 },
    { topic: "Hooks", subject: "React", mastery: 35, easiness: 2.0, repetitions: 1 },
    { topic: "State Management", subject: "React", mastery: 20, easiness: 1.8, repetitions: 1 },
    { topic: "Arrays & Strings", subject: "Data Structures", mastery: 90, easiness: 2.7, repetitions: 6 },
    { topic: "Trees", subject: "Data Structures", mastery: 40, easiness: 2.1, repetitions: 2 },
    { topic: "Dynamic Programming", subject: "Algorithms", mastery: 15, easiness: 1.5, repetitions: 1 },
    { topic: "Sorting", subject: "Algorithms", mastery: 75, easiness: 2.5, repetitions: 4 },
  ];

  // Seed topic mastery
  for (const t of topics) {
    await TopicMastery.findOneAndUpdate(
      { userId, topic: t.topic },
      {
        userId, topic: t.topic, subject: t.subject, mastery: t.mastery,
        sm2: { repetitions: t.repetitions, easiness: t.easiness, interval: t.repetitions * 3, nextReview: new Date(Date.now() + t.repetitions * 86400000) },
        prerequisites: [],
        lastReviewed: new Date(Date.now() - Math.random() * 7 * 86400000),
      },
      { upsert: true }
    );
  }

  // Seed study sessions (30 days)
  const dailySessions = new Map();
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    if (Math.random() > 0.2) { // 80% chance of studying
      dailySessions.set(date, {
        count: Math.floor(Math.random() * 3) + 1,
        totalDuration: Math.floor(Math.random() * 60) + 20,
        sessions: [{ duration: Math.floor(Math.random() * 60) + 20, startTime: new Date(), endTime: new Date(), mode: "focus" }],
      });
    }
  }

  await StudyStats.findOneAndUpdate(
    { userId },
    { userId, totalStudyHours: 45, completedSessions: 25, currentStreak: 7, bestStreak: 12, lastStudyDate: new Date(), dailySessions },
    { upsert: true }
  );

  console.log("Demo data seeded for user:", userId);
  await mongoose.disconnect();
}

seed().catch(console.error);
```

- [ ] **Step 2: Run seeder for test user**

```bash
npx tsx scripts/seed-demo.ts <your-test-user-id>
```

- [ ] **Step 3: Verify insights page shows seeded data**

Open http://localhost:3000/insights — should show populated charts.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-demo.ts
git commit -m "feat: add demo data seeder for presentation"
```

---

## Summary

| Task | Phase | Deliverable |
|------|-------|-------------|
| 1 | Foundation | Hono CF Workers scaffold |
| 2 | Foundation | Auth + mem0 + Express client |
| 3 | Intelligence | SM-2 algorithm (TDD) |
| 4 | Intelligence | Patterns + knowledge graph (TDD) |
| 5 | Intelligence | Tutor agent with SSE |
| 6 | Intelligence | Analyst agent |
| 7 | Email | Scheduler agent + email templates |
| 8 | Backend | Express new routes + models |
| 9 | Frontend | Chat widget + SSE client |
| 10 | Frontend | Insights dashboard |
| 11 | Frontend | Reminder settings |
| 12 | Frontend | Navigation update |
| 13 | Deploy | Integration test + deploy |
| 14 | Polish | Demo data seeder |
