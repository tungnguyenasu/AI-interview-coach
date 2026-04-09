import type { Intent, SessionState } from "./types";

/**
 * Classify user message into an intent using keyword rules.
 * Priority order matters: summary and hint-like phrases are checked first
 * so they aren't swallowed by the long-answer fallback.
 */
export function classifyIntent(message: string, state: SessionState): Intent {
  const lower = message.toLowerCase().trim();

  // --- Summary (check early — "how did I do" is unambiguous) ---
  if (
    lower.includes("summary") ||
    lower.includes("how did i do") ||
    lower.includes("how am i doing") ||
    lower.includes("summarize") ||
    lower.includes("recap") ||
    lower.includes("my progress")
  ) {
    return "summary";
  }

  // --- Hint / stuck ---
  if (
    lower.includes("hint") ||
    lower.includes("give me a clue") ||
    lower.includes("help me") ||
    lower.includes("i'm stuck") ||
    lower.includes("i am stuck") ||
    lower.includes("i don't know") ||
    lower.includes("i dont know") ||
    lower.includes("not sure") ||
    lower.includes("no idea") ||
    lower.includes("can you help")
  ) {
    return "hint";
  }

  // --- Follow-up / harder ---
  if (
    lower.includes("harder") ||
    lower.includes("make it harder") ||
    lower.includes("follow up") ||
    lower.includes("follow-up") ||
    lower.includes("next question") ||
    lower.includes("another question") ||
    lower.includes("ask another") ||
    lower.includes("next one") ||
    lower.includes("one more") ||
    lower.includes("more challenging")
  ) {
    return "follow_up";
  }

  // --- New question ---
  if (
    (lower.includes("give me a") && lower.includes("question")) ||
    lower.includes("ask me") ||
    lower.includes("new question") ||
    (lower.includes("start") && lower.includes("interview")) ||
    lower.includes("generate a question") ||
    lower.includes("interview question") ||
    lower.includes("let's begin") ||
    lower.includes("let's start") ||
    lower.includes("begin the interview")
  ) {
    return "new_question";
  }

  // --- Explicit feedback request ---
  if (
    lower.includes("evaluate") ||
    lower.includes("rate my answer") ||
    lower.includes("grade") ||
    lower.includes("feedback") ||
    lower.includes("how was my answer") ||
    lower.includes("check my answer") ||
    lower.includes("score my answer")
  ) {
    return "answer_feedback";
  }

  // --- Implicit answer: active question + long enough message ---
  if (state.currentQuestion && message.trim().length > 40) {
    return "answer_feedback";
  }

  return "general_help";
}
