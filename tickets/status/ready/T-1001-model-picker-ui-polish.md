# T-1001: Model picker UI polish

## Metadata
- ID: T-1001
- Status: ready
- Priority: P2
- Type: feature
- Area: ui
- Epic: none
- Owner: ai-agent
- Created: 2026-03-06
- Updated: 2026-03-07

## Summary
Polish the model selection UI to be more visually refined and modern. The current model picker is functional but feels unpolished compared to the rest of the chat UI. This is a cosmetic improvement to align the picker with the design system established in M9 (E-0011).

### UI Spec Addendum (Required If `Area: ui`)
- Primary job-to-be-done: Select an AI model for the current conversation quickly and confidently.
- Primary action and what must be visually primary: Model selection dropdown/picker in the composer area.
- Navigation / progressive disclosure notes: Model picker is always visible in the composer; advanced model configuration (if any) is secondary.
- Key states to design and verify (happy, empty, error/offline): Selected model displayed; no models available (offline/no key); loading state during model list fetch.
- Copy constraints (what must not be implied): Must not imply models are equivalent in capability or cost; must not promise models that are not configured.

## Context
- User feedback (F-20260306-002) requested a slicker, more visually appealing model picker.
- T-0085 (rerun with model variants) already wired model selection into the rerun flow; this ticket focuses on visual polish of the primary model picker.
- Design guidelines from T-0066 (M9) should be applied.

## References
- T-0085 (rerun with model variants) for current model selection patterns.
- T-0066 (design guidelines) for visual standards.
- `apps/desktop/src/` for current implementation.

## Feedback References
- F-20260306-002

## Acceptance Criteria
- [ ] Model picker visually aligns with the design system from T-0066 (typography, spacing, hover states).
- [ ] Selected model is clearly indicated with appropriate visual weight.
- [ ] Model list items show model name with clear visual hierarchy.
- [ ] Picker interaction feels responsive (no layout shift, smooth open/close).
- [ ] Existing model selection functionality is preserved (no regressions).

## User-Facing Acceptance Criteria
- [ ] Model picker looks polished and consistent with the rest of the chat UI.

## UX Acceptance Criteria
- [ ] Primary flow is keyboard-usable (arrow keys, Enter to select).
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.

## Subtasks
- [ ] Design updates
- [ ] Implementation
- [ ] Tests
- [ ] Documentation updates

## Notes
- This was previously tracked as a duplicate T-0001 entry (not the bootstrap checklist). Canonicalized as T-1001 during the 2026-03-06 PM board cleanup.
- Standalone cosmetic ticket; can be picked up independently of any epic.

## Change Log
- 2026-03-06: Ticket created (canonicalized from duplicate T-0001 entry during PM board cleanup).
- 2026-03-07: Ticket file restored during PM housekeeping (file was missing from prior run).
