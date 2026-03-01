import { create } from "zustand";

export type RuntimeIssue =
  | { kind: "offline" }
  | { kind: "error"; detail: string }
  | { kind: "api_key_not_set" };

export type ApiKeysStatus = { openai: boolean; anthropic: boolean };

export type ModelEntry = { provider: string; model_id: string; display_name: string };

type RuntimeStore = {
  runtimeIssue: RuntimeIssue | null;
  isBooting: boolean;
  isResetting: boolean;
  apiKeyConfigured: boolean;
  apiKeySet: boolean;
  apiKeys: ApiKeysStatus;
  models: ModelEntry[];
  selectedModelId: string;
  apiKeyError: string | null;
  isSavingApiKey: boolean;
  conversationCostTotal: number | null;
  setRuntimeIssue: (issue: RuntimeIssue | null) => void;
  setIsBooting: (value: boolean) => void;
  setIsResetting: (value: boolean) => void;
  setApiKeyConfigured: (value: boolean) => void;
  setApiKeySet: (value: boolean) => void;
  setApiKeys: (value: ApiKeysStatus) => void;
  setModels: (value: ModelEntry[]) => void;
  setSelectedModelId: (value: string) => void;
  setApiKeyError: (value: string | null) => void;
  setIsSavingApiKey: (value: boolean) => void;
  setConversationCostTotal: (value: number | null) => void;
};

export const useRuntimeStore = create<RuntimeStore>((set) => ({
  runtimeIssue: { kind: "offline" },
  isBooting: true,
  isResetting: false,
  apiKeyConfigured: false,
  apiKeySet: false,
  apiKeys: { openai: false, anthropic: false },
  models: [],
  selectedModelId: "gpt-4o-mini",
  apiKeyError: null,
  isSavingApiKey: false,
  conversationCostTotal: null,
  setRuntimeIssue: (issue) => set({ runtimeIssue: issue }),
  setIsBooting: (value) => set({ isBooting: value }),
  setIsResetting: (value) => set({ isResetting: value }),
  setApiKeyConfigured: (value) => set({ apiKeyConfigured: value }),
  setApiKeySet: (value) => set({ apiKeySet: value }),
  setApiKeys: (value) => set({ apiKeys: value }),
  setModels: (value) => set({ models: value }),
  setSelectedModelId: (value) => set({ selectedModelId: value }),
  setApiKeyError: (value) => set({ apiKeyError: value }),
  setIsSavingApiKey: (value) => set({ isSavingApiKey: value }),
  setConversationCostTotal: (value) => set({ conversationCostTotal: value })
}));
