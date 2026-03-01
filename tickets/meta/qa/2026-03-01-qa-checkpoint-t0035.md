# QA Checkpoint - 2026-03-01 (T-0035)

## Scope Tested
- Ticket: T-0035 (`tickets/status/review/T-0035-user-facing-copy-empty-state-rewrite.md`)
- Area: ui — User-facing copy and empty state rewrite; remove developer terminology

## Automated Test Outcomes
- `cd apps/desktop && npm run test`: PASS (21 tests).

## Manual Scenarios Executed
- Code review: verified no user-visible strings contain "runtime", "local runtime", or "flags".
- Static markup and test assertions verify: empty state "What's on your mind?"; offline "Can't reach the assistant"; Settings "Updates" not "Release Channel"; changelog shows "Stable"/"Beta" not raw channel names; behind-the-scenes info replaces diagnostics.

## UX/UI Design QA (Area: ui — Required)
| Category | Result | Evidence |
| --- | --- | --- |
| 1) Mental Model | PASS | Empty state: "What's on your mind?" + "Start a conversation". Clear, warm, action-oriented. App reads as friendly assistant. |
| 2) Hierarchy | PASS | Unchanged from T-0033. Chat primary; Settings secondary. |
| 3) IA / Navigation | PASS | Unchanged. Progressive disclosure preserved. |
| 4) States and Error | PASS | Empty state warm and actionable. Offline: "Can't reach the assistant." + "Check if it's running, then press Retry." Error state: "The assistant returned an error." + detail. Scoped, actionable, non-alarming. |
| 5) Copy | PASS | All jargon removed: runtime, channel, flags, diagnostics → assistant, updates, early access, behind-the-scenes info. Labels prefer user intent. No promise-control violations. |
| 6) Affordances | PASS | Unchanged. Keyboard flow preserved. |
| 7) Visual Accessibility | PASS | Unchanged. Text hierarchy preserved. |
| 8) Responsive | PASS | Unchanged. Layout consistent. |

## Copy Regression Sweep (User-Facing Text Changed)
- No "runtime", "local runtime", "flags", "diagnostics", "Release Channel", "Experimental Flags" in user-visible surfaces — PASS.
- Empty state: "What's on your mind?" + "Start a conversation — type your message below." — PASS.
- Offline: "Can't reach the assistant." / "Check if it's running, then press Retry." — PASS.
- Settings: "Updates", "Early Access", "Stable (recommended)", "Beta (early access)", "Show behind-the-scenes info" — PASS.
- Error messages: "Could not load updates and drafts."; "Could not save your preference."; "Behind-the-scenes info: enabled/disabled" — PASS.
- Feedback placeholder: "The settings were hard to find." (replaced "experiment controls") — PASS.
- Copy audit recorded in ticket Evidence — PASS.

## Criteria-to-Evidence Mapping
- No user-visible "runtime", "local runtime", or "flags" → grep + code review: PASS.
- Empty state warm and actionable → "What's on your mind?" + "Start a conversation" → PASS.
- Offline plain language → "Can't reach the assistant" / "Check if it's running" → PASS.
- Top bar app name or conversation title (not "Local Desktop Chat" or channel labels) → "Evolving AI Chat" in App.tsx; topBarTitle = activeConversation?.title ?? appName → PASS.
- Settings plain language → "Updates", "Early Access", "Stable", "Beta" → PASS.
- Copy audit in Evidence → ticket Evidence section lists all before/after → PASS.
- Tests updated → appShell.test, settingsPanel.test pass → PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Manual visual smoke recommended: run `tauri:dev`, verify empty state, offline banner, Settings labels, and changelog display in-app.

**Verdict:** PASS. Ready for PM acceptance.

**Suggested commit message:** `T-0035: User-facing copy and empty state rewrite — plain language, no jargon`

**Next-step suggestion:** PM should accept T-0035 to `done/`. Then replenish ready queue from Next Up (T-0041, T-0036, etc.).
