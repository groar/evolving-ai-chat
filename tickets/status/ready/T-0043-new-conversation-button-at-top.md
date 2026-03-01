# T-0043: New conversation button at top of sidebar

## Metadata
- ID: T-0043
- Status: ready
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
- [ ] "+ New Conversation" button is visible without scrolling when the sidebar is open, regardless of conversation list length.
- [ ] Button remains in a fixed position (top of list area or in header) while the conversation list scrolls below it.
- [ ] Existing behavior (create, close sheet, disable during send/reset) preserved.
- [ ] No regression in empty state or single-conversation case.

## Subtasks
- [ ] Move button from after `<ul>` to before it (or into SheetHeader area)
- [ ] Ensure layout: header → [New Conversation] → scrollable list
- [ ] Verify visually and in UI tests
- [ ] Update changelog if needed

## Change Log
- 2026-03-01: Ticket created from tier-3 validation feedback (F-20260301-004).
