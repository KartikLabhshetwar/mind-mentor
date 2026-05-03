# Mind Mentor: Multi-Agent Learning System Design

## Overview

Transform Mind Mentor from a study tool into an intelligent learning companion using a multi-agent architecture. Three specialized Flue Framework agents deployed on Cloudflare Workers handle tutoring, scheduling, and analysis — sharing context through mem0 Cloud as a unified memory layer.

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                  │
│  ┌──────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │Chat Widget│ │Insights Dash │ │Reminder Settings   │  │
│  └─────┬────┘ └──────┬───────┘ └─────────┬──────────┘  │
└────────┼──────────────┼───────────────────┼─────────────┘
         │              │                   │
         ▼              ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKERS (Flue Agents)             │
│                                                          │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ Tutor Agent │  │Scheduler Agent│  │Analyst Agent │  │
│  │  (chat +    │  │  (cron +      │  │  (patterns + │  │
│  │  guidance)  │  │  reminders)   │  │  insights)   │  │
│  └──────┬──────┘  └───────┬───────┘  └──────┬───────┘  │
│         │                 │                  │           │
│         └────────┬────────┴──────────────────┘           │
│                  ▼                                        │
│         ┌──────────────┐                                 │
│         │  mem0 Cloud  │  (shared memory layer)          │
│         └──────────────┘                                 │
└─────────────────────┬───────────────────────────────────┘
                      │ API calls
                      ▼
┌─────────────────────────────────────────────────────────┐
│           EXISTING BACKEND (Express + MongoDB)            │
│  Study Sessions │ Notes │ PDFs │ Plans │ Resources       │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │   Resend     │  (email delivery)
              └──────────────┘
