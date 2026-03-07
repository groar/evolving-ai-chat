import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ProviderId,
  getAllApiKeysFromStore,
  getApiKeyFromStore,
  getDefaultModelFromStore,
  removeApiKeyFromStore,
  setApiKeyInStore,
  setDefaultModelInStore
} from "../apiKeyStore";
import type { ApiKeysStatus, ModelEntry } from "../stores/runtimeStore";

/** Return the first model whose provider has an API key, or null if none. */
export function getFirstModelWithKey(
  models: ModelEntry[],
  apiKeys: ApiKeysStatus
): string | null {
  for (const m of models) {
    if (apiKeys[m.provider as keyof ApiKeysStatus]) return m.model_id;
  }
  return null;
}
import { useConversationStore } from "../stores/conversationStore";
import { useRuntimeStore } from "../stores/runtimeStore";
import { defaultSettings, useSettingsStore } from "../stores/settingsStore";
import type { ChangelogEntry, RuntimeSettings } from "../settingsPanel";
import type { RuntimeIssue } from "../stores/runtimeStore";
import type { PatchEntry, PatchStatus } from "../PatchNotification";

export const runtimeBase = "http://127.0.0.1:8787";
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

type PatchSummaryPayload = {
  id: string;
  status: string;
  title: string;
  description: string;
  unified_diff: string;
  created_at: string;
  failure_reason?: string | null;
  applied_at?: string | null;
  reverted_at?: string | null;
};

