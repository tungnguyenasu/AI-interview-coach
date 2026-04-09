import { useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

interface Props {
  messages: Message[];
  loading: boolean;
}

const INTENT_LABELS: Record<string, string> = {
  new_question: "New Question",
  answer_feedback: "Feedback",
  hint: "Hint",
  follow_up: "Follow-up",
  summary: "Summary",
  general_help: "General",
};

export default function MessageList({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="message-list empty-state">
        <div className="welcome">
          <h2>Ready to practice?</h2>
          <p>Choose a mode above, then try one of these:</p>
          <div className="suggestions">
            <span className="suggestion">"Give me a backend interview question"</span>
            <span className="suggestion">"Ask me an OOP question"</span>
            <span className="suggestion">"Give me a SQL question"</span>
            <span className="suggestion">"Ask me a behavioral question"</span>
          </div>
          <p className="hint-text">
            After answering, you can ask for hints, feedback, harder questions, or a session summary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          <div className="message-avatar">
            {msg.role === "user" ? "You" : "AI"}
          </div>
          <div className="message-body">
            {msg.intent && msg.role === "assistant" && (
              <span className="intent-badge">
                {INTENT_LABELS[msg.intent] || msg.intent}
              </span>
            )}
            <div className="message-content">{msg.content}</div>
          </div>
        </div>
      ))}
      {loading && (
        <div className="message assistant">
          <div className="message-avatar">AI</div>
          <div className="message-body">
            <div className="message-content loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
