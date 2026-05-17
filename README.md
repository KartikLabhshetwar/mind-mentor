# Mind Mentor

AI-powered study assistant with multi-agent architecture. Combines personalized tutoring, spaced repetition, PDF analysis, and learning analytics into one platform.

## Demo

https://github.com/user-attachments/assets/1ea26947-1dca-408d-9741-b24c3429944a

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                        │
│              (App Router, TypeScript, Tailwind, Shadcn)         │
│                                                                 │
│  Dashboard  │  PDF Chat  │  Insights  │  Timer  │  Study Plan   │
└──────┬──────────────┬──────────────┬────────────────────────────┘
       │              │              │
       │  NextAuth JWT│              │  User JWT
       ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Cloudflare Workers (Hono)                       │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │   Tutor     │  │  Analyst    │  │  Scheduler   │            │
│  │  Chat + SSE │  │  Insights   │  │  Email Cron  │            │
│  │  Mem0 memory│  │  SM-2 algo  │  │  Resend API  │            │
│  │  Groq LLM   │  │  Knowledge  │  │  Hourly runs │            │
│  │             │  │  Graph      │  │              │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘            │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │  Agent Secret  │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Backend (:8000)                       │
│                                                                 │
│  Routes: /pdf, /generate-plan, /curate-resources, /api/quiz,    │
│          /api/topics/mastery, /api/reminders, /api/analytics     │
│                                                                 │
│  Services: PDF RAG (LangChain), Groq LLM, Tavily Search,       │
│            HuggingFace Embeddings                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐       ┌──────────┐
                    │   MongoDB    │       │   Mem0   │
                    │  (Mongoose)  │       │ (Memory) │
                    └──────────────┘       └──────────┘
```

### Three-Agent System

| Agent | Purpose | Model |
|-------|---------|-------|
| **Tutor** | Conversational AI tutor with persistent memory. Streams responses via SSE, handles `/resources` commands, extracts topics after each exchange | `qwen/qwen3-32b` (Groq) |
| **Analyst** | Learning analytics engine. Runs SM-2 spaced repetition, builds knowledge graphs, detects study patterns, generates recommendations | `qwen/qwen3-32b` (Groq) |
| **Scheduler** | Email reminder system. Hourly cron sends daily reminders, streak warnings, spaced repetition alerts, weekly digests, milestone emails | Resend API |

### Auth Flow

```
Frontend → Agents:    Authorization: Bearer <NextAuth JWT>
Agents → Express:     X-Agent-Secret: <shared secret>
Frontend → Express:   Authorization: Bearer <NextAuth JWT>  (user-facing routes)
```

## Features

- **AI Tutor** — Chat with persistent memory (Mem0), slash commands, quiz generation
- **PDF Chat (Scriba)** — Upload PDFs, ask questions with RAG-powered answers and source citations
- **Learning Insights** — Mastery radar, study heatmap, velocity charts, weak spot detection, knowledge graph
- **Study Plans** — AI-generated exam-targeted plans with weekly milestones
- **Resource Curation** — Tavily-powered search filtered to educational content
- **Spaced Repetition** — SM-2 algorithm tracks topic mastery and schedules reviews
- **Pomodoro Timer** — Study timer with session tracking and streak stats
- **Email Reminders** — Configurable daily/weekly reminders via Resend
- **Notes** — Create and organize study notes

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Shadcn UI, Zustand |
| Auth | NextAuth.js (credentials + JWT) |
| Agents | Cloudflare Workers, Hono, Wrangler |
| Backend | Node.js, Express, LangChain |
| Database | MongoDB (Mongoose) |
| AI/LLM | Groq (Llama 3.3, Qwen 3), HuggingFace Embeddings |
| Memory | Mem0 (persistent user context) |
| Search | Tavily API |
| Email | Resend |
| Analytics | PostHog |

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- API keys: Groq, Tavily, HuggingFace, Mem0, Resend (optional)

### 1. Clone and install

```bash
git clone https://github.com/KartikLabhshetwar/mind-mentor
cd mind-mentor
make install    # installs deps for all packages
```

### 2. Environment variables

Create `.env` in root:

```env
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=your-mongodb-uri

GROQ_API_KEY=your-groq-key
GROQ_API_KEY_RAG=your-groq-rag-key
TAVILY_API_KEY=your-tavily-key
HUGGINGFACE_API_KEY=your-hf-key

AGENT_SERVICE_SECRET=dev-agent-secret-local
RESEND_API_KEY=your-resend-key

NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Create `mind-mentor-agents/.dev.vars`:

```env
GROQ_API_KEY=your-groq-key
MEM0_API_KEY=your-mem0-key
RESEND_API_KEY=your-resend-key
AGENT_SERVICE_SECRET=dev-agent-secret-local
NEXTAUTH_SECRET=your-secret
EXPRESS_BACKEND_URL=http://localhost:8000
```

### 3. Run locally

```bash
make dev
```

This starts three services:
- **Next.js** → http://localhost:3000
- **Express** → http://localhost:8000
- **Agents (Wrangler)** → http://localhost:8787

### Docker

```bash
docker compose up -d
```

Runs frontend (:3000) and backend (:8000). Agents run separately via Wrangler.

## Project Structure

```
mind-mentor/
├── src/                          # Next.js frontend
│   ├── app/(dashboard)/          # Authenticated pages
│   ├── app/api/                  # Next.js API routes
│   ├── components/               # React components
│   ├── lib/                      # Utilities, auth, agent client
│   └── store/                    # Zustand stores
├── server/                       # Express backend
│   ├── routes/                   # API routes
│   ├── models/                   # Mongoose schemas
│   ├── services/                 # AI, PDF, storage services
│   └── middleware/               # Auth middleware
├── mind-mentor-agents/           # Cloudflare Workers
│   ├── src/agents/               # Tutor, Analyst, Scheduler
│   ├── src/intelligence/         # SM-2, patterns, knowledge graph
│   ├── src/email/                # Resend client + templates
│   └── src/memory/               # Mem0 integration
└── docker-compose.yml
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Commit changes
4. Open a Pull Request

## License

Apache 2.0 — see [LICENSE](LICENSE)

---

Built by [Kartik Labhshetwar](https://github.com/KartikLabhshetwar)
