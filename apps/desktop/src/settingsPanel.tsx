import { useMemo, useState } from "react";

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

type ValidationRunSummary = {
  validation_run_id: string;
  status: "passing" | "failing";
  summary: string;
  artifact_refs: string[];
  created_at: string;
};

type ProposalDecision = {
  status: "pending" | "accepted" | "rejected";
  decided_at?: string | null;
  notes?: string | null;
};

type ChangeProposal = {
  proposal_id: string;
  created_at: string;
  title: string;
  rationale: string;
  source_feedback_ids: string[];
  diff_summary: string;
  risk_notes: string;
  validation_runs: ValidationRunSummary[];
  decision: ProposalDecision;
};

type CreateProposalInput = {
  title: string;
  rationale: string;
  source_feedback_ids: string[];
};

type AddValidationRunInput = {
  status: "passing" | "failing";
  summary: string;
  artifact_refs: string[];
};

type SettingsPanelProps = {
  settings: RuntimeSettings;
  changelog: ChangelogEntry[];
  proposals: ChangeProposal[];
  feedbackIds: string[];
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
  onCreateProposal: (input: CreateProposalInput) => void;
  onAddValidationRun: (proposalId: string, input: AddValidationRunInput) => void;
  onUpdateProposalDecision: (proposalId: string, status: "accepted" | "rejected", notes: string) => void;
};

type ProposalEditorState = {
  validationStatus: "passing" | "failing";
  validationSummary: string;
  validationArtifactRefs: string;
  decisionNotes: string;
};

