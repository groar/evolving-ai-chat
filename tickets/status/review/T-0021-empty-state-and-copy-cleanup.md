# T-0021: Empty state and copy cleanup (reduce implementation leakage)

## Metadata
- ID: T-0021
- Status: review
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0003
- Owner: ai-agent
- Created: 2026-02-28
- Updated: 2026-02-28

## Summary
Improve first-run empty states and microcopy so the UI communicates user value and next actions, avoids redundant instructions, and removes implementation details that are irrelevant to end users.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Replace passive/duplicated instructions with a single, purposeful empty state that frames the product and suggests a first action.
  - Remove implementation-detail labels that reduce trust (for example `SQLite`) from user-facing surfaces.
- Non-goals:
  - Deep visual polish or typography refresh.
  - Long-form onboarding/tutorial content.
- Rules and state transitions:
  - There is one primary first-run empty state in the chat area that includes:
    - a short "what this is" line (product framing),
    - one clear suggested action (start a conversation; type a message; or pick an example prompt).
  - Avoid repeating the same instruction in both the empty state and the composer placeholder.
  - Copy should prefer user terms over implementation terms; technical terms (if needed) must be contextualized.
- User-facing feedback plan:
  - Users should be able to identify the next action without scanning multiple boxes of instructional text.
- Scope bounds:
  - Copy changes + minimal layout adjustments; no new navigation required.
- Edge cases / failure modes:
  - Empty conversation list: empty state appears in the appropriate place without overwhelming the layout.
- Validation plan:
  - Deterministic: add/adjust UI tests to assert that:
    - `SQLite` (and similar implementation strings) are not present in user-facing labels,
    - empty state renders a single primary instruction block.

## Context
The current UI is simultaneously empty and noisy. The designer review (F-20260228-002) calls out duplicated guidance and implementation-oriented labeling as key contributors to confusion.

## References
- `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md`

## Feedback References (Optional)
- F-20260228-002

## Acceptance Criteria
- [x] First-run empty state frames the product and provides a single clear next action.
- [x] Duplicated instruction text is removed (no repeated "press Enter to send" in multiple places).
- [x] User-facing surfaces no longer mention storage implementation details (for example `SQLite`) as labels.
- [x] Regression coverage exists for the new empty-state/copy rules.

## UX Acceptance Criteria (Only If `Area: ui`)
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Empty/error states are clear and actionable.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-02-28-qa-checkpoint-t0021.md`
- Screenshots/artifacts:
  - `tickets/meta/qa/artifacts/runtime-smoke/2026-02-28T19-33-36-438Z/smoke-fastapi.log`

## Evidence (Verification)
- Tests run:
  - `npm --prefix apps/desktop test -- appShell.test.tsx`
  - `npm --prefix apps/desktop test`
  - `npm --prefix apps/desktop run build`
  - `npm --prefix apps/desktop run smoke:fastapi`
- Manual checks performed:
  - Reviewed `apps/desktop/src/App.tsx` empty-state and composer copy flow to confirm only one primary instruction block is rendered in the first-run state.
  - QA checklist pass recorded in `tickets/meta/qa/2026-02-28-qa-checkpoint-t0021.md`.
- Screenshots/logs/notes:
  - Headless QA run; no screenshot captured.
  - Runtime smoke artifact: `tickets/meta/qa/artifacts/runtime-smoke/2026-02-28T19-33-36-438Z/smoke-fastapi.log`

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates (if any)

## Change Log
- 2026-02-28: Ticket created from external designer review (F-20260228-002) and moved to `ready/`.
- 2026-02-28: Moved to `in-progress/`; simplified first-run empty-state copy, removed duplicated send guidance, and added a regression test for single empty-state instruction rendering.
- 2026-02-28: Moved to `review/`; completed QA pass (tests/build/smoke + UX checklist) with no bugs found.
