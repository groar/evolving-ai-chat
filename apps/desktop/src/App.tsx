import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { PanelLeftIcon, PencilIcon, SettingsIcon } from "lucide-react";
import { FeedbackPanel } from "./feedbackPanel";
import { MarkdownMessage } from "./MarkdownMessage";
import { PatchNotification } from "./PatchNotification";
import { SettingsPanel } from "./settingsPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "./components/ui/sheet";
import { useConversationStore } from "./stores/conversationStore";
import { useRuntimeStore } from "./stores/runtimeStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useFeedback } from "./hooks/useFeedback";
import { useRuntime, offlineStateRetryIntervalMs, shouldAutoRetryOfflineState } from "./hooks/useRuntime";
import { useConversations } from "./hooks/useConversations";
import type { RuntimeIssue } from "./stores/runtimeStore";

const appName = "Evolving AI Chat";
const diagnosticsFlagKey = "show_runtime_diagnostics";

export { offlineStateRetryIntervalMs, shouldAutoRetryOfflineState };

export function isApiKeyNotSet(runtimeIssue: RuntimeIssue | null): boolean {
  return runtimeIssue?.kind === "api_key_not_set";
}

export function App() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const feedbackSectionRef = useRef<HTMLElement>(null);

  const runtime = useRuntime();
  const { requestPatch, rollbackPatch } = runtime;
  const { conversations, activeConversationId, messages, createConversation, activateConversation } = useConversations();
  const { updateConversationTitle } = runtime;

  const runtimeIssue = useRuntimeStore((s) => s.runtimeIssue);
  const isBooting = useRuntimeStore((s) => s.isBooting);
  const isResetting = useRuntimeStore((s) => s.isResetting);
  const apiKeyConfigured = useRuntimeStore((s) => s.apiKeyConfigured);
  const apiKeys = useRuntimeStore((s) => s.apiKeys);
  const models = useRuntimeStore((s) => s.models);
  const conversationCostTotal = useRuntimeStore((s) => s.conversationCostTotal);
  const selectedModelId = useRuntimeStore((s) => s.selectedModelId);
  const apiKeyError = useRuntimeStore((s) => s.apiKeyError);
  const isSavingApiKey = useRuntimeStore((s) => s.isSavingApiKey);

  const composer = useConversationStore((s) => s.composer);
  const setComposer = useConversationStore((s) => s.setComposer);
  const isSending = useConversationStore((s) => s.isSending);
  const streamingText = useConversationStore((s) => s.streamingText);

  const settings = useSettingsStore((s) => s.settings);
  const changelog = useSettingsStore((s) => s.changelog);
  const proposals = useSettingsStore((s) => s.proposals);
  const personaAdditions = useSettingsStore((s) => s.personaAdditions);
  const patches = useSettingsStore((s) => s.patches);
  const notificationPatchId = useSettingsStore((s) => s.notificationPatchId);
  const setNotificationPatchId = useSettingsStore((s) => s.setNotificationPatchId);
  const settingsNotice = useSettingsStore((s) => s.settingsNotice);
  const settingsError = useSettingsStore((s) => s.settingsError);
  const isProposalBusy = useSettingsStore((s) => s.isProposalBusy);

  const isFeedbackBusy = isSending || isResetting;
  const feedback = useFeedback(isFeedbackBusy);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingGenerateFeedbackId, setPendingGenerateFeedbackId] = useState<string | null>(null);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.conversation_id === activeConversationId),
    [conversations, activeConversationId]
  );
  const topBarTitle = activeConversation?.title ?? appName;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (streamingText.length > 0) {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingText]);

  // When opening settings from the per-message Improve button, scroll to the right section.
  // If there are captured feedback items, scroll to Improvements so user can generate a suggestion.
  useEffect(() => {
    if (!settingsOpen || !feedback.isOpen || !feedback.contextPointer?.includes(":")) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      const target =
        feedback.items.length > 0
          ? document.getElementById("settings-improvements")
          : feedbackSectionRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [settingsOpen, feedback.isOpen, feedback.contextPointer, feedback.items.length]);

  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setSettingsOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const notificationPatch = useMemo(
    () => patches.find((p) => p.id === notificationPatchId) ?? null,
    [patches, notificationPatchId]
  );

  const hasMessages = messages.length > 0;
  const isRuntimeOffline = runtimeIssue?.kind === "offline";
  const selectedModel = useMemo(
    () => models.find((m) => m.model_id === selectedModelId) ?? models[0],
    [models, selectedModelId]
  );
  const hasKeyForSelectedModel =
    selectedModel && apiKeys[selectedModel.provider as keyof typeof apiKeys];
  const canSend =
    composer.trim().length > 0 &&
    !isSending &&
    activeConversationId.length > 0 &&
    !isRuntimeOffline &&
    apiKeyConfigured &&
    hasKeyForSelectedModel;
  const diagnosticsEnabled = Boolean(settings.active_flags[diagnosticsFlagKey]);
  const canRetry = !isSending && !isResetting;
  const canToggleFlags = settings.channel === "experimental" && !isSending && !isResetting;
  const configuredDiagnosticsFlag = Boolean(settings.experimental_flags[diagnosticsFlagKey]);

  function openSettings() {
    setSettingsOpen(true);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void runtime.sendMessage(inputRef);
    }
  }

  return (
    <main className="app-shell grid grid-cols-1 gap-0 h-screen min-h-screen">
      {/* Conversation sidebar (collapsible) */}
      <Sheet
        open={sidebarOpen}
        onOpenChange={(open) => {
          setSidebarOpen(open);
          if (!open) {
            setEditingConversationId(null);
            setRenameError(null);
          }
        }}
      >
        <SheetContent side="left" className="w-[min(360px,85vw)] p-0 flex flex-col" showCloseButton={true}>
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-border shrink-0">
            <SheetTitle>Conversations</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-3 border-b border-border shrink-0">
            <button
              type="button"
              className="w-full border border-border bg-white text-foreground rounded-lg py-2 px-2.5 font-inherit cursor-pointer transition-all hover:border-[#efbe91] hover:bg-[#fff8f2] disabled:opacity-55 disabled:cursor-not-allowed"
              onClick={() => {
                void createConversation();
                setSidebarOpen(false);
              }}
              disabled={isSending || isResetting}
            >
              + New Conversation
            </button>
          </div>
          <section className="min-h-0 overflow-auto p-4 grid gap-2" aria-live="polite">
            <ul className="m-0 p-0 list-none grid gap-2">
              {conversations.map((conversation) => (
                <li key={conversation.conversation_id} className="grid gap-0.5">
                  {editingConversationId === conversation.conversation_id ? (
                    <div className="grid gap-1">
                      <input
                        type="text"
                        value={renameDraft}
                        onChange={(e) => {
                          setRenameDraft(e.target.value);
                          setRenameError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void (async () => {
                              const result = await updateConversationTitle(
                                conversation.conversation_id,
                                renameDraft
                              );
                              if (result.ok) {
                                setEditingConversationId(null);
                                setRenameDraft("");
                                setRenameError(null);
                              } else {
                                setRenameError(result.error ?? "Rename failed");
                              }
                            })();
                          }
                          if (e.key === "Escape") {
                            setEditingConversationId(null);
                            setRenameDraft("");
                            setRenameError(null);
                          }
                        }}
                        className="w-full border border-border rounded-lg py-2 px-3 text-[0.9375rem] font-inherit bg-white focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:border-[#efbe91]"
                        placeholder="Conversation title"
                        autoFocus
                        aria-label="Rename conversation"
                      />
                      {renameError && (
                        <p className="m-0 text-xs text-destructive">{renameError}</p>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`flex items-center gap-2 w-full border rounded-xl py-2.5 px-3 transition-all ${
                        conversation.conversation_id === activeConversationId
                          ? "border-primary bg-[#fff2e6] shadow-[inset_0_0_0_1px_#efbe91]"
                          : "border-border bg-white hover:border-[#efbe91]"
                      }`}
                    >
                      <button
                        type="button"
                        className={`flex-1 min-w-0 text-left font-inherit cursor-pointer truncate ${
                          conversation.conversation_id === activeConversationId
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => {
                          void activateConversation(conversation.conversation_id);
                          setSidebarOpen(false);
                        }}
                      >
                        {conversation.title}
                      </button>
                      <button
                        type="button"
                        className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-[#fff8f2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#efbe91]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConversationId(conversation.conversation_id);
                          setRenameDraft(conversation.title);
                          setRenameError(null);
                        }}
                        aria-label={`Rename ${conversation.title}`}
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </SheetContent>
      </Sheet>

      {/* Settings sheet (Settings, Improve, Danger Zone) */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-[min(400px,90vw)] overflow-y-auto flex flex-col bg-panel border-l border-border">
          <SheetHeader className="px-5 pt-5 pb-2 shrink-0">
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 pb-8 px-5">
            <SettingsPanel
              settings={settings}
              changelog={changelog}
              proposals={proposals}
              personaAdditions={personaAdditions}
              patches={patches}
              feedbackItems={feedback.items.map((item) => ({ id: item.id, text: item.text, tags: item.tags }))}
              pendingGenerateFeedbackId={pendingGenerateFeedbackId}
              onClearPendingGenerate={() => setPendingGenerateFeedbackId(null)}
              isBusy={isSending || isResetting || isProposalBusy}
              canToggleFlags={canToggleFlags}
              configuredDiagnosticsFlag={configuredDiagnosticsFlag}
              notice={settingsNotice}
              error={settingsError}
              confirmAction={(prompt) => window.confirm(prompt)}
              onRefresh={() => void runtime.refreshState(activeConversationId)}
              onSelectChannel={(channel) => void runtime.updateChannel(channel)}
              onToggleDiagnostics={(enabled) => void runtime.updateExperimentalFlag(enabled)}
              onResetExperiments={() => void runtime.resetExperiments()}
              onCreateProposal={(input) => void runtime.createProposal(input)}
              onAddValidationRun={(proposalId, input) => void runtime.addProposalValidationRun(proposalId, input)}
              onUpdateProposalDecision={(proposalId, status, notes, proposal) =>
                void runtime.updateProposalDecision(proposalId, status, notes, proposal)
              }
              onRemovePersonaAddition={(index) => void runtime.removePersonaAddition(index)}
              onRollbackPatch={(patchId) => void rollbackPatch(patchId)}
              apiKeys={apiKeys}
              onSaveApiKey={(provider, key) => void runtime.saveApiKey(provider, key)}
              onRemoveApiKey={(provider) => void runtime.removeApiKey(provider)}
              apiKeyError={apiKeyError}
              isSavingApiKey={isSavingApiKey}
            />
            <section ref={feedbackSectionRef} className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold mb-2">Improve</h3>
              <FeedbackPanel
                isOpen={feedback.isOpen}
                isBusy={isFeedbackBusy}
                draftText={feedback.draftText}
                selectedTags={feedback.tags}
                contextPointer={feedback.contextPointer}
                items={feedback.items}
                notice={feedback.notice}
                error={feedback.error}
                onToggleOpen={() => {
                  if (feedback.isOpen) feedback.clearPendingContext();
                  feedback.setIsOpen((o) => !o);
                }}
                onChangeDraftText={feedback.setDraftText}
                onToggleTag={feedback.toggleTag}
                onSubmitFeedback={feedback.submitFeedback}
                onGenerateFromFeedback={(id) => {
                  setPendingGenerateFeedbackId(id);
                  document.getElementById("settings-improvements")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
                }}
              onRequestCodePatch={(feedbackId, feedbackTitle, feedbackSummary) => {
                  void requestPatch(feedbackId, feedbackTitle, feedbackSummary, "ui");
                }}
              />
            </section>
            <section className="border-t border-border pt-4">
              <details className="group grid gap-2.5" name="settings-danger-zone">
                <summary className="cursor-pointer text-sm font-semibold text-destructive">Danger Zone</summary>
                <div className="grid gap-2.5 pl-0">
                  <button
                    type="button"
                    className="border border-[#cc7748] bg-[#fff1e8] text-destructive rounded-lg py-2 px-2.5 font-inherit cursor-pointer transition-all hover:bg-[#ffe4d8] hover:border-[#b85a2a] disabled:opacity-55 disabled:cursor-not-allowed"
                    onClick={() => void runtime.deleteLocalData(inputRef, feedback.clearAll)}
                    disabled={isSending || isResetting}
                  >
                    {isResetting ? "Resetting..." : "Delete Local Data"}
                  </button>
                </div>
              </details>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Chat pane (primary, fills the window) */}
      <section className="border border-border rounded-2xl bg-panel shadow-sm grid grid-rows-[auto_1fr_auto] min-h-0 mx-4 my-4">
        <header className="flex items-center gap-2 border-b border-border py-3.5 px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#fff8f2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2"
            aria-label="Toggle conversation list (Cmd+B)"
          >
            <PanelLeftIcon className="size-5" />
          </button>
          <h1 className="m-0 flex-1 text-base font-bold truncate">{topBarTitle}</h1>
          {typeof conversationCostTotal === "number" && conversationCostTotal > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground" title="Approximate conversation cost">
              ~${conversationCostTotal >= 0.01 ? conversationCostTotal.toFixed(2) : conversationCostTotal.toFixed(4)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#fff8f2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2"
            aria-label="Open Settings (Cmd+,)"
          >
            <SettingsIcon className="size-5" />
          </button>
        </header>

        {runtimeIssue && runtimeIssue.kind === "api_key_not_set" && (
          <section role="status" className="rounded-lg m-3 mt-0 mx-4 py-2.5 px-3 text-[0.9rem] flex items-center justify-between gap-3">
            <div className="grid gap-0.5">
              <p className="m-0 font-semibold">Add your API key in Settings to start chatting.</p>
              <p className="m-0">Open Settings and add your API key in the Connections section.</p>
            </div>
            <button
              type="button"
              className="border border-[#cb5627] rounded-lg bg-[#fff7f3] text-destructive font-semibold py-1.5 px-3 cursor-pointer transition-colors hover:bg-[#ffe8de] disabled:opacity-55 disabled:cursor-not-allowed"
              onClick={openSettings}
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
              <p className="m-0 font-semibold">
                {runtimeIssue.kind === "offline"
                  ? "Can't reach the assistant."
                  : "The assistant returned an error."}
              </p>
              <p className="m-0">
                {runtimeIssue.kind === "offline"
                  ? "Check if it's running, then press Retry."
                  : runtimeIssue.detail}
              </p>
            </div>
            <button
              type="button"
              className="border border-[#cb5627] rounded-lg bg-[#fff7f3] text-destructive font-semibold py-1.5 px-3 cursor-pointer transition-colors hover:bg-[#ffe8de] disabled:opacity-55 disabled:cursor-not-allowed"
              disabled={!canRetry}
              onClick={() => void runtime.retryRuntime()}
            >
              Retry
            </button>
          </section>
        )}

        <div className="overflow-auto p-4 grid gap-3 content-start" aria-live="polite">
          {diagnosticsEnabled && (
            <section className="border border-[#9ebf97] bg-[#effbe8] rounded-xl py-2.5 px-3 grid gap-0.5" aria-label="Behind-the-scenes info">
              <p className="m-0 text-sm">Behind-the-scenes info</p>
              <p className="m-0 text-sm">Conversations: {conversations.length}</p>
              <p className="m-0 text-sm">Messages in view: {messages.length}</p>
            </section>
          )}
          {isBooting && (
            <div className="empty-state border border-dashed border-border rounded-xl p-4 text-muted-foreground bg-[#fffaf0]">
              <p className="m-0 mb-2">Loading...</p>
            </div>
          )}
          {!hasMessages && !isBooting && (
            <div className="empty-state border border-dashed border-border rounded-xl p-4 text-muted-foreground bg-[#fffaf0]">
              <p className="m-0 mb-2">What's on your mind?</p>
              <p className="m-0 mb-2">
                {!apiKeyConfigured
                  ? "Add your API key in Settings to start chatting."
                  : isRuntimeOffline
                    ? "Can't reach the assistant — check if it's running, then send your first message."
                    : "Start a conversation — type your message below."}
              </p>
              {!apiKeyConfigured && (
                <button
                  type="button"
                  className="border border-border bg-white text-foreground rounded-lg py-2 px-2.5 font-inherit cursor-pointer transition-all hover:border-[#efbe91] hover:bg-[#fff8f2] disabled:opacity-55 disabled:cursor-not-allowed"
                  onClick={openSettings}
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
              <div className="flex justify-between items-start gap-2">
                <p className="m-0 mb-1 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  {message.role === "user" ? "You" : "Assistant"}
                </p>
                {message.role === "assistant" && (
                  <button
                    type="button"
                    className="shrink-0 text-xs text-muted-foreground hover:text-foreground underline focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-1 rounded"
                    aria-label="Help improve this software"
                    onClick={() => {
                      setSettingsOpen(true);
                      feedback.openFeedbackForMessage(activeConversationId, message.id);
                    }}
                  >
                    Improve
                  </button>
                )}
              </div>
              {message.role === "assistant" ? (
                <MarkdownMessage text={message.text} />
              ) : (
                <p className="m-0 text-[0.9375rem] leading-relaxed whitespace-pre-wrap">{message.text}</p>
              )}
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
          <div className="flex items-center gap-2 mb-2">
            {models.length > 0 && (
              <>
                <label htmlFor="model-select" className="text-xs text-muted-foreground shrink-0">
                  Model
                </label>
                <select
                  id="model-select"
                  className="text-xs border border-border rounded-lg bg-white py-1.5 px-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[#efbe91]/50"
                  value={selectedModelId}
                  onChange={(e) => void runtime.setSelectedModel(e.target.value)}
                >
                  {models.map((m) => (
                    <option key={m.model_id} value={m.model_id}>
                      {m.display_name}
                      {!apiKeys[m.provider as keyof typeof apiKeys] ? " (no key)" : ""}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
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
                  : !hasKeyForSelectedModel
                    ? "Add API key for this model in Settings."
                    : isRuntimeOffline
                      ? "Can't reach the assistant — check your connection."
                      : "Type a message..."
              }
              rows={1}
              disabled={isRuntimeOffline || !apiKeyConfigured || !hasKeyForSelectedModel}
              onChange={(event) => setComposer(event.target.value)}
              onKeyDown={handleComposerKeyDown}
            />
            <button
              type="button"
              className="shrink-0 border border-primary rounded-lg bg-primary text-primary-foreground font-bold text-sm py-2.5 px-4 cursor-pointer transition-colors hover:bg-[#b84a1c] hover:border-[#b84a1c] disabled:opacity-45 disabled:cursor-not-allowed"
              disabled={!canSend}
              onClick={() => void runtime.sendMessage(inputRef)}
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
      {/* M8 patch notification — floating banner for in-flight and terminal patch states */}
      {notificationPatch && (
        <PatchNotification
          patch={notificationPatch}
          onUndo={(patchId) => void rollbackPatch(patchId)}
          onDismiss={() => setNotificationPatchId(null)}
        />
      )}
    </main>
  );
}
