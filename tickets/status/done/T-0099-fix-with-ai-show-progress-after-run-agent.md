# T-0099: Fix with AI — show progress in main UI after Run Agent

## Metadata
- ID: T-0099
- Status: done
- Priority: P2
- Type: bug
- Area: ui
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08

## Summary
After the user clicks "Run Agent" in the refinement conversation, nothing is shown in the main UI to indicate that the patch agent is running. Progress is only visible if the user navigates to the refinement conversation or opens the Activity card. The user has no clear feedback that the request was accepted and is in progress, and may re-click or assume nothing happened.

## Context
Discovered in M13 tier-2 validation (Probe 1). Checkpoint: `tickets/meta/feedback/2026-03-08-pm-checkpoint-m13-tier2-validation.md`. The API call and agent run correctly; the failure is purely UX — the view the user is on does not show progress.

## Acceptance Criteria
- [x] After "Run Agent" is clicked, the user sees visible feedback in the current context (e.g. floating banner, inline status, or automatic switch to a view that shows "Working on your change…" / elapsed time) without having to open Activity or the refinement thread.
- [x] It is not possible to submit "Run Agent" twice by accident because the control is disabled or replaced by progress state while the run is in progress.

## UX Acceptance Criteria (Area: ui)
- [x] Primary flow: user who stays on the refinement conversation (or is returned to it) sees progress; alternatively, a persistent progress indicator (e.g. PatchNotification) is visible from the main chat/improvement flow.
- [x] Empty/error states: if Run Agent fails, the user sees failure state in the same flow (not only in Activity).

## Evidence (Verification)
- M13 tier-2 Session 1 (Probe 1): facilitator report "when we clicked on Run agent, it did not show anything in the UI"; progress only visible "when I click on the card and the refinement conversation is open."
- Immediate in-context feedback added in refinement flow: while `POST /agent/code-patch` is in flight (before patch status exists), refinement UI now shows `Starting code change…`.
- Duplicate submit guard added in both UI and runtime request path:
  - UI: `Run Agent` action is hidden once startup progress is active.
  - Runtime: `requestPatch` exits early when a patch request is already starting or a patch is already in progress.
- Desktop UI validation: `npm --prefix apps/desktop run test -- RefinementConversation.test.tsx` (pass, 3 tests).
- Desktop suite validation: `npm --prefix apps/desktop run validate` (pass, 128 tests; existing non-fatal SSR/ARIA warnings unchanged).
- QA checkpoint: `tickets/meta/qa/2026-03-08-qa-T-0099.md` (PASS; no bugs filed).

## Change Log
- 2026-03-08: Created from M13 tier-2 validation (Probe 1). Source: 2026-03-08-pm-checkpoint-m13-tier2-validation.md.
- 2026-03-08: Picked up for implementation; moved from `tickets/status/ready/` to `tickets/status/in-progress/`.
- 2026-03-08: Implemented immediate startup progress state in refinement UI (`Starting code change…`) and added duplicate request guards for `Run Agent`/`requestPatch`; test coverage updated.
- 2026-03-08: Implementation complete; moved to `tickets/status/review/`.
- 2026-03-08: QA PASS (`tickets/meta/qa/2026-03-08-qa-T-0099.md`).
- 2026-03-08: PM acceptance complete; moved to `tickets/status/done/`.
