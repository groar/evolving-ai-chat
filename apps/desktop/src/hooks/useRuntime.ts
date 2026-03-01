import type { RefObject } from "react";
import { useCallback, useEffect } from "react";
import {
  type ProviderId,
  getAllApiKeysFromStore,
  getApiKeyFromStore,
  getDefaultModelFromStore,
  removeApiKeyFromStore,
  setApiKeyInStore,
  setDefaultModelInStore
} from "../apiKeyStore";
import { useConversationStore } from "../stores/conversationStore";
import { useRuntimeStore } from "../stores/runtimeStore";
import { defaultSettings, useSettingsStore } from "../stores/settingsStore";
import type { AddValidationRunInput, ChangeProposal, ChangelogEntry, CreateProposalInput, RuntimeSettings } from "../settingsPanel";
import type { RuntimeIssue } from "../stores/runtimeStore";

const runtimeBase = "http://127.0.0.1:8787";
const diagnosticsFlagKey = "show_runtime_diagnostics";

export const offlineStateRetryIntervalMs = 2000;

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

type RuntimeStatePayload = {
  active_conversation_id: string;
  conversations: Array<{
    conversation_id: string;
    title: string;
    created_at: string;
    updated_at: string;
  }>;
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
  api_keys?: { openai?: boolean; anthropic?: boolean };
  models?: Array<{ provider: string; model_id: string; display_name: string }>;
  conversation_cost_total?: number | null;
};

function applyState(
  payload: RuntimeStatePayload,
  preferredConversationId?: string,
  conversationStore: ReturnType<typeof useConversationStore.getState>,
  settingsStore: ReturnType<typeof useSettingsStore.getState>,
  runtimeStore: ReturnType<typeof useRuntimeStore.getState>
) {
  conversationStore.setConversations(payload.conversations);
  conversationStore.setActiveConversationId(preferredConversationId || payload.active_conversation_id);
  conversationStore.setMessages(
    payload.messages.map((m) => ({
      id: m.message_id,
      role: m.role,
      text: m.text,
      meta: m.meta ?? undefined
    }))
  );
  settingsStore.setSettings(payload.settings ?? defaultSettings);
  settingsStore.setChangelog(payload.changelog ?? []);
  settingsStore.setProposals(payload.proposals ?? []);
  runtimeStore.setApiKeyConfigured(Boolean(payload.api_key_configured));
  if (payload.api_keys) {
    runtimeStore.setApiKeys({
      openai: Boolean(payload.api_keys.openai),
      anthropic: Boolean(payload.api_keys.anthropic)
    });
    runtimeStore.setApiKeySet(payload.api_keys.openai || payload.api_keys.anthropic);
  } else {
    runtimeStore.setApiKeySet(Boolean(payload.api_key_configured));
  }
  if (payload.models && payload.models.length > 0) {
    runtimeStore.setModels(payload.models);
  }
  runtimeStore.setConversationCostTotal(
    typeof payload.conversation_cost_total === "number" ? payload.conversation_cost_total : null
  );
  runtimeStore.setRuntimeIssue(null);
}

