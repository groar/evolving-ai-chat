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
  /** API key configuration (Connections subsection) */
  apiKeys: { openai: boolean; anthropic: boolean };
  onSaveApiKey: (provider: ProviderId, key: string) => Promise<void>;
  onRemoveApiKey: (provider: ProviderId) => Promise<void>;
  apiKeyError: string | null;
  isSavingApiKey: boolean;
};

export function SettingsPanel(props: SettingsPanelProps) {
  const {
    settings,
    changelog,
    patches = [],
    isBusy,
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
      {/* Connections */}
      <div className="grid gap-3">
        <p className="m-0 text-sm font-semibold text-foreground">Connections</p>
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

      {/* Works offline */}
      <div className="border-t border-border pt-5 grid gap-3">
        <p className="m-0 text-sm font-semibold text-foreground">Works offline</p>
        <ul className="m-0 ml-4 p-0 text-sm text-foreground leading-relaxed [&>li]:mb-1">
          <li>Browse and search conversations</li>
          <li>Change settings and early-access options</li>
          <li>Capture and review feedback</li>
        </ul>
      </div>

      {/* Updates: channel choice */}
      <div className="border-t border-border pt-5 grid gap-3">
        <p className="m-0 text-sm font-semibold text-foreground">Updates</p>
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

      <details className="border-t border-dashed border-border pt-4 mt-1 grid gap-3" open>
        <summary className="cursor-pointer text-sm font-semibold text-foreground list-none">
          Early Access (optional beta features when on Beta channel)
        </summary>
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
      </details>

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

      {/* Changelog compact summary: full history lives in Activity sheet */}
      <div className="border-t border-border pt-5 grid gap-3" aria-label="Changelog summary">
        <p className="m-0 text-sm font-semibold text-foreground">Changelog</p>
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
    </section>
  );
}

export type { ChangelogEntry, RuntimeSettings };
