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
  isBusy: boolean;
  canToggleFlags: boolean;
  configuredDiagnosticsFlag: boolean;
  notice: string | null;
  error: string | null;
  confirmAction: (prompt: string) => boolean;
  onSelectChannel: (channel: "stable" | "experimental") => void;
  onToggleDiagnostics: (enabled: boolean) => void;
  onResetExperiments: () => void;
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
    isBusy,
    canToggleFlags,
    configuredDiagnosticsFlag,
    notice,
    error,
    confirmAction,
    onSelectChannel,
    onToggleDiagnostics,
    onResetExperiments
  } = props;

  function requestSwitchToStable() {
    const confirmed = confirmAction("Switch to Stable and roll back active experimental toggles?");
    if (!confirmed) {
      return;
    }
    onSelectChannel("stable");
  }

  function requestResetExperiments() {
    const confirmed = confirmAction(
      "Reset all experiments? This is feature toggle rollback only and does not roll back code or stored data."
    );
    if (!confirmed) {
      return;
    }
    onResetExperiments();
  }

  return (
    <section className="settings-panel" aria-label="Changelog and experiment settings">
      <p className="settings-title">Changelog + Experiments</p>
      <p className="settings-copy">
        Feature toggle rollback only. These controls do not roll back code changes or stored local data.
      </p>

      <div className="channel-toggle">
        <button
          type="button"
          className={`channel-btn ${settings.channel === "stable" ? "active" : ""}`}
          onClick={requestSwitchToStable}
          disabled={isBusy}
        >
          Stable
        </button>
        <button
          type="button"
          className={`channel-btn ${settings.channel === "experimental" ? "active" : ""}`}
          onClick={() => onSelectChannel("experimental")}
          disabled={isBusy}
        >
          Experimental
        </button>
      </div>

      <label className="flag-control">
        <input
          type="checkbox"
          checked={configuredDiagnosticsFlag}
          disabled={!canToggleFlags}
          onChange={(event) => onToggleDiagnostics(event.target.checked)}
        />
        Show runtime diagnostics (experimental)
      </label>
      {settings.channel !== "experimental" && <p className="flag-note">Switch to Experimental to adjust experiment toggles.</p>}

      <div className="rollback-actions">
        <button type="button" className="rail-btn" disabled={isBusy} onClick={requestSwitchToStable}>
          Switch to Stable
        </button>
        <button type="button" className="rail-btn" disabled={isBusy} onClick={requestResetExperiments}>
          Reset Experiments
        </button>
      </div>

      {notice && (
        <p role="status" className="settings-notice">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="settings-error">
          {error}
        </p>
      )}

      <div className="changelog-wrap">
        <p className="settings-title">Recent Changes</p>
        {changelog.length === 0 ? (
          <p className="flag-note">No changes recorded yet.</p>
        ) : (
          <ul className="changelog-list">
            {changelog.map((entry) => (
              <li key={`${entry.created_at}-${entry.title}`} className="changelog-item">
                <div className="changelog-header">
                  <p className="changelog-title">{entry.title}</p>
                  <span className="changelog-channel">{entry.channel}</span>
                </div>
                <p className="changelog-summary">{entry.summary}</p>
                <p className="changelog-meta">
                  {formatTimestamp(entry.created_at)}
                  {entry.ticket_id ? ` · ${entry.ticket_id}` : ""}
                  {entry.proposal_id ? ` · ${entry.proposal_id}` : ""}
                  {entry.flags_changed && entry.flags_changed.length > 0 ? ` · ${entry.flags_changed.join(", ")}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export type { ChangelogEntry, RuntimeSettings };
