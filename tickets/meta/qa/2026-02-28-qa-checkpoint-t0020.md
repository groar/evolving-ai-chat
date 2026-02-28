# QA Checkpoint - 2026-02-28 (T-0020)

## Scope Tested
- Ticket: T-0020 (`tickets/status/review/T-0020-runtime-offline-ux-single-actionable-state.md`)
- Area: runtime-offline UX messaging and composer availability
- Risk focus: duplicate/error-prone runtime messaging that reads as app-wide failure

## Automated Test Outcomes
- `npm --prefix apps/desktop test -- appShell`: PASS (`1 file, 5 tests`).
- `npm --prefix apps/desktop test`: PASS (`3 files, 14 tests`).
- `npm --prefix apps/desktop run build`: PASS.
- `npm --prefix apps/desktop run smoke:fastapi`: PASS.
  - Artifact: `tickets/meta/qa/artifacts/runtime-smoke/2026-02-28T19-14-16-173Z/smoke-fastapi.log`

## Manual Scenarios Executed
- Normal flow: runtime available path verified through passing smoke and runtime-backed chat contract (`scripts/smoke.mjs`) with no runtime-offline banner persistence.
- Edge flow: runtime-offline render contract verified through deterministic markup assertions for one global offline status, Retry action, and disabled composer state.

## UX/UI Design QA (tests/UX_QA_CHECKLIST.md)
- Mental Model and Framing: PASS — runtime is described as a local background service in plain language.
- Hierarchy and Focus: PASS — runtime status is centralized into one global banner, avoiding repeated failure messaging.
- Information Architecture and Navigation: PASS — runtime-backed settings errors stay scoped to settings surfaces.
- States and Error Handling: PASS — offline and request-failure states now use distinct copy.
- Copy and Terminology: PASS — wording is actionable and does not imply data loss/catastrophic failure.
- Affordances and Interaction: PASS — single Retry action remains available as primary recovery affordance.
- Visual Accessibility Basics: PASS — warning surfaces keep existing contrast-oriented visual language.
- Responsive/Desktop Window Sanity: PASS — banner placement is within chat pane flow and does not hide core controls.

## UI Visual Smoke Check
- No screenshot captured in this run.
- Visual evidence is based on deterministic render assertions plus successful runtime smoke execution.

## Copy Regression Sweep
- Reviewed changed strings in `apps/desktop/src/App.tsx`:
  - Runtime explanation line and offline/request-error variants.
  - Retry affordance placement and wording.
  - Offline composer placeholder copy.
- Result: PASS (copy is scoped, actionable, and avoids implying unrelated surfaces are unavailable).

## Criteria-to-Evidence Mapping
- Single global runtime-offline indicator with clear explanation + action -> `apps/desktop/src/App.tsx`, `apps/desktop/src/appShell.test.tsx` -> PASS.
- Composer enable/disable follows runtime availability with explanatory copy -> `apps/desktop/src/App.tsx`, `apps/desktop/src/appShell.test.tsx` -> PASS.
- Runtime-backed sub-features stay scoped and do not duplicate global messaging -> `apps/desktop/src/settingsPanel.test.tsx`, `apps/desktop/src/App.tsx` -> PASS.
- Regression coverage for runtime-offline copy and state behavior exists -> `apps/desktop/src/appShell.test.tsx`, `apps/desktop/src/settingsPanel.test.tsx` -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- UI evidence is assertion-driven; capture screenshot evidence in a future browser QA pass for stronger visual audit trail.

Suggested commit message: `T-0020: unify runtime-offline UX into one actionable global state`

Next-step suggestion: PM should review `T-0020` in `review/` and accept to `done/` if the runtime-offline UX and QA evidence meet E-0003 expectations.
