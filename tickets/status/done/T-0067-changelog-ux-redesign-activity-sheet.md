# T-0067: Changelog UX redesign — dedicated Activity sheet

## Metadata
- ID: T-0067
- Status: done
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0011
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
Move the patch changelog out of the Settings sheet and into a dedicated "Activity" sheet. The Activity sheet shows the full history of AI-applied changes — grouped by date, full-width cards, expandable diffs — and scales gracefully as the number of entries grows. The Settings sheet retains only a compact one-line summary ("X changes applied") with a "View history →" link. The design follows `docs/design-guidelines.md` (T-0066).

## Design Spec

### Goals
- Give the changelog a home that scales (no more card-wall in a 400 px panel).
- Separate mental models: Settings = configuration; Activity = historical record.
- Preserve all existing actions: Undo, view diff ("See what changed"), view reverted diff.
- Add the structural foundation for per-patch agent logs (T-0069 builds on this).

### Non-goals
- Do not move agent execution logs into the Activity sheet in this ticket (that is T-0069).
- Do not redesign the Settings panel in this ticket (that is T-0068).
- Do not add sorting, filtering, or search to the Activity sheet in this ticket.

### Option considered and rejected
- **Keep changelog in Settings, just improve spacing**: Rejected — the core problem is the mental model mismatch and the structural inability to give history enough space. Spacing tweaks (T-0065) already exhausted that approach.
- **Full-screen "History" page** (replaces the sheet pattern): Considered but rejected — the Sheet pattern is established in the app and keeps the chat transcript visible in context, which is valuable when reviewing what changed.

### Chosen approach: dedicated Activity sheet (right slide-in)
Mirrors the existing patterns for Conversations (left sheet) and Improvement (right sheet).

### Rules and state transitions
1. **Activity sheet trigger**: new icon in the top bar (History / Clock icon), keyboard shortcut `Cmd+H`. When no patches exist, the icon is still visible but the sheet shows an empty state.
2. **Settings compact summary**: the Settings changelog `<details>` block is replaced with a single-line `<p>` showing "N changes applied" (or "No changes yet") and a `<button>` "View activity →" that closes the Settings sheet and opens the Activity sheet.
3. **Activity sheet layout**:
   - Sheet side: right; width: `min(520px, 92vw)` (wider than Settings to accommodate diffs).
   - Header: "Activity" title + close button.
   - Content: vertical list of patch cards, grouped by date ("Today", "Yesterday", date string for older).
   - Each card (collapsed): title (truncated at 2 lines), status pill (applied / reverted / failed), relative timestamp.
   - Each card (expanded, click to toggle): full title, summary/description, exact timestamps, diff view (`<pre>` with `max-h-80`), action buttons (Undo / See what was reverted).
   - Cards with `apply_failed`, `scope_blocked`, or `validation_failed` status show a failure reason on expand.
   - "What's new" runtime changelog entries: shown below the patch list under a "Release notes" sub-heading, same expand/collapse pattern.
4. **Empty state**: centered "No activity yet. Changes applied by AI will appear here." with a soft icon.
5. **Error states**: individual card error states unchanged (red-orange left border for failed, grey for reverted).

### User-facing feedback plan
- User opens Activity from top bar or from Settings compact summary.
- They see a calm, full-width list of entries — not a wall of truncated cards.
- They can click any entry to expand details and diff.
- Undo and "See what was reverted" actions work as before.
- Settings no longer shows the changelog wall.

### Scope bounds
- Only adds one new Sheet component (Activity) and modifies the Settings changelog section to a compact summary.
- Top bar gains one icon (History/Clock).
- No data model changes (uses existing `PatchEntry` / `ChangelogEntry` from `settingsStore`).

### Edge cases / failure modes
- If Activity sheet is opened with 0 entries: show empty state (do not render empty date groups).
- If a date group has no entries (e.g., after undo): hide the group label.
- If diff is very long (>300 lines): `max-h-80` scroll ensures it doesn't overwhelm the card.
- Activity sheet and Settings sheet: only one sheet can be open at a time; "View activity →" button closes Settings before opening Activity (or the Sheet portaling handles z-index naturally — test both).

### Validation plan
- Automated: update `settingsPanel.test.tsx` to assert the changelog wall is gone; add `activitySheet.test.tsx` for card rendering, expand/collapse, empty state, Undo button visibility.
- Manual UX check: open Activity with 10+ patches; verify no crowding; verify Undo works; verify "View activity →" from Settings opens Activity.

## UI Spec Addendum

- **Primary job-to-be-done**: Review history of AI-applied changes and optionally undo one.
- **Primary action and what must be visually primary**: The card list itself (history review is the primary use case, not Undo — Undo is secondary and should not be the visual anchor).
- **Navigation / progressive disclosure**: Collapsed card is the default. Expand to see diff and actions. "View activity →" in Settings is a secondary entry point; top-bar icon is primary.
- **Key states**:
  - Happy: list of cards, some expanded with diff.
  - Empty: friendly empty state copy, no icon-less void.
  - Error/failed card: red-orange left border, failure reason visible on expand.
  - Offline: sheet still opens; Undo calls runtime as before (existing error handling applies).