```

### Technology Choices

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Agent framework | Flue Framework | TypeScript, CF Workers native, role-based agents |
| Agent deployment | Cloudflare Workers | Edge, free tier, cron triggers built-in |
| LLM | Groq + qwen/qwen3-32b | Free, fast inference, good reasoning |
| Memory | mem0 Cloud API | Semantic memory, natural language storage, managed |
| Email | Resend + React Email | Modern DX, free 100/day, template components |
| Frontend | Next.js 14 (existing) | Already deployed on Vercel |
| Backend | Express (existing) | Already deployed, MongoDB connected |
| Graphs | react-force-graph-2d | Interactive knowledge graph visualization |
| Charts | recharts | Insights dashboard panels |

## Agent Specifications

### Tutor Agent

**Purpose:** Conversational tutoring with persistent memory of user's learning journey.

**Endpoint:** `POST /agents/tutor/chat`

**Input:**
```typescript
{
  userId: string;
  message: string;
  context?: { page?: string; subject?: string; documentId?: string };
}
```

**Output (SSE stream):**
```typescript
{
  reply: string;
  memoryUpdates?: string[];
  suggestedTopics?: string[];
}
```

**Behavior:**
- Pulls user context from mem0 before responding (weak topics, style, history)
- Adapts explanation complexity to demonstrated user level
- Recommends next topics via knowledge graph
- Saves new observations to mem0 after each interaction
- Can reference user's PDFs, notes, and study plans from Express backend
- Proactively suggests continuing yesterday's topic

**System prompt priorities:**
1. Be concise, not verbose
2. Use examples matching user's domain (stored in mem0)
3. Ask follow-up questions to gauge understanding
4. Update memory with new observations about user

### Scheduler Agent

**Purpose:** Timely, personalized study reminders via email.

**Endpoints:**
- `POST /agents/scheduler/configure` — save preferences
- `GET /agents/scheduler/status/:userId` — next scheduled reminders

**Cron:** `0 * * * *` (hourly check)

**Email Types:**

| Type | Trigger Condition | Content |
|------|-------------------|---------|
| Daily reminder | User-set time reached, no session today | Focus topic + suggested duration |
| Spaced repetition | SM-2 interval elapsed for a topic | Topic to review + brief context |
| Streak warning | No session by (midnight - threshold hours) | Current streak + encouragement |
| Weekly digest | Configured day, evening | Week stats, insights, next week plan |
| Milestone | Achievement threshold crossed | Celebration + next goal |

**Smart batching rules:**
- Max 2 emails/day per user (bundle if multiple triggers)
- Respect quiet hours (derived from study patterns)
- Stop sending after 3 consecutive ignored emails; ask in chat instead
- Progressive urgency for streak warnings

### Analyst Agent

**Purpose:** Intelligence engine — pattern detection, spaced repetition, knowledge graphs.

**Endpoints:**
- `POST /agents/analyst/analyze` — trigger analysis
- `GET /agents/analyst/insights/:userId` — cached results

**Input:**
```typescript
{
  userId: string;
  type: "full" | "quick";  // full = daily deep run, quick = on-demand
}
```

**Output:**
```typescript
{
  patterns: {
    optimalStudyTime: string;      // "19:00-21:00"
    avgSessionDuration: number;    // minutes
    learningVelocity: Record<string, number>;  // topics/week per subject
    fatigueThreshold: number;      // minutes before quality drops
  };
  knowledgeGraph: {
    nodes: Array<{ id: string; topic: string; mastery: number; subject: string }>;
    edges: Array<{ source: string; target: string; type: "prerequisite" | "related" }>;
  };
  spacedRepetition: Array<{
    topic: string;
    nextReview: Date;
    interval: number;
    easiness: number;
    repetitions: number;
  }>;
  recommendations: string[];
}
```

**Intelligence Modules:**

#### SM-2 Spaced Repetition
- Standard SM-2 with adaptive initial easiness factor
- Calibrates from first 3 reviews (not default 2.5)
- Quality ratings from: quiz scores, self-reports, time-to-answer
- Pattern detection adjusts — morning retention vs evening retention

#### Knowledge Graph
- Topics as nodes with mastery level (0-100)
- Prerequisites as directed edges
- Auto-populated from: study plans, PDF content analysis, notes
- Gap detection: "struggling with X, might need prerequisite Y review"
- Infers prerequisites from study order + failure patterns

#### Pattern Detection
- Optimal study time (when performance peaks)
- Session duration sweet spot (before fatigue)
- Subject switching patterns (helps or hurts?)
- Learning velocity per topic (topics mastered / time)
- Engagement trends (increasing/decreasing)

### Inter-Agent Communication

Agents communicate through mem0 (async) and direct endpoint calls (sync):

```
Async: Tutor logs observation → mem0 → Analyst reads next run → mem0 → Scheduler reads
Sync:  Tutor calls GET /agents/analyst/insights/:userId for real-time SM-2 schedule
```

## Data Models

### New MongoDB Collections

**ReminderPreferences:**
```typescript
{
  userId: ObjectId;
  timezone: string;
  dailyReminder: { enabled: boolean; time: string };
  streakWarning: { enabled: boolean; hoursBeforeMidnight: number };
  weeklyDigest: { enabled: boolean; day: string };
  spacedRepetition: { enabled: boolean; intensity: "aggressive" | "balanced" | "relaxed" };
  email: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  maxEmailsPerDay: number;
  consecutiveIgnored: number;
}
```

**ChatHistory:**
```typescript
{
  userId: ObjectId;
  sessionId: string;
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>;
  context: { page?: string; subject?: string; documentId?: string };
  createdAt: Date;
  updatedAt: Date;
}
```

**TopicMastery:**
```typescript
{
  userId: ObjectId;
  topic: string;
  subject: string;
  mastery: number;
  sm2: {
    repetitions: number;
    easiness: number;
    interval: number;
    nextReview: Date;
  };
  prerequisites: string[];
  lastReviewed: Date;
  reviewHistory: Array<{ date: Date; quality: number }>;
}
```

### mem0 Memory Categories

Stored as natural language with metadata tags:

```javascript
// Preferences
await mem0.add([{ role: "system", content: "User prefers video tutorials over text" }], 
  { user_id: id, metadata: { category: "preference" } });

