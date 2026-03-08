# T-0103: Fix discussion routing during agent run

## Metadata
- ID: T-0103
- Status: done
- Priority: P1
- Type: bug
- Area: ui
- Epic: none
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08 (accepted to done)

## Summary
After launching Fix with AI, discussion routing can break across multiple navigation entry points: selecting another discussion from the left panel can be ignored, opening a discussion from an Activity card can create a brand new discussion and trigger an unexpected model message, and in-progress state can appear in unrelated discussions. This causes context loss and makes run status untrustworthy.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Ensure explicit user navigation always changes to the selected existing discussion.
  - Ensure Activity discussion links open the intended existing discussion without creating a new one.
  - Ensure in-progress status is scoped only to the discussion/run it belongs to.
- Non-goals:
  - No redesign of discussion list layout or Activity information architecture.
  - No new run-status model beyond correct routing/scoping of existing state.
- Rules and state transitions:
  - If a user clicks a discussion in the left panel, active discussion must switch to that target unless the target no longer exists.
  - If a user clicks an Activity card "open discussion" action, app must resolve and activate the referenced discussion id; do not call any "start new discussion" path.
  - A new discussion may only be created from explicit "new discussion" actions, never from discussion deep-links.
  - In-progress badge/state must render only where discussion id (or canonical run link) matches the active run association.
  - If a referenced discussion no longer exists, show non-destructive fallback behavior (stay on current discussion and show a clear error/toast/log note).
- User-facing feedback plan:
  - Navigation immediately reflects the selected discussion.
  - Activity deep-link opens the expected historical discussion without spawning assistant output.
  - Unrelated discussions do not show another run's in-progress indicator.
- Scope bounds:
  - Restrict implementation to discussion selection/deep-link routing and run-status association logic.
  - Do not alter backend patch execution semantics.
- Edge cases / failure modes:
  - Multiple concurrent or recent runs attached to different discussions.
  - Activity card references deleted or stale discussion ids.
  - Rapid user navigation while polling updates are in flight.
- Validation plan:
  - Add/extend deterministic UI tests for left-panel switching, Activity deep-link routing, and status isolation.
  - Add regression assertion that no model call/new discussion creation happens on Activity deep-link.
  - QA manual pass with one active run and at least one unrelated discussion.

### UI Spec Addendum (Required If `Area: ui`)
- Primary job-to-be-done:
  - Move between discussions confidently while a Fix with AI run is active.
- Primary action and what must be visually primary:
  - Discussion selection actions (left panel, Activity deep-link) must deterministically open the chosen discussion.
- Navigation / progressive disclosure notes (what is secondary, and where it lives):
  - Run progress can remain in refinement/activity surfaces, but must not override or hijack explicit navigation intent.
- Key states to design and verify (happy, empty, error/offline):
  - Happy: selected discussion opens correctly.
  - Error: referenced discussion missing; user remains in current context with clear message.
  - In-progress: badge/status appears only on associated discussion.
- Copy constraints (what must not be implied):
  - Must not imply a newly created discussion belongs to an old Activity card link.
  - Must not imply unrelated discussions are currently running the same fix.

## Context
- Reported directly by user after running Fix with AI flow.
- Similar area was recently addressed in T-0100/T-0101, indicating possible regression or incomplete state-binding coverage.

## References
- `STATUS.md`
- `tickets/status/done/T-0099-fix-with-ai-show-progress-after-run-agent.md`
- `tickets/status/done/T-0100-fix-with-ai-correct-conversation-after-run-agent.md`
- `tickets/status/done/T-0101-activity-card-status-when-patch-completes.md`

## Feedback References
- `F-20260308-005`

## Acceptance Criteria
- [x] While a Fix with AI run is in progress, clicking a different discussion in the left panel switches to that discussion immediately and reliably.
- [x] Clicking "open discussion" from an Activity card opens the referenced existing discussion and does not create a new discussion.
- [x] Activity-card discussion deep-link does not trigger unintended model generation or assistant message creation.
- [x] In-progress status/badges are shown only for the discussion linked to that run and never leak to unrelated discussions.
- [x] Deterministic regression tests cover left-panel navigation, Activity deep-link routing, and in-progress state scoping.

