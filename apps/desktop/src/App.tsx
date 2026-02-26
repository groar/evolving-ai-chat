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

type RuntimeSettings = {
  channel: "stable" | "experimental";
  experimental_flags: Record<string, boolean>;
  active_flags: Record<string, boolean>;
};

type RuntimeStatePayload = {
  active_conversation_id: string;
  conversations: Conversation[];
  messages: Array<{
    message_id: number;
    role: "user" | "assistant";
    text: string;
    meta?: string | null;
  }>;
  settings: RuntimeSettings;
};

const runtimeBase = "http://127.0.0.1:8787";
const diagnosticsFlagKey = "show_runtime_diagnostics";
const defaultSettings: RuntimeSettings = {
  channel: "stable",
  experimental_flags: {},
  active_flags: {}
};

export function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [settings, setSettings] = useState<RuntimeSettings>(defaultSettings);
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
  const channelLabel = useMemo(
    () => (settings.channel === "experimental" ? "Experimental" : "Stable (default)"),
    [settings.channel]
  );
  const diagnosticsEnabled = Boolean(settings.active_flags[diagnosticsFlagKey]);
  const canRetry = !isSending && !isResetting;
  const canToggleFlags = settings.channel === "experimental" && !isSending && !isResetting;
  const configuredDiagnosticsFlag = Boolean(settings.experimental_flags[diagnosticsFlagKey]);

  function applyState(payload: RuntimeStatePayload, preferredConversationId?: string) {
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
    setSettings(payload.settings ?? defaultSettings);
    setRuntimeError(null);
  }

  async function refreshState(preferredConversationId?: string) {
    try {
      const response = await fetch(`${runtimeBase}/state`);
      if (!response.ok) {
        throw new Error("Runtime unavailable");
      }
      const payload = (await response.json()) as RuntimeStatePayload;
      applyState(payload, preferredConversationId);
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

  async function updateChannel(nextChannel: "stable" | "experimental") {
    if (isSending || isResetting || settings.channel === nextChannel) {
      return;
    }
    try {
      const response = await fetch(`${runtimeBase}/settings/channel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: nextChannel })
      });
      if (!response.ok) {
        throw new Error("Channel update failed");
      }
      const payload = (await response.json()) as { settings: RuntimeSettings };
      setSettings(payload.settings);
      await refreshState(activeConversationId);
    } catch {
      setRuntimeError("Runtime unavailable. Retry once runtime is running.");
    }
  }

  async function updateExperimentalFlag(enabled: boolean) {
    if (!canToggleFlags) {
      return;
    }
    try {
      const response = await fetch(`${runtimeBase}/settings/flags/${diagnosticsFlagKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      if (!response.ok) {
        throw new Error("Flag update failed");
      }
      const payload = (await response.json()) as { settings: RuntimeSettings };
      setSettings(payload.settings);
    } catch {
      setRuntimeError("Runtime unavailable. Retry once runtime is running.");
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
          <section className="settings-panel" aria-label="Release channel settings">
            <p className="settings-title">Release Channel</p>
            <p className="settings-copy">Local-only setting. Stable hides experiments; Experimental lets you test opt-in features.</p>
            <div className="channel-toggle">
              <button
                type="button"
                className={`channel-btn ${settings.channel === "stable" ? "active" : ""}`}
                onClick={() => void updateChannel("stable")}
                disabled={isSending || isResetting}
              >
                Stable
              </button>
              <button
                type="button"
                className={`channel-btn ${settings.channel === "experimental" ? "active" : ""}`}
                onClick={() => void updateChannel("experimental")}
                disabled={isSending || isResetting}
              >
                Experimental
              </button>
            </div>

            <label className="flag-control">
              <input
                type="checkbox"
                checked={configuredDiagnosticsFlag}
                disabled={!canToggleFlags}
                onChange={(event) => void updateExperimentalFlag(event.target.checked)}
              />
              Show runtime diagnostics (experimental)
            </label>
            {settings.channel !== "experimental" && <p className="flag-note">Switch to Experimental to adjust experiment toggles.</p>}
          </section>
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
          {diagnosticsEnabled && (
            <section className="diagnostics-card" aria-label="Runtime diagnostics">
              <p>Runtime diagnostics enabled</p>
              <p>Conversations: {conversations.length}</p>
              <p>Messages in view: {messages.length}</p>
            </section>
          )}
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
