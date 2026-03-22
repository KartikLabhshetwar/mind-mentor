# Mind-Mentor Chat UI Redesign — Design Spec

**Date:** 2026-03-22
**Status:** Approved

## Overview

Transform mind-mentor from a multi-page dashboard app with a separate Express backend into a single-page learning agent with a ChatGPT/Claude-style conversational UI. The Express backend is removed entirely; AI processing moves to Vercel AI SDK (latest stable, v4.x) server actions and route handlers. All existing features (PDF RAG, study plans, resource curation, timer, stats) are preserved but surfaced through the chat interface and slide-over panels.

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

Dropdown in sidebar header. Options: Groq (Llama 3.3, default), Claude (Sonnet), GPT-4o. Persisted per conversation. If a selected provider has no API key configured, show a toast error and fall back to Groq (default).

## 2. AI Architecture

### Vercel AI SDK (v4.x stable)

- `useChat` from `ai/react` for client-side chat state and streaming
- `streamText` from `ai` in API route handlers (`/api/chat`) for server-side streaming
- Tools defined via `tool()` helper — return structured data (JSON), client renders appropriate React components based on tool call name
- Multi-provider via AI SDK provider registry:
  - `groq('llama-3.3-70b-versatile')` — default, free
  - `anthropic('claude-sonnet-4-20250514')` — premium
  - `openai('gpt-4o')` — premium

### Tool System

AI SDK tools return structured JSON data. The client maps tool names to rich React components:

| Tool | Trigger | Returns (JSON) | Client Renders |
|------|---------|----------------|----------------|
| `generateStudyPlan` | "make me a study plan for X" | `{ overview, weeklyPlans[], recommendations }` | Interactive study plan card with weekly breakdown |
| `searchResources` | "find resources on X" | `{ resources[]{title, link, type, description} }` | Resource cards with links, type badges |
| `analyzePDF` | User uploads PDF + asks question | `{ answer, sources[]{page, excerpt} }` | Answer with expandable source citations |
| `summarizePDF` | "summarize this PDF" | `{ summary, keyPoints[] }` | Structured summary card |
| `getStudyStats` | "show my stats" | `{ streak, totalHours, dailySessions }` | Inline contribution calendar + streak info |
| `startTimer` | "start a 25min focus session" | `{ duration, type }` | Triggers floating pomodoro widget |
| `saveItem` | "save this plan" | `{ saved: true, itemId }` | Toast confirmation |

### Web Search (Resource Curation)

- Tavily API (`TAVILY_API_KEY` env var required) called from server-side tool handler
- Searches educational platforms (Coursera, Khan Academy, freeCodeCamp, etc.)
- LLM curates and structures the search results

### Embeddings (PDF RAG)

- Primary: Hugging Face Inference API (free tier) using `@huggingface/inference` package
  - Model: `sentence-transformers/all-MiniLM-L6-v2`
  - Requires `HF_TOKEN` environment variable
  - Free tier rate limit: ~1000 requests/hour (sufficient for PDF chunking)
  - Note: adds network latency vs previous local approach
- Vector storage: in-memory per conversation session, chunks persisted in MongoDB for reload
- PDF text extraction via `pdf-parse` (kept from current dependencies)

### Conversation Storage

Each conversation saved to MongoDB with this schema:

```typescript
{
  userId: ObjectId,           // ref to User
  title: string,              // auto-generated from first message
  model: string,              // provider model ID used
  messages: [{
    id: string,               // unique message ID
    role: 'user' | 'assistant',
    content: string,          // text content
    toolCalls: [{             // optional, for assistant messages
      toolName: string,
      args: object,
      result: object          // serialized JSON tool result
    }],
    attachments: [{           // optional, for user messages
      type: 'pdf',
      documentId: ObjectId    // ref to PdfDocument
    }],
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Rate Limiting

- Use `upstash/ratelimit` or `next-rate-limit` middleware on `/api/chat` route
- Global: 100 requests per 15 minutes per user
- AI-specific: 30 requests per hour per user for premium models (Claude/GPT-4o)
- Groq: 100 requests per hour per user (matches Groq free tier limits)

### System Prompts

Port existing system prompts from `server/services/aiService.js` and `server/services/pdfService.js` into the chat route handler. The main system prompt establishes the AI as a learning assistant with access to tools. Individual tool descriptions guide tool selection.

### Streaming Behavior

- Text responses stream token-by-token via `streamText`
- When a tool is called, show a loading skeleton component while the tool executes
- Once tool result arrives, replace skeleton with the rendered component
- Multiple tools can be called in sequence within a single response

## 3. Chat UI Components

### Custom Chat Components (built with shadcn + Radix primitives)

The chat UI is built from custom components using shadcn and Radix UI (no external "AI Elements" package):

- **ChatThread** — scrollable message container with auto-scroll, loading states
- **ChatMessage** — message bubble with avatar, timestamp, copy button, markdown rendering
- **ChatComposer** — input bar with file upload button, textarea (auto-resize), send button
- **ToolResultRenderer** — maps tool call names to appropriate card components

### Theming (existing design system)

- User message bubbles: `#27445D` (navy) background, white text
- AI message bubbles: `#FBFAF8` (cream) background, dark text
- Input bar: cream background with `#71BBB2` (aqua) focus ring
- Sidebar: `#27445D` (navy) background, `#A3D3CD` (light aqua) text
- Accent buttons/links: `#497D74` (teal)
- Fonts: Lexend (headings), Inter (body)
- Migrate existing Radix UI components to shadcn equivalents for consistency

