# T-0061: M8 non-review UI — notifications and changelog undo

## Metadata
- ID: T-0061
- Status: ready
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Implement the user-facing UI for the M8 code loop. The user never sees a blocking diff-review screen; instead, changes are applied automatically and surfaced as in-app notifications with an always-present Undo action. The Changelog panel gains a persistent Undo entry for each applied patch. A "See what changed" diff toggle is available but optional. All eight UI states enumerated in the spec must be implemented with the required copy constraints.

## Context
- Spec: `docs/m8-code-loop.md` §§3.5, 5.
- The user's safety valve is rollback, not pre-apply review. The UI must make Undo highly discoverable and trust-building.
- All state transitions and copy strings are defined in the spec; implementers must not invent new copy.

## References
- `docs/m8-code-loop.md`
- `apps/desktop/src/settingsPanel.tsx` (existing Changelog panel)
- `apps/desktop/src/feedbackPanel.tsx` (existing feedback capture UI)

## Feedback References
- F-20260301-008

## Design Spec

### UI Spec Addendum
- **Primary job-to-be-done**: inform the user that a change was made and give them an obvious way to undo it.
- **Primary action**: "Undo" (single-word, always visible while status is `applied`). Secondary action: "See what changed ↓" (collapsed by default).
- **Navigation / progressive disclosure**: notification appears as a toast/banner after apply; the same entry persists in the Changelog panel under Settings. The diff toggle is hidden by default and expands inline.
- **Key states to design and verify**:
  - `pending`: spinner + "Working on a change based on your feedback…"
  - `applying`: spinner + "Applying change…"
  - `applied`: "[description]. Undo?" — Undo button prominent; "See what changed ↓" secondary.
  - `apply_failed`: "Couldn't apply the change: [reason]. No files were modified." — Dismiss.
  - `scope_blocked`: "The agent tried to modify files outside the allowed area. Change blocked." — Dismiss.
  - `reverted`: "Change undone. The app is back to how it was." — "See what was reverted" secondary.
  - `rollback_conflict`: "Can't undo this automatically — a later change modified the same files." — Dismiss.
  - `rollback_unavailable`: "Rollback is no longer available for this change." — Dismiss.
- **Copy constraints** (must not violate):
  - Must not say "approved" or imply the user took action before the change was applied.
  - Must not hide the Undo button after `applied` — it must remain in the Changelog.
  - Must not say "the change is permanent".
  - Spinner states must not say "Done" until apply is confirmed.
  - Must not imply the agent has access beyond the UI layer.

## Acceptance Criteria
- [ ] In-app notification component handles all eight states with the specified copy.
- [ ] "Undo" button triggers `POST /agent/rollback` and transitions notification to `reverting` → `reverted` (or error state).
- [ ] "See what changed ↓" toggle expands an inline read-only unified diff view; collapsed by default.
- [ ] Changelog panel in Settings lists all applied patches with: description, timestamp, Undo button (if `status: applied`), and diff toggle.
- [ ] Undo remains accessible from Changelog even after notification is dismissed.
- [ ] All copy strings match the spec exactly (no invented copy).
- [ ] No blocking modal or screen interrupts the user before a change is applied.
- [ ] UI states transition correctly when polled from `GET /agent/patch-status/{patch_id}`.
- [ ] User-facing acceptance criterion: user can submit feedback, see the notification appear, click Undo, and see the "Change undone" confirmation — without reading any source code.

## User-Facing Acceptance Criteria
- [ ] User can locate and trigger Undo without guidance after a change is applied.
- [ ] Copy/microcopy does not imply unsupported behavior (no "permanently applied", no "approved by you").

## UX Acceptance Criteria
- [ ] All notification actions are keyboard-accessible.
- [ ] Empty state for Changelog: "No changes applied yet."
- [ ] Error/failure states are clear about what happened and whether files were modified.

## Dependencies / Sequencing
- Depends on: T-0059 (patch status endpoint), T-0060 (rollback endpoint).
- Can be developed in parallel with T-0060 using mocked API responses.

## Evidence (Verification)
_(to be filled during implementation)_

## Subtasks
- [ ] In-app notification component (all 8 states)
- [ ] Changelog panel Undo entry + diff toggle
- [ ] API polling for status transitions
- [ ] Copy review against spec constraints
- [ ] Keyboard accessibility pass
- [ ] Component tests for each state

## Change Log
- 2026-03-01: Created from T-0058 design spec (M8 implementation ticket 3 of 3).