export type AssistantRerunVariant = {
  assistant_message_id: number;
  reply: string;
  model_id: string;
  created_at: string;
  cost: number;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
};

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
  api_key_configured?: boolean;
  api_keys?: { openai?: boolean; anthropic?: boolean };
  models?: Array<{ provider: string; model_id: string; display_name: string }>;
  conversation_cost_total?: number | null;
  patches?: PatchSummaryPayload[];
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
  if (payload.patches) {
    settingsStore.setPatches(
      payload.patches.map((p) => ({
        id: p.id,
        status: p.status as PatchStatus,
        title: p.title,
        description: p.description,
        unified_diff: p.unified_diff,
        created_at: p.created_at,
        failure_reason: p.failure_reason,
        applied_at: p.applied_at,
        reverted_at: p.reverted_at
      }))
    );
  }
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
      const hasAny = Boolean(keys.openai) || Boolean(keys.anthropic);
      rt.setApiKeySet(hasAny);
      rt.setApiKeys({
        openai: Boolean(keys.openai),
        anthropic: Boolean(keys.anthropic)
      });
      if (modelId) rt.setSelectedModelId(modelId);
    });
  }, []);

  const models = useRuntimeStore((s) => s.models);
  const apiKeys = useRuntimeStore((s) => s.apiKeys);
  const selectedModelId = useRuntimeStore((s) => s.selectedModelId);

  useEffect(() => {
    if (models.length === 0) return;
    const rt = useRuntimeStore.getState();
    const selected = models.find((m) => m.model_id === selectedModelId);
    const hasKeyForSelected = selected && apiKeys[selected.provider as keyof typeof apiKeys];
    if (!hasKeyForSelected) {
      const firstWithKey = getFirstModelWithKey(models, apiKeys);
      if (firstWithKey) {
        rt.setSelectedModelId(firstWithKey);
        void setDefaultModelInStore(firstWithKey);
      }
    }
  }, [models, apiKeys, selectedModelId]);

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

  // ---------------------------------------------------------------------------
  // M8 patch polling — tracks an in-flight patch and updates store on changes
  // ---------------------------------------------------------------------------

  const patchPollRef = useRef<{ patchId: string; timerId: number } | null>(null);
  const [reloadingPatchId, setReloadingPatchId] = useState<string | null>(null);
  const reloadTimeoutRef = useRef<number | null>(null);

  const stopPatchPoll = useCallback(() => {
    if (patchPollRef.current) {
      window.clearTimeout(patchPollRef.current.timerId);
      patchPollRef.current = null;
    }
  }, []);

  const cancelReloadIfScheduled = useCallback(() => {
    if (reloadTimeoutRef.current != null) {
      window.clearTimeout(reloadTimeoutRef.current);
      reloadTimeoutRef.current = null;
      setReloadingPatchId(null);
    }
  }, []);

  const schedulePatchPoll = useCallback(
    (patchId: string, intervalMs = 1500) => {
      stopPatchPoll();
      const timerId = window.setTimeout(async () => {
        const setts = useSettingsStore.getState();
        try {
          const response = await fetch(`${runtimeBase}/agent/patch-status/${patchId}`);
          if (!response.ok) {
            stopPatchPoll();
            return;
          }
          const data = (await response.json()) as {
            patch_id: string;
            status: string;
            title?: string | null;
            description?: string | null;
            unified_diff?: string;
            failure_reason?: string | null;
            applied_at?: string | null;
            reverted_at?: string | null;
          };
          const updatedPatch: PatchEntry = {
            id: data.patch_id,
            status: data.status as PatchStatus,
            title: data.title ?? "",
            description: data.description ?? "",
            unified_diff: data.unified_diff ?? "",
            created_at: new Date().toISOString(),
            failure_reason: data.failure_reason,
            applied_at: data.applied_at,
            reverted_at: data.reverted_at
          };
          // Upsert into patches list
          const existingPatches = setts.patches;
          const idx = existingPatches.findIndex((p) => p.id === patchId);
          const nextPatches: PatchEntry[] =
            idx >= 0
              ? existingPatches.map((p) => (p.id === patchId ? updatedPatch : p))
              : [updatedPatch, ...existingPatches];
          setts.setPatches(nextPatches);
          setts.setNotificationPatchId(patchId);

          const terminalStatuses: PatchStatus[] = [
            "applied",
            "apply_failed",
            "scope_blocked",
            "reverted",
            "rollback_conflict",
            "rollback_unavailable"
          ];
          if (terminalStatuses.includes(updatedPatch.status)) {
            stopPatchPoll();
            if (updatedPatch.status === "applied") {
              // M10: show reloading for ~400ms, then reload so change is visible
              setReloadingPatchId(patchId);
              reloadTimeoutRef.current = window.setTimeout(() => {
                reloadTimeoutRef.current = null;
                setReloadingPatchId(null);
                window.location.reload();
              }, 400);
            } else {
              await refreshState(useConversationStore.getState().activeConversationId);
            }
          } else {
            schedulePatchPoll(patchId, intervalMs);
          }
        } catch {
          // Transient error — retry
          schedulePatchPoll(patchId, Math.min(intervalMs * 2, 8000));
        }
      }, intervalMs);
      patchPollRef.current = { patchId, timerId };
    },
    [stopPatchPoll, refreshState]
  );

  // Stop polling and cancel reload when component unmounts
  useEffect(
    () => () => {
      stopPatchPoll();
      if (reloadTimeoutRef.current != null) {
        window.clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
    },
    [stopPatchPoll]
  );

  const rerunAssistantAnswer = useCallback(
    async (
      assistantMessageId: number,
      modelId: string
    ): Promise<{ ok: true; variant: AssistantRerunVariant } | { ok: false; error: string }> => {
      const conv = useConversationStore.getState();
      const rt = useRuntimeStore.getState();
      if (conv.activeConversationId.length === 0 || rt.isSending || rt.isResetting) {
        return { ok: false, error: "Cannot rerun right now." };
      }

      try {
        const response = await fetch(`${runtimeBase}/chat/rerun`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conv.activeConversationId,
            assistant_message_id: assistantMessageId,
            model_id: modelId
          })
        });
        if (!response.ok) {
          const detail = await readErrorDetail(response);
          return { ok: false, error: detail };
        }
        const payload = (await response.json()) as AssistantRerunVariant;
        return { ok: true, variant: payload };
      } catch {
        return { ok: false, error: "Can't reach the assistant. Check if it's running." };
      }
    },
    []
  );

  const requestPatch = useCallback(
    async (
      feedbackId: string,
      feedbackTitle: string,
      feedbackSummary: string,
      feedbackArea: string,
      refinedSpec?: { raw_description: string; refinement_conversation_id?: string | null }
    ) => {
      const setts = useSettingsStore.getState();
      const rt = useRuntimeStore.getState();
      if (rt.isSending || rt.isResetting) return;
      setts.setSettingsError(null);
      setts.setRequestingPatch(true);
      try {
        const body: Record<string, unknown> = {
          feedback_id: feedbackId,
          feedback_title: feedbackTitle,
          feedback_summary: feedbackSummary,
          feedback_area: feedbackArea,
          base_ref: ""
        };
        if (refinedSpec) {
          body.refined_spec = refinedSpec;
        }
        const response = await fetch(`${runtimeBase}/agent/code-patch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        let errorPayload: { error?: string; detail?: string } = {};
        try {
          errorPayload = (await response.json()) as { error?: string; detail?: string };
        } catch {
          // non-JSON body (e.g. server error page)
        }

        if (!response.ok) {
          if (errorPayload.error === "patch_in_progress") {
            setts.setSettingsNotice("A code change is already being processed. Try again once it finishes.");
          } else if (errorPayload.error === "malformed_patch") {
            setts.setSettingsError(
              "The assistant didn’t suggest any code changes. Try rephrasing the feedback or try again."
            );
          } else {
            setts.setSettingsError(
              errorPayload.detail ?? `Could not start code fix (${response.status}). Try again later.`
            );
          }
          return;
        }

        const data = errorPayload as {
          patch_id?: string;
          status?: string;
          title?: string | null;
          description?: string | null;
        };
        if (!data.patch_id || !data.status) {
          setts.setSettingsError("Invalid response from change agent. Try again later.");
          return;
        }

        // Optimistically add a pending entry and start polling
        const pendingEntry: PatchEntry = {
          id: data.patch_id,
          status: data.status as PatchStatus,
          title: data.title ?? feedbackTitle,
          description: data.description ?? "",
          unified_diff: "",
          created_at: new Date().toISOString()
        };
        const existingPatches = useSettingsStore.getState().patches;
        setts.setPatches([pendingEntry, ...existingPatches]);
        setts.setNotificationPatchId(data.patch_id);

        if (data.status !== "scope_blocked") {
          schedulePatchPoll(data.patch_id);
        } else {
          await refreshState(useConversationStore.getState().activeConversationId);
        }
      } catch {
        setts.setSettingsError("Couldn't reach the change agent right now. Try again later.");
      } finally {
        setts.setRequestingPatch(false);
      }
    },
    [schedulePatchPoll, refreshState]
  );

  const rollbackPatch = useCallback(
    async (patchId: string) => {
      cancelReloadIfScheduled();
      const setts = useSettingsStore.getState();
      // Optimistically show reverting state in the notification
      const existingPatches = setts.patches;
      const optimistic = existingPatches.map((p) =>
        p.id === patchId ? { ...p, status: "reverting" as PatchStatus } : p
      );
      setts.setPatches(optimistic);

      try {
        const response = await fetch(`${runtimeBase}/agent/rollback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patch_id: patchId })
        });
        const data = (await response.json()) as {
          patch_id: string;
          status: string;
          reason?: string | null;
        };
        const updatedStatus = data.status as PatchStatus;
        const nextPatches = setts.patches.map((p) =>
          p.id === patchId ? { ...p, status: updatedStatus } : p
        );
        setts.setPatches(nextPatches);
        setts.setNotificationPatchId(patchId);
        await refreshState(useConversationStore.getState().activeConversationId);
      } catch {
        // Restore previous status on failure
        await refreshState(useConversationStore.getState().activeConversationId);
        setts.setSettingsError("Couldn't reach the change agent right now. Try again later.");
      }
    },
    [cancelReloadIfScheduled, refreshState]
  );

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
    saveApiKey,
    removeApiKey,
    setSelectedModel,
    sendMessage,
    rerunAssistantAnswer,
    requestPatch,
    rollbackPatch,
    reloadingPatchId
  };
}
