# QA Checkpoint — 2026-03-08 — T-0103

## Ticket
- **T-0103**: Fix discussion routing during agent run
- **Area**: ui
- **Scope**: Left-panel and Activity deep-link navigation during Fix with AI run; in-progress state scoping.

## Test Plan (Scoped)
- Automated: desktop unit/integration tests (activitySheet, App.runAgentFromRefinement, RefinementConversation, appShell).
- Regression: Activity sheet passes `refinement_conversation_id` to onOpenRefinement when opening discussion (new test).
- Behavioral: activateConversation no longer blocked by isSending; RefinementConversation only when activeConversationId === refinement.conversationId.
- UX: Navigation hierarchy and states per ticket (discussion switch, Activity open discussion, in-progress isolation).

## Automated Tests
- **Result**: PASS
- **Command**: `cd apps/desktop && npm run test`
- **Outcome**: 9 test files, 132 tests passed.
- **Relevant**: activitySheet.test.tsx (13 tests, including "calls onOpenRefinement with refinement_conversation_id when opening discussion from Activity (T-0103)"), App.runAgentFromRefinement.test.ts (3), RefinementConversation.test.tsx (3), appShell.test.tsx (10).

## Manual / Visual
- Not run in this environment (no desktop runtime). Recommend manual smoke: (1) Start Fix with AI run, click another discussion in left panel → view switches. (2) From Activity, click "Discussion" on a patch with linked conversation → that discussion opens without new thread. (3) In-progress badge only on the discussion that owns the run.

## UX Checklist (Area: ui) — Heuristic
- **Mental model**: PASS — Discussion list and Activity "Discussion" affordance map to "open this conversation"; no new concepts introduced.
- **Hierarchy**: PASS — Primary = chat/composer; discussion switch and Activity links are secondary; refinement panel scoped to owning discussion.
- **IA / Navigation**: PASS — Left-panel and Activity open-discussion are consistent entry points; no duplicate controls.
- **States / Errors**: PASS — "No discussion linked" notice when opening from Activity without refinement_conversation_id; in-progress state isolated to one discussion.
- **Copy**: PASS — No new user-facing copy in this ticket; "View discussion" / "Discussion" already present; no promise drift.
- **Affordances**: PASS — Buttons and navigation unchanged; keyboard flow for discussion switch and Activity link unchanged.
- **Visual / Responsive**: N/A — No layout or breakpoint changes in this ticket.

**Overall UX**: PASS. No bug or follow-up UI ticket required.

## Copy Regression
- No user-facing text changes in this ticket; skipped.

## Findings
- None. Implementation matches acceptance criteria; regression test guards Activity deep-link; isSending guard removal enables left-panel and Activity navigation during run.

## Evidence Summary
- Tests run: 132 passed (apps/desktop).
- UX checklist: PASS (heuristic).
- Ticket evidence: updated with QA checkpoint link and automated result.

## Recommendation
- **Validation**: PASS. Ready for PM acceptance.

---

**Suggested commit message:** `qa(T-0103): record PASS for discussion routing and Activity deep-link validation`

**Next step:** PM acceptance: move T-0103 to `done/` and add PM checkpoint per `tickets/AGENTS.md`.
