import { create } from "zustand";
import type { ChangeProposal, ChangelogEntry, RuntimeSettings } from "../settingsPanel";

export const defaultSettings: RuntimeSettings = {
  channel: "stable",
  experimental_flags: {},
  active_flags: {}
};

type SettingsStore = {
  settings: RuntimeSettings;
  changelog: ChangelogEntry[];
  proposals: ChangeProposal[];
  settingsNotice: string | null;
  settingsError: string | null;
  isProposalBusy: boolean;
  setSettings: (settings: RuntimeSettings) => void;
  setChangelog: (changelog: ChangelogEntry[]) => void;
  setProposals: (proposals: ChangeProposal[]) => void;
  setSettingsNotice: (value: string | null) => void;
  setSettingsError: (value: string | null) => void;
  setIsProposalBusy: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  changelog: [],
  proposals: [],
  settingsNotice: null,
  settingsError: null,
  isProposalBusy: false,
  setSettings: (settings) => set({ settings }),
  setChangelog: (changelog) => set({ changelog }),
  setProposals: (proposals) => set({ proposals }),
  setSettingsNotice: (value) => set({ settingsNotice: value }),
  setSettingsError: (value) => set({ settingsError: value }),
  setIsProposalBusy: (value) => set({ isProposalBusy: value })
}));
