import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { HistoryIcon, PanelLeftIcon, PencilIcon, SettingsIcon, SparklesIcon } from "lucide-react";
import { FeedbackPanel } from "./feedbackPanel";
import { MarkdownMessage } from "./MarkdownMessage";
import { PatchNotification } from "./PatchNotification";
import { RefinementConversation } from "./RefinementConversation";
import { useRefinement } from "./hooks/useRefinement";
import { ActivitySheet } from "./activitySheet";
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
import { useRuntime, offlineStateRetryIntervalMs, shouldAutoRetryOfflineState, type AssistantRerunVariant } from "./hooks/useRuntime";
import { useConversations } from "./hooks/useConversations";
import type { RuntimeIssue } from "./stores/runtimeStore";

const appName = "Evolving AI Chat — your personal assistant";
const diagnosticsFlagKey = "show_runtime_diagnostics";

export { offlineStateRetryIntervalMs, shouldAutoRetryOfflineState };

export function isApiKeyNotSet(runtimeIssue: RuntimeIssue | null): boolean {
  return runtimeIssue?.kind === "api_key_not_set";
}

export function App() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const runtime = useRuntime();
  const { requestPatch, rollbackPatch, reloadingPatchId } = runtime;
  const refinement = useRefinement();
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
  const patches = useSettingsStore((s) => s.patches);
  const notificationPatchId = useSettingsStore((s) => s.notificationPatchId);
  const setNotificationPatchId = useSettingsStore((s) => s.setNotificationPatchId);
  const settingsNotice = useSettingsStore((s) => s.settingsNotice);
  const settingsError = useSettingsStore((s) => s.settingsError);
  const isRequestingPatch = useSettingsStore((s) => s.isRequestingPatch);

  const patchInProgress = patches.some((p) =>
    ["pending_apply", "pending", "applying", "retrying", "reverting"].includes(p.status)
  );
  const isFeedbackBusy =
    isSending || isResetting || isRequestingPatch || patchInProgress;
  const feedback = useFeedback(isFeedbackBusy);
  const improvementSheetPatchNotice =
    isRequestingPatch ? "Starting code change…" : patchInProgress ? "Code change in progress…" : null;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [improvementSheetOpen, setImprovementSheetOpen] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [assistantVariants, setAssistantVariants] = useState<Record<number, AssistantRerunVariant[]>>({});
  const [activeVariantIndex, setActiveVariantIndex] = useState<Record<number, number>>({});
  const [rerunningMessageId, setRerunningMessageId] = useState<number | null>(null);

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

  useEffect(() => {
    setAssistantVariants((prev) => {
      const next: Record<number, AssistantRerunVariant[]> = {};
      for (const message of messages) {
        if (message.role !== "assistant" || typeof message.id !== "number") continue;
        next[message.id] = prev[message.id] ?? [
          {
            assistant_message_id: message.id,
            reply: message.text,
            model_id: "original",
            created_at: "",
            cost: 0
          }
        ];
      }
      return next;
    });
    setActiveVariantIndex((prev) => {
      const next: Record<number, number> = {};
      for (const message of messages) {
        if (message.role !== "assistant" || typeof message.id !== "number") continue;
        next[message.id] = prev[message.id] ?? 0;
      }
      return next;
    });
  }, [messages]);

  // When opening the improvement sheet, show the form and focus the textarea.
  useEffect(() => {
    if (!improvementSheetOpen) return;
    feedback.setIsOpen(true);
    const timeoutId = window.setTimeout(() => {
      document.getElementById("feedback-input")?.focus();
    }, 150);
    return () => window.clearTimeout(timeoutId);
  }, [improvementSheetOpen]);

  // When opening the Activity sheet, refresh state so Fix with AI patches are visible (T-0096).
  useEffect(() => {
    if (!activitySheetOpen) return;
    void runtime.refreshState(activeConversationId);
  }, [activitySheetOpen, runtime.refreshState, activeConversationId]);

  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setActivitySheetOpen(false);
        setSettingsOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        setSettingsOpen(false);
        setActivitySheetOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const notificationPatch = useMemo(
    () => patches.find((p) => p.id === notificationPatchId) ?? null,
    [patches, notificationPatchId]
  );

  // T-0101: patch for current refinement so terminal status is visible in the same flow.
  const refinementActivePatch = useMemo(() => {
    const fid = refinement.feedbackInfo?.feedbackId;
    if (!fid) return null;
    const refinementConversationId = refinement.conversationId;
    const feedbackMatches = patches.filter((p) => p.feedback_id === fid);
    if (feedbackMatches.length === 0) return null;
    if (refinementConversationId) {
      const exactMatch = feedbackMatches.find(
        (p) => p.refinement_conversation_id === refinementConversationId
      );
      if (exactMatch) return exactMatch;
    }
    return feedbackMatches[0] ?? null;
  }, [patches, refinement.feedbackInfo?.feedbackId, refinement.conversationId]);

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

  function startRenameConversation(conversationId: string, title: string) {
    setEditingConversationId(conversationId);
    setRenameDraft(title);
    setRenameError(null);
  }

  function cancelRenameConversation() {
    setEditingConversationId(null);
    setRenameDraft("");
    setRenameError(null);
  }

  async function submitRenameConversation(conversationId: string) {
    const result = await updateConversationTitle(conversationId, renameDraft);
    if (result.ok) {
      cancelRenameConversation();
      return;
    }
    setRenameError(result.error ?? "Rename failed");
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
                              await submitRenameConversation(conversation.conversation_id);
                            })();
                          }
                          if (e.key === "Escape") {
                            cancelRenameConversation();
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
                          startRenameConversation(conversation.conversation_id, conversation.title);
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

      {/* Improvement sheet (Suggest an improvement — independent of Settings) */}
      <Sheet open={improvementSheetOpen} onOpenChange={setImprovementSheetOpen}>
        <SheetContent side="right" className="w-[min(400px,90vw)] overflow-y-auto flex flex-col bg-panel border-l border-border" data-testid="improvement-sheet">
          <SheetHeader className="px-5 pt-5 pb-2 shrink-0">
            <SheetTitle>Suggest an improvement</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 pb-8 px-5">
            {settingsError && (
              <p role="alert" className="m-0 border border-[#f4a58b] rounded-lg bg-[#fff0ea] text-destructive text-xs py-2 px-2.5">
                {settingsError}
              </p>
            )}
            {settingsNotice && !settingsError && (
              <p role="status" className="m-0 border border-[#9ebf97] rounded-lg bg-[#effbe8] text-[#2e5a2b] text-xs py-2 px-2.5">
                {settingsNotice}
              </p>
            )}
            <FeedbackPanel
              isOpen={feedback.isOpen}
              isBusy={isFeedbackBusy}
              draftText={feedback.draftText}
              selectedTags={feedback.tags}
              contextPointer={feedback.contextPointer}
              items={feedback.items}
              notice={improvementSheetPatchNotice ?? feedback.notice}
              error={feedback.error}
              onToggleOpen={() => {
                if (feedback.isOpen) feedback.clearPendingContext();
                feedback.setIsOpen((o) => !o);
              }}
              onChangeDraftText={feedback.setDraftText}
              onToggleTag={feedback.toggleTag}
              onSubmitFeedback={feedback.submitFeedback}
              onRequestCodePatch={(feedbackId, feedbackTitle, feedbackSummary) => {
                setImprovementSheetOpen(false);
                void refinement.start(feedbackId, feedbackTitle, feedbackSummary, "ui");
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Activity sheet (patch + release history) */}
      <ActivitySheet
        open={activitySheetOpen}
        onOpenChange={setActivitySheetOpen}
        patches={patches}
        changelog={changelog}
        isBusy={isSending || isResetting}
        onRollbackPatch={(patchId) => rollbackPatch(patchId)}
        onOpenRefinement={(feedbackId, feedbackTitle) => {
          setActivitySheetOpen(false);
          void refinement.start(feedbackId, feedbackTitle, "", "ui");
        }}
      />

      {/* Settings sheet */}
      <Sheet
        open={settingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (open) setActivitySheetOpen(false);
        }}
      >
        <SheetContent side="right" className="w-[min(400px,90vw)] overflow-y-auto flex flex-col bg-panel border-l border-border">
          <SheetHeader className="px-5 pt-5 pb-2 shrink-0">
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 pb-8 px-5">
            <SettingsPanel
              settings={settings}
              changelog={changelog}
              patches={patches}
              isBusy={isSending || isResetting}
              isResetting={isResetting}
              canToggleFlags={canToggleFlags}
              configuredDiagnosticsFlag={configuredDiagnosticsFlag}
              notice={settingsNotice}
              error={settingsError}
              confirmAction={(prompt) => window.confirm(prompt)}
              onRefresh={() => void runtime.refreshState(activeConversationId)}
              onSelectChannel={(channel) => void runtime.updateChannel(channel)}
              onToggleDiagnostics={(enabled) => void runtime.updateExperimentalFlag(enabled)}
              onResetExperiments={() => void runtime.resetExperiments()}
              onRollbackPatch={(patchId) => void rollbackPatch(patchId)}
              onOpenActivity={() => {
                setSettingsOpen(false);
                setActivitySheetOpen(true);
              }}
              onDeleteLocalData={() => void runtime.deleteLocalData(inputRef, feedback.clearAll)}
              apiKeys={apiKeys}
              onSaveApiKey={(provider, key) => void runtime.saveApiKey(provider, key)}
              onRemoveApiKey={(provider) => void runtime.removeApiKey(provider)}
              apiKeyError={apiKeyError}
              isSavingApiKey={isSavingApiKey}
            />
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
          {activeConversation && editingConversationId === activeConversation.conversation_id ? (
            <div className="flex-1 min-w-0 grid gap-1">
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
                    void submitRenameConversation(activeConversation.conversation_id);
                  }
                  if (e.key === "Escape") {
                    cancelRenameConversation();
                  }
                }}
                className="w-full border border-border rounded-lg py-1.5 px-2.5 text-sm font-inherit bg-white focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:border-[#efbe91]"
                placeholder="Conversation title"
                autoFocus
                aria-label="Rename current conversation"
              />
              {renameError && <p className="m-0 text-xs text-destructive">{renameError}</p>}
            </div>
          ) : (
            <h1 className="m-0 flex-1 text-base font-bold truncate">{topBarTitle}</h1>
          )}
          {editingConversationId !== activeConversationId && (
            <button
              type="button"
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#fff8f2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2"
              onClick={() => activeConversation && startRenameConversation(activeConversation.conversation_id, activeConversation.title)}
              aria-label="Rename current conversation"
            >
              <PencilIcon className="size-4" />
            </button>
          )}
          {typeof conversationCostTotal === "number" && conversationCostTotal > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground" title="Approximate conversation cost">
              ~${conversationCostTotal >= 0.01 ? conversationCostTotal.toFixed(2) : conversationCostTotal.toFixed(4)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setImprovementSheetOpen(true)}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#fff8f2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2"
            aria-label="Suggest an improvement"
          >
            <SparklesIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSettingsOpen(false);
              setActivitySheetOpen(true);
            }}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#fff8f2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2"
            aria-label="Open Activity (Cmd+H)"
          >
            <HistoryIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActivitySheetOpen(false);
              setSettingsOpen(true);
            }}
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

        {refinement.isActive ? (
          <RefinementConversation
            messages={refinement.messages}
            streamingText={refinement.streamingText}
            isSending={refinement.isSending}
            isLoading={refinement.isLoading}
            isRequestingPatch={isRequestingPatch}
            error={refinement.error}
            feedbackTitle={refinement.feedbackInfo?.feedbackTitle ?? ""}
            activePatch={refinementActivePatch}
            onSendMessage={(text) => void refinement.sendMessage(text)}
            onRunAgent={(description) => {
              if (isRequestingPatch || patchInProgress) return;
              const info = refinement.feedbackInfo;
              if (!info) return;
              const convId = refinement.conversationId;
              // T-0097: keep refinement view open so progress is visible there; do not call refinement.cancel()
              void requestPatch(
                info.feedbackId,
                info.feedbackTitle,
                info.feedbackSummary,
                info.feedbackArea,
                { raw_description: description, refinement_conversation_id: convId }
              );
            }}
            onEdit={() => {
              // Edit: just focus the refinement composer (already open)
            }}
            onCancel={() => refinement.cancel()}
          />
        ) : (
          <>
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

              {messages.map((message) => {
                const variants =
                  message.role === "assistant" && typeof message.id === "number"
                    ? assistantVariants[message.id] ?? []
                    : [];
                const activeIdx =
                  message.role === "assistant" && typeof message.id === "number"
                    ? activeVariantIndex[message.id] ?? 0
                    : 0;
                const activeVariant = variants[activeIdx];
                const displayText = activeVariant?.reply ?? message.text;
                const displayMeta =
                  message.role === "assistant" && activeVariant && activeIdx > 0
                    ? `${activeVariant.model_id} rerun`
                    : message.meta;

                return (
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
                          setImprovementSheetOpen(true);
                          feedback.openFeedbackForMessage(activeConversationId, message.id);
                        }}
                      >
                        Improve
                      </button>
                    )}
                  </div>
                  {message.role === "assistant" ? (
                    <>
                      <MarkdownMessage text={displayText} />
                      {typeof message.id === "number" && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="text-xs border border-border rounded-lg bg-white py-1 px-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                            disabled={rerunningMessageId === message.id || !selectedModelId}
                            onClick={async () => {
                              setRerunningMessageId(message.id);
                              const result = await runtime.rerunAssistantAnswer(message.id, selectedModelId);
                              setRerunningMessageId(null);
                              if (!result.ok) {
                                useSettingsStore.getState().setSettingsError(result.error);
                                return;
                              }
                              setAssistantVariants((prev) => {
                                const existing = prev[message.id] ?? [];
                                return { ...prev, [message.id]: [...existing, result.variant] };
                              });
                              setActiveVariantIndex((prev) => ({ ...prev, [message.id]: variants.length }));
                            }}
                          >
                            {rerunningMessageId === message.id ? "Re-running…" : "Re-run with selected model"}
                          </button>
                          {variants.length > 1 && (
                            <>
                              <button
                                type="button"
                                className="text-xs underline"
                                disabled={activeIdx <= 0}
                                onClick={() =>
                                  setActiveVariantIndex((prev) => ({ ...prev, [message.id]: Math.max(0, activeIdx - 1) }))
                                }
                              >
                                Previous version
                              </button>
                              <button
                                type="button"
                                className="text-xs underline"
                                disabled={activeIdx >= variants.length - 1}
                                onClick={() =>
                                  setActiveVariantIndex((prev) => ({
                                    ...prev,
                                    [message.id]: Math.min(variants.length - 1, activeIdx + 1)
                                  }))
                                }
                              >
                                Next version
                              </button>
                              <span className="text-xs text-muted-foreground">Version {activeIdx + 1} of {variants.length}</span>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="m-0 text-[0.9375rem] leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  )}
                  {displayMeta && <p className="mt-1.5 text-muted-foreground text-xs m-0">{displayMeta}</p>}
                </article>
              );
              })}
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
                  <div
                    aria-label="Model picker"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#d6c4aa] bg-gradient-to-b from-[#fffdf6] to-[#fff3de] px-2.5 py-1.5 shadow-[0_1px_0_rgba(255,255,255,0.9),0_6px_14px_rgba(107,78,0,0.09)]"
                  >
                    <SparklesIcon className="w-3.5 h-3.5 text-[#c06a2f]" aria-hidden="true" />
                    <label htmlFor="model-select" className="text-xs font-medium text-muted-foreground shrink-0">
                      Model
                    </label>
                    <div className="relative">
                      <select
                        id="model-select"
                        className="min-w-[190px] appearance-none text-xs font-medium border border-[#cfbda3] rounded-lg bg-white/90 py-1.5 pl-2 pr-7 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#efbe91]/60 focus:border-[#d49a67]"
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
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-[#8a735a]"
                      >
                        ▾
                      </span>
                    </div>
                  </div>
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
          </>
        )}
      </section>
      {/* M8 patch notification — floating banner for in-flight and terminal patch states */}
      {notificationPatch && (
        <PatchNotification
          patch={
            reloadingPatchId === notificationPatch.id
              ? { ...notificationPatch, status: "reloading" }
              : notificationPatch
          }
          onUndo={(patchId) => void rollbackPatch(patchId)}
          onDismiss={() => setNotificationPatchId(null)}
        />
      )}
    </main>
  );
}
