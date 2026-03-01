import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { FeedbackPanel } from "./feedbackPanel";
import {
  appendFeedbackItem,
  clearFeedbackItems,
  createFeedbackItem,
  readFeedbackItems,
  type FeedbackItem,
  type FeedbackTag
} from "./feedbackStore";
import { getApiKeyFromStore, removeApiKeyFromStore, setApiKeyInStore } from "./apiKeyStore";
import {
  SettingsPanel,
  type AddValidationRunInput,
  type ChangeProposal,
  type ChangelogEntry,
  type CreateProposalInput,
  type RuntimeSettings
} from "./settingsPanel";

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
  changelog: ChangelogEntry[];
  proposals: ChangeProposal[];
  api_key_configured?: boolean;
};

type LeftRailSurface = "conversations" | "settings" | "feedback" | "advanced";
export type RuntimeIssue =
  | {
      kind: "offline";
    }
  | {
      kind: "error";
      detail: string;
    }
  | {
      kind: "api_key_not_set";
    };

const runtimeBase = "http://127.0.0.1:8787";
const diagnosticsFlagKey = "show_runtime_diagnostics";
export const offlineStateRetryIntervalMs = 2000;
const defaultSettings: RuntimeSettings = {
  channel: "stable",
  experimental_flags: {},
  active_flags: {}
};

export function shouldAutoRetryOfflineState(runtimeIssue: RuntimeIssue | null): boolean {
  return runtimeIssue?.kind === "offline";
}

export function isApiKeyNotSet(runtimeIssue: RuntimeIssue | null): boolean {
  return runtimeIssue?.kind === "api_key_not_set";
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string; error?: string };
    if (payload.error === "api_key_not_set") {
      return "api_key_not_set";
    }
    if (typeof payload.detail === "string" && payload.detail.trim().length > 0) {
      return payload.detail;
    }
  } catch {
    // no-op fallback
  }
  return `Runtime returned ${response.status}.`;
}

