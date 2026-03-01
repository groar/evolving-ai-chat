/**
 * API key storage via Tauri plugin-store.
 * Keys stored under provider-specific keys. Only available in Tauri context.
 */

import { load } from "@tauri-apps/plugin-store";

const STORE_PATH = "settings.json";
const OPENAI_KEY = "openai_api_key";
const ANTHROPIC_KEY = "anthropic_api_key";
const DEFAULT_MODEL_KEY = "default_model_id";

export type ProviderId = "openai" | "anthropic";

export async function getApiKeyFromStore(provider: ProviderId = "openai"): Promise<string | null> {
  try {
    const store = await load(STORE_PATH, { autoSave: false });
    const key = provider === "anthropic" ? ANTHROPIC_KEY : OPENAI_KEY;
    const value = await store.get<string>(key);
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

export async function getAllApiKeysFromStore(): Promise<Record<ProviderId, string | null>> {
  const [openai, anthropic] = await Promise.all([
    getApiKeyFromStore("openai"),
    getApiKeyFromStore("anthropic"),
  ]);
  return { openai, anthropic };
}

export async function setApiKeyInStore(key: string, provider: ProviderId = "openai"): Promise<void> {
  const store = await load(STORE_PATH, { autoSave: false });
  const k = provider === "anthropic" ? ANTHROPIC_KEY : OPENAI_KEY;
  await store.set(k, key.trim());
  await store.save();
}

export async function removeApiKeyFromStore(provider: ProviderId = "openai"): Promise<void> {
  const store = await load(STORE_PATH, { autoSave: false });
  const k = provider === "anthropic" ? ANTHROPIC_KEY : OPENAI_KEY;
  await store.delete(k);
  await store.save();
}

export async function getDefaultModelFromStore(): Promise<string | null> {
  try {
    const store = await load(STORE_PATH, { autoSave: false });
    const value = await store.get<string>(DEFAULT_MODEL_KEY);
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

export async function setDefaultModelInStore(modelId: string): Promise<void> {
  const store = await load(STORE_PATH, { autoSave: false });
  await store.set(DEFAULT_MODEL_KEY, modelId.trim());
  await store.save();
}
