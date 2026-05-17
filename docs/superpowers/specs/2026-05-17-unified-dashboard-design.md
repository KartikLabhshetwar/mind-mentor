# Unified Dashboard Design — Mind Mentor

## Overview

Replace segregated multi-tab dashboard with single ChatGPT-inspired unified interface. All study tools (resources, planning, PDF chat, quiz, insights) accessible from one conversation. Dark mode. Target: university/engineering students preparing for exams.

## Layout

**Three-panel layout (Layout B):**

```
┌──────────┬────────────────────────────────┬─────────────┐
│  Sidebar │         Main Chat              │   Context   │
│  (thin)  │                                │   Panel     │
│          │  [messages stream here]        │             │
│  History │                                │  Score      │
│  list    │                                │  Weak Topics│
│          │                                │  Plan       │
│  New Chat│                                │  Resources  │
│          │                                │  Memory     │
│  Avatar  │  [/ command palette]           │  Streak     │
│  Settings│  [input bar]                   │             │
└──────────┴────────────────────────────────┴─────────────┘
```

- Left sidebar: ~240px, collapsible to 64px icons. Chat history grouped by date, new chat button, user avatar, settings link.
- Main chat: flex-1, centered content max-width 768px. Full streaming conversation.
- Right context panel: ~300px, collapsible. Accordion sections.

## Color Scheme (Dark Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#1a1a1a` | Main background |
| `--bg-secondary` | `#202123` | Chat message area |
| `--bg-sidebar` | `#171717` | Left sidebar |
| `--bg-surface` | `#2d2d30` | Cards, panels, inputs |
| `--bg-surface-hover` | `#3d3d40` | Hover states |
| `--accent` | `#10a37f` | Primary accent (green) |
| `--accent-muted` | `#10a37f33` | Accent backgrounds |
| `--text-primary` | `#ececec` | Primary text |
| `--text-secondary` | `#9a9a9a` | Secondary text |
| `--text-muted` | `#666666` | Muted text |
| `--border` | `#333333` | Borders |
| `--input-bg` | `#40414f` | Input fields |
| `--error` | `#ef4444` | Error states |
| `--warning` | `#f59e0b` | Warning/weak topics |

## Components

### 1. UnifiedChat (main page)

Location: `src/app/(dashboard)/dashboard/page.tsx`

Orchestrates the three panels. Manages:
- Active conversation state
- Context panel visibility
- Sidebar collapse state
- Responsive breakpoints (mobile: no sidebar, panel as bottom sheet)

### 2. ChatHistory (left sidebar)

Location: `src/components/unified/ChatHistory.tsx`

- List of past conversations (title, date, preview)
- New chat button at top
- Search conversations
- User avatar + settings at bottom
- Fetches from existing `chatHistory` server route

### 3. ChatArea (center)

Location: `src/components/unified/ChatArea.tsx`

- Message list with streaming support
- User messages right-aligned (dark surface)
- AI messages left-aligned with avatar
- Renders markdown via ReactMarkdown (existing)
- Inline quiz cards when AI generates quiz
- Resource cards when AI finds resources
- Study plan display when AI generates plan
- PDF upload/chat inline

Reuses existing `streamChat` from `agent-client.ts`.

### 4. CommandPalette

Location: `src/components/unified/CommandPalette.tsx`

Triggered when user types `/` in input. Floating popup above input.

Commands:
| Command | Description | Backend Action |
|---------|-------------|----------------|
| `/quiz [topic]` | Generate quiz | Calls agent with quiz intent |
| `/resources [subject]` | Find resources | Calls existing resource curation |
| `/plan [subject]` | Create/view study plan | Calls existing plan generation |
| `/pdf` | Upload or chat with PDF | Opens file picker or PDF chat mode |
| `/review [topic]` | Spaced repetition review | Fetches weak topics, generates questions |
| `/explain [concept]` | Explain concept simply | Calls agent with explain intent |
| `/score` | Show my scores | Fetches and displays performance |

Keyboard navigation: arrow keys to select, enter to confirm, escape to dismiss. Filters as user types after `/`.

### 5. ContextPanel (right)

Location: `src/components/unified/ContextPanel.tsx`

Collapsible accordion sections:

**Performance Score:**
- Overall mastery percentage (circular progress)
- Per-topic progress bars
- Trend indicator (up/down arrow + percentage change)
- Data from `topicMastery` + new `quizResults`

