# T-0087: Rename active conversation from chat header

## Metadata
- ID: T-0087
- Status: done
- Priority: P2
- Type: feature
- Area: ui
- Epic: none
- Owner: ai-agent
- Created: 2026-03-06
- Updated: 2026-03-06

## Summary
Add an in-context rename action in the conversation header so users can rename the current conversation directly from the chat view using the same pencil affordance pattern as the conversation list.

## Design Spec
### Goals
- Let users rename the active conversation without opening the conversation list panel.
- Reuse the existing rename interaction model and backend rename API.

### Non-goals
- Renaming conversations other than the active conversation from the header.
- Adding new conversation metadata fields.

### Rules and state transitions
- Header shows a pencil button when an active conversation exists and no rename edit is active.
- Clicking pencil enters inline title edit mode for the active conversation.
- Enter submits rename; Escape cancels.
- Existing validation/runtime errors are shown inline.

### User-facing feedback plan
- New pencil icon appears next to the conversation title in the top bar.
- Inline input replaces title while editing and shows rename errors if rename fails.

### Scope bounds
- Desktop UI only (`apps/desktop/src/App.tsx`) plus shell test coverage.

### Edge cases / failure modes
- Busy runtime rename rejection surfaces existing error copy.
- No active conversation: no rename button shown.

### Validation plan
- Automated SSR shell test asserts header rename affordance is rendered.
- Manual checks for happy path rename and Escape cancel path.

### UI Spec Addendum
- Primary job-to-be-done: quickly correct conversation naming while staying in chat context.
- Primary action and what must be visually primary: rename pencil beside conversation title.
- Navigation / progressive disclosure notes: keep full conversation management in sidebar; header adds only direct active-item rename.
- Key states to design and verify (happy, empty, error/offline): default, edit mode, rename error.
- Copy constraints (what must not be implied): do not imply renaming other conversations from header.

## Context
User feedback requested parity with the sidebar pencil rename affordance directly inside conversation view.

## References
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/appShell.test.tsx`

## Feedback References
- `F-20260306-004`

## Acceptance Criteria
- [x] Chat header shows a rename pencil action for the active conversation.
- [x] Users can rename the active conversation inline from the header with Enter submit and Escape cancel.
- [x] Rename errors are shown inline in header edit mode.
- [x] Existing sidebar rename flow continues to work via shared rename helpers.

## User-Facing Acceptance Criteria
- [x] Rename is available from normal chat flow without opening sidebar.
- [x] Copy/microcopy does not imply unsupported rename behavior.

## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable (no mouse required for core actions).
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common breakpoints (mobile + desktop) relevant to the host project.

## QA Evidence Links
- QA checkpoint: `tickets/meta/qa/2026-03-06-qa-T-0087.md`
- Screenshots/artifacts: code inspection + SSR markup evidence

## Evidence (Verification)
- Tests run:
  - Added/updated: `apps/desktop/src/appShell.test.tsx` (header rename affordance assertion)
- Manual checks performed:
  - Verified header now provides a dedicated rename pencil trigger tied to active conversation.
  - Verified shared handlers preserve Enter submit + Escape cancel behavior.
- Screenshots/logs/notes:
  - Markup-based shell test coverage updated for header affordance label.

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates

## Notes
Assumption made autonomously: “same pencil button as in conversation list” means same icon/action pattern, not pixel-identical placement.

## Change Log
- 2026-03-06: Ticket created from F-20260306-004 and placed in ready.
- 2026-03-06: Moved to in-progress; implemented top-bar rename affordance and shared rename handlers.
- 2026-03-06: Added app shell test coverage for header rename affordance.
- 2026-03-06: Moved to review.
- 2026-03-06: QA passed (`tickets/meta/qa/2026-03-06-qa-T-0087.md`).
- 2026-03-06: PM accepted and moved to done (`tickets/meta/feedback/2026-03-06-pm-checkpoint-T-0087-self-evolve.md`).
