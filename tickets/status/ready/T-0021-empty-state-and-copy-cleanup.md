# T-0021: Empty state and copy cleanup (reduce implementation leakage)

## Metadata
- ID: T-0021
- Status: ready
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
- [ ] First-run empty state frames the product and provides a single clear next action.
- [ ] Duplicated instruction text is removed (no repeated "press Enter to send" in multiple places).
- [ ] User-facing surfaces no longer mention storage implementation details (for example `SQLite`) as labels.
- [ ] Regression coverage exists for the new empty-state/copy rules.

## UX Acceptance Criteria (Only If `Area: ui`)
- [ ] Copy/microcopy is consistent and unambiguous.
- [ ] Empty/error states are clear and actionable.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint:
- Screenshots/artifacts:

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Design updates
- [ ] Implementation
- [ ] Tests
- [ ] Documentation updates (if any)

## Change Log
- 2026-02-28: Ticket created from external designer review (F-20260228-002) and moved to `ready/`.