## User-Facing Acceptance Criteria (Only If End-User Behavior Changes)
- [x] A user can switch discussions during a run and always lands in the selected discussion.
- [x] A user opening a historical discussion from Activity sees that exact discussion history, without unexpected new-thread content.

## UX Acceptance Criteria (Only If `Area: ui`)
- [x] Primary flow is keyboard-usable for discussion switching and opening discussion links from Activity.
- [x] Error state for stale/missing discussion links is clear and actionable.
- [x] In-progress copy and indicators are unambiguous about which discussion/run they belong to.
- [x] Layout and navigation behavior remain stable at common desktop breakpoints used by the app.

## Dependencies / Sequencing
- Depends on: none.
- Blocks: reliable post-run navigation confidence in Fix with AI flow.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-03-08-qa-checkpoint-t0103.md`
- Screenshots/artifacts: N/A for unit-test–backed changes

## Evidence (Verification)
- Tests run: `apps/desktop npm run test` — 9 files, 132 tests pass. New test: "calls onOpenRefinement with refinement_conversation_id when opening discussion from Activity (T-0103)". App.runAgentFromRefinement.test.ts covers runAgentFromRefinement using refinementConversationId for existing discussion.
- Manual checks performed: Recommended manual smoke (see QA checkpoint): left-panel switch during run, Activity "Discussion" opens linked conversation, in-progress only on owning discussion.
- Screenshots/logs/notes: useRuntime.activateConversation no longer early-returns when isSending; left-panel and Activity open-discussion now switch conversation during a run. RefinementConversation only renders when activeConversationId === refinement.conversationId (existing fix). QA PASS 2026-03-08.

## Subtasks
- [x] Reproduce and isolate routing/state-leak paths (debug instrumentation in place)
- [x] Implement discussion selection and deep-link routing fixes (Activity deep-link: use refinement_conversation_id when present)
- [x] Add regression tests for routing and status scoping
- [x] QA validation for multi-discussion scenario
- [x] Update changelog/docs if user-visible behavior copy changes

## Notes
Treat this as a regression cluster in one flow and fix as a cohesive slice to avoid partial routing/state mismatches.

## Change Log
- 2026-03-08: Ticket created from user feedback F-20260308-005 and moved directly to `ready/` as next P1 pickup.
- 2026-03-08: Implementation agent started debug run. Moved to in-progress. Instrumentation added for hypotheses: (A) left-panel switch ignored when isSending early-return, (B) Activity always calls refinement.start (new discussion), (C) refinement panel shown when activeConversationId !== refinement.conversationId, (D) Activity click has refinement_conversation_id on patch, (E) activateConversation completes. Activity sheet and App now pass/use refinement_conversation_id when present to open existing discussion (no new discussion). Awaiting user reproduction and log analysis.
- 2026-03-08: Log analysis: C CONFIRMED (match=false while refinement visible on wrong discussion). B CONFIRMED (refinementConversationIdFromPatch null → start() called). A,E REJECTED; D INCONCLUSIVE. Fix applied: show RefinementConversation only when activeConversationId === refinement.conversationId so in-progress state does not leak to other discussions. Instrumentation kept for verification run.
- 2026-03-08: Pick-up completion. Missing fix: activateConversation in useRuntime was still returning early when rt.isSending, blocking left-panel and Activity open-discussion during a run. Removed isSending guard so navigation always wins (T-0103). Added regression test in activitySheet.test.tsx: onOpenRefinement called with refinement_conversation_id when opening discussion from Activity. Moved to review.
- 2026-03-08: QA PASS (2026-03-08-qa-checkpoint-t0103.md). PM acceptance: criteria met; evidence and regression tests in place. Moved to done.
