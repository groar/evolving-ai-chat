# T-0012: In-app feedback capture

## Metadata
- ID: T-0012
- Status: review
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0002
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-27

## Summary
Add a minimal in-app way to capture explicit user feedback (friction/suggestion) and persist it locally for later conversion into proposals/tickets.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Let the user record "this was confusing" or "I want X" while using the app.
  - Persist feedback locally with enough context to turn it into a proposal later.
- Non-goals:
  - Auto-creating code changes.
  - External syncing/export.
- Rules and state transitions:
  - Feedback capture creates a new local `feedback_item` record with:
    - timestamp,
    - freeform text,
    - optional tags (low cardinality),
    - optional context pointer (current conversation ID, if available),
    - status (`new`, `triaged`, `converted`, `closed`).
  - Default capture path must be reachable in <= 2 interactions from the main UI.
  - Copy constraints:
    - Must not imply it "opens a GitHub issue" or sends data anywhere.
- User-facing feedback plan:
  - Provide success confirmation and a way to find captured items.
- Scope bounds:
  - Single capture UI (modal or panel) and a simple list view is sufficient.
  - Local-only; no account system.
- Edge cases / failure modes:
  - Storage fails: show non-blocking error; do not crash core chat.
- Validation plan:
  - Deterministic: at least one UI test for "submit feedback creates an item".

## Context
Explicit feedback capture is the minimal "observe" leg of the self-improvement loop.

## References
- `STATUS.md`
- `tickets/meta/epics/E-0002-m1-first-self-improvement-cycle.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [x] User can capture a feedback item from the main UI (discoverable entry point).
- [x] Captured feedback is persisted locally and appears in a simple list view.
- [x] Copy clearly states feedback stays local and does not imply external reporting.
- [x] Basic empty/error states are clear.

## UX Acceptance Criteria (Only If `Area: ui`)
- [x] Capture flow is keyboard-usable.
- [x] Success confirmation is visible and unambiguous.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-02-27-qa-checkpoint-t0012.md`
- Screenshots/artifacts:

## Evidence (Verification)
- Tests run:
  - `npm test` (apps/desktop) -> PASS
  - `npm run build` (apps/desktop) -> PASS
- Manual checks performed:
  - Verified capture entry point is available on main UI rail as `Capture Feedback` toggle.
  - Verified keyboard-usable controls in capture form (textarea, checkboxes, submit button) and status/empty-state messaging paths.
- Screenshots/logs/notes:
  - Deterministic submit flow covered by `apps/desktop/src/feedbackPanel.test.tsx`.

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-27: Moved to `ready/` after M1 loop spec completed.
- 2026-02-27: Moved to `in-progress/` for implementation.
- 2026-02-27: Added local feedback capture panel, local persistence, list view, and deterministic submit test.
- 2026-02-27: Moved to `review/` after implementation and verification evidence updates.