// Learning patterns  
await mem0.add([{ role: "system", content: "User studies best 7-9 PM, retention drops after 45min" }],
  { user_id: id, metadata: { category: "learning_pattern" } });

// Mastery observations
await mem0.add([{ role: "system", content: "User strong in arrays, weak in dynamic programming" }],
  { user_id: id, metadata: { category: "mastery" } });

// Session context
await mem0.add([{ role: "system", content: "Last session discussed React hooks, stopped at useEffect cleanup" }],
  { user_id: id, metadata: { category: "session_context" } });
```

## API Contracts

### Agent Endpoints (Cloudflare Workers)

```
POST   /agents/tutor/chat                 → SSE stream response
POST   /agents/scheduler/configure        → save reminder prefs
GET    /agents/scheduler/status/:userId   → next reminders
POST   /agents/analyst/analyze            → trigger analysis
GET    /agents/analyst/insights/:userId   → cached insights
```

### New Express Backend Routes

```
GET    /api/analytics/sessions/:userId    → study session aggregates
GET    /api/analytics/topics/:userId      → topic mastery list
POST   /api/reminders/preferences         → save reminder prefs to MongoDB
GET    /api/reminders/preferences/:userId → get reminder prefs
GET    /api/chat/history/:userId          → paginated chat history
POST   /api/chat/history                  → persist chat messages
POST   /api/topics/mastery                → update topic mastery + SM-2
GET    /api/topics/mastery/:userId        → get all topic mastery data
```

## Frontend Additions

### New Pages

| Page | Path | Purpose |
|------|------|---------|
| Chat | `/chat` | Dedicated tutor conversation page |
| Insights | `/insights` | Learning analytics dashboard |
| Knowledge Graph | `/insights/knowledge-graph` | Interactive topic graph |
| Reminder Settings | `/settings/reminders` | Email preference controls |

### Chat Widget

- Floating button (bottom-right) on all dashboard pages
- SSE streaming for real-time responses
- Context-aware (sends current page info to agent)
- Quick actions: "Explain this", "What's next?", "Quiz me"
- Persists to ChatHistory collection

### Insights Dashboard Panels

| Panel | Chart Type | Data Source |
|-------|-----------|-------------|
| Topic Mastery | Radar chart | TopicMastery collection |
| Study Patterns | Heatmap | Study sessions aggregate |
| Learning Velocity | Line chart | Analyst Agent patterns |
| Weak Spots | Progress bars | Knowledge graph gaps |
| Predicted Readiness | Gauge | SM-2 + patterns combined |
| Recommendations | Action cards | Tutor Agent suggestions |

### Knowledge Graph Viewer

- react-force-graph-2d for interactive visualization
- Nodes color-coded: red (0-33) → yellow (34-66) → green (67-100) mastery
- Click node → SM-2 details, next review, history
- Suggested next topics highlighted with pulsing border

### Updated Navigation

```
Dashboard
├── Home (+ insight summary cards)
├── Chat (new)
├── Study Plan
├── Resources
├── PDF Chat
├── Notes
├── Timer
├── Insights (new)
│   ├── Overview
│   └── Knowledge Graph
├── Settings (new)
│   └── Reminders
└── Profile
```

## Agent Project Structure

```
mind-mentor-agents/
├── .flue/
│   ├── agents/
│   │   ├── tutor.ts
│   │   ├── scheduler.ts
│   │   └── analyst.ts
│   └── roles/
│       ├── tutor-role.md
│       ├── scheduler-role.md
│       └── analyst-role.md
├── src/
│   ├── memory/
│   │   └── mem0Client.ts
│   ├── email/
│   │   ├── resendClient.ts
│   │   └── templates/
│   │       ├── dailyReminder.tsx
│   │       ├── streakWarning.tsx
│   │       ├── weeklyDigest.tsx
│   │       ├── spacedRepetition.tsx
│   │       └── milestone.tsx
│   ├── intelligence/
│   │   ├── sm2.ts
│   │   ├── knowledgeGraph.ts
│   │   └── patterns.ts
│   ├── api/
│   │   └── expressClient.ts
│   └── types/
│       └── index.ts
├── wrangler.toml
├── tsconfig.json
└── package.json
```

## Deployment

### Cloudflare Workers (wrangler.toml)

```toml
name = "mind-mentor-agents"
main = "src/index.ts"
compatibility_date = "2025-04-01"

