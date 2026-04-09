import type { InterviewMode, Difficulty, ChatTurn } from "./types";

export function buildQuestionPrompt(mode: InterviewMode, difficulty: Difficulty): string {
  const modeDescriptions: Record<InterviewMode, string> = {
    backend: "backend engineering (APIs, databases, caching, microservices, scalability)",
    oop: "object-oriented programming and design (SOLID principles, design patterns, inheritance, polymorphism)",
    sql: "SQL and database design (queries, normalization, indexing, transactions)",
    behavioral: "behavioral and situational (teamwork, leadership, conflict resolution, problem-solving)",
    general: "general software engineering",
  };

  return [
    "You are an experienced interview coach for software engineering candidates.",
    `Generate one realistic ${modeDescriptions[mode]} interview question.`,
    `Difficulty: ${difficulty}.`,
    "Do not give the answer unless asked.",
    "Keep it concise — one clear question.",
    "Do not include preamble like 'Sure, here is a question'. Just state the question directly.",
  ].join("\n");
}

export function buildFeedbackPrompt(question: string, answer: string): string {
  return [
    "You are a senior software engineering interviewer evaluating a candidate's response.",
    "",
    "Question:",
    question,
    "",
    "Candidate's answer:",
    answer,
    "",
    "You MUST respond using EXACTLY this format with these five labeled sections:",
    "",
    "Score: X/10",
    "",
    "Strengths:",
    "- (list what the candidate did well)",
    "",
    "Weaknesses:",
    "- (list what could be improved)",
    "",
    "Improved Answer:",
    "(write a concise model answer the candidate can learn from)",
    "",
    "Follow-up Question:",
    "(one harder follow-up question to go deeper on the same topic)",
    "",
    "Be fair but rigorous. This is practice, so be constructive and specific.",
    "Do not add any text before 'Score:' or deviate from the format above.",
  ].join("\n");
}

export function buildHintPrompt(question: string): string {
  return [
    "You are an interview coach helping a candidate who is stuck.",
    "",
    "The interview question is:",
    question,
    "",
    "Give a helpful hint that nudges the candidate toward the right approach without revealing the full answer.",
    "Keep it to 2-3 sentences.",
  ].join("\n");
}

export function buildFollowUpPrompt(question: string, difficulty: Difficulty): string {
  const harder: Difficulty = difficulty === "easy" ? "medium" : "hard";
  return [
    "You are an interview coach.",
    "",
    "The previous question was:",
    question,
    "",
    `Generate a harder follow-up question (difficulty: ${harder}) that builds on the same topic.`,
    "Just state the question directly.",
  ].join("\n");
}

export function buildSummaryPrompt(turns: ChatTurn[]): string {
  const conversation = turns
    .map((t) => `${t.role === "user" ? "Candidate" : "Coach"}: ${t.content}`)
    .join("\n");

  return [
    "You are an interview coach reviewing a practice session.",
    "",
    "Here is the conversation so far:",
    conversation,
    "",
    "Provide a concise session summary:",
    "- **Strongest areas**: Topics where the candidate performed well",
    "- **Weakest areas**: Topics needing improvement",
    "- **Top 3 improvements**: Specific, actionable advice",
    "- **Suggested next topic**: What to practice next",
    "",
    "Keep it encouraging but honest.",
  ].join("\n");
}

export function buildGeneralPrompt(message: string, turns: ChatTurn[]): string {
  const recentContext = turns
    .slice(-6)
    .map((t) => `${t.role === "user" ? "Candidate" : "Coach"}: ${t.content}`)
    .join("\n");

  return [
    "You are a friendly and knowledgeable software engineering interview coach.",
    "You help candidates prepare for technical interviews.",
    "",
    recentContext ? `Recent conversation:\n${recentContext}\n` : "",
    `Candidate says: ${message}`,
    "",
    "Respond helpfully. If the candidate seems to want a question, offer to generate one.",
    "If they seem confused, offer guidance on how to use this practice tool.",
  ].join("\n");
}