export function useRuntime() {
  const runtimeIssue = useRuntimeStore((s) => s.runtimeIssue);
  const isBooting = useRuntimeStore((s) => s.isBooting);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);

  const refreshState = useCallback(
    async (preferredConversationId?: string) => {
      const conv = useConversationStore.getState();
      const setts = useSettingsStore.getState();
      const rt = useRuntimeStore.getState();
      try {
        const response = await fetch(`${runtimeBase}/state`);
        if (!response.ok) {
          const detail = await readErrorDetail(response);
          rt.setRuntimeIssue({ kind: "error", detail });
          setts.setSettingsError("Could not load updates and drafts.");
          return;
        }
        const payload = (await response.json()) as RuntimeStatePayload;
        applyState(payload, preferredConversationId, conv, setts, rt);
        setts.setSettingsError(null);
      } catch {
        rt.setRuntimeIssue({ kind: "offline" });
        setts.setSettingsError("Could not load updates and drafts. Check if the assistant is running.");
      } finally {
        rt.setIsBooting(false);
      }
    },
    []
  );

  const retryRuntime = useCallback(async () => {
    const rt = useRuntimeStore.getState();
    const conv = useConversationStore.getState();
    if (rt.isSending || rt.isResetting) return;
    await refreshState(conv.activeConversationId);
  }, [refreshState]);

  const createConversation = useCallback(async () => {
    const rt = useRuntimeStore.getState();
    const conv = useConversationStore.getState();
    if (rt.isSending || rt.isResetting) return;
    try {
      const response = await fetch(`${runtimeBase}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation", set_active: true })
      });
      if (!response.ok) {
        const detail = await readErrorDetail(response);
        rt.setRuntimeIssue({ kind: "error", detail });
        return;
      }
      const payload = (await response.json()) as { conversation_id: string };
      await refreshState(payload.conversation_id);
    } catch {
      rt.setRuntimeIssue({ kind: "offline" });
    }
  }, [refreshState]);

  const activateConversation = useCallback(
    async (conversationId: string) => {
      const conv = useConversationStore.getState();
      const rt = useRuntimeStore.getState();
      if (conversationId === conv.activeConversationId || rt.isSending) return;
      try {
        const response = await fetch(`${runtimeBase}/conversations/${conversationId}/activate`, {
          method: "POST"
        });
        if (!response.ok) {
          const detail = await readErrorDetail(response);
          rt.setRuntimeIssue({ kind: "error", detail });
          return;
        }
        await refreshState(conversationId);
      } catch {
        rt.setRuntimeIssue({ kind: "offline" });
      }
    },
    [refreshState]
  );

  const updateConversationTitle = useCallback(
    async (conversationId: string, title: string): Promise<{ ok: boolean; error?: string }> => {
      const rt = useRuntimeStore.getState();
      const conv = useConversationStore.getState();
      if (rt.isSending || rt.isResetting) return { ok: false, error: "Cannot rename while busy." };
      const trimmed = title.trim();
      if (!trimmed) return { ok: false, error: "Title cannot be empty." };
      try {
        const response = await fetch(`${runtimeBase}/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed })
        });
        if (!response.ok) {
          const detail = await readErrorDetail(response);
          rt.setRuntimeIssue({ kind: "error", detail });
          return { ok: false, error: detail };
        }
        await refreshState(conv.activeConversationId);
        return { ok: true };
      } catch {
        rt.setRuntimeIssue({ kind: "offline" });
        return { ok: false, error: "Can't reach the assistant. Check if it's running." };
      }
    },
    [refreshState]
  );

  const deleteLocalData = useCallback(
    async (inputRef: { current: HTMLTextAreaElement | null }, clearFeedback: () => void) => {
      const rt = useRuntimeStore.getState();
      const conv = useConversationStore.getState();
      if (rt.isResetting || rt.isSending) return;
      rt.setIsResetting(true);
      try {
        const response = await fetch(`${runtimeBase}/data`, { method: "DELETE" });
        if (!response.ok) {
          const detail = await readErrorDetail(response);
          rt.setRuntimeIssue({ kind: "error", detail });
          return;
        }
        conv.setComposer("");
        clearFeedback();
        await refreshState();
      } catch {
        rt.setRuntimeIssue({ kind: "offline" });
      } finally {
        rt.setIsResetting(false);
        inputRef.current?.focus();
      }
    },
    [refreshState]
  );

  const updateChannel = useCallback(
    async (nextChannel: "stable" | "experimental") => {
      const conv = useConversationStore.getState();
      const rt = useRuntimeStore.getState();
      const setts = useSettingsStore.getState();
      if (rt.isSending || rt.isResetting || setts.settings.channel === nextChannel) return;
      try {
        const response = await fetch(`${runtimeBase}/settings/channel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: nextChannel })
        });
        if (!response.ok) {
          const detail = await readErrorDetail(response);
          rt.setRuntimeIssue({ kind: "error", detail });
          return;
        }
        const payload = (await response.json()) as { settings: RuntimeSettings };
        setts.setSettings(payload.settings);
        if (nextChannel === "stable") {
          setts.setSettingsNotice("Switched to stable updates. Your conversations and history are unaffected.");
        }
        await refreshState(conv.activeConversationId);
      } catch {
        rt.setRuntimeIssue({ kind: "offline" });
        setts.setSettingsError("Could not save your preference.");
      }
    },
    [refreshState]
  );

  const updateExperimentalFlag = useCallback(
    async (enabled: boolean) => {
      const conv = useConversationStore.getState();
      const rt = useRuntimeStore.getState();
      const setts = useSettingsStore.getState();
      if (setts.settings.channel !== "experimental" || rt.isSending || rt.isResetting) return;
      try {
        const response = await fetch(`${runtimeBase}/settings/flags/${diagnosticsFlagKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled })
        });
        if (!response.ok) {
          const detail = await readErrorDetail(response);
          rt.setRuntimeIssue({ kind: "error", detail });
          return;
        }
        const payload = (await response.json()) as { settings: RuntimeSettings };
        setts.setSettings(payload.settings);
        setts.setSettingsNotice(`Behind-the-scenes info: ${enabled ? "enabled" : "disabled"}.`);
        await refreshState(conv.activeConversationId);
      } catch {
        rt.setRuntimeIssue({ kind: "offline" });
        setts.setSettingsError("Could not update early-access feature.");
      }
    },
    [refreshState]
  );

  const resetExperiments = useCallback(async () => {
    const conv = useConversationStore.getState();
    const rt = useRuntimeStore.getState();
    const setts = useSettingsStore.getState();
    if (rt.isSending || rt.isResetting) return;
    try {
      const response = await fetch(`${runtimeBase}/settings/experiments/reset`, { method: "POST" });
      if (!response.ok) {
        const detail = await readErrorDetail(response);
        rt.setRuntimeIssue({ kind: "error", detail });
        return;
      }
      const payload = (await response.json()) as { settings: RuntimeSettings };
      setts.setSettings(payload.settings);
      setts.setSettingsNotice("All toggles reset to defaults. No data deleted.");
      await refreshState(conv.activeConversationId);
    } catch {
      rt.setRuntimeIssue({ kind: "offline" });
      setts.setSettingsError("Could not reset early-access features.");
    }
  }, [refreshState]);

  const createProposal = useCallback(
    async (input: CreateProposalInput) => {
      const conv = useConversationStore.getState();
      const rt = useRuntimeStore.getState();
      const setts = useSettingsStore.getState();
      if (rt.isSending || rt.isResetting || setts.isProposalBusy) return;
      setts.setIsProposalBusy(true);
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
        if (!response.ok) throw new Error(await readErrorDetail(response));
        setts.setSettingsNotice("Proposal created. Run validation before accepting.");
        setts.setSettingsError(null);
        await refreshState(conv.activeConversationId);
      } catch (error) {
        setts.setSettingsError(error instanceof Error ? error.message : "Could not create proposal.");
      } finally {
        setts.setIsProposalBusy(false);
      }
    },
    [refreshState]
  );

  const addProposalValidationRun = useCallback(
    async (proposalId: string, input: AddValidationRunInput) => {
      const conv = useConversationStore.getState();
      const setts = useSettingsStore.getState();
      const rt = useRuntimeStore.getState();
      if (rt.isSending || rt.isResetting || setts.isProposalBusy) return;
      setts.setIsProposalBusy(true);
      try {
        const response = await fetch(`${runtimeBase}/proposals/${proposalId}/validation-runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        });
        if (!response.ok) throw new Error(await readErrorDetail(response));
        setts.setSettingsNotice(`Validation run added (${input.status}).`);
        setts.setSettingsError(null);
        await refreshState(conv.activeConversationId);
      } catch (error) {
        setts.setSettingsError(error instanceof Error ? error.message : "Could not add validation run.");
      } finally {
        setts.setIsProposalBusy(false);
      }
    },
    [refreshState]
  );

  const updateProposalDecision = useCallback(
    async (proposalId: string, status: "accepted" | "rejected", notes: string) => {
      const conv = useConversationStore.getState();
      const setts = useSettingsStore.getState();
      const rt = useRuntimeStore.getState();
      if (rt.isSending || rt.isResetting || setts.isProposalBusy) return;
      setts.setIsProposalBusy(true);
      try {
        const response = await fetch(`${runtimeBase}/proposals/${proposalId}/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes })
        });
        if (!response.ok) throw new Error(await readErrorDetail(response));
        setts.setSettingsNotice(
          status === "accepted"
            ? "Proposal accepted. Changelog entry should now appear in Recent Changes."
            : "Proposal rejected with rationale."
        );
        setts.setSettingsError(null);
        await refreshState(conv.activeConversationId);
      } catch (error) {
        setts.setSettingsError(error instanceof Error ? error.message : "Could not update proposal decision.");
      } finally {
        setts.setIsProposalBusy(false);
      }
    },
    [refreshState]
  );

  const saveApiKey = useCallback(async (provider: ProviderId, key: string) => {
    const rt = useRuntimeStore.getState();
    if (rt.isSavingApiKey || key.trim().length === 0) return;
    rt.setIsSavingApiKey(true);
    rt.setApiKeyError(null);
    try {
      const allKeys = await getAllApiKeysFromStore();
      await setApiKeyInStore(key.trim(), provider);
      await fetch(`${runtimeBase}/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openai_api_key: provider === "openai" ? key.trim() : allKeys.openai ?? undefined,
          anthropic_api_key: provider === "anthropic" ? key.trim() : allKeys.anthropic ?? undefined
        })
      });
      rt.setApiKeys({
        openai: provider === "openai" ? true : Boolean(allKeys.openai),
        anthropic: provider === "anthropic" ? true : Boolean(allKeys.anthropic)
      });
      rt.setApiKeySet(true);
      rt.setApiKeyConfigured(true);
    } catch {
      rt.setApiKeyError("Could not save API key. Please try again.");
    } finally {
      rt.setIsSavingApiKey(false);
    }
  }, []);

  const removeApiKey = useCallback(async (provider: ProviderId) => {
    const rt = useRuntimeStore.getState();
    if (rt.isSavingApiKey) return;
    rt.setIsSavingApiKey(true);
    rt.setApiKeyError(null);
    try {
      await removeApiKeyFromStore(provider);
      const allKeys = await getAllApiKeysFromStore();
      await fetch(`${runtimeBase}/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openai_api_key: provider === "openai" ? "" : allKeys.openai ?? undefined,
          anthropic_api_key: provider === "anthropic" ? "" : allKeys.anthropic ?? undefined
        })
      });
      const hasAny = Boolean(allKeys.openai) || Boolean(allKeys.anthropic);
      if (provider === "openai") {
        rt.setApiKeys({ openai: false, anthropic: Boolean(allKeys.anthropic) });
      } else {
        rt.setApiKeys({ openai: Boolean(allKeys.openai), anthropic: false });
      }
      rt.setApiKeySet(hasAny);
      rt.setApiKeyConfigured(hasAny);
    } catch {
      rt.setApiKeyError("Could not remove API key. Please try again.");
    } finally {
      rt.setIsSavingApiKey(false);
    }
  }, []);

  const setSelectedModel = useCallback(async (modelId: string) => {
    useRuntimeStore.getState().setSelectedModelId(modelId);
    await setDefaultModelInStore(modelId);
  }, []);

  const sendMessage = useCallback(
    async (inputRef?: RefObject<HTMLTextAreaElement | null>) => {
      const conv = useConversationStore.getState();
      const rt = useRuntimeStore.getState();
      const isRuntimeOffline = rt.runtimeIssue?.kind === "offline";
      const canSend =
        conv.composer.trim().length > 0 &&
        !conv.isSending &&
        conv.activeConversationId.length > 0 &&
        !isRuntimeOffline &&
        rt.apiKeyConfigured;
      if (!canSend) return;

      const nextText = conv.composer.trim();
      conv.setComposer("");
      conv.setIsSending(true);
      conv.setStreamingText("");

      const modelId = rt.selectedModelId || "gpt-4o-mini";
      const body = JSON.stringify({
        message: nextText,
        conversation_id: conv.activeConversationId,
        model_id: modelId,
        history: conv.messages.map((m) => ({ role: m.role, content: m.text }))
      });

      try {
      const response = await fetch(`${runtimeBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body
      });

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        if (detail === "api_key_not_set") {
          rt.setRuntimeIssue({ kind: "api_key_not_set" });
        } else {
          rt.setRuntimeIssue({ kind: "error", detail });
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
                const event = JSON.parse(raw) as { delta?: string; done?: boolean; error?: string; detail?: string };
                if (event.error) {
                  rt.setRuntimeIssue({ kind: "error", detail: event.detail ?? event.error });
                  streamEnded = true;
                  break;
                }
                if (event.delta) {
                  accumulated += event.delta;
                  conv.setStreamingText(accumulated);
                }
                if (event.done) streamEnded = true;
              } catch {
                // Skip malformed JSON
              }
            }
          }
          if (streamEnded) break;
        }
        await refreshState(conv.activeConversationId);
      } else {
        const payload = (await response.json()) as { conversation_id?: string };
        await refreshState(payload.conversation_id);
      }
    } catch {
      rt.setRuntimeIssue({ kind: "offline" });
    } finally {
      conv.setIsSending(false);
      conv.setStreamingText("");
      inputRef?.current?.focus();
    }
  }, [refreshState]);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  useEffect(() => {
    Promise.all([getAllApiKeysFromStore(), getDefaultModelFromStore()]).then(([keys, modelId]) => {
      const rt = useRuntimeStore.getState();
      rt.setApiKeySet(Boolean(keys.openai) || Boolean(keys.anthropic));
      if (modelId) rt.setSelectedModelId(modelId);
    });
  }, []);

  useEffect(() => {
    if (runtimeIssue || isBooting) return;
    let cancelled = false;
    getAllApiKeysFromStore().then(async (keys) => {
      const hasAny = Boolean(keys.openai) || Boolean(keys.anthropic);
      if (cancelled || !hasAny) return;
      try {
        await fetch(`${runtimeBase}/configure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            openai_api_key: keys.openai ?? undefined,
            anthropic_api_key: keys.anthropic ?? undefined
          })
        });
        if (!cancelled) await refreshState(useConversationStore.getState().activeConversationId);
      } catch {
        if (!cancelled) await refreshState(useConversationStore.getState().activeConversationId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshState, runtimeIssue, isBooting]);

  useEffect(() => {
    if (!shouldAutoRetryOfflineState(runtimeIssue)) return;
    const timerId = window.setInterval(() => {
      void refreshState(activeConversationId || undefined);
    }, offlineStateRetryIntervalMs);
    return () => window.clearInterval(timerId);
  }, [refreshState, runtimeIssue, activeConversationId]);

  return {
    refreshState,
    retryRuntime,
    createConversation,
    activateConversation,
    updateConversationTitle,
    deleteLocalData,
    updateChannel,
    updateExperimentalFlag,
    resetExperiments,
    createProposal,
    addProposalValidationRun,
    updateProposalDecision,
    saveApiKey,
    removeApiKey,
    setSelectedModel,
    sendMessage
  };
}
