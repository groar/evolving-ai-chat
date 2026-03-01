# T-0038: Conversation renaming

## Metadata
- ID: T-0038
- Status: ready
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0006
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Allow users to rename conversations from the sidebar. Currently all conversations are titled "New Conversation" — as usage grows this becomes unusable. Support inline editing (click to rename) and auto-generated titles from the first message or AI summary.

### UI Spec Addendum
- Primary job-to-be-done: Users can identify and find past conversations by meaningful names.
- Primary action and what must be visually primary: The conversation title in the sidebar, editable on click or via context menu.
- Navigation / progressive disclosure notes: Rename is inline (double-click or pencil icon). No separate rename screen.
- Key states to design and verify:
  - Happy: click to rename, type new title, press Enter to save.
  - Cancel: press Escape to cancel rename.
  - Auto-title: new conversations get an auto-generated title after the first exchange (e.g., first few words of the user's first message).
  - Error: if rename fails (runtime offline), show inline error and preserve the old title.
- Copy constraints: Auto-generated titles should be truncated to ~50 characters.

## Context
- All conversations are currently created as "New Conversation" with no rename capability.
- The backend already has a `title` field on conversations — this ticket adds the UI and API endpoint to update it.
- Auto-titling (from first message or AI-generated summary) is a stretch goal — manual rename is the minimum.

## References
- `apps/desktop/src/App.tsx` (conversation list rendering)
- `apps/desktop/runtime/main.py` (conversation endpoints)
- `apps/desktop/runtime/models.py`
- E-0006-m5-conversational-ux-table-stakes.md

## Feedback References
- F-20260301-002

## Acceptance Criteria
- [ ] Users can rename a conversation by clicking on its title in the sidebar (or via an edit icon).
- [ ] Pressing Enter saves the new title; pressing Escape cancels.
- [ ] The backend persists the new title (new PATCH or PUT endpoint on `/conversations/{id}`).
- [ ] New conversations auto-title from the user's first message (first ~50 characters) after the first exchange completes.
- [ ] Renamed conversations show their custom title in the sidebar and top bar.
- [ ] If rename fails (offline/error), the old title is preserved and an inline error is shown.

## Dependencies / Sequencing
- Depends on: none (backend change is small; can ship independently).
- Blocks: none.

## Subtasks
- [ ] Add PATCH `/conversations/{id}` endpoint to backend (title update)
- [ ] Add inline rename UI in conversation sidebar
- [ ] Implement auto-title from first user message
- [ ] Update top bar to show conversation title
- [ ] Add tests (frontend + backend)

## Notes
Auto-titling via AI summary (e.g., "Summarize this conversation in 5 words") is a nice stretch goal but requires real model calls (M3). For now, truncating the first user message is sufficient.

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
- 2026-03-01: Moved to ready (PM checkpoint 17).
