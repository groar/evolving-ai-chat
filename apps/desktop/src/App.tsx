import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

type ChatMessage = {
  id: string | number;
  role: "user" | "assistant";
  text: string;
  meta?: string;
};

type Conversation = {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

const runtimeBase = "http://127.0.0.1:8787";

export function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(
    "Runtime unavailable. Start the local runtime to enable responses."
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    void refreshState();
  }, []);

  const hasMessages = messages.length > 0;
  const canSend = composer.trim().length > 0 && !isSending && activeConversationId.length > 0;
  const channelLabel = useMemo(() => "Stable (default)", []);
  const canRetry = !isSending && !isResetting;

  async function refreshState(preferredConversationId?: string) {
    try {
      const response = await fetch(`${runtimeBase}/state`);
      if (!response.ok) {
        throw new Error("Runtime unavailable");
      }
      const payload = (await response.json()) as {
        active_conversation_id: string;
        conversations: Conversation[];
        messages: Array<{
          message_id: number;
          role: "user" | "assistant";
          text: string;
          meta?: string | null;
        }>;
      };

      setConversations(payload.conversations);
      setActiveConversationId(preferredConversationId || payload.active_conversation_id);
      setMessages(
        payload.messages.map((message) => ({
          id: message.message_id,
          role: message.role,
          text: message.text,
          meta: message.meta ?? undefined
        }))
      );
      setRuntimeError(null);
    } catch {
      setRuntimeError("Runtime unavailable. Retry once runtime is running.");
    } finally {
      setIsBooting(false);
    }
  }

  async function retryRuntime() {
    if (!canRetry) {
      return;
    }
    await refreshState();
  }

  async function createConversation() {
    if (isSending || isResetting) {
      return;
    }
    try {
      const response = await fetch(`${runtimeBase}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation", set_active: true })
      });
      if (!response.ok) {
        throw new Error("Conversation create failed");
      }
      const payload = (await response.json()) as { conversation_id: string };
      await refreshState(payload.conversation_id);
    } catch {
      setRuntimeError("Runtime unavailable. Retry once runtime is running.");
    }
  }

  async function activateConversation(conversationId: string) {
    if (conversationId === activeConversationId || isSending) {
      return;
    }
    try {
      const response = await fetch(`${runtimeBase}/conversations/${conversationId}/activate`, {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error("Conversation activation failed");
      }
      await refreshState(conversationId);
    } catch {
      setRuntimeError("Runtime unavailable. Retry once runtime is running.");
    }
  }

  async function deleteLocalData() {
    if (isResetting || isSending) {
      return;
    }
    setIsResetting(true);
    try {
      const response = await fetch(`${runtimeBase}/data`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Delete local data failed");
      }
      setComposer("");
      await refreshState();
    } catch {
      setRuntimeError("Runtime unavailable. Retry once runtime is running.");
    } finally {
      setIsResetting(false);
      inputRef.current?.focus();
    }
  }

  async function sendMessage() {
    if (!canSend) {
      return;
    }

    const nextText = composer.trim();
    setComposer("");
    setIsSending(true);

    try {
      const response = await fetch(`${runtimeBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nextText, conversation_id: activeConversationId })
      });

      if (!response.ok) {
        throw new Error(`Runtime returned ${response.status}`);
      }

      const payload = (await response.json()) as {
        conversation_id?: string;
        reply?: string;
        model_id?: string;
        created_at?: string;
        cost?: number;
      };
      await refreshState(payload.conversation_id);
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
          <p>Conversation List (SQLite)</p>
        </header>
        <ul className="conversation-list">
          {conversations.map((conversation) => (
            <li key={conversation.conversation_id}>
              <button
                type="button"
                className={`conversation-item ${conversation.conversation_id === activeConversationId ? "active" : ""}`}
                onClick={() => void activateConversation(conversation.conversation_id)}
              >
                {conversation.title}
              </button>
            </li>
          ))}
        </ul>
        <div className="left-rail-actions">
          <button type="button" className="rail-btn" onClick={() => void createConversation()} disabled={isSending || isResetting}>
            + New Conversation
          </button>
          <button type="button" className="rail-btn danger" onClick={() => void deleteLocalData()} disabled={isSending || isResetting}>
            {isResetting ? "Resetting..." : "Delete Local Data"}
          </button>
        </div>
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
          {isBooting && (
            <div className="empty-state">
              <p>Loading local state...</p>
            </div>
          )}
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
              {message.meta && <p className="message-meta">{message.meta}</p>}
            </article>
          ))}
        </div>

        <footer className="composer-wrap">
          {runtimeError && (
            <div role="alert" className="runtime-error">
              <strong>Runtime status:</strong> {runtimeError}
              <button type="button" className="retry-btn" disabled={!canRetry} onClick={() => void retryRuntime()}>
                Retry
              </button>
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