const defaultProposalEditorState: ProposalEditorState = {
  validationStatus: "passing",
  validationSummary: "",
  validationArtifactRefs: "",
  decisionNotes: ""
};

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function parseCsvIds(rawValue: string): string[] {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function latestValidationRun(proposal: ChangeProposal): ValidationRunSummary | null {
  if (proposal.validation_runs.length === 0) {
    return null;
  }
  return proposal.validation_runs[proposal.validation_runs.length - 1];
}

function proposalStateLabel(proposal: ChangeProposal): string {
  if (proposal.decision.status === "accepted") {
    return "Accepted";
  }
  if (proposal.decision.status === "rejected") {
    return "Rejected";
  }

  const latestValidation = latestValidationRun(proposal);
  if (!latestValidation) {
    return "Pending validation";
  }

  return latestValidation.status === "passing" ? "Ready for decision" : "Validation failed";
}

function acceptBlockReason(proposal: ChangeProposal): string | null {
  const latestValidation = latestValidationRun(proposal);
  if (!latestValidation) {
    return "Accept disabled: run validation first.";
  }
  if (latestValidation.status !== "passing") {
    return "Accept disabled: latest validation is failing.";
  }
  return null;
}

export function SettingsPanel(props: SettingsPanelProps) {
  const {
    settings,
    changelog,
    proposals,
    feedbackIds,
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
    onCreateProposal,
    onAddValidationRun,
    onUpdateProposalDecision
  } = props;

  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalRationale, setProposalRationale] = useState("");
  const [proposalFeedbackIdsCsv, setProposalFeedbackIdsCsv] = useState("");
  const [proposalFormError, setProposalFormError] = useState<string | null>(null);
  const [proposalEditors, setProposalEditors] = useState<Record<string, ProposalEditorState>>({});

  const sortedFeedbackIds = useMemo(() => [...feedbackIds].sort((a, b) => b.localeCompare(a)), [feedbackIds]);

  function editorFor(proposalId: string): ProposalEditorState {
    return proposalEditors[proposalId] ?? defaultProposalEditorState;
  }

  function updateProposalEditor(proposalId: string, updates: Partial<ProposalEditorState>) {
    setProposalEditors((current) => {
      const existing = current[proposalId] ?? defaultProposalEditorState;
      return {
        ...current,
        [proposalId]: {
          ...existing,
          ...updates
        }
      };
    });
  }

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

  function submitCreateProposal() {
    const title = proposalTitle.trim();
    const rationale = proposalRationale.trim();
    const sourceFeedbackIds = parseCsvIds(proposalFeedbackIdsCsv);
    if (title.length === 0) {
      setProposalFormError("Proposal title is required.");
      return;
    }

    if (sourceFeedbackIds.length === 0 && rationale.length === 0) {
      setProposalFormError("Provide a rationale when creating without linked feedback IDs.");
      return;
    }

    onCreateProposal({
      title,
      rationale,
      source_feedback_ids: sourceFeedbackIds
    });
    setProposalTitle("");
    setProposalRationale("");
    setProposalFeedbackIdsCsv("");
    setProposalFormError(null);
  }

  function submitValidationRun(proposal: ChangeProposal) {
    const editor = editorFor(proposal.proposal_id);
    const summary = editor.validationSummary.trim();
    if (summary.length === 0) {
      return;
    }

    onAddValidationRun(proposal.proposal_id, {
      status: editor.validationStatus,
      summary,
      artifact_refs: parseCsvIds(editor.validationArtifactRefs)
    });

    updateProposalEditor(proposal.proposal_id, {
      validationSummary: "",
      validationArtifactRefs: ""
    });
  }

  function submitProposalDecision(proposal: ChangeProposal, status: "accepted" | "rejected") {
    const editor = editorFor(proposal.proposal_id);
    const notes = editor.decisionNotes.trim();
    if (status === "rejected" && notes.length < 10) {
      return;
    }

    onUpdateProposalDecision(proposal.proposal_id, status, notes);
  }

  return (
    <section className="settings-panel" aria-label="Settings">
      <p className="settings-title">Settings</p>
      <p className="settings-copy">Changelog and experiment controls live in this section.</p>
      <div className="settings-section-header">
        <p className="settings-title">Changelog + Experiments</p>
      </div>
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

      <div className="proposals-wrap">
        <div className="settings-section-header">
          <p className="settings-title">Proposals</p>
          <button type="button" className="rail-btn" onClick={onRefresh} disabled={isBusy}>
            Refresh
          </button>
        </div>
        <p className="settings-copy">
          Proposals are reviewed locally and require your explicit decision. Accepting does not self-ship code changes.
        </p>

        <div className="proposal-create-form">
          <label className="settings-title" htmlFor="proposal-title-input">
            Create proposal
          </label>
          <input
            id="proposal-title-input"
            className="settings-input"
            type="text"
            placeholder="Title"
            value={proposalTitle}
            onChange={(event) => setProposalTitle(event.target.value)}
            disabled={isBusy}
          />
          <textarea
            className="settings-textarea"
            placeholder="Rationale (required if no feedback IDs linked)"
            rows={3}
            value={proposalRationale}
            onChange={(event) => setProposalRationale(event.target.value)}
            disabled={isBusy}
          />
          <input
            className="settings-input"
            type="text"
            list="feedback-id-options"
            placeholder="Feedback IDs (comma-separated, optional)"
            value={proposalFeedbackIdsCsv}
            onChange={(event) => setProposalFeedbackIdsCsv(event.target.value)}
            disabled={isBusy}
          />
          <datalist id="feedback-id-options">
            {sortedFeedbackIds.map((feedbackId) => (
              <option key={feedbackId} value={feedbackId} />
            ))}
          </datalist>
          {proposalFormError && <p className="settings-error">{proposalFormError}</p>}
          <button type="button" className="rail-btn" onClick={submitCreateProposal} disabled={isBusy}>
            Create proposal
          </button>
        </div>

        {proposals.length === 0 ? (
          <p className="flag-note">No proposals yet.</p>
        ) : (
          <ul className="proposals-list">
            {proposals.map((proposal) => {
              const latestValidation = latestValidationRun(proposal);
              const acceptReason = acceptBlockReason(proposal);
              const editor = editorFor(proposal.proposal_id);
              const isRejectDisabled = editor.decisionNotes.trim().length < 10;
              return (
                <li key={proposal.proposal_id} className="proposal-item">
                  <div className="proposal-header">
                    <p className="changelog-title">{proposal.title}</p>
                    <span className="changelog-channel">{proposalStateLabel(proposal)}</span>
                  </div>
                  <p className="changelog-meta">
                    {formatTimestamp(proposal.created_at)} · {proposal.proposal_id}
                  </p>
                  <p className="changelog-summary">{proposal.rationale || "No rationale provided."}</p>
                  <p className="changelog-meta">
                    Feedback links: {proposal.source_feedback_ids.length > 0 ? proposal.source_feedback_ids.join(", ") : "none"}
                  </p>

                  <div className="proposal-subsection">
                    <p className="settings-title">Validation</p>
                    <p className="flag-note">
                      {latestValidation
                        ? `Latest: ${latestValidation.status} (${formatTimestamp(latestValidation.created_at)})`
                        : "Validation has not run."}
                    </p>
                    <div className="proposal-actions-grid">
                      <select
                        className="settings-input"
                        value={editor.validationStatus}
                        onChange={(event) =>
                          updateProposalEditor(proposal.proposal_id, {
                            validationStatus: event.target.value === "failing" ? "failing" : "passing"
                          })
                        }
                        disabled={isBusy}
                      >
                        <option value="passing">Passing</option>
                        <option value="failing">Failing</option>
                      </select>
                      <input
                        className="settings-input"
                        type="text"
                        placeholder="Validation summary"
                        value={editor.validationSummary}
                        onChange={(event) =>
                          updateProposalEditor(proposal.proposal_id, {
                            validationSummary: event.target.value
                          })
                        }
                        disabled={isBusy}
                      />
                      <input
                        className="settings-input"
                        type="text"
                        placeholder="Artifact refs (comma-separated)"
                        value={editor.validationArtifactRefs}
                        onChange={(event) =>
                          updateProposalEditor(proposal.proposal_id, {
                            validationArtifactRefs: event.target.value
                          })
                        }
                        disabled={isBusy}
                      />
                      <button
                        type="button"
                        className="rail-btn"
                        onClick={() => submitValidationRun(proposal)}
                        disabled={isBusy || editor.validationSummary.trim().length === 0}
                      >
                        Add validation run
                      </button>
                    </div>
                  </div>

                  <div className="proposal-subsection">
                    <p className="settings-title">Decision</p>
                    <textarea
                      className="settings-textarea"
                      rows={2}
                      placeholder="Decision notes (required to reject)"
                      value={editor.decisionNotes}
                      onChange={(event) =>
                        updateProposalEditor(proposal.proposal_id, {
                          decisionNotes: event.target.value
                        })
                      }
                      disabled={isBusy}
                    />
                    {acceptReason && <p className="flag-note">{acceptReason}</p>}
                    <div className="proposal-actions-row">
                      <button
                        type="button"
                        className="rail-btn"
                        onClick={() => submitProposalDecision(proposal, "accepted")}
                        disabled={isBusy || acceptReason !== null}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="rail-btn danger"
                        onClick={() => submitProposalDecision(proposal, "rejected")}
                        disabled={isBusy || isRejectDisabled}
                      >
                        Reject
                      </button>
                    </div>
                    {proposal.decision.decided_at && (
                      <p className="changelog-meta">
                        Decision: {proposal.decision.status} at {formatTimestamp(proposal.decision.decided_at)}
                      </p>
                    )}
                    {proposal.decision.notes && <p className="changelog-meta">Notes: {proposal.decision.notes}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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

export type { AddValidationRunInput, ChangeProposal, ChangelogEntry, CreateProposalInput, RuntimeSettings };
