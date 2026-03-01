import { create } from "zustand";

export type RuntimeIssue =
  | { kind: "offline" }
  | { kind: "error"; detail: string }
  | { kind: "api_key_not_set" };

type RuntimeStore = {
  runtimeIssue: RuntimeIssue | null;
  isBooting: boolean;
  isResetting: boolean;
  apiKeyConfigured: boolean;
  apiKeySet: boolean;
  apiKeyError: string | null;
  isSavingApiKey: boolean;
  setRuntimeIssue: (issue: RuntimeIssue | null) => void;
  setIsBooting: (value: boolean) => void;
  setIsResetting: (value: boolean) => void;
  setApiKeyConfigured: (value: boolean) => void;
  setApiKeySet: (value: boolean) => void;
  setApiKeyError: (value: string | null) => void;
  setIsSavingApiKey: (value: boolean) => void;
};

export const useRuntimeStore = create<RuntimeStore>((set) => ({
  runtimeIssue: { kind: "offline" },
  isBooting: true,
  isResetting: false,
  apiKeyConfigured: false,
  apiKeySet: false,
  apiKeyError: null,
  isSavingApiKey: false,
  setRuntimeIssue: (issue) => set({ runtimeIssue: issue }),
  setIsBooting: (value) => set({ isBooting: value }),
  setIsResetting: (value) => set({ isResetting: value }),
  setApiKeyConfigured: (value) => set({ apiKeyConfigured: value }),
  setApiKeySet: (value) => set({ apiKeySet: value }),
  setApiKeyError: (value) => set({ apiKeyError: value }),
  setIsSavingApiKey: (value) => set({ isSavingApiKey: value })
}));
