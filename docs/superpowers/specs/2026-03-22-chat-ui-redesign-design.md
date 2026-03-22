# Mind-Mentor Chat UI Redesign — Design Spec

**Date:** 2026-03-22
**Status:** Approved

## Overview

Transform mind-mentor from a multi-page dashboard app with a separate Express backend into a single-page learning agent with a ChatGPT/Claude-style conversational UI. The Express backend is removed entirely; AI processing moves to Vercel AI SDK v6 server actions. All existing features (PDF RAG, study plans, resource curation, timer, stats) are preserved but surfaced through the chat interface and slide-over panels.

## 1. Layout & Navigation

### Structure

Classic ChatGPT/Claude layout with 3 zones:

- **Left Sidebar** (shadcn `Sidebar` component, collapsible):
  - Top: "New Chat" button + model selector dropdown (Groq/Claude/GPT-4o)
  - Middle: Conversation history grouped by date (Today, Yesterday, Previous 7 days, etc.)
  - Bottom section: Quick nav links — "My Library", "Stats", "Timer"
  - Footer: User avatar + name, settings gear icon
  - Collapsible on mobile via hamburger icon

- **Main Chat Area** (center):
  - Scrollable message thread
  - Bottom-pinned input bar with file attachment (PDF), text input, send button

- **Slide-over Panels** (from right, shadcn `Sheet`):
  - "My Library" — saved study plans, PDFs, curated resources in tabs
  - "Stats" — contribution calendar, streaks, study hours
  - "Timer" — floating pomodoro widget (bottom-right corner)

### Model Selector

Dropdown in sidebar header. Options: Groq (Llama 3.3, default), Claude (Sonnet), GPT-4o. Persisted per conversation.

## 2. AI Architecture

### Vercel AI SDK v6

- `streamUI` / `useChat` from `ai/rsc` for server-side streaming with React component responses
- Server actions in `app/actions.ts` — no API routes needed for AI
- Multi-provider via AI SDK provider registry:
  - `groq('llama-3.3-70b-versatile')` — default, free
  - `anthropic('claude-sonnet-4-20250514')` — premium
  - `openai('gpt-4o')` — premium

### Tool System

AI SDK tools that return rich React components inline:

| Tool | Trigger | Renders |
|------|---------|---------|
| `generateStudyPlan` | "make me a study plan for X" | Interactive study plan card with weekly breakdown |
| `searchResources` | "find resources on X" | Resource cards with links, type badges, descriptions |
| `analyzePDF` | User uploads PDF + asks question | Answer with source citations, page references |
| `summarizePDF` | "summarize this PDF" | Structured summary with key points |
| `getStudyStats` | "show my stats" | Inline contribution calendar + streak info |
| `startTimer` | "start a 25min focus session" | Triggers floating pomodoro widget |
| `saveItem` | "save this plan" | Saves to MongoDB, confirms with toast |

### Embeddings (PDF RAG)

- Primary: Hugging Face Inference API (free) — `sentence-transformers/all-MiniLM-L6-v2`
- Wrapped via AI SDK embedding provider
- Vector storage: in-memory per conversation, chunks persisted in MongoDB

### Conversation Storage

- Each conversation saved to MongoDB: `{ userId, title, messages[], model, createdAt }`
- Auto-generated title from first user message via LLM
- Messages store both text and serialized tool results

## 3. Chat UI with AI Elements

### AI Elements Components

- `<Thread />` — message thread container, handles scrolling, loading states
- `<Message />` — message bubble with avatar, timestamp, copy button
- `<Composer />` — input bar with file attachments, submit button
- `<MarkdownContent />` — renders markdown with syntax highlighting

### Theming (existing design system)

- User message bubbles: `#27445D` (navy) background, white text
- AI message bubbles: `#FBFAF8` (cream) background, dark text
- Input bar: cream background with `#71BBB2` (aqua) focus ring
- Sidebar: `#27445D` (navy) background, `#A3D3CD` (light aqua) text
- Accent buttons/links: `#497D74` (teal)
- Fonts: Lexend (headings), Inter (body)

### Rich Tool Response Components

- **StudyPlanCard** — collapsible weekly view, progress bar, "Save" button
- **ResourceGrid** — cards with favicon, title, type badge, link, benefit tag
- **PDFChatResponse** — answer text + expandable source citations with page numbers
- **StatsWidget** — mini contribution calendar + streak counter + hours this week
- **TimerWidget** — floating pill in bottom-right, countdown, pause/resume

### Attachment Handling

- PDF upload via paperclip icon in composer
- Drag-and-drop onto chat area
- PDF thumbnail preview in message before processing
- File stored in MongoDB (base64)

## 4. Data & State Management

### MongoDB Collections

| Collection | Purpose | Change |
|---|---|---|
| `users` | Auth + preferences | Add `preferredModel` field |
| `conversations` | Chat history | **New** — stores full message threads with serialized tool results |
| `pdfdocuments` | Uploaded PDFs + chunks | Add `conversationId` link |
| `studyplans` | Saved study plans | Add `conversationId` for traceability |
| `curatedresources` | Saved resource collections | Keep as-is |
| `studystats` | Streaks, calendar, hours | Change tracking to hybrid (auto + manual) |
| `notes` | — | **Dropped** — replaced by conversations |

### State Management

- **Zustand** — client state: timer, sidebar open/close, active conversation ID, model selection
- **Server components** — conversations fetched server-side, no client caching
- **AI SDK** — `useChat` manages message streaming internally
- **NextAuth** — session management, unchanged

### Hybrid Study Tracking

- Auto: log a study session when user sends 5+ messages in a day
- Manual: timer widget logs explicit focus sessions
- Both feed into contribution calendar and streak calculation

## 5. Page Structure & Routing

```
/                        → Landing/marketing page (keep)
/signin                  → Sign in (keep)
/register                → Sign up (keep)
/chat                    → Main app (default after login)
/chat/[conversationId]   → Specific conversation
```

- Sidebar handles conversation switching (URL updates to `/chat/[id]`)
- Library and Stats are slide-over panels (no URL change)
- Timer is a floating widget (no route)
- Settings via dropdown from user avatar

### Routes Removed

- `/home`, `/notes`, `/pdf`, `/pdf/[documentId]`, `/study-plan`, `/resources`, `/timer`, `/profile`

## 6. Migration & Cleanup

### Removed

- `/server` directory (Express backend, all routes, services, Xenova models)
- Backend dependencies: express, cors, multer, rate-limit, node-cache, langchain, @xenova/transformers, groq-sdk (server-side)
- All protected route pages: home, notes, pdf, study-plan, resources, timer, profile
- `/src/lib/api-client.ts`
- API routes that forwarded to Express

### Added

- `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/groq` — Vercel AI SDK + providers
- AI Elements package for chat UI
- shadcn sidebar + sheet components
- `/src/app/chat/` — new chat route with layout
- `/src/app/actions.ts` — server actions for AI tools
- `/src/components/chat/` — chat UI components
- `/src/components/sidebar/` — sidebar with conversation history
- `/src/components/panels/` — library and stats slide-over panels
- `/src/components/widgets/` — floating timer widget

### Preserved

- NextAuth setup (migrate to Better Auth later, separate task)
- MongoDB connection + Mongoose models (User, StudyStats, StudyPlan, CuratedResource, PdfDocument)
- Zustand store (adapted)
- Design system (globals.css, colors, fonts)
- Radix UI primitives + existing shadcn components
- PostHog analytics
