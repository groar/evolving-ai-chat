# T-0101: Activity card status when patch completes (applied / failed)

## Metadata
- ID: T-0101
- Status: done
- Priority: P2
- Type: bug
- Area: ui
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08

## Summary
When the patch agent completes (success or failure), the Activity card and refinement UI continue to show "in progress." The terminal status (e.g. `applied`, `apply_failed` with reason) is not reflected in the UI, so the user cannot tell that the run finished or what the outcome was without checking logs.

## Context
Discovered in M13 tier-2 validation (Probe 1). Checkpoint: `tickets/meta/feedback/2026-03-08-pm-checkpoint-m13-tier2-validation.md`. Facilitator: "It is always in progress even though the agent finished: I can see the agent log 'Completed — … shipped as T-0098'. Nothing was committed." Server log showed `apply_failed reason=patch_timeout`.

## Acceptance Criteria
- [x] When the patch run reaches a terminal status (`applied`, `apply_failed`, etc.), the Activity card (and any refinement view tied to that run) updates to show that status within a reasonable time (e.g. next poll or event).
- [x] User can distinguish "in progress" from "completed successfully" and "failed" (with reason if available) without consulting backend logs.

## UX Acceptance Criteria (Area: ui)
- [x] Primary flow: Activity card and refinement view show terminal status (e.g. "Applied", "Failed: &lt;reason&gt;") within one poll cycle of completion.
- [x] Empty/error states: failed runs show reason text when available (e.g. patch_timeout); applied runs show clear success state.

## Evidence (Verification)
- M13 tier-2 Session 1 (Probe 1): card stayed "in progress" after agent completed; server had `apply_failed reason=patch_timeout`.
- Desktop UI tests: `npm --prefix apps/desktop run test -- src/RefinementConversation.test.tsx src/PatchNotification.test.tsx src/activitySheet.test.tsx` (pass, 77 tests).
- Refinement status surface now follows the latest patch for the active refinement feedback/run and renders terminal outcome states (`applied`, `apply_failed`, `validation_failed`, `scope_blocked`, rollback outcomes) with failure-reason copy for failed terminal states.
- QA checkpoint: `tickets/meta/qa/2026-03-08-qa-T-0101.md` (PASS; no bugs filed).

## Change Log
- 2026-03-08: Created from M13 tier-2 validation (Probe 1). Source: 2026-03-08-pm-checkpoint-m13-tier2-validation.md.
- 2026-03-08: Implementation started. Updated refinement patch-state binding to follow the same feedback/refinement run and surface terminal statuses (`applied`, `apply_failed`, `validation_failed`, etc.) directly in refinement UI; added `validation_failed` as a typed terminal patch status and test coverage for refinement + notification terminal copy.
- 2026-03-08: Implementation complete; moved to `review` with automated UI test evidence captured.
- 2026-03-08: QA PASS (`tickets/meta/qa/2026-03-08-qa-T-0101.md`) and PM acceptance complete; moved to `done`.
