# QA Checkpoint - 2026-03-01 (T-0033)

## Scope Tested
- Ticket: T-0033 (`tickets/status/review/T-0033-chat-first-layout-hide-meta-surfaces.md`)
- Area: ui — Chat-first layout; collapsible sidebar; Settings/Feedback/Advanced behind gear icon

## Automated Test Outcomes
- `cd apps/desktop && npm test`: PASS (21 tests).
- `cd apps/desktop && npm run build`: PASS.

## Manual Scenarios Executed
- Static markup and test assertions verify: chat pane fills window, no left-rail tabs by default, top bar shows "Evolving AI Chat" or conversation title, sidebar toggle (aria-label "Toggle conversation list (Cmd+B)"), settings button (aria-label "Open Settings"), "+ New Conversation" not in default view.
- Copy sweep: "Local Desktop Chat" removed from top bar; "runtime" replaced with "assistant service" in default-visible surfaces.

## UX/UI Design QA (Area: ui — Required)
| Category | Result | Evidence |
| --- | --- | --- |
| 1) Mental Model | PASS | Default view: chat pane + composer. "Your local AI assistant." + "Type your first message below" or contextual prompt. Primary job (chat) is obvious. |
| 2) Hierarchy | PASS | Chat pane and composer are primary; sidebar toggle and gear icon are secondary, unobtrusive in top bar. |
| 3) IA / Navigation | PASS | Primary nav: chat always visible. Secondary: conversation list (Sheet, Cmd+B). Tertiary: Settings/Feedback/Advanced (gear → Sheet). 4-tab left rail removed. |
| 4) States and Error | PASS | Empty state: single prompt + optional "Open Settings". Offline: "The assistant service is not running." + Retry. API key: Add API key prompt + Open Settings. |
| 5) Copy | PASS | No "runtime", "channel", "flags" in default-visible surfaces. "assistant service" used instead of "runtime". Copy is consistent. |
| 6) Affordances | PASS | Tab order, Enter to send, Cmd+B sidebar toggle. Icon buttons have aria-labels. |
| 7) Visual Accessibility | PASS | Same Tailwind theme; headings/body hierarchy preserved; spacing and borders. |
| 8) Responsive | PASS | styles.css `.app-shell` media query at 900px; grid-cols-1 layout; sidebar Sheet uses `w-[min(360px,85vw)]`. |

## Copy Regression Sweep (User-Facing Text Changed)
- Top bar: "Evolving AI Chat" or conversation title — PASS (no "Local Desktop Chat").
- Offline/error: "The assistant service is not running.", "The service returned an error" — PASS.
- Empty state: "Start the assistant service, then send your first message." — PASS.
- Placeholder: "Start the assistant service to chat." — PASS.
- Diagnostics: "Diagnostics enabled" — PASS (dev-only, not default-visible).

## Criteria-to-Evidence Mapping
- Chat pane fills window by default → `grid-cols-1`, no left aside in main layout → PASS.
- Sidebar toggleable (icon + Cmd+B) → PanelLeftIcon button, useEffect keydown Cmd+B → PASS.
- Top bar shows conversation title or app name → `topBarTitle = activeConversation?.title ?? appName` → PASS.
- Settings/Feedback/Advanced not left-rail tabs → Moved to Settings Sheet (gear icon) → PASS.
- 4-tab nav removed → No nav buttons in App.tsx → PASS.
- Existing functionality preserved → createConversation, activateConversation, offline banner, Retry → PASS.
- Usable without sidebar → Composer, Send, messages visible when sidebar closed → PASS.
- No "runtime"/"channel"/"flags" in default-visible copy → Sweep above → PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Manual visual smoke recommended: run `tauri:dev` or `npm run dev`, verify sidebar opens/closes, Cmd+B works, Settings sheet opens, conversation title updates when switching.
- First-time user flow: if no conversation exists, user must open sidebar (Cmd+B or icon) then "+ New Conversation" — acceptable per spec (secondary surface).

**Suggested commit message:** `T-0033: Chat-first layout — collapsible sidebar, hide meta-surfaces by default`

**Next-step suggestion:** PM should accept T-0033 to `done/`. Optional: run manual visual check. Then proceed with T-0034 (Settings as modal/drawer) or T-0035 (copy and empty state rewrite).
