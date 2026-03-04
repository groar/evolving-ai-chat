import { useState } from "react";

// ---------------------------------------------------------------------------
// Types (also exported for use in settingsPanel, stores, and hooks)
// ---------------------------------------------------------------------------

export type PatchStatus =
  | "pending_apply"
  | "pending"
  | "applying"
  | "applied"
  | "apply_failed"
  | "scope_blocked"
  | "reverted"
  | "rollback_conflict"
  | "rollback_unavailable"
  | "reverting";

export type PatchEntry = {
  id: string;
  status: PatchStatus;
  title: string;
  description: string;
  unified_diff: string;
  created_at: string;
  failure_reason?: string | null;
  applied_at?: string | null;
  reverted_at?: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSpinnerStatus(status: PatchStatus): boolean {
  return (
    status === "pending_apply" ||
    status === "pending" ||
    status === "applying" ||
    status === "reverting"
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin shrink-0"
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// PatchNotification — floating banner surfacing all 8 UI states (spec §5)
// ---------------------------------------------------------------------------

type Props = {
  patch: PatchEntry;
  onUndo: (patchId: string) => void;
  onDismiss: () => void;
};

function getFailureReasonCopy(reason?: string | null): string {
  switch (reason) {
    case "validation_failed":
      return "checks didn't pass";
    case "base_ref_mismatch":
      return "the codebase changed since this was generated — resubmit your feedback";
    case "empty_or_malformed_patch":
      return "the agent returned an unusable response";
    case "harness_unavailable":
      return "the AI agent couldn't be reached";
    default:
      return "an unexpected error occurred";
  }
}

export function PatchNotification({ patch, onUndo, onDismiss }: Props) {
  const [diffExpanded, setDiffExpanded] = useState(false);
  const { status } = patch;

  const hasDiff = Boolean(patch.unified_diff);

  const baseClass =
    "fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-2rem))] border rounded-xl p-3.5 shadow-lg grid gap-2.5 bg-white";

  const stateVariant: Record<string, string> = {
    applied: "border-[#9ebf97] bg-[#effbe8]",
    reverted: "border-[#9ebf97] bg-[#effbe8]",
    apply_failed: "border-[#f4a58b] bg-[#fff0ea]",
    scope_blocked: "border-[#f4a58b] bg-[#fff0ea]",
    rollback_conflict: "border-[#f4a58b] bg-[#fff0ea]",
    rollback_unavailable: "border-[#f4a58b] bg-[#fff0ea]",
  };
  const variantClass = stateVariant[status] ?? "border-[#dfbe78] bg-[#fff7e6]";

  const actionBtnBase =
    "border rounded-lg py-1.5 px-3 text-sm font-medium font-inherit cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-1";
  const primaryBtn = `${actionBtnBase} border-[#d25722] bg-[#d25722] text-white hover:bg-[#b84a1c] hover:border-[#b84a1c]`;
  const secondaryBtn = `${actionBtnBase} border-border bg-white text-foreground hover:bg-[#fff8f2] hover:border-[#efbe91]`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Code change notification"
      className={`${baseClass} ${variantClass}`}
    >
      {/* Main message */}
      <div className="flex items-start gap-2">
        {isSpinnerStatus(status) && (
          <span className="mt-0.5 text-[#6b4e00]">
            <Spinner />
          </span>
        )}
        <p className="m-0 text-sm text-foreground flex-1">
          {status === "pending_apply" || status === "pending"
            ? "Working on a change based on your feedback…"
            : status === "applying"
              ? "Applying change…"
              : status === "reverting"
                ? "Undoing change…"
                : status === "applied"
                  ? `${patch.description || patch.title}. Undo?`
                  : status === "apply_failed"
                    ? `Couldn't apply the change: ${getFailureReasonCopy(patch.failure_reason)}. No files were modified.`
                    : status === "scope_blocked"
                      ? "The agent tried to modify files outside the allowed area. Change blocked."
                      : status === "reverted"
                        ? "Change undone. The app is back to how it was."
                        : status === "rollback_conflict"
                          ? "Can't undo this automatically — a later change modified the same files."
                          : status === "rollback_unavailable"
                            ? "Rollback is no longer available for this change."
                            : null}
        </p>
      </div>

      {/* Actions row */}
      {!isSpinnerStatus(status) && (
        <div className="flex flex-wrap gap-2">
          {status === "applied" && (
            <>
              <button
                type="button"
                className={primaryBtn}
                onClick={() => onUndo(patch.id)}
                aria-label="Undo this change"
              >
                Undo
              </button>
              {hasDiff && (
                <button
                  type="button"
                  className={secondaryBtn}
                  onClick={() => setDiffExpanded((e) => !e)}
                  aria-expanded={diffExpanded}
                  aria-controls={`diff-${patch.id}`}
                >
                  {diffExpanded ? "Hide changes ↑" : "See what changed ↓"}
                </button>
              )}
              <button
                type="button"
                className={secondaryBtn}
                onClick={onDismiss}
                aria-label="Done"
              >
                Done
              </button>
            </>
          )}

          {status === "reverted" && hasDiff && (
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => setDiffExpanded((e) => !e)}
              aria-expanded={diffExpanded}
              aria-controls={`diff-${patch.id}`}
            >
              {diffExpanded ? "Hide changes ↑" : "See what was reverted ↓"}
            </button>
          )}

          {(status === "apply_failed" ||
            status === "scope_blocked" ||
            status === "rollback_conflict" ||
            status === "rollback_unavailable") && (
            <button
              type="button"
              className={secondaryBtn}
              onClick={onDismiss}
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Inline diff toggle */}
      {diffExpanded && hasDiff && (
        <div
          id={`diff-${patch.id}`}
          aria-label="Unified diff of the change"
        >
          <pre className="m-0 text-xs leading-relaxed overflow-auto max-h-60 bg-[#f4f5f0] border border-border rounded-lg p-2.5 font-mono whitespace-pre">
            <code>{patch.unified_diff}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
