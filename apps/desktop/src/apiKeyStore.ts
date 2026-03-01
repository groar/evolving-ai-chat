/**
 * API key storage via Tauri plugin-store.
 * Key is stored under `openai_api_key`. Only available in Tauri context.
 */

import { load } from "@tauri-apps/plugin-store";

const STORE_PATH = "settings.json";
const KEY = "openai_api_key";

export async function getApiKeyFromStore(): Promise<string | null> {
  try {
    const store = await load(STORE_PATH, { autoSave: false });
    const value = await store.get<string>(KEY);
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

export async function setApiKeyInStore(key: string): Promise<void> {
  const store = await load(STORE_PATH, { autoSave: false });
  await store.set(KEY, key.trim());
  await store.save();
}

export async function removeApiKeyFromStore(): Promise<void> {
  const store = await load(STORE_PATH, { autoSave: false });
  await store.delete(KEY);
  await store.save();
}
