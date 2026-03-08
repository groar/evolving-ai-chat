# T-0100: Fix with AI — show correct conversation after Run Agent

## Metadata
- ID: T-0100
- Status: ready
- Priority: P2
- Type: bug
- Area: ui
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08

## Summary
After clicking "Run Agent" from a refinement conversation, the UI sometimes opens or shows a different conversation (a "discussion that is completely different from the one we started"). The user loses context and cannot easily see progress or outcome for the refinement they just confirmed.

## Context
Discovered in M13 tier-2 validation (Probe 1). Checkpoint: `tickets/meta/feedback/2026-03-08-pm-checkpoint-m13-tier2-validation.md`. Facilitator noted: "super weird it opens a discussion that is completely different from the one we started."

## Acceptance Criteria
- [ ] After "Run Agent", the user remains in (or is returned to) the same refinement conversation context; no unrelated conversation is shown as the active one.
- [ ] Progress and final outcome for that patch run are visible in association with the same refinement conversation (or the Activity card that corresponds to it).

## UX Acceptance Criteria (Area: ui)
- [ ] Primary flow: active conversation after "Run Agent" is the same refinement conversation (or user is returned to it); no unrelated chat is shown.
- [ ] Empty/error states: if the run fails, failure is visible in the same flow (refinement or Activity card for that run).

## Evidence (Verification)
- M13 tier-2 Session 1 (Probe 1): facilitator report + screenshot reference.

## Change Log
- 2026-03-08: Created from M13 tier-2 validation (Probe 1). Source: 2026-03-08-pm-checkpoint-m13-tier2-validation.md.
