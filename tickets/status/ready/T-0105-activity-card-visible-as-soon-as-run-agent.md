# T-0105: Activity card visible as soon as Run agent is clicked

## Metadata
- ID: T-0105
- Status: ready
- Priority: P2
- Type: feature
- Area: ui
- Epic: none
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08

## Summary
When the user clicks "Run agent" in the Fix with AI flow, no card appears in the Activity panel until the backend returns (after patch generation and scope validation). The user expects to see the current run in the Activity panel right away, under "In progress", so they can open the sheet and see that their request is being worked on. This ticket adds an immediate "in progress" representation—e.g. an optimistic placeholder card or a provisional run id returned at request start—so the Activity panel shows the current card as soon as Run agent is clicked.

## Context
- Root cause: POST /agent/code-patch is synchronous; the patch artifact is created only after `generate_patch()` and scope validation complete. The frontend adds a card only when the response returns (requestPatch success path). So during the entire agent run (often 30–60+ seconds) there is no card.
- Related: T-0097 (F-20260308-004) added in-progress Activity cards and progress in the refinement view; cards appear once a patch exists. This ticket addresses the earlier phase: card visible from click time.

## References
- `apps/desktop/src/activitySheet.tsx` (split: inProgress = isTransientStatus)
- `apps/desktop/src/hooks/useRuntime.ts` (requestPatch, pendingEntry added on response)
- `apps/desktop/runtime/main.py` (agent_code_patch: creates artifact after generate_patch + validation)

## Feedback References (Optional)
- F-20260308-008

## Acceptance Criteria
- [ ] When the user clicks "Run agent" in the Fix with AI flow, a card for that run appears in the Activity panel under "In progress" within a short delay (e.g. &lt; 1 s), without waiting for the agent to finish or validation to complete.
- [ ] The card is identifiable (e.g. shows feedback title or "Code change in progress…") and remains in "In progress" until the run completes or fails; then it transitions to the appropriate terminal state or is updated to the real patch card.
- [ ] If the run never produces a patch (e.g. harness error, malformed patch), the placeholder is updated or removed so the Activity state is accurate (no stale "in progress" card).

## User-Facing Acceptance Criteria (Only If End-User Behavior Changes)
- [ ] User can open the Activity panel immediately after clicking Run agent and see a card for the current run under "In progress".

## UX Acceptance Criteria (Only If `Area: ui`)
- [ ] Primary flow is keyboard-usable (no mouse required for core actions).
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.
- [ ] Layout works at common breakpoints (mobile + desktop) relevant to the host project.

## Dependencies / Sequencing (Optional)
- Depends on: T-0096, T-0097 (Activity refresh and in-progress cards already shipped).
- Sequencing notes: Can be implemented with frontend-only optimistic placeholder (add a synthetic "pending_run" entry when requestPatch is called, keyed by feedback_id/refinement_conversation_id; replace with real patch when response returns or clear on error). Backend change (return run id immediately and process in background) is an alternative but larger.

## Change Log
- 2026-03-08: Ticket created from F-20260308-008 (PM feedback triage).
- 2026-03-08: Moved to ready (rank 2 in ORDER.md).