export function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [settings, setSettings] = useState<RuntimeSettings>(defaultSettings);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [proposals, setProposals] = useState<ChangeProposal[]>([]);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isProposalBusy, setIsProposalBusy] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackDraftText, setFeedbackDraftText] = useState("");
  const [feedbackTags, setFeedbackTags] = useState<FeedbackTag[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [activeLeftRailSurface, setActiveLeftRailSurface] = useState<LeftRailSurface>("conversations");
  const [runtimeIssue, setRuntimeIssue] = useState<RuntimeIssue | null>({ kind: "offline" });
  const [apiKeySet, setApiKeySet] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    void refreshState();
  }, []);

  useEffect(() => {
    try {
      setFeedbackItems(readFeedbackItems(window.localStorage));
      setFeedbackError(null);
    } catch {
      setFeedbackError("Could not load local feedback. You can still use chat.");
    }
  }, []);

  useEffect(() => {
    getApiKeyFromStore().then((key) => {
      setApiKeySet(Boolean(key));
    });
  }, []);

  useEffect(() => {
    if (runtimeIssue || isBooting) return;
    let cancelled = false;
    getApiKeyFromStore().then(async (storedKey) => {
      if (cancelled || !storedKey) return;
      try {
        await fetch(`${runtimeBase}/configure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openai_api_key: storedKey })
        });
        if (!cancelled) await refreshState(activeConversationId);
      } catch {
        if (!cancelled) await refreshState(activeConversationId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [runtimeIssue, isBooting]);

  const hasMessages = messages.length > 0;
  const isRuntimeOffline = runtimeIssue?.kind === "offline";
  const canSend =
    composer.trim().length > 0 &&
    !isSending &&
    activeConversationId.length > 0 &&
    !isRuntimeOffline &&
    apiKeyConfigured;
  const channelLabel = useMemo(() => (settings.channel === "experimental" ? "Experimental" : "Stable"), [settings.channel]);
  const diagnosticsEnabled = Boolean(settings.active_flags[diagnosticsFlagKey]);
  const canRetry = !isSending && !isResetting;
  const canToggleFlags = settings.channel === "experimental" && !isSending && !isResetting;
  const configuredDiagnosticsFlag = Boolean(settings.experimental_flags[diagnosticsFlagKey]);
  const isFeedbackBusy = isSending || isResetting;

  useEffect(() => {
    if (!shouldAutoRetryOfflineState(runtimeIssue)) {
      return;
    }
    const timerId = window.setInterval(() => {
      void refreshState(activeConversationId || undefined);
    }, offlineStateRetryIntervalMs);
    return () => window.clearInterval(timerId);
  }, [activeConversationId, runtimeIssue]);

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
    setChangelog(payload.changelog ?? []);
    setProposals(payload.proposals ?? []);
    setApiKeyConfigured(Boolean(payload.api_key_configured));
    setRuntimeIssue(null);
  }

  async function refreshState(preferredConversationId?: string) {
    try {
      const response = await fetch(`${runtimeBase}/state`);
      if (!response.ok) {
        const detail = await readErrorDetail(response);
        setRuntimeIssue({ kind: "error", detail });
        setSettingsError("Could not load changelog and proposals (runtime error).");
        return;
      }
      const payload = (await response.json()) as RuntimeStatePayload;
      applyState(payload, preferredConversationId);
      setSettingsError(null);
    } catch {
      setRuntimeIssue({ kind: "offline" });
      setSettingsError("Could not load changelog and proposals (runtime offline).");
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
        const detail = await readErrorDetail(response);
        setRuntimeIssue({ kind: "error", detail });
        return;
      }
      const payload = (await response.json()) as { conversation_id: string };
      await refreshState(payload.conversation_id);
    } catch {
      setRuntimeIssue({ kind: "offline" });
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
        const detail = await readErrorDetail(response);
        setRuntimeIssue({ kind: "error", detail });
        return;
      }
      await refreshState(conversationId);
    } catch {
      setRuntimeIssue({ kind: "offline" });
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
        const detail = await readErrorDetail(response);
        setRuntimeIssue({ kind: "error", detail });
        return;
      }
      setComposer("");
      clearFeedbackItems(window.localStorage);
      setFeedbackItems([]);
      setFeedbackDraftText("");
      setFeedbackTags([]);
      setFeedbackNotice(null);
      setFeedbackError(null);
      await refreshState();
    } catch {
      setRuntimeIssue({ kind: "offline" });
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
        const detail = await readErrorDetail(response);
        setRuntimeIssue({ kind: "error", detail });
        return;
      }
      const payload = (await response.json()) as { settings: RuntimeSettings };
      setSettings(payload.settings);
      if (nextChannel === "stable") {
        setSettingsNotice("Switched to Stable. Your conversations and history are unaffected.");
      }
      await refreshState(activeConversationId);
    } catch {
      setRuntimeIssue({ kind: "offline" });
      setSettingsError("Could not update release channel.");
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
        const detail = await readErrorDetail(response);
        setRuntimeIssue({ kind: "error", detail });
        return;
      }
      const payload = (await response.json()) as { settings: RuntimeSettings };
      setSettings(payload.settings);
      setSettingsNotice(`Updated diagnostics early-access feature: ${enabled ? "enabled" : "disabled"}.`);
      await refreshState(activeConversationId);
    } catch {
      setRuntimeIssue({ kind: "offline" });
      setSettingsError("Could not update early-access feature.");
    }
  }

  async function resetExperiments() {
    if (isSending || isResetting) {
      return;
    }
    try {
      const response = await fetch(`${runtimeBase}/settings/experiments/reset`, {
        method: "POST"
      });
      if (!response.ok) {
        const detail = await readErrorDetail(response);
        setRuntimeIssue({ kind: "error", detail });
        return;
      }
      const payload = (await response.json()) as { settings: RuntimeSettings };
      setSettings(payload.settings);
      setSettingsNotice("All toggles reset to defaults. No data deleted.");
      await refreshState(activeConversationId);
    } catch {
      setRuntimeIssue({ kind: "offline" });
      setSettingsError("Could not reset early-access features.");
    }
  }

  async function createProposal(input: CreateProposalInput) {
    if (isSending || isResetting || isProposalBusy) {
      return;
    }
    setIsProposalBusy(true);
    try {
      const response = await fetch(`${runtimeBase}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          rationale: input.rationale,
          source_feedback_ids: input.source_feedback_ids,
          diff_summary: "",
          risk_notes: ""
        })
      });
      if (!response.ok) {
        throw new Error(await readErrorDetail(response));
      }
      setSettingsNotice("Proposal created. Run validation before accepting.");
      setSettingsError(null);
      await refreshState(activeConversationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create proposal.";
      setSettingsError(message);
    } finally {
      setIsProposalBusy(false);
    }
  }

  async function addProposalValidationRun(proposalId: string, input: AddValidationRunInput) {
    if (isSending || isResetting || isProposalBusy) {
      return;
    }
    setIsProposalBusy(true);
    try {
      const response = await fetch(`${runtimeBase}/proposals/${proposalId}/validation-runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      if (!response.ok) {
        throw new Error(await readErrorDetail(response));
      }
      setSettingsNotice(`Validation run added (${input.status}).`);
      setSettingsError(null);
      await refreshState(activeConversationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add validation run.";
      setSettingsError(message);
    } finally {
      setIsProposalBusy(false);
    }
  }

  async function saveApiKey(key: string) {
    if (isSavingApiKey || key.trim().length === 0) return;
    setIsSavingApiKey(true);
    setApiKeyError(null);
    try {
      await setApiKeyInStore(key.trim());
      await fetch(`${runtimeBase}/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openai_api_key: key.trim() })
      });
      setApiKeySet(true);
      setApiKeyConfigured(true);
    } catch (err) {
      setApiKeyError("Could not save API key. Please try again.");
    } finally {
      setIsSavingApiKey(false);
    }
  }

  async function removeApiKey() {
    if (isSavingApiKey) return;
    setIsSavingApiKey(true);
    setApiKeyError(null);
    try {
      await removeApiKeyFromStore();
      await fetch(`${runtimeBase}/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openai_api_key: null })
      });
      setApiKeySet(false);
      setApiKeyConfigured(false);
    } catch (err) {
      setApiKeyError("Could not remove API key. Please try again.");
    } finally {
      setIsSavingApiKey(false);
    }
  }

  async function updateProposalDecision(proposalId: string, status: "accepted" | "rejected", notes: string) {
    if (isSending || isResetting || isProposalBusy) {
      return;
    }
    setIsProposalBusy(true);
    try {
      const response = await fetch(`${runtimeBase}/proposals/${proposalId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes })
      });
      if (!response.ok) {
        throw new Error(await readErrorDetail(response));
      }
      setSettingsNotice(
        status === "accepted"
          ? "Proposal accepted. Changelog entry should now appear in Recent Changes."
          : "Proposal rejected with rationale."
      );
      setSettingsError(null);
      await refreshState(activeConversationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update proposal decision.";
      setSettingsError(message);
    } finally {
      setIsProposalBusy(false);
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
        const detail = await readErrorDetail(response);
        if (detail === "api_key_not_set") {
          setRuntimeIssue({ kind: "api_key_not_set" });
        } else {
          setRuntimeIssue({ kind: "error", detail });
        }
        return;
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
      setRuntimeIssue({ kind: "offline" });
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function toggleFeedbackTag(tag: FeedbackTag) {
    setFeedbackTags((currentTags) =>
      currentTags.includes(tag) ? currentTags.filter((value) => value !== tag) : [...currentTags, tag]
    );
  }

  function submitFeedback() {
    const nextText = feedbackDraftText.trim();
    if (nextText.length === 0 || isFeedbackBusy) {
      return;
    }

    const nextItem = createFeedbackItem({
      text: nextText,
      tags: feedbackTags,
      contextPointer: activeConversationId || undefined
    });

    try {
      const nextItems = appendFeedbackItem(window.localStorage, nextItem);
      setFeedbackItems(nextItems);
      setFeedbackDraftText("");
      setFeedbackTags([]);
      setFeedbackNotice("Saved locally. You can review captured items below.");
      setFeedbackError(null);
      setIsFeedbackOpen(true);
    } catch {
      setFeedbackNotice(null);
      setFeedbackError("Could not save feedback locally. Core chat is unaffected.");
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
          <h1>Evolving AI Chat</h1>
        </header>
        <nav className="left-rail-nav" aria-label="Left rail surfaces">
          <button
            type="button"
            className={`surface-nav-btn ${activeLeftRailSurface === "conversations" ? "active" : ""}`}
            onClick={() => setActiveLeftRailSurface("conversations")}
          >
            Conversations
          </button>
          <button
            type="button"
            className={`surface-nav-btn ${activeLeftRailSurface === "settings" ? "active" : ""}`}
            onClick={() => setActiveLeftRailSurface("settings")}
          >
            Settings
          </button>
          <button
            type="button"
            className={`surface-nav-btn ${activeLeftRailSurface === "feedback" ? "active" : ""}`}
            onClick={() => setActiveLeftRailSurface("feedback")}
          >
            Feedback
          </button>
          <button
            type="button"
            className={`surface-nav-btn ${activeLeftRailSurface === "advanced" ? "active" : ""}`}
            onClick={() => setActiveLeftRailSurface("advanced")}
          >
            Advanced
          </button>
        </nav>
        <section className="left-rail-surface" aria-live="polite">
          {activeLeftRailSurface === "conversations" && (
            <>
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
                <button
                  type="button"
                  className="rail-btn"
                  onClick={() => void createConversation()}
                  disabled={isSending || isResetting}
                >
                  + New Conversation
                </button>
              </div>
            </>
          )}
          {activeLeftRailSurface === "settings" && (
            <div className="surface-panel">
              <SettingsPanel
                settings={settings}
                changelog={changelog}
                proposals={proposals}
                feedbackIds={feedbackItems.map((item) => item.id)}
                isBusy={isSending || isResetting || isProposalBusy}
                canToggleFlags={canToggleFlags}
                configuredDiagnosticsFlag={configuredDiagnosticsFlag}
                notice={settingsNotice}
                error={settingsError}
                confirmAction={(prompt) => window.confirm(prompt)}
                onRefresh={() => void refreshState(activeConversationId)}
                onSelectChannel={(channel) => void updateChannel(channel)}
                onToggleDiagnostics={(enabled) => void updateExperimentalFlag(enabled)}
                onResetExperiments={() => void resetExperiments()}
                onCreateProposal={(input) => void createProposal(input)}
                onAddValidationRun={(proposalId, input) => void addProposalValidationRun(proposalId, input)}
                onUpdateProposalDecision={(proposalId, status, notes) => void updateProposalDecision(proposalId, status, notes)}
                apiKeySet={apiKeySet}
                onSaveApiKey={(key) => void saveApiKey(key)}
                onRemoveApiKey={() => void removeApiKey()}
                apiKeyError={apiKeyError}
                isSavingApiKey={isSavingApiKey}
              />
            </div>
          )}
          {activeLeftRailSurface === "feedback" && (
            <div className="surface-panel">
              <FeedbackPanel
                isOpen={isFeedbackOpen}
                isBusy={isFeedbackBusy}
                draftText={feedbackDraftText}
                selectedTags={feedbackTags}
                contextPointer={activeConversationId || null}
                items={feedbackItems}
                notice={feedbackNotice}
                error={feedbackError}
                onToggleOpen={() => setIsFeedbackOpen((isOpen) => !isOpen)}
                onChangeDraftText={setFeedbackDraftText}
                onToggleTag={toggleFeedbackTag}
                onSubmitFeedback={submitFeedback}
              />
            </div>
          )}
          {activeLeftRailSurface === "advanced" && (
            <div className="surface-panel">
              <div className="advanced-panel">
                <p className="settings-copy">Release channel: {channelLabel}. Change it in Settings.</p>
                <button
                  type="button"
                  className="rail-btn danger"
                  onClick={() => void deleteLocalData()}
                  disabled={isSending || isResetting}
                >
                  {isResetting ? "Resetting..." : "Delete Local Data"}
                </button>
              </div>
            </div>
          )}
        </section>
      </aside>

      <section className="chat-pane">
        <header className="top-bar">
          <div>
            <p className="top-bar-title">Local Desktop Chat</p>
            <p className="top-bar-subtitle">Local AI chat · {channelLabel} channel</p>
          </div>
        </header>
        {runtimeIssue && runtimeIssue.kind === "api_key_not_set" && (
          <section role="status" className="runtime-status api-key-prompt">
            <div className="runtime-status-copy">
              <p className="runtime-status-title">Add your OpenAI API key in Settings to start chatting.</p>
              <p>
                Open Settings and add your API key in the Connections section.
              </p>
            </div>
            <button
              type="button"
              className="retry-btn"
              onClick={() => setActiveLeftRailSurface("settings")}
            >
              Open Settings
            </button>
          </section>
        )}
        {runtimeIssue && runtimeIssue.kind !== "api_key_not_set" && (
          <section role="status" className={`runtime-status ${runtimeIssue.kind === "offline" ? "offline" : "error"}`}>
            <div className="runtime-status-copy">
              <p className="runtime-status-title">
                The local runtime is not running.
              </p>
              <p>
                {runtimeIssue.kind === "offline"
                  ? "Start it, then press Retry."
                  : `Runtime responded with an error: ${runtimeIssue.detail}`}
              </p>
            </div>
            <button type="button" className="retry-btn" disabled={!canRetry} onClick={() => void retryRuntime()}>
              Retry
            </button>
          </section>
        )}

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
            {!hasMessages && !isBooting && (
            <div className="empty-state">
              <p>Your local AI assistant.</p>
              <p>
                {!apiKeyConfigured
                  ? "Add your OpenAI API key in Settings to start chatting."
                  : isRuntimeOffline
                    ? "Start the runtime, then send your first message."
                    : "Type your first message below."}
              </p>
              {!apiKeyConfigured && (
                <button
                  type="button"
                  className="rail-btn"
                  onClick={() => setActiveLeftRailSurface("settings")}
                >
                  Open Settings
                </button>
              )}
            </div>
          )}

          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <p className="message-role">{message.role === "user" ? "You" : "Assistant"}</p>
              <p>{message.text}</p>
              {message.meta && <p className="message-meta">{message.meta}</p>}
            </article>
          ))}
        </div>

        <footer className="composer-wrap">
          <label htmlFor="composer" className="sr-only">
            Message composer
          </label>
          <div className="composer-bar">
            <textarea
              id="composer"
              ref={inputRef}
              value={composer}
              className="composer"
              placeholder={
                !apiKeyConfigured
                  ? "Add your API key in Settings to chat."
                  : isRuntimeOffline
                    ? "Start the runtime to chat."
                    : "Type a message..."
              }
              rows={1}
              disabled={isRuntimeOffline || !apiKeyConfigured}
              onChange={(event) => setComposer(event.target.value)}
              onKeyDown={handleComposerKeyDown}
            />
            <button type="button" className="send-btn" disabled={!canSend} onClick={() => void sendMessage()}>
              {isSending ? <span className="sending-indicator" aria-label="Sending" /> : "Send"}
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
