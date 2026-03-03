import { create } from "zustand";
import type { ChangelogEntry, RuntimeSettings } from "../settingsPanel";
import type { PatchEntry } from "../PatchNotification";

export const defaultSettings: RuntimeSettings = {
  channel: "stable",
  experimental_flags: {},
  active_flags: {}
};

type SettingsStore = {
  settings: RuntimeSettings;
  changelog: ChangelogEntry[];
  patches: PatchEntry[];
  /** ID of the patch currently shown in the notification banner (null when dismissed) */
  notificationPatchId: string | null;
  settingsNotice: string | null;
  settingsError: string | null;
  setSettings: (settings: RuntimeSettings) => void;
  setChangelog: (changelog: ChangelogEntry[]) => void;
  setPatches: (patches: PatchEntry[]) => void;
  setNotificationPatchId: (id: string | null) => void;
  setSettingsNotice: (value: string | null) => void;
  setSettingsError: (value: string | null) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  changelog: [],
  patches: [],
  notificationPatchId: null,
  settingsNotice: null,
  settingsError: null,
  setSettings: (settings) => set({ settings }),
  setChangelog: (changelog) => set({ changelog }),
  setPatches: (patches) => set({ patches }),
  setNotificationPatchId: (notificationPatchId) => set({ notificationPatchId }),
  setSettingsNotice: (value) => set({ settingsNotice: value }),
  setSettingsError: (value) => set({ settingsError: value })
}));
