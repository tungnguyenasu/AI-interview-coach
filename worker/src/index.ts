import type { Env, ChatRequest, ChatResponse, SessionState, InterviewMode } from "./types";
import { classifyIntent } from "./router";
import { callWorkersAI } from "./ai";
import {
  buildQuestionPrompt,
  buildFeedbackPrompt,
  buildHintPrompt,
  buildFollowUpPrompt,
  buildSummaryPrompt,
  buildGeneralPrompt,
} from "./prompts";

export { InterviewSession } from "./session-do";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function getSessionStub(env: Env, sessionId: string): DurableObjectStub {
  const id = env.INTERVIEW_SESSIONS.idFromName(sessionId);
  return env.INTERVIEW_SESSIONS.get(id);
}

async function getState(stub: DurableObjectStub, sessionId: string): Promise<SessionState> {
  const res = await stub.fetch(`http://do/get-state?sessionId=${sessionId}`);
  return res.json();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/api/chat" && request.method === "POST") {
        return await handleChat(request, env);
      }

      if (path === "/api/reset" && request.method === "POST") {
        return await handleReset(request, env);
      }

      if (path === "/api/session" && request.method === "GET") {
        return await handleGetSession(request, env);
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("Worker error:", message);
      return json({ error: message }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as ChatRequest;
  const { sessionId, message, mode } = body;

  if (!sessionId || !message) {
    return json({ error: "sessionId and message are required" }, 400);
  }

  const stub = getSessionStub(env, sessionId);
  const state = await getState(stub, sessionId);

  // Update mode if provided
  if (mode && mode !== state.mode) {
    await stub.fetch("http://do/set-mode", {
      method: "POST",
      body: JSON.stringify({ sessionId, mode }),
    });
    state.mode = mode;
  }

  const activeMode: InterviewMode = mode || state.mode || "general";
  const intent = classifyIntent(message, state);

  let systemPrompt: string;

  switch (intent) {
    case "new_question":
      systemPrompt = buildQuestionPrompt(activeMode, state.currentDifficulty);
      break;
    case "answer_feedback":
      if (!state.currentQuestion) {
        return json({
          reply: "I don't have a current question to evaluate against. Ask me for a question first!",
          intent,
          mode: activeMode,
        } satisfies ChatResponse);
      }
      systemPrompt = buildFeedbackPrompt(state.currentQuestion, message);
      break;
    case "hint":
      if (!state.currentQuestion) {
        return json({
          reply: "There's no active question to give a hint for. Ask me for a question first!",
          intent,
          mode: activeMode,
        } satisfies ChatResponse);
      }
      systemPrompt = buildHintPrompt(state.currentQuestion);
      break;
    case "follow_up":
      if (!state.currentQuestion) {
        systemPrompt = buildQuestionPrompt(activeMode, state.currentDifficulty);
      } else {
        systemPrompt = buildFollowUpPrompt(state.currentQuestion, state.currentDifficulty);
      }
      break;
    case "summary":
      if (state.turns.length === 0) {
        return json({
          reply: "We haven't started yet! Ask me for a question to begin your practice session.",
          intent,
          mode: activeMode,
        } satisfies ChatResponse);
      }
      systemPrompt = buildSummaryPrompt(state.turns);
      break;
    default:
      systemPrompt = buildGeneralPrompt(message, state.turns);
  }

  const aiReply = await callWorkersAI(env, systemPrompt);

  const now = new Date().toISOString();

  // Store turns
  await stub.fetch("http://do/append-turn", {
    method: "POST",
    body: JSON.stringify({ sessionId, turn: { role: "user", content: message, timestamp: now } }),
  });
  await stub.fetch("http://do/append-turn", {
    method: "POST",
    body: JSON.stringify({ sessionId, turn: { role: "assistant", content: aiReply, timestamp: now } }),
  });

  // Update current question for question-generating intents
  if (intent === "new_question" || intent === "follow_up") {
    await stub.fetch("http://do/set-current-question", {
      method: "POST",
      body: JSON.stringify({ sessionId, question: aiReply }),
    });
  }

  // Save summary if requested
  if (intent === "summary") {
    await stub.fetch("http://do/save-summary", {
      method: "POST",
      body: JSON.stringify({ sessionId, summary: aiReply }),
    });
  }

  return json({ reply: aiReply, intent, mode: activeMode } satisfies ChatResponse);
}

async function handleReset(request: Request, env: Env): Promise<Response> {
  const { sessionId } = (await request.json()) as { sessionId: string };
  if (!sessionId) {
    return json({ error: "sessionId is required" }, 400);
  }
  const stub = getSessionStub(env, sessionId);
  await stub.fetch("http://do/reset", { method: "POST" });
  return json({ ok: true });
}

async function handleGetSession(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    return json({ error: "sessionId query param is required" }, 400);
  }
  const stub = getSessionStub(env, sessionId);
  const state = await getState(stub, sessionId);
  return json(state);
}
