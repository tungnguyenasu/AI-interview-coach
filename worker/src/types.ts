export type InterviewMode = "backend" | "oop" | "sql" | "behavioral" | "general";
export type Difficulty = "easy" | "medium" | "hard";

export type Intent =
  | "new_question"
  | "answer_feedback"
  | "hint"
  | "follow_up"
  | "summary"
  | "general_help";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SessionState {
  sessionId: string;
  mode: InterviewMode;
  currentQuestion?: string;
  currentDifficulty: Difficulty;
  turns: ChatTurn[];
  summary?: string;
  lastFeedback?: string;
  questionCount: number;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  mode?: InterviewMode;
}

export interface ChatResponse {
  reply: string;
  intent: Intent;
  mode: InterviewMode;
}

export interface Env {
  AI: Ai;
  INTERVIEW_SESSIONS: DurableObjectNamespace;
}
