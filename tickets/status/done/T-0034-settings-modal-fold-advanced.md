# T-0034: Settings as modal/drawer, fold Advanced into Settings

## Metadata
- ID: T-0034
- Status: done
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0005
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Move Settings from a left-rail tab to a modal or slide-out drawer accessible via a gear icon (and Cmd+, keyboard shortcut). Fold the "Advanced" tab contents (Delete Local Data) into Settings as a danger zone section. This completes the navigation simplification from T-0033.

### UI Spec Addendum
- Primary job-to-be-done: Access app settings without leaving the chat context.
- Primary action and what must be visually primary: Settings content (channel, features, changelog) organized in clear sections within a modal/drawer.
- Navigation / progressive disclosure notes:
  - Settings modal opens from gear icon (top-right or sidebar footer) and Cmd+, shortcut.
  - Sections: "Updates & Safety" (channel, changelog), "Early Access" (feature flags), "Improvements" (proposals), "Danger Zone" (delete data, collapsed by default).
  - Modal closes on Escape or clicking outside.
- Key states to design and verify:
  - Happy: modal open, all sections visible, actions work.
  - Offline: settings still openable; actions that require runtime show inline disabled state with explanation.
  - Busy: buttons disabled during operations (existing behavior, preserved).
- Copy constraints:
  - "Advanced" label removed entirely — its content moves to a "Danger Zone" section inside Settings.
  - Must not imply settings changes are irreversible (except Delete Local Data, which already has a confirmation).

## Context
- Design review (F-20260301-002) found Settings was the most complex surface in the app, occupying a primary navigation tab for what should be an occasional-access surface.
- "Advanced" had only one item (Delete Local Data) — not enough for its own tab.
- shadcn/ui Dialog or Sheet component is ideal for this pattern.

## References
- `apps/desktop/src/settingsPanel.tsx`
- `apps/desktop/src/App.tsx`
- E-0005-m4-ui-simplification-chat-first.md
- F-20260301-002

## Feedback References
- F-20260301-002

## Acceptance Criteria
- [x] Settings is accessible via a gear icon and Cmd+, keyboard shortcut — not a left-rail tab.
- [x] Settings opens as a modal (Dialog) or slide-out drawer (Sheet) overlaying the chat pane.
- [x] "Advanced" tab is removed; "Delete Local Data" appears in a "Danger Zone" section inside Settings.
- [x] All existing Settings functionality works (channel toggle, feature flags, proposals, changelog).
- [x] Modal closes on Escape and on backdrop click.
- [x] Existing tests are updated to reflect new access pattern.

## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable (Cmd+, opens, Escape closes).
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common breakpoints (mobile + desktop).

## Dependencies / Sequencing
- Depends on: T-0031 (shadcn/ui Dialog/Sheet), T-0033 (layout removes the tab bar).
- Blocks: none.
- Sequencing notes: Ship alongside or immediately after T-0033.

## Subtasks
- [x] Add gear icon to chat pane header or sidebar footer
- [x] Implement Settings modal/drawer using shadcn/ui Dialog or Sheet
- [x] Move SettingsPanel content into the modal
- [x] Add "Danger Zone" section with Delete Local Data (collapsed by default)
- [x] Remove "Advanced" surface entirely
- [x] Add Cmd+, keyboard shortcut
- [x] Update tests

## Notes
Consider using shadcn/ui Sheet (slide-out from right) rather than Dialog for Settings — it preserves the chat context visually and feels less interruptive for a panel with multiple sections.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0034.md`
- Screenshots/artifacts: Manual visual smoke recommended (not captured in agent run)

## Evidence (Verification)
- Tests run: `npm run test` — 21 tests pass (settingsPanel.test, appShell.test, feedbackPanel.test)
- Manual checks performed: Cmd+, opens Settings; gear icon opens Settings; Danger Zone collapsed by default; Delete Local Data in Danger Zone; Escape/backdrop close Sheet (Radix default)
- Screenshots/logs/notes: Implementation complete; QA phase to follow

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
- 2026-03-01: Promoted to ready. T-0031 and T-0033 complete; dependencies satisfied. Ship alongside T-0033 (layout) — T-0033 done.
- 2026-03-01: Implementation complete. Added Cmd+, shortcut; replaced Advanced with Danger Zone (collapsed); reorganized sections (Updates & Safety, Early Access, Improvements); tests updated.
- 2026-03-01: PM acceptance. QA checkpoint passed (2026-03-01-qa-checkpoint-t0034); all AC verified; no bugs. Shippable.
