import { useMemo, useState } from "react";
import { railBtn, railBtnDanger, settingsInput, settingsTextarea } from "@/lib/ui-classes";

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
  /** API key configuration (Connections subsection) */
  apiKeySet: boolean;
  onSaveApiKey: (key: string) => Promise<void>;
  onRemoveApiKey: () => Promise<void>;
  apiKeyError: string | null;
  isSavingApiKey: boolean;
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
    onUpdateProposalDecision,
    apiKeySet,
    onSaveApiKey,
    onRemoveApiKey,
    apiKeyError,
    isSavingApiKey
  } = props;

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalRationale, setProposalRationale] = useState("");
  const [proposalFeedbackIdsCsv, setProposalFeedbackIdsCsv] = useState("");
  const [proposalFormError, setProposalFormError] = useState<string | null>(null);
  const [proposalEditors, setProposalEditors] = useState<Record<string, ProposalEditorState>>({});
  const [isCreateDraftOpen, setIsCreateDraftOpen] = useState(false);

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

  async function handleSaveApiKey() {
    const key = apiKeyInput.trim();
    if (key.length === 0) return;
    try {
      await onSaveApiKey(key);
      setApiKeyInput("");
    } catch {
      // Error surfaced via apiKeyError prop
    }
  }

  async function handleRemoveApiKey() {
    try {
      await onRemoveApiKey();
    } catch {
      // Error surfaced via apiKeyError prop
    }
  }

  function requestSwitchToStable() {
    const confirmed = confirmAction(
      "Switch to Stable? Your conversations and history are unaffected."
    );
    if (!confirmed) {
      return;
    }
    onSelectChannel("stable");
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

  function submitCreateProposal() {
    const title = proposalTitle.trim();
    const rationale = proposalRationale.trim();
    const sourceFeedbackIds = parseCsvIds(proposalFeedbackIdsCsv);
    if (title.length === 0) {
      setProposalFormError("Draft title is required.");
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
    setIsCreateDraftOpen(false);
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
    <section className="grid gap-5 max-h-none min-h-0 overflow-visible min-w-0" aria-label="Settings">
      <div className="flex justify-between items-center gap-2">
        <p className="m-0 text-sm font-semibold text-foreground">Connections</p>
      </div>
      <p className="m-0 text-sm text-foreground">
        {apiKeySet ? "OpenAI API key: Set ✓" : "OpenAI API key: Not configured"}
      </p>
      {apiKeySet ? (
        <div className="flex items-center gap-2.5">
          <span className="font-mono tracking-[0.15em]" aria-hidden>••••••••••••</span>
          <button
            type="button"
            className={railBtnDanger}
            onClick={() => void handleRemoveApiKey()}
            disabled={isBusy || isSavingApiKey}
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <label htmlFor="api-key-input" className="sr-only">
            OpenAI API key
          </label>
          <input
            id="api-key-input"
            className={settingsInput}
            type="password"
            placeholder="OpenAI API key"
            value={apiKeyInput}
            onChange={(event) => setApiKeyInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void handleSaveApiKey()}
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
            onClick={() => void handleSaveApiKey()}
            disabled={isBusy || isSavingApiKey || apiKeyInput.trim().length === 0}
          >
            {isSavingApiKey ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      <div className="flex justify-between items-center gap-2">
        <p className="m-0 text-sm font-semibold text-foreground">Works offline</p>
      </div>
      <ul className="m-0 ml-4 p-0 text-sm text-foreground leading-relaxed [&>li]:mb-1">
        <li>Browse and search conversations</li>
        <li>Change settings and feature toggles</li>
        <li>Capture and review feedback</li>
      </ul>

      <div className="flex justify-between items-center gap-2">
        <p className="m-0 text-sm font-semibold text-foreground">Release Channel</p>
      </div>
      <p className="m-0 text-sm text-foreground">Controls which features are active. Your conversations and history are never affected.</p>

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
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Early-Access Features (advanced)</summary>
        <p className="m-0 text-sm text-foreground">Optional beta toggles. Your data is never affected.</p>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={configuredDiagnosticsFlag}
            disabled={!canToggleFlags}
            onChange={(event) => onToggleDiagnostics(event.target.checked)}
          />
          Show local service diagnostics (early-access feature)
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

      <details className="border-t border-dashed border-border pt-2.5 grid gap-2.5" name="settings-advanced">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Improvements (advanced)</summary>
        <p className="m-0 text-sm text-foreground">Change draft = local suggestion you review. Nothing ships automatically.</p>
        <p className="m-0 text-xs text-muted-foreground">Feedback → Draft → Run checks → Decide</p>
        <div className="flex justify-between items-center gap-2">
          <p className="m-0 text-sm font-semibold text-foreground">Change Drafts</p>
          <button type="button" className={railBtn} onClick={onRefresh} disabled={isBusy}>
            Refresh
          </button>
        </div>
        <button type="button" className={railBtn} onClick={() => setIsCreateDraftOpen((current) => !current)} disabled={isBusy}>
          {isCreateDraftOpen ? "Hide Draft Form" : "Draft an Improvement"}
        </button>

        {isCreateDraftOpen && (
          <div className="border border-border rounded-lg bg-white p-2.5 grid gap-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="proposal-title-input">
              Draft an Improvement
            </label>
            <input
              id="proposal-title-input"
              className={settingsInput}
              type="text"
              placeholder="Draft title"
              value={proposalTitle}
              onChange={(event) => setProposalTitle(event.target.value)}
              disabled={isBusy}
            />
            <textarea
              className={settingsTextarea}
              placeholder="Rationale (required if no feedback IDs linked)"
              rows={3}
              value={proposalRationale}
              onChange={(event) => setProposalRationale(event.target.value)}
              disabled={isBusy}
            />
            <input
              className={settingsInput}
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
            {proposalFormError && (
              <p className="m-0 border border-[#f4a58b] rounded-lg bg-[#fff0ea] text-destructive text-xs py-2 px-2.5">
                {proposalFormError}
              </p>
            )}
            <button type="button" className={railBtn} onClick={submitCreateProposal} disabled={isBusy}>
              Save Draft
            </button>
          </div>
        )}

        {proposals.length === 0 ? (
          <p className="m-0 text-xs text-muted-foreground">No change drafts yet.</p>
        ) : (
          <ul className="list-none m-0 p-0 grid gap-2">
            {proposals.map((proposal) => {
              const latestValidation = latestValidationRun(proposal);
              const acceptReason = acceptBlockReason(proposal);
              const editor = editorFor(proposal.proposal_id);
              const isRejectDisabled = editor.decisionNotes.trim().length < 10;
              return (
                <li key={proposal.proposal_id} className="border border-border rounded-lg bg-white p-2.5 grid gap-2.5">
                  <div className="flex justify-between items-center gap-2">
                    <p className="m-0 text-sm font-bold">{proposal.title}</p>
                    <span className="border border-border rounded-full py-0.5 px-2 text-xs text-muted-foreground uppercase">
                      {proposalStateLabel(proposal)}
                    </span>
                  </div>
                  <p className="m-0 text-xs text-muted-foreground">
                    {formatTimestamp(proposal.created_at)} · {proposal.proposal_id}
                  </p>
                  <p className="m-0 text-sm text-foreground">{proposal.rationale || "No rationale provided."}</p>
                  <p className="m-0 text-xs text-muted-foreground">
                    Feedback links: {proposal.source_feedback_ids.length > 0 ? proposal.source_feedback_ids.join(", ") : "none"}
                  </p>

                  <div className="border-t border-dashed border-border pt-2.5 grid gap-2">
                    <p className="m-0 text-sm font-semibold text-foreground">Checks</p>
                    <p className="m-0 text-xs text-muted-foreground">
                      {latestValidation
                        ? `Latest: ${latestValidation.status} (${formatTimestamp(latestValidation.created_at)})`
                        : "Checks have not run."}
                    </p>
                    <div className="grid gap-1.5">
                      <select
                        className={settingsInput}
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
                        className={settingsInput}
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
                        className={settingsInput}
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
                        className={railBtn}
                        onClick={() => submitValidationRun(proposal)}
                        disabled={isBusy || editor.validationSummary.trim().length === 0}
                      >
                        Add check run
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-border pt-2.5 grid gap-2">
                    <p className="m-0 text-sm font-semibold text-foreground">Decision</p>
                    <textarea
                      className={settingsTextarea}
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
                    {acceptReason && <p className="m-0 text-xs text-muted-foreground">{acceptReason}</p>}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        className={railBtn}
                        onClick={() => submitProposalDecision(proposal, "accepted")}
                        disabled={isBusy || acceptReason !== null}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className={railBtnDanger}
                        onClick={() => submitProposalDecision(proposal, "rejected")}
                        disabled={isBusy || isRejectDisabled}
                      >
                        Reject
                      </button>
                    </div>
                    {proposal.decision.decided_at && (
                      <p className="m-0 text-xs text-muted-foreground">
                        Decision: {proposal.decision.status} at {formatTimestamp(proposal.decision.decided_at)}
                      </p>
                    )}
                    {proposal.decision.notes && (
                      <p className="m-0 text-xs text-muted-foreground">Notes: {proposal.decision.notes}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </details>

      <div className="border-t border-dashed border-border pt-2.5 grid gap-2.5">
        <p className="m-0 text-sm font-semibold text-foreground">Recent Changes</p>
        {changelog.length === 0 ? (
          <p className="m-0 text-xs text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <ul className="list-none m-0 p-0 grid gap-2">
            {changelog.map((entry) => (
              <li key={`${entry.created_at}-${entry.title}`} className="border border-border rounded-lg bg-white p-2.5 grid gap-1">
                <div className="flex justify-between gap-2 items-center">
                  <p className="m-0 text-sm font-bold">{entry.title}</p>
                  <span className="border border-border rounded-full py-0.5 px-2 text-xs text-muted-foreground capitalize">
                    {entry.channel}
                  </span>
                </div>
                <p className="m-0 text-sm text-foreground">{entry.summary}</p>
                <p className="m-0 text-xs text-muted-foreground">
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