[triggers]
crons = ["0 * * * *"]

[vars]
EXPRESS_BACKEND_URL = "https://mind-mentor-api.onrender.com"
```

### Secrets (via `wrangler secret put`)
- GROQ_API_KEY
- MEM0_API_KEY
- RESEND_API_KEY
- AGENT_SERVICE_SECRET
- NEXTAUTH_SECRET

### Frontend (Vercel)
- Add `NEXT_PUBLIC_AGENT_URL` pointing to CF Worker URL

### Deploy Commands
```bash
# Agents
cd mind-mentor-agents
flue dev --target cloudflare    # local
wrangler deploy                 # production

# Frontend
git push                        # Vercel auto-deploy
```

## Security & Authentication

### Agent-to-Express Authentication

CF Workers authenticate to Express using a shared service secret:

```typescript
// CF Worker → Express calls
headers: {
  "X-Agent-Secret": env.AGENT_SERVICE_SECRET,
  "X-Agent-Name": "tutor" | "scheduler" | "analyst"
}
```

Express middleware validates:
```typescript
function validateAgentAuth(req, res, next) {
  const secret = req.headers["x-agent-secret"];
  if (secret !== process.env.AGENT_SERVICE_SECRET) {
    return res.status(401).json({ error: "Unauthorized agent call" });
  }
  next();
}
```

### Frontend-to-Agent Authentication

Frontend passes NextAuth JWT to CF Workers. Worker validates it:

```typescript
// Frontend chat call
const res = await fetch(`${AGENT_URL}/agents/tutor/chat`, {
  headers: { "Authorization": `Bearer ${session.token}` },
  body: JSON.stringify({ message, context })
});

// CF Worker validates JWT
import { jwtVerify } from "jose";
const { payload } = await jwtVerify(token, new TextEncoder().encode(env.NEXTAUTH_SECRET));
const userId = payload.id; // NextAuth stores user.id in token.id (custom claim, not sub)
```

Key points:
- userId is NEVER passed in request body from frontend
- Worker extracts userId from verified JWT payload
- NextAuth NEXTAUTH_SECRET shared with CF Worker as a secret
- Add `NEXTAUTH_SECRET` to wrangler secrets

### Secrets Summary

| Secret | Used By | Purpose |
|--------|---------|---------|
| GROQ_API_KEY | CF Workers | LLM inference |
| MEM0_API_KEY | CF Workers | Memory read/write |
| RESEND_API_KEY | CF Workers | Email sending |
| AGENT_SERVICE_SECRET | CF Workers + Express | Service-to-service auth |
| NEXTAUTH_SECRET | CF Workers | JWT verification for user identity |

## Framework Fallback Strategy

### Primary: Flue Framework

If Flue Framework installs and works on CF Workers as expected, use it for agent scaffolding.

### Fallback: Vanilla CF Workers + Hono

If Flue Framework is unavailable, unverified, or has blocking issues on Day 1:

```typescript
// Use Hono (lightweight CF Workers framework) as fallback
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";

const app = new Hono();

app.post("/agents/tutor/chat", async (c) => {
  // Agent logic here, same architecture, no Flue dependency
  return streamSSE(c, async (stream) => {
    // ... streaming response
  });
});