**Weak Topics:**
- Topics below 60% mastery
- Days since last review
- "Review Now" button triggers `/review` command
- Sorted by urgency (lowest score + longest gap)

**Active Study Plan:**
- Current plan name and progress bar
- Today's checklist items (checkbox style)
- Next deadline with countdown
- From existing `generatePlan` route

**Pinned Resources:**
- Last 5 curated resources (title + link)
- Uploaded PDFs
- Click opens in chat context

**AI Memory (mem0):**
- Key facts AI remembers (learning style, struggles, preferences)
- Edit/delete individual memories
- "What do you know about me?" shortcut

**Study Streak:**
- Current streak count (flame icon)
- Contribution calendar (existing component)
- Today's stats: questions answered, time studied

### 6. QuizCard (inline component)

Location: `src/components/unified/QuizCard.tsx`

Renders within chat messages when AI generates a quiz:
- Question text
- 4 MCQ options as clickable buttons
- On select: shows correct/incorrect, explanation
- After all questions: score summary card
- "Save Results" persists to `quizResults`

### 7. ChatInput

Location: `src/components/unified/ChatInput.tsx`

- Multi-line textarea (auto-expand)
- Send button (green accent)
- Attach file button (PDF upload)
- `/` triggers CommandPalette
- Keyboard: Enter to send, Shift+Enter for newline
- Disabled state during streaming

## New Data Models

### quizResults (MongoDB)

```javascript
{
  userId: ObjectId,
  topic: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    userAnswer: Number,
    isCorrect: Boolean
  }],
  score: Number,        // percentage 0-100
  totalQuestions: Number,
  correctCount: Number,
  createdAt: Date,
  difficulty: String    // 'easy' | 'medium' | 'hard'
}
```

### Extended topicMastery

Add fields to existing model. New fields default to `null`/`0` for backward compatibility with existing documents (no migration needed — MongoDB is schemaless, code handles missing fields with defaults):

```javascript
{
  // existing fields...
  quizCount: { type: Number, default: 0 },
  lastQuizDate: { type: Date, default: null },
  averageScore: { type: Number, default: null },
  nextReviewDate: { type: Date, default: null },
  reviewInterval: { type: Number, default: 1 } // days until next review, starts at 1
}
```

Access pattern: `topic.averageScore ?? 0` — always handle null for documents created before this feature.

## New Server Routes

All new routes registered in `server/index.js` with auth middleware. Pattern follows existing: `app.use('/api/quiz', authMiddleware, quizRouter)`.

### Auth Middleware

New routes require authentication. Use existing JWT verification pattern from `server/middleware/auth.js`.

### POST /api/quiz/generate

Request: `{ userId, topic, difficulty, questionCount }`
Response: `{ questions: [...], quizId }`
Auth: Required (Bearer token)

Generates quiz questions using AI. Stores empty result for tracking.

### POST /api/quiz/submit

Request: `{ quizId, answers: [{ questionIndex, answer }] }`
Response: `{ score, correctCount, results: [...], topicUpdate }`
Auth: Required

Scores quiz, updates `quizResults` and `topicMastery`.

### GET /api/quiz/history

Request: `?userId=X&topic=Y`
Response: `{ quizzes: [...], stats: { average, trend, totalTaken } }`
Auth: Required

### GET /api/performance/summary

Request: `?userId=X`
Response: `{ overallScore, topics: [...], weakTopics: [...], streak, nextReviews: [...] }`
Auth: Required

Aggregates data for context panel.

### Route Registration (server/index.js)

Server uses ESM (`import` syntax). Add alongside existing route imports:

```javascript
import quizRouter from './routes/quiz.js';
import performanceRouter from './routes/performance.js';
import { authMiddleware } from './middleware/auth.js';

// Protected routes
app.use('/api/quiz', authMiddleware, quizRouter);
app.use('/api/performance', authMiddleware, performanceRouter);
```

### Abandoned Quiz Handling

Quizzes created by `/api/quiz/generate` but never submitted are cleaned up:
- TTL index on `quizResults` where `completedAt` is null: expire after 24 hours
- Or: generate endpoint returns questions without persisting; only `/submit` creates the record

## Routing Changes

| Old Route | New Behavior |
|-----------|-------------|
| `/home` | Keep as landing/welcome page |
| `/chat` | Redirect to `/dashboard` |
| `/resources` | Redirect to `/dashboard` |
| `/study-plan` | Redirect to `/dashboard` |
| `/pdf` | Redirect to `/dashboard` |
| `/insights` | Redirect to `/dashboard` |
| `/dashboard` | **New unified interface** |
| `/profile` | Keep |
| `/settings/*` | Keep |
| `/timer` | Keep (standalone utility) |
| `/notes` | Keep (standalone utility) |

