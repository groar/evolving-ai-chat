# T-0099: Fix with AI — show progress in main UI after Run Agent

## Metadata
- ID: T-0099
- Status: backlog
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
- [ ] After "Run Agent" is clicked, the user sees visible feedback in the current context (e.g. floating banner, inline status, or automatic switch to a view that shows "Working on your change…" / elapsed time) without having to open Activity or the refinement thread.
- [ ] It is not possible to submit "Run Agent" twice by accident because the control is disabled or replaced by progress state while the run is in progress.

## UX Acceptance Criteria (Area: ui)
- [ ] Primary flow: user who stays on the refinement conversation (or is returned to it) sees progress; alternatively, a persistent progress indicator (e.g. PatchNotification) is visible from the main chat/improvement flow.
- [ ] Empty/error states: if Run Agent fails, the user sees failure state in the same flow (not only in Activity).

## Evidence (Verification)
- M13 tier-2 Session 1 (Probe 1): facilitator report "when we clicked on Run agent, it did not show anything in the UI"; progress only visible "when I click on the card and the refinement conversation is open."

## Change Log
- 2026-03-08: Created from M13 tier-2 validation (Probe 1). Source: 2026-03-08-pm-checkpoint-m13-tier2-validation.md.