export default app;
```

Decision criteria (Day 1):
- Can `npm install flue` resolve? → If no, use Hono
- Does `flue dev --target cloudflare` produce a working Worker? → If no, use Hono
- Does Flue support SSE streaming? → If no, use Hono

Hono is battle-tested on CF Workers, supports SSE, CORS, middleware. Same agent logic applies regardless of framework choice. Only the routing/scaffold layer changes.

Updated wrangler.toml (fallback):
```toml
compatibility_date = "2025-04-01"
```

## SSE Streaming Design

### CF Worker Streaming Implementation

```typescript
// Tutor agent streaming response
app.post("/agents/tutor/chat", async (c) => {
  return streamSSE(c, async (stream) => {
    // Set CORS headers
    stream.writeSSE({ event: "start", data: "" });
    
    // Stream from Groq
    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [...],
      stream: true,
    });
    
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      stream.writeSSE({ data: content });
    }
    
    stream.writeSSE({ event: "done", data: "" });
  });
});
```

### CORS Configuration (CF Worker)

```typescript
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
```

### CPU Time Limit Mitigation

CF Workers have 30s CPU time limit (not wall-clock). Streaming is mostly I/O wait (not CPU), so typical chat sessions (< 60s wall-clock) stay well within limits.

For long sessions:
- Groq inference is fast (qwen3-32b on Groq = ~100 tokens/sec)
- Max response capped at 2000 tokens (~20s of streaming)
- If response exceeds 25s wall-clock, send `event: truncated` and offer continuation

### Frontend SSE Client

EventSource only supports GET. Use fetch + eventsource-parser for POST-based SSE:

```typescript
import { createParser } from "eventsource-parser";

async function streamChat(message: string, token: string, onChunk: (text: string) => void) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_AGENT_URL}/agents/tutor/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ message, context: { page: window.location.pathname } }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const parser = createParser((event) => {
    if (event.type === "event" && event.data) {
      if (event.event === "done") return;
      onChunk(event.data);
    }
  });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(decoder.decode(value));
  }
}
```

## Knowledge Graph: Scope Decision

### For Demo/Presentation (Phase 2 target)

Knowledge graph prerequisite edges are **LLM-inferred at study plan creation time**, not continuously auto-detected:

1. When user creates a study plan → Analyst Agent extracts topics and infers prerequisites
2. When user uploads a PDF → Analyst extracts key topics, links to existing graph
3. Manual override: user can add/remove edges in the graph viewer

This avoids expensive continuous inference while still producing an impressive, populated graph.

### Topic Extraction Prompt (run once per study plan/PDF)

```
Given these study plan topics: [topics]
Identify prerequisite relationships.
Return JSON: { edges: [{ from: "topic_a", to: "topic_b", reason: "..." }] }
```

### Mastery Score Derivation

```
mastery = weighted_avg(
  sm2_easiness_normalized * 0.4,    // retention quality (easiness / 2.5 * 100)
  review_count_normalized * 0.3,     // practice frequency (min(reviews, 10) / 10 * 100)
  recency_score * 0.3               // exponential decay from last review
)

// Recency decay function:
recency_score = 100 * exp(-0.1 * days_since_last_review)
// Day 0 = 100, Day 7 = 50, Day 14 = 25, Day 30 ≈ 5
```

## Predicted Readiness Formula

```
readiness(topic) = (
  mastery_score * 0.5 +
  days_until_next_review_factor * 0.3 +
  recent_study_consistency * 0.2
)

// days_until_next_review_factor:
//   1.0 if review is overdue (need to study now)
//   0.5 if review is today
//   0.0 if next review is far away (already fresh)

