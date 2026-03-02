# T-0061: M8 non-review UI — notifications and changelog undo

## Metadata
- ID: T-0061
- Status: done
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-02


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
- [x] In-app notification component handles all eight states with the specified copy.
- [x] "Undo" button triggers `POST /agent/rollback` and transitions notification to `reverting` → `reverted` (or error state).
- [x] "See what changed ↓" toggle expands an inline read-only unified diff view; collapsed by default.
- [x] Changelog panel in Settings lists all applied patches with: description, timestamp, Undo button (if `status: applied`), and diff toggle.
- [x] Undo remains accessible from Changelog even after notification is dismissed.
- [x] All copy strings match the spec exactly (no invented copy).
- [x] No blocking modal or screen interrupts the user before a change is applied.
- [x] UI states transition correctly when polled from `GET /agent/patch-status/{patch_id}`.
- [x] User-facing acceptance criterion: user can submit feedback, see the notification appear, click Undo, and see the "Change undone" confirmation — without reading any source code.

## User-Facing Acceptance Criteria
- [x] User can locate and trigger Undo without guidance after a change is applied.
- [x] Copy/microcopy does not imply unsupported behavior (no "permanently applied", no "approved by you").

## UX Acceptance Criteria
- [x] All notification actions are keyboard-accessible.
- [x] Empty state for Changelog: "No changes applied yet."
- [x] Error/failure states are clear about what happened and whether files were modified.

## Dependencies / Sequencing
- Depends on: T-0059 (patch status endpoint), T-0060 (rollback endpoint).
- Can be developed in parallel with T-0060 using mocked API responses.

## Evidence (Verification)

### Frontend component (`PatchNotification.tsx`)
- All 8 UI states implemented with exact spec copy (spec §5).
- `role="status"` + `aria-live="polite"` for screen-reader announcements.
- "Undo" button present and prominent for `applied` state; calls `POST /agent/rollback`.
- "See what changed ↓" / "See what was reverted ↓" toggle hidden by default, `aria-expanded` tracked.
- "Dismiss" button on all error/terminal-without-Undo states.
- Inline `<pre><code>` diff panel with max-height scroll.
- Copy constraints verified via tests: no "approved", no "permanent", no "Done" in spinner states.

### Backend additions
- `PatchStorage.list_all()` — returns all artifacts sorted by `created_at` desc.
- `PatchStatusResponse.unified_diff` — diff exposed to frontend for "See what changed" toggle.
- `CodePatchRequest.base_ref` optional — auto-resolved via `git rev-parse HEAD` when empty.
- `GET /state` — includes `patches: PatchSummary[]` so Changelog loads on boot.

### Changelog panel (`settingsPanel.tsx`)
- Shows all `PatchEntry` items above the existing system changelog.
- Per-entry: title, description, status badge, timestamp, applied/reverted timestamps.
- Undo button present only for `status: applied` patches (persists after notification dismissed).
- "See what changed ↓" / "See what was reverted ↓" diff toggle per entry.
- Empty state: "No changes applied yet."

### FeedbackPanel (`feedbackPanel.tsx`)
- "Fix with AI →" button per captured feedback item triggers `POST /agent/code-patch`.

### Polling (`useRuntime.ts`)
- `requestPatch(feedbackId, title, summary, area)` — calls `/agent/code-patch`, starts poll.
- `rollbackPatch(patchId)` — calls `/agent/rollback`, optimistic `reverting` transition.
- Poll interval 1.5 s with exponential backoff on error (max 8 s); stops at terminal states.

### Tests (`PatchNotification.test.tsx`)
- 37 tests covering all 8 states, Undo/Dismiss callbacks, diff toggle expand/collapse, copy constraints, accessibility attributes.
- All 115 frontend tests pass (`npm run test`).
- All 27 `test_patch_agent.py` backend tests pass.

## Subtasks
- [x] In-app notification component (all 8 states)
- [x] Changelog panel Undo entry + diff toggle
- [x] API polling for status transitions
- [x] Copy review against spec constraints
- [x] Keyboard accessibility pass
- [x] Component tests for each state

## Change Log
- 2026-03-01: Created from T-0058 design spec (M8 implementation ticket 3 of 3).
- 2026-03-02: Implementation complete. All ACs checked. 37 new tests, 115 total pass. Moved to review.
- 2026-03-02: PM accepted. QA PASS. T-0062 filed for follow-up (notification dismiss + failure reason copy). Moved to done.
