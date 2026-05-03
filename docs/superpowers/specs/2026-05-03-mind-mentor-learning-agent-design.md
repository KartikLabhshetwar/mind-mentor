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
compatibility_date = "2024-01-01"

[triggers]
crons = ["0 * * * *"]

[vars]
EXPRESS_BACKEND_URL = "https://mind-mentor-api.onrender.com"
```

### Secrets (via `wrangler secret put`)
- GROQ_API_KEY
- MEM0_API_KEY
- RESEND_API_KEY

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