// recent_study_consistency:
//   streak_days / 7 (capped at 1.0)
```

## Email Tracking (Ignored Email Counter)

### Implementation

Use Resend webhooks for delivery + open tracking:

```typescript
// Express route for Resend webhooks
app.post("/api/webhooks/resend", async (req, res) => {
  const { type, data } = req.body;
  
  if (type === "email.opened" || type === "email.clicked") {
    // Reset ignored counter
    await ReminderPreferences.updateOne(
      { email: data.to },
      { $set: { consecutiveIgnored: 0 } }
    );
  }
});

// Scheduler Agent: after sending, increment counter
// Counter resets on open/click via webhook
// After 3 sends with no open → pause email, ask in chat
```

### Webhook Setup
- Register Resend webhook URL: `https://express-backend/api/webhooks/resend`
- Events: `email.opened`, `email.clicked`
- Verify webhook signature using Svix headers before processing:

```typescript
import { Webhook } from "svix";

app.post("/api/webhooks/resend", async (req, res) => {
  const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET);
  try {
    const payload = wh.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });
    // Process verified event...
  } catch (err) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }
});
```

- Fallback: if webhooks not configured, use time-based heuristic (no open within 48h = ignored)

## Express Route Naming Convention

All new routes use `/api/` prefix for consistency. Existing routes (`/generate-plan`, `/curate-resources`, `/pdf`) remain unchanged to avoid breaking deployed frontend.

```
# Existing (unchanged)
/generate-plan
/curate-resources
/pdf

# New (all under /api/)
/api/analytics/sessions/:userId
/api/analytics/topics/:userId
/api/reminders/preferences
/api/reminders/preferences/:userId
/api/chat/history/:userId
/api/chat/history
/api/topics/mastery
/api/topics/mastery/:userId
/api/webhooks/resend
```

Agent-facing routes protected by `validateAgentAuth` middleware.
User-facing routes (chat history) protected by NextAuth session verification.

## Quality Requirements

### Memory Intelligence
- Agent connects facts, not just stores them
- Example: "Struggling with recursion + studying trees → teach iterative traversal first"
- Semantic search over keyword matching

### SM-2 Adaptation
- Initial easiness calibrated from first 3 reviews
- Pattern-adjusted intervals (morning vs evening retention)
- Quality derived from multiple signals (quiz + self-report + response time)

### Email Non-Annoyance
- Max 2 emails/day, smart batching
- Quiet hours respected
- Progressive urgency for streak warnings
- Auto-disable after 3 consecutive ignores

### Chat Quality
- First token < 2s latency
- Remembers mid-conversation context across sessions
- References actual user data (notes, PDFs, plans)
- Adapts vocabulary to demonstrated level

### Presentation-Ready
- Demo data seeder for realistic 30-day history
- All visualizations animated
- New user onboarding flow that seeds initial preferences
- Mobile responsive

## Testing Strategy

| Level | Scope | Tool |
|-------|-------|------|
| Unit | SM-2 algorithm, pattern detection, graph ops | Jest/Vitest |
| Integration | Agent → mem0 → Express round-trip | Wrangler dev + local Express |
| E2E | Sign up → study → get smart email next day | Manual + seeded data |
| Load | 100 concurrent chat sessions | CF Workers built-in scaling |
| Manual | Full walkthrough with demo account | Before submission |

## Implementation Phases

| Phase | Days | Deliverable | Quality Gate |
|-------|------|-------------|--------------|
| 1. Agent Foundation | 1-3 | Tutor chat + mem0 persistence | Memory persists across sessions |
| 2. Intelligence Core | 4-6 | SM-2 + knowledge graph + patterns | Accurate insights from simulated data |
| 3. Email System | 7-8 | Scheduler + all 5 email types | Personalized email arrives on time |
| 4. Frontend Chat | 9-10 | Chat widget + streaming + history | Smooth streaming, references real data |
| 5. Frontend Insights | 11-13 | Dashboard + graph + settings | Real data renders, settings take effect |
| 6. Integration & Polish | 14-15 | E2E testing + demo seeder + mobile | Full walkthrough passes |
