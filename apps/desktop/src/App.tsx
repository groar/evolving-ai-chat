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
  const [streamingText, setStreamingText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (streamingText.length > 0) {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingText]);

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
    setStreamingText("");

    const body = JSON.stringify({
      message: nextText,
      conversation_id: activeConversationId,
      history: messages.map((m) => ({ role: m.role, content: m.text }))
    });

    try {
      const response = await fetch(`${runtimeBase}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream"
        },
        body
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

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let streamEnded = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const raw = line.slice(6);
              if (raw === "[DONE]" || raw.trim() === "") continue;
              try {
                const event = JSON.parse(raw) as
                  | { delta?: string; done?: boolean; error?: string; detail?: string };
                if (event.error) {
                  setRuntimeIssue({ kind: "error", detail: event.detail ?? event.error });
                  streamEnded = true;
                  break;
                }
                if (event.delta) {
                  accumulated += event.delta;
                  setStreamingText(accumulated);
                }
                if (event.done) streamEnded = true;
              } catch {
                // Skip malformed JSON
              }
            }
          }
          if (streamEnded) break;
        }
        await refreshState(activeConversationId);
      } else {
        const payload = (await response.json()) as {
          conversation_id?: string;
          reply?: string;
          model_id?: string;
          created_at?: string;
          cost?: number;
        };
        await refreshState(payload.conversation_id);
      }
    } catch {
      setRuntimeIssue({ kind: "offline" });
    } finally {
      setIsSending(false);
      setStreamingText("");
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
    <main className="app-shell grid grid-cols-[minmax(300px,360px)_1fr] gap-4 h-screen p-4">
      <aside className="border border-border rounded-2xl bg-panel shadow-sm p-3.5 flex flex-col gap-3 min-h-0 overflow-hidden">
        <header>
          <h1 className="m-0 text-[1.35rem]">Evolving AI Chat</h1>
        </header>
        <nav className="flex gap-0.5 border-b border-border pb-0" aria-label="Left rail surfaces">
          <button
            type="button"
            className={`flex-1 border-b-2 border-transparent rounded-none bg-transparent text-muted-foreground py-2 px-1 -mb-px text-sm text-center cursor-pointer transition-colors ${
              activeLeftRailSurface === "conversations" ? "text-primary border-b-primary font-semibold" : "hover:text-foreground"
            }`}
            onClick={() => setActiveLeftRailSurface("conversations")}
          >
            Conversations
          </button>
          <button
            type="button"
            className={`flex-1 border-b-2 border-transparent rounded-none bg-transparent text-muted-foreground py-2 px-1 -mb-px text-sm text-center cursor-pointer transition-colors ${
              activeLeftRailSurface === "settings" ? "text-primary border-b-primary font-semibold" : "hover:text-foreground"
            }`}
            onClick={() => setActiveLeftRailSurface("settings")}
          >
            Settings
          </button>
          <button
            type="button"
            className={`flex-1 border-b-2 border-transparent rounded-none bg-transparent text-muted-foreground py-2 px-1 -mb-px text-sm text-center cursor-pointer transition-colors ${
              activeLeftRailSurface === "feedback" ? "text-primary border-b-primary font-semibold" : "hover:text-foreground"
            }`}
            onClick={() => setActiveLeftRailSurface("feedback")}
          >
            Feedback
          </button>
          <button
            type="button"
            className={`flex-1 border-b-2 border-transparent rounded-none bg-transparent text-muted-foreground py-2 px-1 -mb-px text-sm text-center cursor-pointer transition-colors ${
              activeLeftRailSurface === "advanced" ? "text-primary border-b-primary font-semibold" : "hover:text-foreground"
            }`}
            onClick={() => setActiveLeftRailSurface("advanced")}
          >
            Advanced
          </button>
        </nav>
        <section className="min-h-0 overflow-auto grid" aria-live="polite">
          {activeLeftRailSurface === "conversations" && (
            <>
              <ul className="m-0 p-0 list-none grid gap-2">
                {conversations.map((conversation) => (
                  <li key={conversation.conversation_id}>
                    <button
                      type="button"
                      className={`w-full text-left border rounded-xl py-2.5 px-3 cursor-pointer font-inherit transition-all ${
                        conversation.conversation_id === activeConversationId
                          ? "border-primary bg-[#fff2e6] text-foreground shadow-[inset_0_0_0_1px_#efbe91]"
                          : "border-border bg-white text-muted-foreground hover:border-[#efbe91] hover:text-foreground"
                      }`}
                      onClick={() => void activateConversation(conversation.conversation_id)}
                    >
                      {conversation.title}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="grid gap-2">
                <button
                  type="button"
                  className="border border-border bg-white text-foreground rounded-lg py-2 px-2.5 font-inherit cursor-pointer transition-all hover:border-[#efbe91] hover:bg-[#fff8f2] disabled:opacity-55 disabled:cursor-not-allowed"
                  onClick={() => void createConversation()}
                  disabled={isSending || isResetting}
                >
                  + New Conversation
                </button>
              </div>
            </>
          )}
          {activeLeftRailSurface === "settings" && (
            <div className="grid gap-2.5 min-h-0">
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
            <div className="grid gap-2.5 min-h-0">
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
            <div className="grid gap-2.5 min-h-0">
              <div className="grid gap-2.5">
                <p className="m-0 text-sm text-foreground">Release channel: {channelLabel}. Change it in Settings.</p>
                <button
                  type="button"
                  className="border border-[#cc7748] bg-[#fff1e8] text-destructive rounded-lg py-2 px-2.5 font-inherit cursor-pointer transition-all hover:bg-[#ffe4d8] hover:border-[#b85a2a] disabled:opacity-55 disabled:cursor-not-allowed"
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

      <section className="border border-border rounded-2xl bg-panel shadow-sm grid grid-rows-[auto_1fr_auto] min-h-0">
        <header className="flex justify-between items-center border-b border-border py-3.5 px-4">
          <div>
            <p className="m-0 text-base font-bold">Local Desktop Chat</p>
            <p className="mt-0.5 text-muted-foreground text-[0.88rem]">Local AI chat · {channelLabel} channel</p>
          </div>
        </header>
        {runtimeIssue && runtimeIssue.kind === "api_key_not_set" && (
          <section role="status" className="rounded-lg m-3 mt-0 mx-4 py-2.5 px-3 text-[0.9rem] flex items-center justify-between gap-3">
            <div className="grid gap-0.5">
              <p className="m-0 font-semibold">Add your OpenAI API key in Settings to start chatting.</p>
              <p className="m-0">Open Settings and add your API key in the Connections section.</p>
            </div>
            <button
              type="button"
              className="border border-[#cb5627] rounded-lg bg-[#fff7f3] text-destructive font-semibold py-1.5 px-3 cursor-pointer transition-colors hover:bg-[#ffe8de] disabled:opacity-55 disabled:cursor-not-allowed"
              onClick={() => setActiveLeftRailSurface("settings")}
            >
              Open Settings
            </button>
          </section>
        )}
        {runtimeIssue && runtimeIssue.kind !== "api_key_not_set" && (
          <section
            role="status"
            className={`rounded-lg m-3 mt-0 mx-4 py-2.5 px-3 text-[0.9rem] flex items-center justify-between gap-3 ${
              runtimeIssue.kind === "offline"
                ? "border border-[#f4a58b] bg-[#ffe4dd] text-destructive"
                : "border border-[#dfbe78] bg-[#fff7e6] text-[#6b4e00]"
            }`}
          >
            <div className="grid gap-0.5">
              <p className="m-0 font-semibold">The local runtime is not running.</p>
              <p className="m-0">
                {runtimeIssue.kind === "offline"
                  ? "Start it, then press Retry."
                  : `Runtime responded with an error: ${runtimeIssue.detail}`}
              </p>
            </div>
            <button
              type="button"
              className="border border-[#cb5627] rounded-lg bg-[#fff7f3] text-destructive font-semibold py-1.5 px-3 cursor-pointer transition-colors hover:bg-[#ffe8de] disabled:opacity-55 disabled:cursor-not-allowed"
              disabled={!canRetry}
              onClick={() => void retryRuntime()}
            >
              Retry
            </button>
          </section>
        )}

        <div className="overflow-auto p-4 grid gap-3 content-start" aria-live="polite">
          {diagnosticsEnabled && (
            <section className="border border-[#9ebf97] bg-[#effbe8] rounded-xl py-2.5 px-3 grid gap-0.5" aria-label="Runtime diagnostics">
              <p className="m-0 text-sm">Runtime diagnostics enabled</p>
              <p className="m-0 text-sm">Conversations: {conversations.length}</p>
              <p className="m-0 text-sm">Messages in view: {messages.length}</p>
            </section>
          )}
          {isBooting && (
            <div className="empty-state border border-dashed border-border rounded-xl p-4 text-muted-foreground bg-[#fffaf0]">
              <p className="m-0 mb-2">Loading local state...</p>
            </div>
          )}
          {!hasMessages && !isBooting && (
            <div className="empty-state border border-dashed border-border rounded-xl p-4 text-muted-foreground bg-[#fffaf0]">
              <p className="m-0 mb-2">Your local AI assistant.</p>
              <p className="m-0 mb-2">
                {!apiKeyConfigured
                  ? "Add your OpenAI API key in Settings to start chatting."
                  : isRuntimeOffline
                    ? "Start the runtime, then send your first message."
                    : "Type your first message below."}
              </p>
              {!apiKeyConfigured && (
                <button
                  type="button"
                  className="border border-border bg-white text-foreground rounded-lg py-2 px-2.5 font-inherit cursor-pointer transition-all hover:border-[#efbe91] hover:bg-[#fff8f2] disabled:opacity-55 disabled:cursor-not-allowed"
                  onClick={() => setActiveLeftRailSurface("settings")}
                >
                  Open Settings
                </button>
              )}
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`border rounded-xl py-3 px-3.5 max-w-[700px] bg-white ${
                message.role === "user"
                  ? "ml-auto bg-[#fff2e6]"
                  : "border-[#c8d3c1] bg-[#f8fff5]"
              }`}
            >
              <p className="m-0 mb-1 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                {message.role === "user" ? "You" : "Assistant"}
              </p>
              <p className="m-0 text-[0.9375rem] leading-relaxed whitespace-pre-wrap">{message.text}</p>
              {message.meta && <p className="mt-1.5 text-muted-foreground text-xs m-0">{message.meta}</p>}
            </article>
          ))}
          {streamingText.length > 0 && (
            <article className="border border-[#c8d3c1] rounded-xl py-3 px-3.5 max-w-[700px] bg-[#f8fff5]">
              <p className="m-0 mb-1 text-xs font-semibold tracking-wide uppercase text-muted-foreground">Assistant</p>
              <p className="m-0 text-[0.9375rem] leading-relaxed whitespace-pre-wrap">
                {streamingText}
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary animate-[streaming-blink_0.8s_step-end_infinite] align-text-bottom" aria-hidden="true" />
              </p>
            </article>
          )}
          <div ref={transcriptEndRef} aria-hidden="true" />
        </div>

        <footer className="border-t border-border py-3 px-4 pb-4">
          <label htmlFor="composer" className="sr-only">
            Message composer
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="composer"
              ref={inputRef}
              value={composer}
              className="flex-1 resize-none min-h-0 max-h-[120px] rounded-lg border border-border py-2.5 px-3 font-inherit text-[0.9375rem] leading-snug bg-white overflow-y-auto transition-colors focus:outline-none focus:border-[#efbe91] focus:ring-2 focus:ring-[#efbe91]/50 focus:ring-offset-2"
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
            <button
              type="button"
              className="shrink-0 border border-primary rounded-lg bg-primary text-primary-foreground font-bold text-sm py-2.5 px-4 cursor-pointer transition-colors hover:bg-[#b84a1c] hover:border-[#b84a1c] disabled:opacity-45 disabled:cursor-not-allowed"
              disabled={!canSend}
              onClick={() => void sendMessage()}
            >
              {isSending ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin align-middle" aria-label="Sending" />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
