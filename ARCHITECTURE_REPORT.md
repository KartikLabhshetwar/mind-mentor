# Mind Mentor - Architecture & Technical Report

## Final Year Project Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Multi-Agent AI System](#6-multi-agent-ai-system)
7. [Database Design](#7-database-design)
8. [Authentication & Security](#8-authentication--security)
9. [AI/ML Algorithms & Intelligence Layer](#9-aiml-algorithms--intelligence-layer)
10. [Real-Time Communication (SSE)](#10-real-time-communication-sse)
11. [Email Notification System](#11-email-notification-system)
12. [Memory & Personalization Layer](#12-memory--personalization-layer)
13. [PDF Processing & RAG Pipeline](#13-pdf-processing--rag-pipeline)
14. [State Management](#14-state-management)
15. [Deployment Architecture](#15-deployment-architecture)
16. [API Reference](#16-api-reference)
17. [Data Flow Diagrams](#17-data-flow-diagrams)
18. [Technical Definitions & Glossary](#18-technical-definitions--glossary)

---

## 1. Project Overview

**Mind Mentor** is an AI-powered adaptive learning platform that personalizes the study experience through multi-agent intelligence, spaced repetition algorithms, knowledge graph modeling, and real-time AI tutoring. The system combines a Next.js frontend, an Express.js backend, and a Cloudflare Workers-based multi-agent system to deliver personalized study plans, intelligent resource curation, PDF document analysis, learning analytics, and automated study reminders.

### 1.1 Problem Statement

Traditional e-learning platforms provide static content without adapting to individual learning patterns, knowledge gaps, or optimal study schedules. Students lack tools that:
- Identify prerequisite knowledge gaps before advancing
- Schedule reviews at scientifically optimal intervals
- Detect fatigue patterns and suggest optimal study windows
- Provide real-time tutoring that remembers past interactions

### 1.2 Proposed Solution

A multi-agent AI system where specialized agents (Tutor, Analyst, Scheduler) collaborate through a shared memory layer (mem0) to provide:
- **Adaptive tutoring** with persistent user context
- **Spaced repetition** via the SM-2 algorithm
- **Knowledge graph** modeling with prerequisite detection
- **Study pattern analysis** with fatigue threshold detection
- **Automated email reminders** with intelligent batching

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| AI Study Plan Generator | Generates weekly study plans with daily tasks using Groq LLM |
| Smart Resource Curation | Uses Tavily search API + LLM to curate learning resources per topic |
| PDF Chat (RAG) | Upload PDFs, ask questions answered from document context |
| AI Tutor Chat | Real-time streaming tutor that remembers user context via mem0 |
| Learning Insights | Radar charts, heatmaps, velocity graphs, knowledge graphs |
| Knowledge Graph | Force-directed graph visualizing topic mastery and prerequisites |
| Pomodoro Timer | Focus/break timer with session tracking and streak calculation |
| Spaced Repetition | SM-2 algorithm scheduling reviews at optimal intervals |
| Email Reminders | 5 types of smart notifications via Resend |
| Notes System | Block-based note editor with hierarchical organization |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
+---------------------+       +------------------------+       +----------------------------+
|                     |       |                        |       |                            |
|   Next.js Frontend  |<----->|   Express.js Backend   |<----->|   MongoDB Atlas            |
|   (Vercel)          |       |   (Render)             |       |   (Cloud Database)         |
|                     |       |                        |       |                            |
+--------+------------+       +-----------+------------+       +----------------------------+
         |                                ^
         |  SSE / REST                    | REST (X-Agent-Secret)
         v                                |
+--------+----------------------------+   |
|                                     |   |
|   Cloudflare Workers                |   |
|   Multi-Agent System                +---+
|                                     |
|   +----------+  +----------+  +----------+
|   |  Tutor   |  | Analyst  |  |Scheduler |
|   |  Agent   |  |  Agent   |  |  Agent   |
|   +----+-----+  +----+-----+  +----+-----+
|        |              |              |
|        v              v              v
|   +----+----+    +---------+   +---------+
|   | Groq    |    | SM-2    |   | Resend  |
|   | LLM     |    | Engine  |   | Email   |
|   +---------+    +---------+   +---------+
|        |
|        v
|   +---------+
|   |  mem0   |
|   | Memory  |
|   +---------+
+---------------------------------------------+
```

### 2.2 Service Communication Pattern

```
Frontend (Next.js)  ─── JWT Bearer Token ──→  Agent System (CF Workers)
                                                     │
                                                     │ X-Agent-Secret Header
                                                     ▼
                                              Express Backend
                                                     │
                                                     │ Mongoose ODM
                                                     ▼
                                               MongoDB Atlas
```

### 2.3 Architecture Pattern

The system follows a **microservices-inspired architecture** with three distinct services:

1. **Frontend Service (Next.js)** - UI rendering, client-side state, API route proxying
2. **Backend Service (Express.js)** - Data persistence, AI content generation, PDF processing
3. **Agent Service (Cloudflare Workers)** - Multi-agent intelligence, personalization, scheduling

Inter-service communication uses REST APIs with shared-secret authentication between trusted services and JWT authentication for user-facing endpoints.

---

## 3. Technology Stack

### 3.1 Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.2.35 | React meta-framework with App Router, SSR, API routes |
| **React** | 18.x | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript superset |
| **Tailwind CSS** | 3.4.x | Utility-first CSS framework |
| **Shadcn/UI** | - | Radix UI-based component library (Accordion, Dialog, Tabs, etc.) |
| **Zustand** | 5.x | Lightweight state management with persistence |
| **Recharts** | 3.8.x | Charting library for insights visualizations |
| **react-force-graph-2d** | 1.29.x | Force-directed graph for knowledge graph visualization |
| **react-pdf** / **pdfjs-dist** | 7.7 / 3.11 | PDF rendering in browser |
| **react-contribution-calendar** | 2.0.x | GitHub-style study activity heatmap |
| **Framer Motion** | 11.x | Animation library |
| **NextAuth.js** | 4.24.x | Authentication framework |
| **eventsource-parser** | 1.1.x | Server-Sent Events parser for streaming |
| **Zod** | 3.24.x | Schema validation for forms |
| **PostHog** | 1.215.x | Product analytics and user tracking |

### 3.2 Backend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Express.js** | 4.18.x | HTTP server framework |
| **MongoDB** | - | NoSQL document database |
| **Mongoose** | 8.x | MongoDB object modeling (ODM) |
| **Groq SDK** | 0.3.x | LLM inference via Groq Cloud |
| **LangChain** | 0.1.x | RAG pipeline orchestration |
| **@xenova/transformers** | 2.15.x | Client-side embeddings (MiniLM-L6-v2) |
| **pdf-parse** | 1.1.x | PDF text extraction |
| **Multer** | 1.4.x | File upload middleware |
| **node-cache** | 5.1.x | In-memory TTL caching |
| **express-rate-limit** | 7.1.x | API rate limiting |

### 3.3 Agent System Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Hono** | 4.4.x | Ultrafast web framework for Cloudflare Workers |
| **Cloudflare Workers** | - | Edge compute runtime (V8 isolates) |
| **Groq SDK** | 0.3.x | LLM inference (qwen/qwen3-32b model) |
| **mem0ai** | 2.4.x | Persistent memory layer for AI personalization |
| **Resend** | 3.2.x | Transactional email API |
| **jose** | 5.6.x | JWT verification (Web Crypto API compatible) |
| **Vitest** | 1.6.x | Unit testing framework |

### 3.4 Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting with edge functions |
| **Render** | Express backend hosting |
| **Cloudflare Workers** | Agent system hosting (edge compute) |
| **MongoDB Atlas** | Managed database |
| **Resend** | Transactional email delivery |
| **mem0 Cloud** | Managed AI memory service |
| **Groq Cloud** | LLM inference endpoint |
| **PostHog Cloud** | Product analytics |

---

## 4. Frontend Architecture

### 4.1 Next.js App Router Structure

The frontend uses Next.js 14 App Router with route groups for layout isolation:

```
src/app/
├── layout.tsx                    # Root layout (fonts, providers, toaster)
├── (marketing)/                  # Public-facing pages
│   ├── layout.tsx                # Header + Footer
│   └── page.tsx                  # Landing page (Hero, Features, FAQ)
├── (auth)/                       # Authentication pages
│   ├── layout.tsx                # Header only
│   ├── signin/page.tsx           # Login form
│   └── register/page.tsx         # Registration form
├── (dashboard)/                  # Protected app pages
│   ├── layout.tsx                # Sidebar nav + ChatWidget
│   ├── home/page.tsx             # Study activity calendar + streaks
│   ├── chat/page.tsx             # Full AI tutor chat
│   ├── study-plan/page.tsx       # Plan generator + stored plans
│   ├── resources/page.tsx        # Resource curator + stored resources
│   ├── pdf/page.tsx              # PDF upload + document list
│   ├── pdf/[documentId]/page.tsx # PDF viewer + RAG chat
│   ├── notes/page.tsx            # Note editor + list
│   ├── timer/page.tsx            # Pomodoro timer
│   ├── insights/page.tsx         # Analytics dashboard
│   ├── insights/knowledge-graph/ # Force-directed graph
│   ├── settings/reminders/       # Reminder configuration
│   └── profile/page.tsx          # User profile editor
└── api/                          # Next.js API routes (proxy layer)
    ├── register/route.ts         # User registration
    ├── notes/                    # CRUD for notes
    ├── pdf/                      # PDF proxy to Express
    ├── study-sessions/route.ts   # Session recording
    ├── user/profile/route.ts     # Profile management
    └── users/stats/route.ts      # Study statistics
```

### 4.2 Route Groups Explained

**Route groups** (parenthesized folders) in Next.js App Router provide layout isolation without affecting URL paths:

- `(marketing)` - Public pages with Header + Footer layout
- `(auth)` - Sign-in/Register with minimal Header layout
- `(dashboard)` - Protected pages with collapsible sidebar + floating ChatWidget

### 4.3 Component Architecture

```
src/components/
├── ui/                     # Shadcn/UI primitives (Button, Card, Dialog, etc.)
├── auth/                   # SignInForm, SignUpForm (Zod validation)
├── chat/                   # ChatWidget, ChatMessages, ChatInput
├── insights/               # MasteryRadar, StudyHeatmap, VelocityChart, WeakSpots, ReadinessGauge
├── settings/               # ReminderSettings
├── timer/                  # StudyTimer, TimerControls, SessionSummary
├── notes/                  # NoteEditor, NotesList
├── study-plan/             # StoredPlan
├── sections/               # HeroSection, FeatureGrid, FaqSection (marketing)
├── dashboard/              # DashboardNav (collapsible sidebar)
├── ChatInterface.tsx        # PDF chat interface
├── PdfChat.tsx              # Split-view PDF + chat
├── PdfViewer.tsx            # Full PDF viewer (zoom, rotate, touch gestures)
├── StudyPlanForm.tsx        # Plan creation form
├── StudyPlanDisplay.tsx     # Plan display with weekly breakdown
├── ResourceCurator.tsx      # Resource generation form
└── CurateResourcesForm.tsx  # Resource curation input
```

### 4.4 Provider Hierarchy

```tsx
<html>
  <body>
    <NextAuthProvider>           {/* Session management */}
      <PostHogProvider>          {/* Analytics tracking */}
        <PostHogPageView />      {/* Page view tracking */}
        {children}               {/* Route content */}
        <Toaster />              {/* Toast notifications */}
      </PostHogProvider>
    </NextAuthProvider>
  </body>
</html>
```

### 4.5 Middleware (Route Protection)

```
File: src/middleware.ts

Flow:
1. Extract JWT token from request via next-auth/jwt
2. Public paths (/, /register, /signin):
   - If token exists → redirect to /home
3. Protected paths (all dashboard routes):
   - If no token → redirect to /signin
```

Protected routes: `/home`, `/study-plan`, `/resources`, `/timer`, `/analytics`, `/settings`, `/profile`, `/chat`, `/insights`, `/insights/knowledge-graph`, `/settings/reminders`

---

## 5. Backend Architecture

### 5.1 Express Server Structure

```
server/
├── index.js                        # App entry, CORS, rate limiting, route registration
├── middleware/
│   └── agentAuth.js                # X-Agent-Secret header validation
├── models/
│   ├── studyPlan.js                # Study plan schema
│   ├── curatedResource.js          # Curated resources schema
│   ├── pdfDocument.js              # PDF document + chat history schema
│   ├── chatHistory.js              # Agent chat history schema
│   ├── reminderPreferences.js      # User notification preferences
│   ├── studyStatsServer.js         # Study session statistics
│   └── topicMastery.js             # Topic mastery + SM-2 data
├── routes/
│   ├── generatePlan.js             # Study plan CRUD + AI generation
│   ├── curateResources.js          # Resource curation via Tavily + LLM
│   ├── pdfChat.js                  # PDF upload, chat, RAG pipeline
│   ├── analytics.js                # Study session analytics (agent-facing)
│   ├── chatHistory.js              # Chat history persistence (agent-facing)
│   ├── reminders.js                # Reminder preferences CRUD (agent-facing)
│   ├── topicMastery.js             # Topic mastery CRUD (agent-facing)
│   └── webhooks.js                 # Resend webhook handler
├── services/
│   ├── aiService.js                # Groq LLM + Tavily integration
│   ├── dbService.js                # Database persistence helpers
│   ├── pdfService.js               # PDF parsing, chunking, RAG chain
│   ├── storageService.js           # Multer config, Base64 conversion
│   └── transformersEmbeddings.js   # HuggingFace embeddings (MiniLM-L6-v2)
└── scripts/
    └── seed-demo-data.js           # Demo data seeder
```

### 5.2 Route Categories

**Public Routes** (no auth middleware):
| Route | Method | Purpose |
|-------|--------|---------|
| `/generate-plan` | POST | Create AI study plan |
| `/generate-plan/:userId` | GET | Fetch user's active plans |
| `/generate-plan/:planId` | DELETE | Soft-delete (deactivate) plan |
| `/curate-resources` | POST | Generate curated resources |
| `/curate-resources/:userId` | GET | Fetch user's resources |
| `/curate-resources/:resourceId` | DELETE | Delete resource set |
| `/pdf/upload` | POST | Upload + process PDF |
| `/pdf` | GET | List user's PDFs |
| `/pdf/:id` | GET/DELETE | Get/delete specific PDF |
| `/pdf/:id/chat` | POST | Chat with PDF (RAG) |

**Agent-Facing Routes** (protected by `X-Agent-Secret`):
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/analytics/sessions/:userId` | GET | Study sessions + streaks |
| `/api/analytics/topics/:userId` | GET | Topic mastery data |
| `/api/chat/history/:userId` | GET | Last 50 chat sessions |
| `/api/chat/history` | POST | Append chat messages |
| `/api/reminders/preferences` | POST | Upsert reminder prefs |
| `/api/reminders/preferences/:userId` | GET | Get reminder prefs |
| `/api/reminders/active-users` | GET | All users with reminders enabled |
| `/api/topics/mastery/:userId` | GET | Topic mastery records |
| `/api/topics/mastery` | POST | Upsert mastery + review history |
| `/api/webhooks/resend` | POST | Email event webhook |

### 5.3 Rate Limiting Strategy

```
Global:        100 requests / 15 minutes per IP
AI Endpoints:  100 requests / 60 minutes per IP
```

### 5.4 CORS Configuration

Allowed origins: `mind-mentor-pearl.vercel.app`, `mind-mentor.kartiklabhshetwar.me`, `www.mind-mentor.ink`, `mind-mentor.ink`, `localhost:3000`

---

## 6. Multi-Agent AI System

### 6.1 Agent Architecture

The multi-agent system runs on **Cloudflare Workers** using the **Hono** web framework. Three specialized agents operate independently but share a common memory layer (mem0).

```
┌──────────────────────────────────────────────────┐
│              Cloudflare Workers Runtime           │
│                                                   │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ Tutor Agent │ │Analyst Agent │ │ Scheduler  │ │
│  │             │ │              │ │   Agent    │ │
│  │ - Chat SSE  │ │ - SM-2       │ │ - Cron     │ │
│  │ - Context   │ │ - Patterns   │ │ - Emails   │ │
│  │ - Memory    │ │ - KG Build   │ │ - Batching │ │
│  └──────┬──────┘ └──────┬───────┘ └─────┬──────┘ │
│         │               │               │        │
│         └───────┬───────┴───────┬───────┘        │
│                 │               │                 │
│          ┌──────▼──────┐ ┌──────▼──────┐         │
│          │  mem0 Cloud │ │ Groq Cloud  │         │
│          │  (Memory)   │ │ (LLM)      │         │
│          └─────────────┘ └─────────────┘         │
└──────────────────────────────────────────────────┘
```

### 6.2 Tutor Agent

**Purpose:** Personalized AI tutoring with persistent memory.

**Endpoint:** `POST /agents/tutor/chat`

**Flow:**
1. Verify JWT from `Authorization: Bearer <token>` header
2. Extract `userId` from verified token payload
3. Search mem0 for user's past learning context using current message as query
4. Build system prompt incorporating user's memory context, current page, and subject
5. Stream response from Groq LLM (`qwen/qwen3-32b`) via SSE
6. After completion, save interaction observation to mem0 (non-blocking)
7. Persist chat history to Express backend (non-blocking)

**System Prompt Strategy:**
```
- Adapts to user's learning level
- References known preferences, weak topics, strong topics
- Asks follow-up questions to gauge understanding
- Notes new observations about user's learning patterns
```

**LLM Configuration:**
- Model: `qwen/qwen3-32b`
- Temperature: 0.7
- Max tokens: 2,000
- Streaming: enabled

### 6.3 Analyst Agent

**Purpose:** Learning analytics, knowledge graph construction, spaced repetition scheduling.

**Endpoints:**
- `POST /agents/analyst/analyze` - Full or quick analysis
- `GET /agents/analyst/insights` - Cached insights from mem0

**Analysis Pipeline:**
1. Fetch study sessions from Express backend
2. Fetch topic mastery data from Express backend
3. Run pattern detection algorithm on sessions
4. Build knowledge graph from mastery data
5. (Full analysis only) Use LLM to infer prerequisite relationships between topics
6. Calculate SM-2 spaced repetition schedule for all topics
7. Generate AI recommendations based on patterns + graph
8. Store insight summary in mem0 for caching
9. Return complete `AnalysisResult` object

**Output Structure:**
```typescript
interface AnalysisResult {
  patterns: {
    optimalStudyTime: string;      // e.g., "19:00-20:00"
    avgSessionDuration: number;    // minutes
    learningVelocity: Record<string, number>; // topics/week per subject
    fatigueThreshold: number;      // minutes before performance drops
  };
  knowledgeGraph: {
    nodes: TopicNode[];            // Topics with mastery scores
    edges: TopicEdge[];            // Prerequisite/related relationships
  };
  spacedRepetition: SM2Data[];     // Next review dates per topic
  recommendations: string[];       // AI-generated study advice
}
```

### 6.4 Scheduler Agent

**Purpose:** Automated email reminders with intelligent batching.

**Endpoints:**
- `POST /agents/scheduler/configure` - Save notification preferences
- `GET /agents/scheduler/status` - Get current preferences

**Cron Trigger:** Runs every hour (`0 * * * *`) via Cloudflare Cron Triggers.

**Email Types:**

| Type | Trigger | Content |
|------|---------|---------|
| Daily Reminder | At configured time (default 19:00) | Current study topic from mem0 |
| Streak Warning | N hours before midnight | Current streak + hours remaining |
| Spaced Repetition | When topic's `nextReview` date arrives | Topic name + days since last review |
| Weekly Digest | Configured day (default Sunday) at 18:00 | Hours, sessions, streak, top topics |
| Milestone | Streak hits 7, 14, or 30 days | Achievement name + next goal |

**Smart Batching Rules:**
1. **Max emails/day:** Configurable (default 2)
2. **Quiet hours:** No emails between 22:00 - 07:00 (user timezone)
3. **Auto-disable:** Stop after 3 consecutive ignored emails
4. **Webhook tracking:** Resend `email.opened` / `email.clicked` events reset the ignore counter

### 6.5 Inter-Agent Communication

Agents don't communicate directly. They share context through:
1. **mem0 Memory Layer** - Tutor writes observations, Analyst reads them for pattern context
2. **MongoDB (via Express)** - All agents read/write to the same data models
3. **Express Backend** - Acts as the shared data bus between agents

---

## 7. Database Design

### 7.1 Entity-Relationship Overview

```
User (1) ──────── (N) StudyPlan
  │
  ├──── (1) StudyStats
  │         └── dailySessions: Map<date, {count, duration, sessions[]}>
  │
  ├──── (N) CuratedResource
  │         └── resources: [{title, link, type, description, benefits[]}]
  │
  ├──── (N) Note
  │         └── content: [{type, content, checked}]
  │
  ├──── (N) PdfDocument
  │         ├── documentChunks: [{text, metadata}]
  │         └── chatHistory: [{role, content, sources[]}]
  │
  ├──── (N) ChatHistory (agent chats)
  │         └── messages: [{role, content, timestamp}]
  │
  ├──── (N) TopicMastery
  │         ├── sm2: {repetitions, easiness, interval, nextReview}
  │         └── reviewHistory: [{date, quality}]
  │
  └──── (1) ReminderPreferences
              ├── dailyReminder, streakWarning, weeklyDigest, spacedRepetition
              └── consecutiveIgnored (auto-disable counter)
```

### 7.2 Schema Definitions

#### User
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, bcrypt-hashed),
  subjects: [String],
  savedPlans: [StudyPlanSubdoc],
  savedResources: [ResourceSubdoc],
  profile: {
    preferences: {
      emailNotifications: Boolean (default: true),
      studyReminders: Boolean (default: true)
    }
  },
  stats: ObjectId → StudyStats
}
// Indexes: { subjects: 1 }
```

#### StudyPlan
```javascript
{
  userId: ObjectId → User (required, indexed),
  overview: { subject: String, duration: String, examDate: String },
  weeklyPlans: [{
    week: String,
    goals: [String],
    dailyTasks: [{ day: String, tasks: [String], duration: String }]
  }],
  recommendations: [String],
  isActive: Boolean (default: true),
  progress: Number (default: 0),
  lastUpdated: Date
}
// Indexes: { userId: 1, isActive: 1 }, { userId: 1, 'overview.subject': 1 }
```

#### StudyStats
```javascript
{
  userId: ObjectId → User (required, unique, indexed),
  totalStudyHours: Number (default: 0),
  completedSessions: Number (default: 0),
  currentStreak: Number (default: 0),
  bestStreak: Number (default: 0),
  lastStudyDate: Date,
  dailySessions: Map<String, {
    count: Number,
    totalDuration: Number,
    sessions: [{ duration, startTime, endTime, mode }]
  }>
}
```

#### TopicMastery
```javascript
{
  userId: ObjectId → User (required, indexed),
  topic: String (required),
  subject: String (required),
  mastery: Number (default: 0),       // 0-100 score
  sm2: {
    repetitions: Number (default: 0),
    easiness: Number (default: 2.5),   // SM-2 E-Factor
    interval: Number (default: 0),     // days until next review
    nextReview: Date
  },
  prerequisites: [String],            // topic IDs
  lastReviewed: Date,
  reviewHistory: [{ date: Date, quality: Number }]  // quality: 0-5
}
// Indexes: { userId: 1, topic: 1 } (unique compound)
```

#### PdfDocument
```javascript
{
  userId: String (required, indexed),
  title: String (required),
  pdfData: String (required),          // Base64 encoded full PDF
  pageCount: Number (required),
  documentChunks: [{                   // Pre-processed for RAG
    text: String,
    metadata: { pageNumber: Number, location: String }
  }],
  chatHistory: [{
    role: 'user' | 'assistant',
    content: String,
    sourcePages: [Number],
    sources: [{ page: Number, content: String }],
    timestamp: Date
  }]
}
// Indexes: { userId: 1, createdAt: -1 }, { userId: 1, title: 1 }
```

#### ReminderPreferences
```javascript
{
  userId: ObjectId → User (required, unique),
  timezone: String (default: "Asia/Kolkata"),
  dailyReminder: { enabled: Boolean, time: String },
  streakWarning: { enabled: Boolean, hoursBeforeMidnight: Number },
  weeklyDigest: { enabled: Boolean, day: String },
  spacedRepetition: { enabled: Boolean, intensity: "aggressive"|"balanced"|"relaxed" },
  email: String (required),
  maxEmailsPerDay: Number (default: 2),
  consecutiveIgnored: Number (default: 0)
}
```

#### ChatHistory
```javascript
{
  userId: ObjectId → User (required, indexed),
  messages: [{
    role: 'user' | 'assistant',
    content: String,
    timestamp: Date
  }]
}
// Session merging: appends to existing session if last message < 30 min ago
```

#### Note
```javascript
{
  userId: ObjectId → User (required, indexed),
  title: String (default: 'Untitled'),
  content: [{
    type: 'paragraph'|'heading1'|'heading2'|'heading3'|'bulletList'|'numberedList'|'todo'|'code',
    content: String,
    checked: Boolean (for todo type)
  }],
  icon: String,
  cover: String,
  isArchived: Boolean (default: false),
  parentId: ObjectId → Note (nullable),
  path: String (default: '/')
}
// Indexes: { userId: 1, path: 1 }, { userId: 1, parentId: 1 }
```

---

## 8. Authentication & Security

### 8.1 Authentication Flow

```
Registration:
  Client → POST /api/register → bcrypt.hash(password, 10) → MongoDB

Login:
  Client → NextAuth CredentialsProvider
    → MongoDB lookup by email
    → bcrypt.compare(password, hash)
    → JWT issued (contains userId)
    → Session cookie set

Token Flow:
  NextAuth JWT (cookie) → next-auth/jwt getToken()
    → Session callback creates agent JWT via jose SignJWT
    → Agent JWT sent to frontend via session.token
    → Frontend sends to CF Workers as Bearer token
```

### 8.2 Three-Layer Security Model

```
Layer 1: Frontend ↔ Next.js API Routes
  - NextAuth session validation via getServerSession()
  - JWT extraction via getToken() from next-auth/jwt

Layer 2: Frontend ↔ Agent System (CF Workers)
  - NextAuth-signed JWT (HMAC-SHA256 via jose)
  - Token contains: { id: userId }
  - Expiration: 30 days
  - Verified in CF Workers using NEXTAUTH_SECRET

Layer 3: Agent System ↔ Express Backend
  - Shared secret: X-Agent-Secret header
  - Server-to-server only (never exposed to client)
  - userId NEVER passed from frontend body — always extracted from verified JWT
```

### 8.3 Security Measures

| Measure | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with salt rounds = 10 |
| JWT Signing | HMAC-SHA256 via jose library |
| Rate Limiting | 100 req/15min global, 100 req/hr for AI endpoints |
| CORS | Whitelist of allowed origins |
| Input Validation | Zod schemas on frontend forms |
| Route Protection | Next.js middleware redirects unauthenticated users |
| Agent Auth | Shared secret for service-to-service calls |
| File Validation | 10MB max upload, PDF-only filter |

---

## 9. AI/ML Algorithms & Intelligence Layer

### 9.1 SM-2 Spaced Repetition Algorithm

The **SuperMemo 2 (SM-2)** algorithm is a spaced repetition scheduling algorithm that optimizes review intervals based on recall quality.

**Algorithm Parameters:**
- `quality` (0-5): User's self-assessed recall quality
- `easiness` (E-Factor): Difficulty multiplier (minimum 1.3)
- `repetitions`: Number of successful consecutive reviews
- `interval`: Days until next review

**Algorithm Logic:**
```
Input: { repetitions, easiness, interval, quality }

1. Update Easiness Factor:
   E' = E + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
   E' = max(1.3, E')

2. If quality < 3 (failed recall):
   - repetitions = 0
   - interval = 1 day

3. If quality >= 3 (successful recall):
   - repetitions++
   - If repetitions == 1: interval = 1 day
   - If repetitions == 2: interval = 6 days
   - If repetitions >= 3: interval = round(interval * E')

4. nextReview = today + interval

Output: { repetitions, easiness, interval, nextReview }
```

**Mastery Score Formula:**
```
masteryScore = (easinessNormalized * 0.4) + (reviewNormalized * 0.3) + (recencyScore * 0.3)

Where:
  easinessNormalized = (easiness / 2.5) * 100
  reviewNormalized   = (min(reviewCount, 10) / 10) * 100
  recencyScore       = 100 * e^(-0.1 * daysSinceLastReview)
```

This creates a 0-100 mastery score that decays exponentially without reviews.

### 9.2 Knowledge Graph

A **directed graph** modeling topic relationships and mastery levels.

**Data Structure:**
```typescript
Node: { id, topic, subject, mastery (0-100) }
Edge: { source, target, type: "prerequisite" | "related" }
```

**Operations:**

| Method | Description |
|--------|-------------|
| `addNode(node)` | Register a topic with mastery score |
| `addEdge(source, target, type)` | Create relationship between topics |
| `getPrerequisites(topicId)` | Find all prerequisite nodes for a topic |
| `findGaps(topicId, minMastery)` | Find prerequisites below mastery threshold |
| `suggestNext()` | Suggest next topics to study (prerequisites met, lowest mastery first) |
| `toJSON() / fromJSON()` | Serialization for API transport |

**Topic Suggestion Algorithm:**
```
1. For each node with mastery < 80%:
   a. Get all prerequisite nodes
   b. Check if ALL prerequisites have mastery >= 60%
   c. If yes (or no prerequisites), add to candidates
2. Sort candidates by mastery ascending
3. Return sorted list (weakest first)
```

**LLM-Inferred Prerequisites:**
During full analysis, the Analyst agent sends all topic names to the LLM and asks it to identify prerequisite relationships:
```
Input: ["Arrays", "Dynamic Programming", "Recursion", "Trees"]
Output: { edges: [{ from: "Arrays", to: "Dynamic Programming" }, ...] }
```

### 9.3 Study Pattern Detection

**Input:** Array of study sessions `{ date, startHour, duration, subject }`

**Detected Patterns:**

| Pattern | Method |
|---------|--------|
| **Optimal Study Time** | Mode of `startHour` across all sessions |
| **Average Session Duration** | Mean of all session durations |
| **Fatigue Threshold** | Median session duration (assumes longer sessions drop off due to fatigue) |
| **Learning Velocity** | Unique study days per subject per week |

### 9.4 Groq LLM Integration

**Model:** `qwen/qwen3-32b` (32B parameter model hosted on Groq's LPU hardware)

**Usage Points:**
1. **Study Plan Generation** - Structured weekly plans with daily tasks
2. **Resource Curation** - Evaluating Tavily search results into structured resources
3. **Tutor Chat** - Streaming conversational tutoring
4. **Prerequisite Inference** - Identifying topic relationships from names
5. **Recommendation Generation** - Personalized study advice from patterns + graph
6. **PDF Q&A** - Answering questions from document context (RAG)

---

## 10. Real-Time Communication (SSE)

### 10.1 Server-Sent Events Architecture

The Tutor Agent uses **Server-Sent Events (SSE)** for streaming AI responses token-by-token.

**Why SSE over WebSocket:**
- Unidirectional (server → client) is sufficient for chat streaming
- HTTP/1.1 compatible, works behind all proxies
- Auto-reconnection built into EventSource API
- Simpler than WebSocket for this use case

**Why Custom Parser over EventSource:**
- `EventSource` API only supports GET requests
- Chat requires POST (sending message body)
- Solution: `fetch()` + `eventsource-parser` library

### 10.2 SSE Flow

```
Client                          CF Worker (Hono)                    Groq API
  │                                   │                                │
  │── POST /agents/tutor/chat ──────→│                                │
  │   (Bearer JWT, JSON body)        │                                │
  │                                   │── groq.chat.completions ────→│
  │                                   │   (stream: true)              │
  │                                   │                                │
  │                                   │←── chunk { delta.content } ──│
  │←── SSE: data: "token" ──────────│                                │
  │                                   │←── chunk { delta.content } ──│
  │←── SSE: data: "token" ──────────│                                │
  │                                   │                                │
  │                                   │←── [DONE] ──────────────────│
  │←── SSE: event: done ────────────│                                │
  │                                   │                                │
```

### 10.3 Client-Side Implementation

```typescript
// Uses fetch() for POST + eventsource-parser for SSE parsing
const parser = createParser((event) => {
  if (event.type === "event") {
    if (event.event === "done") { onDone(); return; }
    if (event.event === "error") { onError(event.data); return; }
    if (event.data) { onChunk(event.data); }  // Append token to UI
  }
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  parser.feed(decoder.decode(value));
}
```

---

## 11. Email Notification System

### 11.1 Architecture

```
Cloudflare Cron Trigger (hourly)
         │
         ▼
  Scheduler Agent (runSchedulerCron)
         │
         ├── Fetch active users from Express
         │
         ├── For each user:
         │     ├── Check timezone + quiet hours
         │     ├── Check consecutiveIgnored < 3
         │     ├── Check emailsSentThisRun < maxEmailsPerDay
         │     │
         │     ├── Daily Reminder?  → send if hour matches
         │     ├── Streak Warning?  → send if no study today + hours left
         │     ├── Spaced Review?   → send if topic.nextReview <= now
         │     ├── Weekly Digest?   → send if day + hour match
         │     └── Milestone?       → send if streak == 7/14/30
         │
         └── Resend API → user's email
                  │
                  └── Webhook (email.opened / email.clicked)
                          │
                          ▼
                  Express /api/webhooks/resend
                     → Reset consecutiveIgnored = 0
```

### 11.2 Email Templates

All templates use inline CSS for email client compatibility. Each includes:
- Brand-colored header
- Dynamic content (user name, topic, streak, stats)
- CTA button linking to relevant Mind Mentor page
- Footer with "Mind Mentor AI" attribution

---

## 12. Memory & Personalization Layer

### 12.1 mem0 Integration

**mem0** is a managed memory layer for AI applications that provides persistent, queryable user memories.

**Architecture:**
```
Agent writes observation → mem0 Cloud (stores, deduplicates, indexes)
Agent queries with context → mem0 returns relevant memories
```

**Memory Categories:**
| Category | Written By | Used By | Content |
|----------|-----------|---------|---------|
| `session_context` | Tutor | Tutor | What user asked about, topics discussed |
| `learning_pattern` | Analyst | Tutor, Scheduler | Optimal study time, weak topics, velocity |
| `preference` | Tutor | Tutor | User's learning style, preferred explanations |
| `mastery` | Analyst | Tutor | Topic mastery summaries |

**API Usage:**
```typescript
// Write memory
await client.add(
  [{ role: "user", content: "User asked about recursion" }],
  { user_id: userId, metadata: { category: "session_context" } }
);

// Search memory (semantic)
const results = await client.search("recursion trees", { user_id: userId });
```

### 12.2 Personalization Flow

```
1. User sends chat message
2. Tutor searches mem0 with message as query
3. mem0 returns semantically relevant memories
4. Memories injected into system prompt as "What you know about this user"
5. LLM generates response using user context
6. Key observations saved back to mem0 for future sessions
```

---

## 13. PDF Processing & RAG Pipeline

### 13.1 RAG (Retrieval-Augmented Generation) Architecture

```
PDF Upload Flow:
  PDF File → pdf-parse (text extraction)
           → RecursiveCharacterTextSplitter (chunking)
           → MiniLM-L6-v2 (embedding)
           → MemoryVectorStore (in-memory storage)
           → MongoDB (persist chunks + base64 PDF)

Chat Flow:
  User Question → MiniLM-L6-v2 (embed question)
               → Vector similarity search (top-k chunks)
               → Construct prompt with retrieved context
               → Groq LLM generates answer
               → Response includes source pages
```

### 13.2 Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Text Extraction | `pdf-parse` | Extract raw text from PDF pages |
| Text Splitting | LangChain `RecursiveCharacterTextSplitter` | Split text into overlapping chunks |
| Embeddings | `@xenova/transformers` (MiniLM-L6-v2) | Generate 384-dim vectors locally |
| Vector Store | LangChain `MemoryVectorStore` | In-memory similarity search |
| LLM | Groq (`ChatGroq`) | Answer generation from context |
| Chain | LangChain `RunnableSequence` | Orchestrate retrieval + generation |

### 13.3 Embedding Model

**Model:** `Xenova/all-MiniLM-L6-v2`
- **Type:** Sentence transformer (ONNX format)
- **Dimensions:** 384
- **Runtime:** `@xenova/transformers` (runs in Node.js, no GPU needed)
- **Caching:** Model files cached in `./models` directory
- **Initialization:** Lazy (loads on first request, reuses afterward)

---

## 14. State Management

### 14.1 Client-Side State

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Server State** | `fetch` + React hooks | API data fetching (no React Query) |
| **Auth State** | NextAuth `useSession()` | User session, JWT token |
| **Timer State** | Zustand + `persist` | Pomodoro timer (survives refresh) |
| **Component State** | React `useState` | Form inputs, UI toggles, loading states |

### 14.2 Zustand Timer Store

```typescript
interface TimerStore {
  timeLeft: number;        // seconds remaining
  isActive: boolean;       // running or paused
  mode: 'focus' | 'break'; // current mode
  focusTime: number;       // focus duration in minutes (15/25/30/45/60)
  breakTime: number;       // break duration in minutes (5/10/15/20)
  progress: number;        // 0-100 percentage
  lastTick: number;        // timestamp for drift correction
}
```

**Persistence:** Zustand `persist` middleware stores timer state in `localStorage` under key `timer-storage`. This allows the timer to survive page navigation and browser refresh.

**Tick Mechanism:** 100ms `setInterval` calculates elapsed time from `lastTick` delta (not fixed decrements), preventing drift from browser throttling.

---

## 15. Deployment Architecture

### 15.1 Service Deployment

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│     Vercel       │     │     Render        │     │ Cloudflare Workers│
│                  │     │                   │     │                   │
│  Next.js 14      │     │  Express.js       │     │  Hono + Agents    │
│  (Standalone)    │     │  (Node.js)        │     │  (V8 Isolates)    │
│                  │     │                   │     │                   │
│  Port: 3000      │     │  Port: 8000       │     │  Edge Network     │
│  SSR + API       │     │  REST API         │     │  Cron Triggers    │
└─────────┬────────┘     └────────┬──────────┘     └────────┬──────────┘
          │                       │                          │
          └───────────┬───────────┴──────────────────────────┘
                      │
               ┌──────▼──────┐
               │ MongoDB Atlas│
               │ (Cloud DB)   │
               └──────────────┘
```

### 15.2 Docker Configuration

**Frontend Dockerfile (Multi-stage):**
1. `deps` stage: Install npm dependencies
2. `builder` stage: Build Next.js (standalone output)
3. `runner` stage: Alpine image, non-root user, health check

**Docker Compose:** Orchestrates frontend + backend with shared network, health checks, volume mounts for uploads and model cache.

### 15.3 Environment Variables

| Variable | Service | Purpose |
|----------|---------|---------|
| `NEXTAUTH_SECRET` | Frontend, Agents | JWT signing key |
| `MONGODB_URI` | Frontend, Backend | Database connection string |
| `GROQ_API_KEY` | Backend, Agents | LLM API access |
| `GROQ_API_KEY_RAG` | Backend | Separate key for RAG endpoints |
| `TAVILY_API_KEY` | Backend | Web search for resource curation |
| `MEM0_API_KEY` | Agents | Memory layer access |
| `RESEND_API_KEY` | Agents | Email sending |
| `AGENT_SERVICE_SECRET` | Agents, Backend | Service-to-service auth |
| `NEXT_PUBLIC_API_URL` | Frontend | Express backend URL |
| `NEXT_PUBLIC_AGENT_URL` | Frontend | Agent system URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | Frontend | Analytics |

---

## 16. API Reference

### 16.1 Next.js API Routes (Frontend)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/register` | POST | None | Create user account |
| `/api/notes` | GET, POST | Session | List/create notes |
| `/api/notes/[noteId]` | GET, PATCH, DELETE | Session | Single note CRUD |
| `/api/pdf` | GET, POST, DELETE | JWT | PDF proxy to backend |
| `/api/pdf/upload` | POST | JWT | PDF upload proxy |
| `/api/pdf/[documentId]` | GET, POST | JWT | PDF data + chat proxy |
| `/api/pdf/[documentId]/chat` | POST | Header | Direct chat proxy |
| `/api/pdf/[documentId]/history` | GET | JWT | Chat history proxy |
| `/api/study-sessions` | POST | Session | Record completed session |
| `/api/user/profile` | GET, PUT | Session | Profile management |
| `/api/users/stats` | GET | Session | Study statistics |

### 16.2 Agent Endpoints (Cloudflare Workers)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | None | Health check + agent list |
| `/agents/tutor/chat` | POST | Bearer JWT | Stream AI tutor response |
| `/agents/analyst/analyze` | POST | Bearer JWT | Run learning analysis |
| `/agents/analyst/insights` | GET | Bearer JWT | Get cached insights |
| `/agents/scheduler/configure` | POST | Bearer JWT | Save reminder prefs |
| `/agents/scheduler/status` | GET | Bearer JWT | Get reminder status |

### 16.3 Express Backend Routes

See Section 5.2 for complete route listing.

---

## 17. Data Flow Diagrams

### 17.1 Study Session Recording

```
User completes Pomodoro session
         │
         ▼
StudyTimer component
  → POST /api/study-sessions { duration, startTime, endTime, mode }
         │
         ▼
API Route handler
  → Find/create StudyStats for userId
  → Append session to dailySessions[today]
  → Update totalStudyHours, completedSessions
  → Recalculate currentStreak (check if yesterday has entry)
  → Update bestStreak if currentStreak > bestStreak
         │
         ▼
Dispatch custom event: 'study-session-completed'
  → Home page listens → refetch calendar data
```

### 17.2 AI Chat with Memory

```
User types message in ChatWidget
         │
         ▼
streamChat() → POST /agents/tutor/chat
         │
         ▼
Tutor Agent:
  1. Verify JWT → extract userId
  2. mem0.search(message, userId) → relevant memories
  3. Build system prompt with memories
  4. groq.chat.completions.create(stream: true)
  5. For each token → SSE writeSSE({ data: token })
  6. After stream:
     a. mem0.add(observation, userId) [non-blocking]
     b. express.saveChatMessage(userId, messages) [non-blocking]
         │
         ▼
Client receives SSE events
  → Append tokens to assistant message in state
  → Render with ReactMarkdown (prose styling)
```

### 17.3 PDF RAG Chat

```
User uploads PDF
         │
         ▼
POST /pdf/upload (multer, 10MB max)
  → pdf-parse extracts text
  → RecursiveCharacterTextSplitter chunks text
  → MiniLM-L6-v2 generates embeddings
  → Store: MongoDB (chunks, base64 PDF, metadata)
  → Return: documentId
         │
         ▼
User asks question about PDF
         │
         ▼
POST /pdf/:id/chat { question, chatHistory }
  → Load document chunks from MongoDB
  → Re-embed chunks into MemoryVectorStore
  → Embed question → similarity search → top-k chunks
  → Construct prompt: "Answer using ONLY this context: {chunks}"
  → Groq LLM generates answer
  → Append Q&A to document's chatHistory
  → Return: { answer, sourcePages, sources }
```

### 17.4 Learning Analysis Pipeline

```
User clicks "View Insights"
         │
         ▼
triggerAnalysis(token, "quick")
  → POST /agents/analyst/analyze
         │
         ▼
Analyst Agent:
  1. express.getStudySessions(userId)
     → Returns: sessions[], streaks, weekly stats
  2. express.getTopicMastery(userId)
     → Returns: topics with SM-2 data
  3. detectPatterns(sessions)
     → Returns: optimalStudyTime, avgDuration, fatigueThreshold, velocity
  4. Build KnowledgeGraph from mastery data
     → Add nodes (topics with mastery scores)
     → Add edges (prerequisites)
  5. [Full only] LLM infers prerequisite relationships
  6. Calculate SM-2 nextReview for all topics
  7. LLM generates recommendations
  8. Store summary in mem0
  9. Return AnalysisResult
         │
         ▼
Frontend renders:
  - MasteryRadar (Recharts RadarChart)
  - StudyHeatmap (optimal time, avg session, fatigue)
  - VelocityChart (Recharts BarChart)
  - WeakSpots (progress bars, sorted by mastery)
  - ReadinessGauge (SVG circle, weighted score)
  - KnowledgeGraph (react-force-graph-2d, color-coded)
```

---

## 18. Technical Definitions & Glossary

### 18.1 Core Concepts

| Term | Definition |
|------|-----------|
| **Multi-Agent System** | Architecture where multiple specialized AI agents (Tutor, Analyst, Scheduler) operate independently on distinct tasks while sharing a common memory layer for coordination. Each agent has a single responsibility and communicates through a shared data store rather than direct messaging. |
| **Spaced Repetition** | Learning technique that schedules review sessions at increasing intervals to exploit the psychological spacing effect. Items recalled successfully are reviewed less frequently; items forgotten are reviewed sooner. |
| **SM-2 Algorithm** | SuperMemo 2 algorithm by Piotr Wozniak (1987). Calculates optimal review intervals using an Easiness Factor (E-Factor) that adjusts based on recall quality (0-5 scale). Core formula: `nextInterval = previousInterval * E-Factor`. |
| **Knowledge Graph** | Directed graph data structure where nodes represent topics (with mastery scores 0-100) and edges represent prerequisite or related relationships. Used to identify learning gaps and suggest optimal study order. |
| **RAG (Retrieval-Augmented Generation)** | AI technique that retrieves relevant document chunks via vector similarity search and injects them into the LLM prompt as context, grounding responses in specific source material rather than general training data. |
| **E-Factor (Easiness Factor)** | SM-2 parameter (minimum 1.3) representing how easy/difficult a topic is for a specific user. Higher values = easier items = longer review intervals. Adjusted after each review based on recall quality. |
| **Mastery Score** | Composite 0-100 metric calculated from three weighted components: Easiness Factor (40%), review count (30%), and recency decay (30%). Decays exponentially without reviews. |
| **Learning Velocity** | Rate of topic coverage measured as unique study days per subject per week. Higher velocity indicates consistent engagement with a subject. |
| **Fatigue Threshold** | Median session duration across all study sessions. Used as a proxy for the point where cognitive fatigue reduces learning effectiveness. |

### 18.2 Architecture & Infrastructure Terms

| Term | Definition |
|------|-----------|
| **Server-Sent Events (SSE)** | HTTP-based protocol where the server pushes data to the client over a single long-lived connection. Unlike WebSocket, SSE is unidirectional (server→client) and works over standard HTTP. Used for streaming LLM token output. |
| **Cloudflare Workers** | Serverless compute platform that runs JavaScript/TypeScript at the edge (200+ data centers worldwide). Uses V8 isolates (not containers) for sub-millisecond cold starts. Used to host the multi-agent system. |
| **V8 Isolate** | Lightweight execution environment within the V8 JavaScript engine. Unlike containers, isolates share a single OS process and have microsecond startup times. Each Cloudflare Worker request runs in its own isolate. |
| **Hono** | Ultrafast web framework for Cloudflare Workers, Deno, and Bun. Provides Express-like routing with middleware support, optimized for edge runtimes. 14KB minified. |
| **Edge Computing** | Computing paradigm where code runs at servers geographically close to the user rather than in centralized data centers. Reduces latency for global users. |
| **Cron Trigger** | Cloudflare Workers feature that invokes a Worker on a schedule (e.g., `0 * * * *` = every hour). Used to trigger the Scheduler Agent's email dispatch loop. |
| **App Router** | Next.js 13+ routing system using the `app/` directory with file-system-based routing. Supports React Server Components, nested layouts, loading states, and route groups. |
| **Route Group** | Next.js App Router feature using parenthesized folder names (e.g., `(dashboard)`) to organize routes under a shared layout without affecting URL paths. |
| **API Route** | Next.js server-side endpoint defined in `app/api/` directory. Handles HTTP requests and can proxy to external backends, access databases, or perform server-side logic. |
| **Standalone Output** | Next.js build mode (`output: "standalone"`) that generates a self-contained `server.js` with only required `node_modules`. Optimized for Docker deployments. |
| **ODM (Object-Document Mapper)** | Library (Mongoose) that maps MongoDB documents to JavaScript/TypeScript objects with schema validation, type casting, query building, and lifecycle hooks. |

### 18.3 AI/ML Terms

| Term | Definition |
|------|-----------|
| **LLM (Large Language Model)** | Neural network trained on massive text corpora that generates human-like text. Mind Mentor uses Groq-hosted `qwen/qwen3-32b` (32 billion parameters). |
| **Groq LPU** | Language Processing Unit - Groq's custom ASIC hardware designed specifically for LLM inference. Achieves >500 tokens/second output speed, enabling real-time streaming. |
| **Prompt Engineering** | Technique of crafting input prompts to guide LLM behavior. Mind Mentor uses system prompts with user context injection, structured output instructions, and role-based framing. |
| **Streaming Inference** | LLM output delivered token-by-token as generated rather than waiting for complete response. Reduces perceived latency from seconds to milliseconds for first token. |
| **Temperature** | LLM sampling parameter (0.0-2.0) controlling response randomness. Higher = more creative/varied. Mind Mentor uses 0.7 for tutoring (balanced) and 0.3 for structured output (more deterministic). |
| **Vector Embedding** | Dense numerical representation (array of floats) of text in high-dimensional space where semantically similar texts have nearby vectors. MiniLM-L6-v2 produces 384-dimensional embeddings. |
| **Sentence Transformer** | Neural network architecture (based on BERT/MiniLM) fine-tuned to produce meaningful sentence-level embeddings. `all-MiniLM-L6-v2` is a popular 22M-parameter model. |
| **Vector Similarity Search** | Finding the most similar vectors to a query vector using distance metrics (cosine similarity). Used in RAG to find document chunks most relevant to a user's question. |
| **Cosine Similarity** | Metric measuring the cosine of the angle between two vectors. Range: -1 (opposite) to 1 (identical). Used to rank document chunks by relevance to a query. |
| **Text Chunking** | Splitting long documents into smaller overlapping segments for embedding. `RecursiveCharacterTextSplitter` uses multiple separators (paragraphs, sentences, words) for natural boundaries. |
| **Context Window** | Maximum number of tokens an LLM can process in a single request. RAG works around context limits by retrieving only the most relevant chunks rather than the entire document. |
| **mem0** | Managed memory layer for AI applications. Stores, indexes, and retrieves user-specific memories using semantic search. Provides persistent context across sessions without re-processing conversation history. |

### 18.4 Frontend Terms

| Term | Definition |
|------|-----------|
| **Zustand** | Minimalist state management library for React. Uses hooks-based API with no boilerplate. Supports middleware (persist, devtools). Mind Mentor uses it for Pomodoro timer state with localStorage persistence. |
| **Shadcn/UI** | Component collection built on Radix UI primitives. Not a package — components are copied into the project and customized. Provides accessible, unstyled primitives styled with Tailwind. |
| **Radix UI** | Headless component library providing accessible, unstyled UI primitives (Dialog, Accordion, Tabs, etc.). Handles ARIA attributes, keyboard navigation, and focus management. |
| **Force-Directed Graph** | Graph visualization algorithm where nodes repel each other and edges act as springs, finding a balanced layout through physics simulation. Used for Knowledge Graph visualization. |
| **CSS Custom Properties** | CSS variables (e.g., `--primary`) used for theming. Shadcn/UI defines design tokens as HSL values, enabling theme switching by changing variable values. |
| **Contribution Calendar** | GitHub-style heatmap showing activity frequency by date. Each cell's color intensity represents study session count for that day. |

### 18.5 Security Terms

| Term | Definition |
|------|-----------|
| **JWT (JSON Web Token)** | Compact, URL-safe token format for securely transmitting claims between parties. Structure: `header.payload.signature`. Mind Mentor uses HMAC-SHA256 signed JWTs for user authentication. |
| **bcrypt** | Password hashing algorithm with built-in salt and configurable work factor. Mind Mentor uses 10 salt rounds, making brute-force attacks computationally expensive. |
| **CORS (Cross-Origin Resource Sharing)** | HTTP mechanism allowing servers to specify which origins can access their resources. Prevents unauthorized cross-site requests. Mind Mentor whitelists specific deployment domains. |
| **Rate Limiting** | Controlling request frequency per client (IP-based) to prevent abuse. Mind Mentor uses sliding window: 100 requests per 15 minutes globally, 100 per hour for AI endpoints. |
| **Shared Secret Authentication** | Service-to-service auth using a pre-shared key in request headers (`X-Agent-Secret`). Simpler than mTLS, appropriate for trusted internal services. |

### 18.6 DevOps Terms

| Term | Definition |
|------|-----------|
| **Multi-Stage Docker Build** | Dockerfile pattern using multiple `FROM` stages to separate build-time dependencies from runtime. Produces smaller images by discarding build tools in the final stage. |
| **Health Check** | Endpoint (`/health`) returning service status. Used by Docker, load balancers, and orchestrators to detect and restart unhealthy containers. |
| **Docker Compose** | Tool for defining multi-container Docker applications. Mind Mentor's `docker-compose.yml` orchestrates frontend + backend with shared network, volumes, and health-dependent startup ordering. |
| **Wrangler** | Cloudflare's CLI tool for developing and deploying Workers. Handles local dev, secret management, and deployment to the edge network. |

---

## Appendix A: Project Statistics

| Metric | Count |
|--------|-------|
| Frontend Pages | 14 |
| React Components | 40+ |
| Next.js API Routes | 11 |
| Express Routes | 8 route files, 20+ endpoints |
| Agent Endpoints | 5 |
| MongoDB Models | 8 |
| Email Templates | 5 |
| Unit Tests | 3 test files (SM-2, Knowledge Graph, Patterns) |
| External APIs | 5 (Groq, mem0, Resend, Tavily, PostHog) |

## Appendix B: File Structure Summary

```
mind-mentor/
├── src/                          # Next.js frontend (TypeScript)
│   ├── app/                      # App Router pages + API routes
│   ├── components/               # React components
│   ├── lib/                      # Utilities (auth, mongodb, api clients)
│   ├── models/                   # Mongoose models (frontend-side)
│   ├── store/                    # Zustand stores
│   ├── types/                    # TypeScript type definitions
│   ├── hooks/                    # Custom React hooks
│   ├── providers/                # Context providers
│   └── middleware.ts             # Route protection
├── server/                       # Express.js backend (JavaScript ESM)
│   ├── routes/                   # API route handlers
│   ├── services/                 # Business logic (AI, PDF, DB, embeddings)
│   ├── models/                   # Mongoose models (backend-side)
│   ├── middleware/               # Agent auth middleware
│   └── scripts/                  # Seed scripts
├── mind-mentor-agents/           # Cloudflare Workers (TypeScript)
│   ├── src/agents/               # Tutor, Analyst, Scheduler agents
│   ├── src/intelligence/         # SM-2, Knowledge Graph, Patterns
│   ├── src/memory/               # mem0 client
│   ├── src/email/                # Resend client + HTML templates
│   ├── src/api/                  # Express backend client
│   ├── src/middleware/           # JWT auth middleware
│   ├── src/types/                # Type definitions
│   └── tests/                    # Vitest unit tests
├── docker-compose.yml            # Multi-service orchestration
├── Dockerfile                    # Frontend container
├── render.yaml                   # Render deployment config
└── docs/                         # Design specs + implementation plans
```
