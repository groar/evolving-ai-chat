import { useState } from "react";
import { railBtn, railBtnDanger, settingsInput } from "@/lib/ui-classes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ProviderId } from "./apiKeyStore";
import type { PatchEntry } from "./PatchNotification";

type RuntimeSettings = {
  channel: "stable" | "experimental";
  experimental_flags: Record<string, boolean>;
  active_flags: Record<string, boolean>;
};

type ChangelogEntry = {
  created_at: string;
  title: string;
  summary: string;
  channel: "stable" | "experimental";
  ticket_id?: string | null;
  proposal_id?: string | null;
  flags_changed?: string[];
};

type SettingsPanelProps = {
  settings: RuntimeSettings;
  changelog: ChangelogEntry[];
  patches?: PatchEntry[];
  isBusy: boolean;
  /** True while a local-data reset is in progress; controls "Resetting..." label in Danger Zone. */
  isResetting?: boolean;
  canToggleFlags: boolean;
  configuredDiagnosticsFlag: boolean;
  notice: string | null;
  error: string | null;
  confirmAction: (prompt: string) => boolean;
  onRefresh: () => void;
  onSelectChannel: (channel: "stable" | "experimental") => void;
  onToggleDiagnostics: (enabled: boolean) => void;
  onResetExperiments: () => void;
  onRollbackPatch?: (patchId: string) => void;
  /** Opens the Activity sheet (e.g. from "View activity →"). Caller should close Settings when opening Activity. */
  onOpenActivity?: () => void;
  /** Triggers local data deletion from inside the Danger Zone section. */
  onDeleteLocalData?: () => void;
  /** API key configuration (Connections subsection) */
  apiKeys: { openai: boolean; anthropic: boolean };
  onSaveApiKey: (provider: ProviderId, key: string) => Promise<void>;
  onRemoveApiKey: (provider: ProviderId) => Promise<void>;
  apiKeyError: string | null;
  isSavingApiKey: boolean;
};

/** Uppercase spaced section label per design guidelines §5 (Detail/Summary + Typography). */
const sectionLabel = "m-0 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground";

