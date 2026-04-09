import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface Message {
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

interface Props {
  messages: Message[];
  loading: boolean;
  onSend: (message: string) => void;
}

export default function ChatWindow({ messages, loading, onSend }: Props) {
  return (
    <main className="chat-window">
      <MessageList messages={messages} loading={loading} />
      <MessageInput onSend={onSend} disabled={loading} />
    </main>
  );
}
