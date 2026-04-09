# Cloudflare AI Interview Coach

A chat-based interview practice application built entirely on Cloudflare. The frontend is hosted on Cloudflare Pages, the backend API runs on Cloudflare Workers, Workers AI powers interview question generation and answer evaluation, and Durable Objects provide per-session memory and state. The Worker coordinates user intent routing so the app can generate questions, provide hints, evaluate answers, and summarize progress.

## Architecture

```
Browser (Cloudflare Pages)
         │
         ▼
  Cloudflare Worker API
         │
         ▼
    Intent Router
     ┌───┴───┐
     ▼       ▼
Workers AI   Durable Object
(LLM)        (Session Store)
```

**Data flow:** The Pages UI sends a chat message to the Worker API. The Worker loads the session from a Durable Object, classifies the user's intent, builds the appropriate prompt, calls Workers AI, stores the updated conversation, and returns the response.

## Assignment Requirement Mapping

| Requirement             | Implementation                                                                 |
|-------------------------|--------------------------------------------------------------------------------|
| **LLM**                | Workers AI (Meta Llama 3.1 8B Instruct) generates questions, hints, feedback  |
| **Workflow/Coordination**| Worker request routing + intent classification + session orchestration         |
| **User Input**          | Chat UI on Cloudflare Pages (React)                                           |
| **Memory/State**        | Durable Objects store per-session conversation history and interview state     |

## Features

- **Interview modes**: Backend, OOP, SQL/Database, Behavioral, General
- **Intent routing**: The Worker classifies each message into one of six intents: `new_question`, `answer_feedback`, `hint`, `follow_up`, `summary`, `general_help`
- **Session memory**: Durable Objects persist conversation turns, current question, mode, and difficulty across the session
- **Structured feedback**: Answer evaluations include score, strengths, weaknesses, a model answer, and a follow-up question
- **Session summary**: Request a summary of your performance with strengths, weaknesses, and improvement suggestions

## Supported Interactions

| Message                                      | Intent             |
|----------------------------------------------|--------------------|
| "Give me a backend interview question"       | `new_question`     |
| "Here is my answer: ..."                     | `answer_feedback`  |
| "Can you give me a hint?"                    | `hint`             |
| "Make it harder" / "Next question"           | `follow_up`        |
| "Summarize how I did so far"                 | `summary`          |
| General conversation                         | `general_help`     |

## Tech Stack

- **Frontend**: React + TypeScript, built with Vite, deployed to Cloudflare Pages
- **Backend**: Cloudflare Worker (TypeScript)
- **AI**: Workers AI (`@cf/meta/llama-3.1-8b-instruct`)
- **State**: Durable Objects for per-session memory
- **Tooling**: Wrangler CLI

## Project Structure

```
ai-interview-coach/
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main UI: state, API calls, layout
│   │   ├── main.tsx             # React entry point
│   │   ├── app.css              # Global styles
│   │   └── components/
│   │       ├── ChatWindow.tsx   # Chat container
│   │       ├── MessageList.tsx  # Message display + welcome state
│   │       ├── MessageInput.tsx # Input box with auto-resize
│   │       └── ModeSelector.tsx # Interview mode toggle
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── worker/
│   ├── src/
│   │   ├── index.ts             # Worker entry: API routes, orchestration
│   │   ├── router.ts            # Intent classifier
│   │   ├── prompts.ts           # System prompt templates
│   │   ├── session-do.ts        # Durable Object: session storage
│   │   ├── ai.ts                # Workers AI call wrapper
│   │   └── types.ts             # Shared TypeScript types
│   ├── wrangler.jsonc
│   └── package.json
└── README.md
```

## Local Development

### Prerequisites

- Node.js 18+
- npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- A Cloudflare account (for Workers AI access)

### Setup

1. **Clone the repo and install dependencies:**

```bash
git clone <repo-url>
cd ai-interview-coach

cd frontend && npm install && cd ..
cd worker && npm install && cd ..
```

2. **Authenticate Wrangler:**

```bash
wrangler login
```

3. **Start the Worker (backend):**

```bash
cd worker
npm run dev
```

This starts the Worker at `http://localhost:8787`.

4. **Start the frontend (in a separate terminal):**

```bash
cd frontend
npm run dev
```

This starts Vite at `http://localhost:5173` with API requests proxied to the Worker.

5. **Open** `http://localhost:5173` in your browser.

## Deployment

### Deploy the Worker

```bash
cd worker
npm run deploy
```

Note the deployed Worker URL (e.g., `https://ai-interview-coach.<your-subdomain>.workers.dev`).

### Deploy the Frontend

1. Update `frontend/src/App.tsx` — change `API_BASE` to your deployed Worker URL.
2. Build and deploy:

```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=ai-interview-coach
```

## API Endpoints

### `POST /api/chat`

Main chat endpoint.

**Request:**
```json
{
  "sessionId": "abc123",
  "message": "Give me a backend interview question",
  "mode": "backend"
}
```

**Response:**
```json
{
  "reply": "Explain how you would design a rate limiter...",
  "intent": "new_question",
  "mode": "backend"
}
```

### `POST /api/reset`

Clears the session state.

**Request:**
```json
{ "sessionId": "abc123" }
```

### `GET /api/session?sessionId=abc123`

Returns current session state (useful for debugging).

## Future Improvements

- LLM-based intent classification for more natural conversations
- Score tracking across sessions (D1 database)
- Timer-based mock interview mode
- Markdown rendering for formatted feedback
- Export session transcript
- Difficulty progression based on performance
