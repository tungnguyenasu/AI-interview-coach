import { useState, useCallback } from "react";
import ChatWindow from "./components/ChatWindow";
import ModeSelector from "./components/ModeSelector";
import "./app.css";

type InterviewMode = "backend" | "oop" | "sql" | "behavioral" | "general";

interface Message {
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ""}/api`;

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [mode, setMode] = useState<InterviewMode>("backend");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: text, mode }),
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();
        const assistantMsg: Message = {
          role: "assistant",
          content: data.reply,
          intent: data.intent,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: Message = {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong."}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, mode]
  );

  const resetSession = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      // Reset locally even if the API call fails
    }
    setMessages([]);
    setSessionId(generateSessionId());
  }, [sessionId]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">AI Interview Coach</h1>
          <p className="app-subtitle">Practice technical interviews with AI-powered feedback</p>
        </div>
        <div className="header-controls">
          <ModeSelector mode={mode} onModeChange={setMode} />
          <button className="reset-btn" onClick={resetSession} title="Start a new session">
            New Session
          </button>
        </div>
      </header>

      <ChatWindow messages={messages} loading={loading} onSend={sendMessage} />
    </div>
  );
}
