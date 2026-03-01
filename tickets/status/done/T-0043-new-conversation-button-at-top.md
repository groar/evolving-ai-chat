# T-0043: New conversation button at top of sidebar

## Metadata
- ID: T-0043
- Status: done
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0006
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
The "+ New Conversation" button is currently at the bottom of the conversation list in the sidebar. When users have many conversations, they must scroll to find it. Move the button to the top (or a fixed header) so it is always visible without scrolling.

## Impact
- Severity: S3
- User impact: Friction during tier-3 validation; general UX annoyance when list is long.
- Scope: sidebar/conversation sheet in `App.tsx`.

## References
- F-20260301-004
- `apps/desktop/src/App.tsx` (Sheet with conversations list, "+ New Conversation" button ~line 240)

## Acceptance Criteria
- [x] "+ New Conversation" button is visible without scrolling when the sidebar is open, regardless of conversation list length.
- [x] Button remains in a fixed position (top of list area or in header) while the conversation list scrolls below it.
- [x] Existing behavior (create, close sheet, disable during send/reset) preserved.
- [x] No regression in empty state or single-conversation case.

## Subtasks
- [x] Move button from after `<ul>` to before it (or into SheetHeader area)
- [x] Ensure layout: header → [New Conversation] → scrollable list
- [x] Verify visually and in UI tests
- [x] Update changelog if needed

## Evidence
- Moved "+ New Conversation" from inside scrollable section (after `<ul>`) to fixed div below SheetHeader, above scrollable conversation list. Layout: SheetHeader → New Conversation button → scrollable list.

## Change Log
- 2026-03-01: Ticket created from tier-3 validation feedback (F-20260301-004).
- 2026-03-01: Implemented. Button in fixed header area below SheetTitle; conversation list scrolls independently below.
- 2026-03-01: QA passed (2026-03-01-qa-checkpoint-t0043). PM accepted → done.