export function SettingsPanel(props: SettingsPanelProps) {
  const {
    settings,
    changelog,
    patches = [],
    isBusy,
    isResetting = false,
    canToggleFlags,
    configuredDiagnosticsFlag,
    notice,
    error,
    confirmAction,
    onRefresh,
    onSelectChannel,
    onToggleDiagnostics,
    onResetExperiments,
    onRollbackPatch = () => undefined,
    onOpenActivity,
    onDeleteLocalData,
    apiKeys,
    onSaveApiKey,
    onRemoveApiKey,
    apiKeyError,
    isSavingApiKey
  } = props;

  const [switchToStableConfirmOpen, setSwitchToStableConfirmOpen] = useState(false);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<ProviderId, string>>({ openai: "", anthropic: "" });

  async function handleSaveApiKey(provider: ProviderId) {
    const key = apiKeyInputs[provider].trim();
    if (key.length === 0) return;
    try {
      await onSaveApiKey(provider, key);
      setApiKeyInputs((prev) => ({ ...prev, [provider]: "" }));
    } catch {
      // Error surfaced via apiKeyError prop
    }
  }

  async function handleRemoveApiKey(provider: ProviderId) {
    try {
      await onRemoveApiKey(provider);
    } catch {
      // Error surfaced via apiKeyError prop
    }
  }

  function requestSwitchToStable() {
    if (settings.channel === "stable") return;
    setSwitchToStableConfirmOpen(true);
  }

  function confirmSwitchToStable() {
    onSelectChannel("stable");
    setSwitchToStableConfirmOpen(false);
  }

  function requestResetExperiments() {
    const confirmed = confirmAction(
      "Reset all toggles to defaults? No data is deleted."
    );
    if (!confirmed) {
      return;
    }
    onResetExperiments();
  }

  return (
    <section className="grid gap-6 max-h-none min-h-0 overflow-visible min-w-0" aria-label="Settings">

      {/* Notices — time-sensitive; rendered above Connections so they are seen immediately */}
      {notice && (
        <p role="status" className="m-0 border border-[#9ebf97] rounded-lg bg-[#effbe8] text-[#2e5a2b] text-xs py-2 px-2.5">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="m-0 border border-[#f4a58b] rounded-lg bg-[#fff0ea] text-destructive text-xs py-2 px-2.5">
          {error}
        </p>
      )}

      {/* ── CONNECTIONS ─────────────────────────────────── */}
      <div className="grid gap-3">
        <p className={sectionLabel}>Connections</p>
        <p className="m-0 text-sm text-foreground">
          OpenAI: {apiKeys.openai ? "Set ✓" : "Not configured"} · Anthropic: {apiKeys.anthropic ? "Set ✓" : "Not configured"}
        </p>
        {(["openai", "anthropic"] as const).map((provider) => (
          <div key={provider} className="grid gap-2">
            <p className="m-0 text-sm font-medium text-foreground">
              {provider === "openai" ? "OpenAI" : "Anthropic"} API key
            </p>
            {apiKeys[provider] ? (
              <div className="flex items-center gap-2.5">
                <span className="font-mono tracking-[0.15em]" aria-hidden>••••••••••••</span>
                <button
                  type="button"
                  className={railBtnDanger}
                  onClick={() => void handleRemoveApiKey(provider)}
                  disabled={isBusy || isSavingApiKey}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                <label htmlFor={`api-key-input-${provider}`} className="sr-only">
                  {provider === "openai" ? "OpenAI" : "Anthropic"} API key
                </label>
                <input
                  id={`api-key-input-${provider}`}
                  className={settingsInput}
                  type="password"
                  placeholder={provider === "openai" ? "sk-..." : "sk-ant-..."}
                  value={apiKeyInputs[provider]}
                  onChange={(event) => setApiKeyInputs((prev) => ({ ...prev, [provider]: event.target.value }))}
                  onKeyDown={(event) => event.key === "Enter" && void handleSaveApiKey(provider)}
                  disabled={isBusy || isSavingApiKey}
                  autoComplete="off"
                />
                {apiKeyError && (
                  <p role="alert" className="m-0 border border-[#f4a58b] rounded-lg bg-[#fff0ea] text-destructive text-xs py-2 px-2.5">
                    {apiKeyError}
                  </p>
                )}
                <button
                  type="button"
                  className={`${railBtn} w-fit min-w-[100px]`}
                  onClick={() => void handleSaveApiKey(provider)}
                  disabled={isBusy || isSavingApiKey || apiKeyInputs[provider].trim().length === 0}
                >
                  {isSavingApiKey ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── RELEASE CHANNEL ─────────────────────────────── */}
      <div className="border-t border-border pt-5 grid gap-3">
        <p className={sectionLabel}>Release Channel</p>
        <p className="m-0 text-sm text-foreground">
          Choose which version of the app you get. Stable = recommended; Beta = early access to new features. Your conversations and history are never affected.
        </p>
        <div className="channel-toggle grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`border rounded-xl py-2.5 px-3 text-sm font-medium font-inherit cursor-pointer transition-all disabled:opacity-55 disabled:cursor-not-allowed ${
              settings.channel === "stable"
                ? "border-primary bg-[#fff2e6] text-primary shadow-[inset_0_0_0_1px_rgba(210,87,34,0.2)]"
                : "border-border bg-white text-foreground hover:border-[#efbe91] hover:bg-[#fff8f2]"
            }`}
            onClick={requestSwitchToStable}
            disabled={isBusy}
          >
            Stable (recommended)
          </button>
          <button
            type="button"
            className={`border rounded-xl py-2.5 px-3 text-sm font-medium font-inherit cursor-pointer transition-all disabled:opacity-55 disabled:cursor-not-allowed ${
              settings.channel === "experimental"
                ? "border-primary bg-[#fff2e6] text-primary shadow-[inset_0_0_0_1px_rgba(210,87,34,0.2)]"
                : "border-border bg-white text-foreground hover:border-[#efbe91] hover:bg-[#fff8f2]"
            }`}
            onClick={() => onSelectChannel("experimental")}
            disabled={isBusy}
          >
            Beta (early access)
          </button>
        </div>
      </div>

      {/* ── ACTIVITY ────────────────────────────────────── */}
      <div className="border-t border-border pt-5 grid gap-3" aria-label="Activity summary">
        <p className={sectionLabel}>Activity</p>
        <p className="m-0 text-sm text-foreground" data-testid="settings-changelog-summary">
          {patches.length === 0 ? "No changes yet." : `${patches.length} change${patches.length === 1 ? "" : "s"} applied.`}
        </p>
        <button
          type="button"
          className={`${railBtn} w-fit`}
          onClick={() => onOpenActivity?.()}
          data-testid="settings-view-activity"
        >
          View activity →
        </button>
      </div>

      {/* ── ADVANCED (default closed; beta-only) ─────────── */}
      <details className="border-t border-border pt-4 mt-1 grid gap-3">
        <summary className="cursor-pointer list-none flex items-center gap-2">
          <span className={sectionLabel}>Advanced</span>
          <span className="text-xs text-muted-foreground">(beta-only)</span>
        </summary>
        <div className="grid gap-3 pt-2">
          <p className="m-0 text-sm text-foreground">Optional toggles for beta features. Only available when you choose the Beta channel above. Your data is never affected.</p>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={configuredDiagnosticsFlag}
              disabled={!canToggleFlags}
              onChange={(event) => onToggleDiagnostics(event.target.checked)}
            />
            Show behind-the-scenes info (early-access)
          </label>
          {settings.channel !== "experimental" && (
            <p className="m-0 text-xs text-muted-foreground">Switch to Beta above to adjust these toggles.</p>
          )}
          <div className="grid gap-1.5">
            <button type="button" className={railBtn} disabled={isBusy} onClick={requestResetExperiments}>
              Reset Early-Access Features
            </button>
          </div>
          <p className="m-0 text-xs text-muted-foreground">Resets all toggles to defaults. No data is deleted.</p>
        </div>
      </details>

      {/* ── DANGER ZONE (default closed) ─────────────────── */}
      <details className="border-t border-border pt-4 mt-1 grid gap-3">
        <summary className="cursor-pointer list-none">
          <span className={`${sectionLabel} text-destructive`}>Danger Zone</span>
        </summary>
        <div className="grid gap-2.5 pt-2">
          <button
            type="button"
            className="border border-[#cc7748] bg-[#fff1e8] text-destructive rounded-lg py-2 px-2.5 font-inherit cursor-pointer transition-all hover:bg-[#ffe4d8] hover:border-[#b85a2a] disabled:opacity-55 disabled:cursor-not-allowed"
            onClick={() => onDeleteLocalData?.()}
            disabled={isBusy}
          >
            {isResetting ? "Resetting..." : "Delete Local Data"}
          </button>
          <p className="m-0 text-xs text-muted-foreground">This cannot be undone.</p>
        </div>
      </details>

      <Dialog open={switchToStableConfirmOpen} onOpenChange={setSwitchToStableConfirmOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch to Stable?</DialogTitle>
            <DialogDescription>
              Your conversations and history are unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false} className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSwitchToStableConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSwitchToStable}>
              Switch to Stable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export type { ChangelogEntry, RuntimeSettings };