## Mobile Responsive

- Below 768px: sidebar hidden (hamburger toggle), context panel as slide-over drawer (uses Radix Dialog with `side="right"` via existing `@radix-ui/react-dialog` dependency)
- Below 1024px: context panel collapsed by default, toggle button visible
- Chat area always full-width on mobile

Implementation: Use Radix Dialog (already installed) styled as a right-side drawer. No new dependencies needed.

## Dark Mode Integration

CSS variables defined in `src/app/globals.css` under `.dark` class (or `:root` since this is dark-only for the dashboard). The dashboard route forces dark mode via `next-themes`:

```tsx
// In dashboard layout
<div className="dark" data-theme="dark">
  {/* dashboard content */}
</div>
```

This scopes dark mode to dashboard without affecting marketing pages.

## Agent Integration

### streamChat Refactor

Replace the existing `streamChat` function signature. Current signature:

```typescript
// OLD
streamChat(message, token, context: { page?: string; subject?: string }, onChunk, onDone, onError)
```

New signature with structured event handling:

```typescript
interface ChatContext {
  page?: string;
  subject?: string;
  command?: string;   // explicit slash command (e.g., "quiz", "resources")
  topic?: string;     // current conversation topic
  pdfId?: string;     // active PDF document ID for /pdf mode
}

interface ChatEvent {
  type: 'text' | 'quiz' | 'resources' | 'plan';
  data: string;       // text chunk for 'text', JSON string for structured types
}

export async function streamChat(
  message: string,
  token: string,
  context: ChatContext,
  onEvent: (event: ChatEvent) => void,  // REPLACES onChunk
  onDone: () => void,
  onError: (error: string) => void
)
```

The `onEvent` callback receives discriminated events. Consumer pattern:

```typescript
const handleEvent = (event: ChatEvent) => {
  switch (event.type) {
    case 'text':
      appendToCurrentMessage(event.data);
      break;
    case 'quiz':
      const quiz = JSON.parse(event.data);
      appendQuizCard(quiz);
      break;
    case 'resources':
      const resources = JSON.parse(event.data);
      appendResourceCards(resources);
      break;
    case 'plan':
      const plan = JSON.parse(event.data);
      appendPlanDisplay(plan);
      break;
  }
};
```

Parser update inside `streamChat`: map SSE `event` field to `ChatEvent.type`. Default (no event field or `event: text`) maps to `type: 'text'`.

Agent already handles intent detection. Slash commands add explicit `command` field so agent knows to use specific tool without guessing.

### Structured Message Protocol (Quiz/Resource Rendering)

The agent backend streams SSE events. Extend the event types to support structured content:

```
event: text
data: Regular markdown text chunk

event: quiz
data: {"type":"quiz","id":"q123","questions":[{"question":"...","options":["A","B","C","D"],"correct":2}]}

event: resources
data: {"type":"resources","items":[{"title":"...","url":"...","description":"..."}]}

event: plan
data: {"type":"plan","name":"...","weeks":[...]}

event: done
data: 
```

Frontend parser logic in ChatArea:
1. Accumulate `text` events as markdown (existing behavior)
2. On `quiz` event: render `QuizCard` component inline after current text
3. On `resources` event: render resource cards inline
4. On `plan` event: render plan display inline

If agent backend cannot be modified to emit structured events, fallback: parse markdown for known patterns (e.g., `<!-- quiz:json {...} -->` embedded in response) and extract structured data client-side.

### PDF Chat Mode

When user triggers `/pdf`:
1. If no PDF uploaded: show file picker, upload via existing `/api/pdf/upload`
2. After upload (or if PDF already active): set `pdfId` in context
3. All subsequent messages include `pdfId` in context → agent uses PDF content for answers
4. User can exit PDF mode by starting new chat or typing `/pdf clear`

State tracked in component: `activePdfId: string | null`

## Migration Path

1. Build new `/dashboard` page alongside existing pages
2. Keep old pages functional during development
3. Once unified interface works, add redirects from old routes
4. Remove old page components in cleanup phase

## Out of Scope

- Real-time collaboration / multiplayer
- Video/audio integration
- Payment/billing
- Mobile native app
- Offline mode
