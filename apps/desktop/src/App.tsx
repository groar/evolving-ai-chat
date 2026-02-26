import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const runtimeUrl = "http://127.0.0.1:8787/chat";

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(
    "Runtime unavailable. Start the local runtime to enable responses."
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const hasMessages = messages.length > 0;
  const canSend = composer.trim().length > 0 && !isSending;
  const channelLabel = useMemo(() => "Stable (default)", []);

  async function sendMessage() {
    if (!canSend) {
      return;
    }

    const nextText = composer.trim();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: nextText
    };

    setMessages((existing) => [...existing, userMessage]);
    setComposer("");
    setIsSending(true);

    try {
      const response = await fetch(runtimeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nextText })
      });

      if (!response.ok) {
        throw new Error(`Runtime returned ${response.status}`);
      }

      const payload = (await response.json()) as { reply?: string };
      const reply = payload.reply?.trim() || "No reply received from runtime.";

      setMessages((existing) => [
        ...existing,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: reply
        }
      ]);
      setRuntimeError(null);
    } catch {
      setRuntimeError("Runtime unavailable. Retry once runtime is running.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="app-shell">
      <aside className="left-rail">
        <header className="left-rail-header">
          <h1>Evolving Chat</h1>
          <p>Conversation List</p>
        </header>
        <ul className="conversation-list">
          <li className="conversation-item active">Today’s Session</li>
          <li className="conversation-item">+ New Conversation (soon)</li>
        </ul>
      </aside>

      <section className="chat-pane">
        <header className="top-bar">
          <div>
            <p className="top-bar-title">Local Desktop Chat</p>
            <p className="top-bar-subtitle">Self-evolving workbench baseline</p>
          </div>
          <span className="channel-pill">{channelLabel}</span>
        </header>

        <div className="transcript" aria-live="polite">
          {!hasMessages && (
            <div className="empty-state">
              <p>No messages yet.</p>
              <p>Use the composer below and press Enter to send.</p>
            </div>
          )}

          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <h2>{message.role === "user" ? "You" : "Assistant"}</h2>
              <p>{message.text}</p>
            </article>
          ))}
        </div>

        <footer className="composer-wrap">
          {runtimeError && (
            <div role="alert" className="runtime-error">
              <strong>Runtime status:</strong> {runtimeError}
            </div>
          )}

          <label htmlFor="composer" className="sr-only">
            Message composer
          </label>
          <textarea
            id="composer"
            ref={inputRef}
            value={composer}
            className="composer"
            placeholder="Type a message and press Enter to send."
            rows={3}
            onChange={(event) => setComposer(event.target.value)}
            onKeyDown={handleComposerKeyDown}
          />
          <button type="button" className="send-btn" disabled={!canSend} onClick={() => void sendMessage()}>
            {isSending ? "Sending..." : "Send"}
          </button>
        </footer>
      </section>
    </main>
  );
}
