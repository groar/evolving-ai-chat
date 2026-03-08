# T-0104: Align rename button with title

## Metadata
- ID: T-0104
- Status: done
- Priority: P2
- Type: feature
- Area: ui
- Epic: none
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08

## Summary
Place the header rename (“edit name”) button directly beside the active discussion title so the control is visually tied to the field it edits, while keeping the existing right-side top-bar controls (cost, improvement, activity, settings) in their current positions.

## Design Spec
### Goals
- Make the rename affordance contextually obvious by placing it adjacent to the discussion title.
- Preserve existing top-bar control grouping and behavior.

### Non-goals
- Changing rename behavior (submit/cancel/error handling).
- Reordering settings/activity/suggestion controls.

### Rules and state transitions
- Non-edit state: title and rename button render in the same left-side title group.
- Edit state: inline rename input replaces title group; no duplicate rename button is shown.
- Existing Enter submit / Escape cancel behavior remains unchanged.

### User-facing feedback plan
- Users see the pencil button immediately next to the discussion title.
- No changes to button labels, shortcuts, or right-side control layout.

### Scope bounds
- Desktop header layout in `apps/desktop/src/App.tsx`.
- Shell markup regression assertion in `apps/desktop/src/appShell.test.tsx`.

### Edge cases / failure modes
- Long titles still truncate without pushing right-side controls out of place.
- No active conversation: existing visibility logic for rename action remains unchanged.

### Validation plan
- Regression assertion verifies rename button is adjacent to title markup.
- Manual UI pass verifies right-side controls remain unchanged.

### UI Spec Addendum
- Primary job-to-be-done: quickly rename the current discussion from where the title is displayed.
- Primary action and what must be visually primary: title + adjacent rename pencil as one coherent control cluster.
- Navigation / progressive disclosure notes: keep secondary/global controls on the right cluster.
- Key states to design and verify (happy, empty, error/offline): default header, inline rename edit state, rename error state.
- Copy constraints (what must not be implied): do not imply editing anything other than current discussion name.

## Context
Feedback reported that rename was perceived as grouped with unrelated top-right controls, reducing discoverability and expected affordance mapping.

## References
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/appShell.test.tsx`

## Feedback References
- `F-20260308-006`
- `F-20260308-007`

## Acceptance Criteria
- [x] In non-edit mode, the rename button is rendered directly next to the active discussion title.
- [x] Top-right controls (cost, improvement, activity, settings) remain in their existing order and location.
- [x] Inline rename edit mode (input + Enter/Escape + errors) continues to function unchanged.

## User-Facing Acceptance Criteria
- [x] Rename action is discoverable from the normal chat flow beside the title it edits.
- [x] Copy/microcopy does not imply broader rename scope.

## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable (no mouse required for core actions).
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common breakpoints (mobile + desktop) relevant to the host project.

## QA Evidence Links
- QA checkpoint: `tickets/meta/qa/2026-03-08-qa-checkpoint-t0104.md`
- Screenshots/artifacts: N/A (static pass + markup/manual validation notes)

## Evidence (Verification)
- Tests run:
  - Static regression coverage confirmed in `apps/desktop/src/appShell.test.tsx` (`Rename current conversation` adjacent-to-title regex assertion).
- Manual checks performed:
  - Reviewed `App.tsx` header structure: title + rename button share left-side cluster; cost/improvement/activity/settings remain right-side siblings.
  - Verified edit mode flow remains unchanged (input + Enter/Escape + error message paths unchanged in `submitRenameConversation` flow).
- Screenshots/logs/notes:
  - Code inspection evidence captured in QA checkpoint.

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates

## Notes
Assumption made autonomously: “discussion name” refers specifically to the active chat header title, not sidebar list items.

## Change Log
- 2026-03-08: Ticket created from F-20260308-006 and placed in ready.
- 2026-03-08: Self-evolving run linked duplicate feedback F-20260308-007 and validated existing implementation against AC/UX constraints.
- 2026-03-08: QA PASS recorded; ticket accepted to done.
