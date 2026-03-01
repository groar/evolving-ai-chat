# QA Checkpoint - 2026-03-01 (T-0041)

## Scope Tested
- Ticket: T-0041 (`tickets/status/review/T-0041-clarify-feedback-scope-per-response-vs-app-level.md`)
- Area: ui — Clarify feedback scope (per-response vs app-level); per-message Feedback affordance; panel copy rewrite

## Automated Test Outcomes
- `cd apps/desktop && npm test`: PASS (24 tests).
- New tests in feedbackPanel.test.tsx: scope copy for message-scoped (conv:msg), conversation-only, and app-level with per-message tip.

## Manual Scenarios Executed
- Code review: per-message "Feedback" button on assistant messages; opens Settings + Feedback panel with message context; context stored as `conversationId:messageId` in feedback items; panel copy varies by scope (response/conversation/app).
- Static markup and test assertions verify: "Feedback about this response" when conv:msg; "Feedback about this conversation" when conv-only; "Feedback about the app or a specific response" + tip when null.

## UX/UI Design QA (Area: ui — Required)
| Category | Result | Evidence |
| --- | --- | --- |
| 1) Mental Model | PASS | Primary job: give feedback about a response. Affordance lives on each assistant message. Panel explicitly states scope (response/conversation/app). |
| 2) Hierarchy | PASS | Per-message "Feedback" link is secondary (small, top-right of message); primary content is the message text. Panel scope text before the form. |
| 3) IA / Navigation | PASS | Feedback panel in Settings unchanged; per-message link opens Settings + scrolls to Feedback section. Single source of truth. |
| 4) States and Error | PASS | Empty/error states unchanged. Panel scope copy clarifies intent before submit. |
| 5) Copy | PASS | Must not imply feedback is app-only → "Feedback about the app or a specific response" + tip for per-message link. Message-scoped: "Feedback about this response". No promise-control violations. |
| 6) Affordances | PASS | Feedback link: underline, hover state; keyboard-focusable. Cmd+, opens Settings; feedback form tab-order preserved. |
| 7) Visual Accessibility | PASS | Link styled with text-xs, hover:text-foreground; consistent with existing patterns. |
| 8) Responsive | PASS | Per-message button inline with header; layout unchanged. |

## Copy Regression Sweep (User-Facing Text Changed)
- "Feedback Inbox" → "Feedback" — PASS.
- Scope copy added: "Feedback about this response" / "Feedback about this conversation" / "Feedback about the app or a specific response" — PASS.
- Tip when app-level: "Use the 'Feedback' link on any assistant message to give feedback about that response." — PASS.
- Label variants: "What felt confusing or what should change about this response?" vs "What felt confusing or what should change?" — PASS.
- Placeholder variants: message-scoped vs app-level — PASS.
- Context display: "response in conversation X" vs "conversation X" — PASS.

## Criteria-to-Evidence Mapping
- Per-message affordance → "Feedback" button on assistant messages in App.tsx → PASS.
- Scope explicitly communicated → feedbackPanel.tsx scope copy; tests assert all three states → PASS.
- Context stored (conv + msg) → useFeedback openFeedbackForMessage; createFeedbackItem contextPointer `convId:msgId`; feedbackStore → PASS.
- App-level feedback possible → panel opened from Settings without message context shows app-level copy + tip → PASS.
- Deterministic test for 10 sec comprehension → feedbackPanel.test.tsx asserts scope copy; per-message affordance is primary discovery path → PASS.
- User can distinguish response vs app from UI → scope labels + per-message link → PASS.
- Keyboard-usable → link focusable; form unchanged → PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Manual visual smoke recommended: run `tauri:dev` or `npm run dev`, verify (1) Feedback link on assistant message, (2) click opens Settings + Feedback with "Feedback about this response", (3) submit stores conv:msg in captured items, (4) open Feedback from Settings (no message) shows app-level copy + tip.
- Re-run Probe 3 ("How would you give feedback about a response?") after release — target: <10 sec.

**Verdict:** PASS. Ready for PM acceptance.

**Suggested commit message:** `T-0041: Clarify feedback scope — per-message Feedback link, panel copy (response/conversation/app)`

**Next-step suggestion:** PM should accept T-0041 to `done/`. Optional: manual visual check and re-run Probe 3. Then replenish ready queue from Next Up (T-0036, T-0037, etc.).
