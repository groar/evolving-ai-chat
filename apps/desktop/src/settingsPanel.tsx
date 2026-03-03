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
  /** API key configuration (Connections subsection) */
  apiKeys: { openai: boolean; anthropic: boolean };
  onSaveApiKey: (provider: ProviderId, key: string) => Promise<void>;
  onRemoveApiKey: (provider: ProviderId) => Promise<void>;
  apiKeyError: string | null;
  isSavingApiKey: boolean;
};

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

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
    apiKeys,
    onSaveApiKey,
    onRemoveApiKey,
    apiKeyError,
    isSavingApiKey
  } = props;

  const [expandedDiffIds, setExpandedDiffIds] = useState<Set<string>>(new Set());
  function togglePatchDiff(patchId: string) {
    setExpandedDiffIds((current) => {
      const next = new Set(current);
      if (next.has(patchId)) next.delete(patchId);
      else next.add(patchId);
      return next;
    });
  }

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
    <section className="grid gap-5 max-h-none min-h-0 overflow-visible min-w-0" aria-label="Settings">
      <div className="flex justify-between items-center gap-2">
        <p className="m-0 text-sm font-semibold text-foreground">Connections</p>
      </div>
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

      <div className="flex justify-between items-center gap-2">
        <p className="m-0 text-sm font-semibold text-foreground">Works offline</p>
      </div>
      <ul className="m-0 ml-4 p-0 text-sm text-foreground leading-relaxed [&>li]:mb-1">
        <li>Browse and search conversations</li>
        <li>Change settings and early-access options</li>
        <li>Capture and review feedback</li>
      </ul>

      <div className="flex justify-between items-center gap-2">
        <p className="m-0 text-sm font-semibold text-foreground">Updates & Safety</p>
      </div>
      <p className="m-0 text-sm font-semibold text-foreground">Updates</p>
      <p className="m-0 text-sm text-foreground">Choose which updates you receive. Your conversations and history are never affected.</p>

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

      <details className="border-t border-dashed border-border pt-2.5 grid gap-2.5">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Early Access</summary>
        <p className="m-0 text-sm text-foreground">Optional beta toggles. Your data is never affected.</p>
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
          <p className="m-0 text-xs text-muted-foreground">Switch to Beta (early access) to adjust early-access feature toggles.</p>
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

      <div className="border-t border-dashed border-border pt-2.5 grid gap-2.5">
        <p className="m-0 text-sm font-semibold text-foreground">Changelog</p>

        {/* M8 patch entries — applied code changes with Undo and diff toggle */}
        {patches.length > 0 && (
          <ul className="list-none m-0 p-0 grid gap-2" aria-label="Applied code changes">
            {patches.map((patch) => {
              const isApplied = patch.status === "applied";
              const isReverted = patch.status === "reverted";
              const isError =
                patch.status === "apply_failed" ||
                patch.status === "scope_blocked" ||
                patch.status === "rollback_conflict" ||
                patch.status === "rollback_unavailable";
              const diffOpen = expandedDiffIds.has(patch.id);
              const hasDiff = Boolean(patch.unified_diff);
              const patchStatusLabel: Record<string, string> = {
                pending_apply: "Pending",
                pending: "Pending",
                applying: "Applying…",
                applied: "Applied",
                apply_failed: "Failed",
                scope_blocked: "Blocked",
                reverting: "Undoing…",
                reverted: "Undone",
                rollback_conflict: "Conflict",
                rollback_unavailable: "Unavailable"
              };
              return (
                <li
                  key={patch.id}
                  className={`border rounded-lg bg-white p-2.5 grid gap-1.5 ${
                    isApplied
                      ? "border-[#9ebf97]"
                      : isReverted
                        ? "border-[#c8d3c1]"
                        : isError
                          ? "border-[#f4a58b]"
                          : "border-border"
                  }`}
                >
                  <div className="flex justify-between gap-2 items-center">
                    <p className="m-0 text-sm font-bold truncate flex-1">{patch.title}</p>
                    <span className="border border-border rounded-full py-0.5 px-2 text-xs text-muted-foreground shrink-0">
                      {patchStatusLabel[patch.status] ?? patch.status}
                    </span>
                  </div>
                  {patch.description && (
                    <p className="m-0 text-sm text-foreground">{patch.description}</p>
                  )}
                  <p className="m-0 text-xs text-muted-foreground">
                    {formatTimestamp(patch.created_at)}
                    {patch.applied_at ? ` · Applied ${formatTimestamp(patch.applied_at)}` : ""}
                    {patch.reverted_at ? ` · Undone ${formatTimestamp(patch.reverted_at)}` : ""}
                    {patch.failure_reason ? ` · ${patch.failure_reason}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {isApplied && (
                      <button
                        type="button"
                        className={`${railBtn} text-sm`}
                        onClick={() => onRollbackPatch(patch.id)}
                        disabled={isBusy}
                        aria-label={`Undo: ${patch.title}`}
                      >
                        Undo
                      </button>
                    )}
                    {(isApplied || isReverted) && hasDiff && (
                      <button
                        type="button"
                        className={`${railBtn} text-sm`}
                        onClick={() => togglePatchDiff(patch.id)}
                        aria-expanded={diffOpen}
                        aria-controls={`patch-diff-${patch.id}`}
                      >
                        {diffOpen
                          ? "Hide changes ↑"
                          : isReverted
                            ? "See what was reverted ↓"
                            : "See what changed ↓"}
                      </button>
                    )}
                  </div>
                  {diffOpen && hasDiff && (
                    <div id={`patch-diff-${patch.id}`}>
                      <pre className="m-0 text-xs leading-relaxed overflow-auto max-h-60 bg-[#f4f5f0] border border-border rounded-lg p-2.5 font-mono whitespace-pre">
                        <code>{patch.unified_diff}</code>
                      </pre>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Changelog entries (flags, channel, etc.) */}
        {changelog.length === 0 && patches.length === 0 ? (
          <p className="m-0 text-xs text-muted-foreground">No changes applied yet.</p>
        ) : changelog.length > 0 ? (
          <ul className="list-none m-0 p-0 grid gap-2">
            {changelog.map((entry) => (
              <li key={`${entry.created_at}-${entry.title}`} className="border border-border rounded-lg bg-white p-2.5 grid gap-1">
                <div className="flex justify-between gap-2 items-center">
                  <p className="m-0 text-sm font-bold">{entry.title}</p>
                  <span className="border border-border rounded-full py-0.5 px-2 text-xs text-muted-foreground">
                    {entry.channel === "experimental" ? "Beta" : "Stable"}
                  </span>
                </div>
                <p className="m-0 text-sm text-foreground">{entry.summary}</p>
                <p className="m-0 text-xs text-muted-foreground">
                  {formatTimestamp(entry.created_at)}
                  {entry.ticket_id ? ` · ${entry.ticket_id}` : ""}
                  {entry.proposal_id ? ` · ${entry.proposal_id}` : ""}
                  {entry.flags_changed && entry.flags_changed.length > 0 ? " · early-access changes" : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export type { ChangelogEntry, RuntimeSettings };