### Rich Tool Response Components

- **StudyPlanCard** — collapsible weekly view, progress bar, "Save" button
- **ResourceGrid** — cards with favicon, title, type badge, link, benefit tag
- **PDFChatResponse** — answer text + expandable source citations with page numbers
- **StatsWidget** — mini contribution calendar + streak counter + hours this week
- **TimerWidget** — floating pill in bottom-right, countdown, pause/resume

### Attachment Handling

- PDF upload via paperclip icon in composer
- Drag-and-drop onto chat area
- PDF thumbnail preview in the message before processing
- File stored in MongoDB (base64) — max 10MB file size enforced client-side and server-side
- Note: MongoDB 16MB document limit. PDFs stored in separate `PdfDocument` collection, referenced by ID

### Keyboard Shortcuts

- Enter to send, Shift+Enter for newline
- Escape to close slide-over panels
- Cmd/Ctrl+K for new chat

## 4. Data & State Management

### MongoDB Collections

| Collection | Purpose | Change |
|---|---|---|
| `users` | Auth + preferences | Add `preferredModel` field |
| `conversations` | Chat history | **New** — schema defined in Section 2 |
| `pdfdocuments` | Uploaded PDFs + chunks | **New frontend model** — port from `server/models/pdfDocument.js` to `src/models/PdfDocument.ts`. Add `conversationId` link |
| `studyplans` | Saved study plans | Add `conversationId` for traceability |
| `curatedresources` | Saved resource collections | Keep as-is |
| `studystats` | Streaks, calendar, hours | Change tracking to hybrid (auto + manual) |
| `notes` | — | **Dropped** — existing note data will be orphaned (acceptable, no migration) |

### State Management

- **Zustand** — client state: timer, sidebar open/close, active conversation ID, model selection
- **Server components** — conversations fetched server-side, no client caching
- **AI SDK** — `useChat` manages message streaming internally
- **NextAuth** — session management, unchanged

### Hybrid Study Tracking

- Auto: log a study session when user has a sustained conversation (5+ messages within a 30-minute window)
- Manual: timer widget logs explicit focus sessions
- Both feed into contribution calendar and streak calculation

### Environment Variables

```
# Existing
MONGODB_URI=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
GROQ_API_KEY=...
TAVILY_API_KEY=...

# New
HF_TOKEN=...                    # Hugging Face Inference API (free)
OPENAI_API_KEY=...              # Optional, for GPT-4o
ANTHROPIC_API_KEY=...           # Optional, for Claude
```

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
- `docker-compose.yml`, `render.yaml`, `server/Dockerfile` — deployment configs for Express
- Backend dependencies: express, cors, multer, rate-limit, node-cache, langchain, @xenova/transformers
- All protected route pages: home, notes, pdf, study-plan, resources, timer, profile
- `/src/lib/api-client.ts`
- API routes that forwarded to Express

### Added

- `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/groq` — Vercel AI SDK + providers
- `@huggingface/inference` — embedding provider
- shadcn sidebar + sheet components (+ migrate existing Radix usage to shadcn)
- `/src/app/chat/` — new chat route with layout
- `/src/app/api/chat/route.ts` — streaming chat API route
- `/src/models/Conversation.ts` — new Mongoose model
- `/src/models/PdfDocument.ts` — ported from server
- `/src/components/chat/` — chat UI components
- `/src/components/sidebar/` — sidebar with conversation history
- `/src/components/panels/` — library and stats slide-over panels
- `/src/components/widgets/` — floating timer widget

### Preserved

- NextAuth setup (migrate to Better Auth later, separate task)
- MongoDB connection + Mongoose models (User, StudyStats, StudyPlan, CuratedResource)
- Zustand store (adapted)
- Design system (globals.css, colors, fonts)
- PostHog analytics
- `next-intl` (i18n support preserved, not actively extended)
