# T-0072: Activity/history stub clutter cleanup

## Metadata
- ID: T-0072
- Status: backlog
- Priority: P3
- Type: cleanup
- Area: ui
- Epic: none
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
Reduce visual clutter from stub or low-value entries in the Activity/history view so that meaningful changes are easy to scan. In E-0011 tier-2 validation, the user could find and understand history but noted "a lot of stub things" cluttering the interface.

## Design Spec
- Goals:
  - Make the Activity/history view feel calm and informative rather than noisy.
  - Ensure high-signal changes are easy to spot when scanning.
- Non-goals:
  - Do not re-architect the Activity sheet layout again (that was part of E-0011).
  - Do not change the underlying patch history semantics.
- Rules and state transitions:
  - Stub or placeholder entries that carry no actionable information should be hidden, grouped, or otherwise visually de-emphasized.
  - High-signal events (e.g., accepted patches, applied changes, rollbacks) should remain clearly visible.
- User-facing feedback plan:
  - After this ticket, a user should be able to scroll history without feeling that irrelevant or stub records dominate the view.
- Scope bounds:
  - Limited to presentation rules and filtering/grouping of Activity/history entries.
  - No changes to how patches are stored or applied.
- Edge cases / failure modes:
  - Avoid hiding events that might be needed for debugging; if in doubt, group rather than fully hide.
- Validation plan:
  - Internal validation: manual pass over Activity/history with a realistic set of entries to confirm that the view feels de-cluttered while still complete enough for debugging.

### UI Spec Addendum
- Primary job-to-be-done:
  - Let the user quickly see what has meaningfully changed in the app without being overwhelmed by stub entries.
- Primary action:
  - Scan the Activity/history sheet and identify meaningful patches/changes at a glance.
- Navigation / progressive disclosure:
  - Keep Activity/history accessible as designed in E-0011; focus on what shows inside the sheet.
- Key states to design and verify:
  - Activity/history with many entries, where stubs are de-emphasized or grouped.
  - Activity/history when there are only a few entries (must still look clean).
- Copy constraints:
  - Avoid cryptic or overloaded labels; keep change summaries readable.

## Context
- E-0011 tier-2 validation feedback: user said change history is "pretty good" but there are "a lot of stub things that are cluttering my interface".
- This is a follow-up polish ticket to preserve the calm, coherent design standard set by E-0011 while keeping history useful.

## References
- E-0011 epic: `tickets/meta/epics/E-0011-m9-design-system-ux-polish.md`
- Tier-2 validation checkpoint: `tickets/meta/feedback/2026-03-04-pm-checkpoint-e0011-tier2-validation.md`
- T-0070: `T-0070-e0011-tier2-validation-epic-closure.md`

## Acceptance Criteria
- [ ] Stub or placeholder Activity/history entries are either removed from default view or visually de-emphasized (for example, grouped under a collapsible section or condensed summary).
- [ ] Meaningful change events (e.g., accepted patches, applied changes, rollbacks) remain clearly visible and scannable.
- [ ] A user reviewing history with a realistic volume of entries does not describe the view as "cluttered with stubs".

## UX Acceptance Criteria
- [ ] Activity/history sheet continues to feel consistent with the overall design system (calm, minimal, readable).
- [ ] Grouping or de-emphasis mechanisms do not introduce new confusion (e.g., clear labels if grouping is used).

## Dependencies / Sequencing
- Depends on:
  - None strictly, but benefits from having E-0011’s Activity sheet already in place (done).
- Blocks:
  - None.

## Evidence (Verification)
- Tests run:
  - TBD
- Manual checks performed:
  - Review Activity/history in a scenario with many entries and confirm clutter reduction.
- Screenshots/logs/notes:
  - TBD

## Subtasks
- [ ] Identify what constitutes a "stub" or low-signal entry in Activity/history.
- [ ] Implement filtering/grouping/de-emphasis behavior.
- [ ] Run internal UX pass with a realistic history set.

## Notes
- Consider a mild "advanced details" affordance (e.g., an optional toggle or grouped section) if hiding entries outright feels too opaque for debugging.

## Change Log
- 2026-03-04: Ticket created from E-0011 tier-2 validation feedback (Activity/history felt cluttered by stub entries).

