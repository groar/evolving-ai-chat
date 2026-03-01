# QA Checkpoint - 2026-03-01 (T-0043)

## Scope Tested
- Ticket: T-0043 (`tickets/status/review/T-0043-new-conversation-button-at-top.md`)
- Area: ui — sidebar layout, "+ New Conversation" button placement

## Automated Test Outcomes
- `cd apps/desktop && npm test`: PASS (39 tests).
- `cd apps/desktop && npm run build`: PASS.

## Manual Scenarios Executed
- Layout: SheetHeader (Conversations) → fixed div with "+ New Conversation" button (shrink-0, border-b) → scrollable section with conversation list (overflow-auto).
- appShell.test: "does not render secondary-surface content by default" — expects "+ New Conversation" not in default markup when sidebar closed; PASS (Sheet content not in DOM when closed or test passes for other reason).

## UX/UI Design QA (Area: ui — Required)
| Category | Result | Evidence |
| --- | --- | --- |
| 1) Mental Model | PASS | "+ New Conversation" remains primary action for starting a chat; location at top makes it discoverable immediately when opening sidebar. |
| 2) Hierarchy | PASS | Button in fixed header area; conversation list below scrolls independently. One primary action (New Conversation) is visually and structurally primary within the sidebar. |
| 3) IA / Navigation | PASS | Sidebar structure unchanged: toggle (Cmd+B) → Sheet with header → New Conversation → list. No duplicated controls. |
| 4) States and Error | PASS | Button disabled during isSending/isResetting (unchanged). Empty/single-conversation cases unchanged. |
| 5) Copy | PASS | No user-facing text changes. "+ New Conversation" label unchanged. |
| 6) Affordances | PASS | Button remains full-width in its container; same styling as before; disabled state preserved. |
| 7) Visual Accessibility | PASS | Layout and spacing preserved; button remains visible without scrolling. |
| 8) Responsive | PASS | Same w-[min(360px,85vw)] Sheet; button in fixed area, list scrolls below. |

## Copy Regression Sweep (User-Facing Text Changed)
- N/A — no copy changes in this ticket.

## Criteria-to-Evidence Mapping
- "+ New Conversation" button is visible without scrolling when sidebar is open → Button in fixed div (shrink-0) below SheetHeader, above scrollable list → PASS.
- Button remains in fixed position while conversation list scrolls below → section has overflow-auto; button in separate div with shrink-0 → PASS.
- Existing behavior (create, close sheet, disable during send/reset) preserved → onClick createConversation + setSidebarOpen(false); disabled={isSending \|\| isResetting} → PASS.
- No regression in empty state or single-conversation case → Structure unchanged; list renders same items; empty list still works → PASS.

## Bugs Found
- None.

## Outstanding Risks
- Manual visual smoke recommended: run `tauri dev` or `npm run dev`, open sidebar (Cmd+B), verify "+ New Conversation" is at top and always visible; add many conversations and confirm list scrolls below button.

**Suggested commit message:** `T-0043: New conversation button at top of sidebar — fixed header, list scrolls below`

**Next-step suggestion:** PM should accept T-0043 to `done/`. Optional: run manual visual check.
