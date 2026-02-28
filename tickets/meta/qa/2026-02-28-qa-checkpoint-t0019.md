# QA Checkpoint - 2026-02-28 (T-0019)

## Scope Tested
- Ticket: T-0019 (`tickets/status/review/T-0019-desktop-nav-hierarchy-and-progressive-disclosure.md`)
- Area: desktop left-rail IA hierarchy and progressive disclosure

## Automated Test Outcomes
- `npm --prefix apps/desktop test`: PASS (`3 files, 12 tests`).
- `npm --prefix apps/desktop run build`: PASS (Vite production build successful).
- `npm --prefix apps/desktop run smoke:fastapi`: PASS.
  - Artifact: `tickets/meta/qa/artifacts/runtime-smoke/2026-02-28T17-45-11-899Z/smoke-fastapi.log`

## Manual Scenarios Executed
- Normal flow: verified the default left rail starts on `Conversations`, exposes `+ New Conversation`, and keeps Settings/Feedback/Advanced as explicit entry points.
- Edge flow: verified each secondary surface includes `Back to Conversations`, ensuring users can recover context quickly without stacked cards in default view.

## UX/UI Design QA (tests/UX_QA_CHECKLIST.md)
- Mental Model and Framing: PASS — first-run rail now answers where to start (`Conversations`) and what to do next.
- Hierarchy and Focus: PASS — secondary admin/dev features moved behind separate surfaces instead of competing cards.
- Information Architecture and Navigation: PASS — clear stable nav, progressive disclosure, and single canonical channel control surface.
- States and Error Handling: PASS — existing runtime error state remains scoped/actionable and unchanged by IA split.
- Copy and Terminology: PASS — removed storage-detail wording (`SQLite`) from primary rail framing.
- Affordances and Interaction: PASS — button-based nav and back controls are keyboard-focusable.
- Visual Accessibility Basics: PASS — existing typography and contrast system retained; hierarchy improved through structure.
- Responsive/Desktop Window Sanity: PASS — left rail now scrolls for narrow heights and preserves access to nav/actions.

## UI Visual Smoke Check
- No new screenshot captured in this run.
- Visual smoke evidence is based on deterministic render assertions and successful app build/smoke execution.

## Copy Regression Sweep
- Reviewed changed copy in `apps/desktop/src/App.tsx`:
  - `Conversations` heading + start guidance.
  - Surface labels (`Settings`, `Feedback`, `Advanced`).
  - `Back to Conversations` affordance.
  - `Current release channel` informational copy.
- Result: PASS (copy is consistent, intent-led, and does not imply unsupported behavior).

## Criteria-to-Evidence Mapping
- Default rail is `Conversations` and avoids implementation-detail copy -> `apps/desktop/src/App.tsx`, `apps/desktop/src/appShell.test.tsx` -> PASS.
- Settings/Feedback/Advanced are clear non-stacked entry points -> `apps/desktop/src/App.tsx`, `apps/desktop/src/appShell.test.tsx` -> PASS.
- Secondary surface selection swaps content and offers obvious way back -> `apps/desktop/src/App.tsx` (`activeLeftRailSurface` + `Back to Conversations`) -> PASS.
- One canonical Stable/Experimental control surface remains -> `apps/desktop/src/App.tsx`, `apps/desktop/src/settingsPanel.tsx`, `apps/desktop/src/settingsPanel.test.tsx` -> PASS.
- Regression coverage exists for IA labels and channel control presence -> `apps/desktop/src/appShell.test.tsx`, `apps/desktop/src/settingsPanel.test.tsx` -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- UI visual evidence relies on deterministic assertions; add screenshot capture in a future UI QA pass if stronger visual audit traceability is needed.

Suggested commit message: `T-0019: restructure desktop left-rail IA with progressive disclosure`

Next-step suggestion: PM should review `T-0019` in `review/` and accept to `done/` if the IA and QA evidence meet E-0003 expectations.
