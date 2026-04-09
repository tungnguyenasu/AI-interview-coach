import type { ChatTurn, SessionState, InterviewMode, Difficulty, Env } from "./types";

export class InterviewSession implements DurableObject {
  private state: DurableObjectState;
  private session: SessionState | null = null;

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state;
  }

  private async loadSession(sessionId: string): Promise<SessionState> {
    if (this.session) return this.session;

    const stored = await this.state.storage.get<SessionState>("session");
    if (stored) {
      this.session = stored;
      return this.session;
    }

    this.session = {
      sessionId,
      mode: "general",
      currentDifficulty: "medium",
      turns: [],
      questionCount: 0,
    };
    await this.persist();
    return this.session;
  }

  private async persist(): Promise<void> {
    if (this.session) {
      await this.state.storage.put("session", this.session);
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/get-state") {
        const sessionId = url.searchParams.get("sessionId") || "default";
        const session = await this.loadSession(sessionId);
        return Response.json(session);
      }

      if (path === "/append-turn") {
        const { sessionId, turn } = await request.json() as {
          sessionId: string;
          turn: ChatTurn;
        };
        const session = await this.loadSession(sessionId);
        session.turns.push(turn);
        // Keep last 50 turns to avoid unbounded growth
        if (session.turns.length > 50) {
          session.turns = session.turns.slice(-50);
        }
        await this.persist();
        return Response.json({ ok: true });
      }

      if (path === "/set-current-question") {
        const { sessionId, question } = await request.json() as {
          sessionId: string;
          question: string;
        };
        const session = await this.loadSession(sessionId);
        session.currentQuestion = question;
        session.questionCount++;
        await this.persist();
        return Response.json({ ok: true });
      }

      if (path === "/set-mode") {
        const { sessionId, mode } = await request.json() as {
          sessionId: string;
          mode: InterviewMode;
        };
        const session = await this.loadSession(sessionId);
        session.mode = mode;
        await this.persist();
        return Response.json({ ok: true });
      }

      if (path === "/set-difficulty") {
        const { sessionId, difficulty } = await request.json() as {
          sessionId: string;
          difficulty: Difficulty;
        };
        const session = await this.loadSession(sessionId);
        session.currentDifficulty = difficulty;
        await this.persist();
        return Response.json({ ok: true });
      }

      if (path === "/save-summary") {
        const { sessionId, summary } = await request.json() as {
          sessionId: string;
          summary: string;
        };
        const session = await this.loadSession(sessionId);
        session.summary = summary;
        await this.persist();
        return Response.json({ ok: true });
      }

      if (path === "/reset") {
        this.session = null;
        await this.state.storage.deleteAll();
        return Response.json({ ok: true });
      }

      return Response.json({ error: "Unknown DO endpoint" }, { status: 404 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal DO error";
      return Response.json({ error: message }, { status: 500 });
    }
  }
}