- **Copy constraints**:
  - Sheet title: "Activity" (not "Changelog" — changelog implies dev tooling; "Activity" is user-friendly).
  - Settings compact line: "N changes applied" / "No changes yet" + "View activity →".
  - Empty state: "No activity yet. Changes applied by AI will appear here."
  - Date group labels: "Today", "Yesterday", then locale-formatted date (e.g., "March 1, 2026").
  - Must not imply: "all changes are safe to undo" (some reverted entries cannot be re-applied).

## Context
- The current changelog card-wall breaks at ~5 entries in a 400 px-wide sheet. M8's autonomous loop will produce many more entries over time.
- This is the primary mitigation for F-20260304-001.
- T-0069 (agent logs) will add an "Agent log" section inside each expanded card in this sheet.

## References
- `apps/desktop/src/settingsPanel.tsx` (existing changelog rendering)
- `apps/desktop/src/stores/settingsStore.ts` (`PatchEntry`, `ChangelogEntry`, store shape)
- `apps/desktop/src/components/ui/sheet.tsx` (Radix Sheet component)
- `docs/design-guidelines.md` (T-0066 — must exist before implementation)
- E-0011, F-20260304-001

## Feedback References
- F-20260304-001

## Acceptance Criteria
- [x] An "Activity" icon/button in the top bar opens a right-side Sheet showing the patch and changelog history.
- [x] Activity sheet width is wider than Settings (min 480 px) and cards are full-width inside it.
- [x] Cards are grouped by date ("Today" / "Yesterday" / date string).
- [x] Collapsed card shows: title, status pill, relative timestamp. Expanded shows: full content, diff, action buttons.
- [x] Settings changelog section is replaced by a compact "N changes applied / No changes yet" line + "View activity →" button.
- [x] "View activity →" opens the Activity sheet (and closes Settings if open).
- [x] Undo and diff view work identically to the previous changelog implementation.
- [x] Empty state ("No activity yet.") is shown when there are no entries.
- [x] `activitySheet.test.tsx`: card rendering, expand/collapse, empty state, Undo visibility all tested.
- [x] `settingsPanel.test.tsx`: updated to assert changelog wall is absent; compact summary text present.

## UX Acceptance Criteria
- [ ] Opening Activity with 10+ entries does not feel crowded.
- [ ] No horizontal overflow in any card state (collapsed or expanded with diff).
- [ ] Empty/error states are clear and actionable.
- [ ] Sheet is keyboard-closeable (Escape) and the trigger is keyboard-focusable.

## Dependencies / Sequencing
- Depends on: T-0066 (design guidelines — conceptual, not hard build dep)
- Blocks: T-0069 (agent logs live inside Activity sheet)
- Sequencing notes: rank 2 in E-0011 ready queue; pick up after T-0066 is accepted

## QA Evidence Links
- QA checkpoint: `tickets/meta/qa/2026-03-04-qa-T-0067.md`
- Screenshots/artifacts: (manual visual check recommended; QA heuristic pass completed)

## Evidence (Verification)
- Tests run: `apps/desktop npm run test` — `settingsPanel.test.tsx` (14 tests), `activitySheet.test.tsx` (9 tests) all pass.
- Manual checks performed: QA heuristic pass (UX checklist) and automated tests; see tickets/meta/qa/2026-03-04-qa-T-0067.md.
- Screenshots/logs/notes: Manual visual check with 10+ patches recommended before release.

## Subtasks
- [x] Design (spec review, copy finalized)
- [x] Implementation: new `ActivitySheet` component
- [x] Implementation: update `settingsPanel.tsx` changelog → compact summary
- [x] Implementation: add Activity icon to top bar in `App.tsx`
- [x] Tests: `activitySheet.test.tsx`, update `settingsPanel.test.tsx`
- [x] Documentation updates: update `docs/design-guidelines.md` with Activity sheet pattern if new patterns emerge (no new pattern doc needed; follows existing Sheet pattern)

## Notes
- The Sheet width of `min(520px, 92vw)` is intentionally wider than Settings (`min(400px, 90vw)`) to give diffs room to breathe. Adjust after visual testing if needed.
- Keyboard shortcut `Cmd+H` is proposed; verify no conflict with existing shortcuts (`Cmd+B` = sidebar, `Cmd+,` = settings).

## Change Log
- 2026-03-04: Ticket created from F-20260304-001 / E-0011.
- 2026-03-04: Implementation complete. Added `ActivitySheet` (activitySheet.tsx), compact changelog in Settings, History icon + Cmd+H in App; tests added/updated. Moved to review for QA.
- 2026-03-04: QA passed (tickets/meta/qa/2026-03-04-qa-T-0067.md). PM acceptance: moved to done.
