# T-0062: Patch notification — dismiss affordance and human-readable failure reasons

## Metadata
- ID: T-0062
- Status: backlog
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-02
- Updated: 2026-03-02

## Summary
Two small UX polishes surfaced during QA of T-0061:

1. **No dismiss in `applied` state** — the notification banner has no close/dismiss affordance when `status: applied`. Users who want to keep a change and move on have no way to clear the notification without clicking Undo. The Undo action must remain in the Changelog (spec §3.4), but the toast itself should be closable.

2. **Machine-readable `failure_reason` in copy** — `apply_failed` state renders the raw `failure_reason` field (e.g. `validation_failed`, `base_ref_mismatch`) directly in the notification copy. These codes are not user-friendly.

## Context
- T-0061 implemented the spec exactly; both items are follow-ups that improve UX without changing the core M8 guarantees.
- The spec says "Must not hide the Undo button after applied — it must remain in the Changelog." That constraint is already satisfied by the persistent Changelog entry. The toast dismissal is additive.

## Design Spec

### Issue 1 — Dismiss in `applied` state
- Add a small `×` (close icon) or a text "Done" button to the notification in `applied` state.
- On dismiss: `setNotificationPatchId(null)` — the Changelog entry in Settings still has the Undo button.
- Must not remove the patch from the Changelog or change its status.

### Issue 2 — Human-readable failure reasons
Map machine-readable `failure_reason` values to user-friendly copy before rendering:
| `failure_reason` | User-facing copy |
|---|---|
| `validation_failed` | "checks didn't pass" |
| `base_ref_mismatch` | "the codebase changed since this was generated — resubmit your feedback" |
| `empty_or_malformed_patch` | "the agent returned an unusable response" |
| `harness_unavailable` | "the AI agent couldn't be reached" |
| _(unknown / null)_ | "an unexpected error occurred" |

## Acceptance Criteria
- [ ] `applied` state notification has a visible dismiss affordance (button or icon); clicking it clears the toast without affecting Changelog or patch status.
- [ ] `apply_failed` notification shows mapped human-readable reason, not raw `failure_reason` code.
- [ ] Keyboard accessible: dismiss affordance is tab-reachable with visible focus ring.
- [ ] Existing `PatchNotification` tests continue to pass; add tests for dismiss in `applied` state.

## Evidence (Verification)
_(to be filled during implementation)_

## Change Log
- 2026-03-02: Created from T-0061 QA findings (WARN items). Filed by automatic QA phase.
