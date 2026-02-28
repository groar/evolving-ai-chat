# QA Checkpoint - 2026-02-28 (T-0017)

## Scope Tested
- Ticket: T-0017 (`tickets/status/review/T-0017-settings-discoverability-and-runtime-messaging.md`)
- Area: left-rail Settings discoverability and runtime-offline messaging scope

## Automated Test Outcomes
- `npm --prefix apps/desktop test -- src/settingsPanel.test.tsx`: PASS (`1 file, 7 tests`).
- `npm --prefix apps/desktop test`: PASS (`2 files, 8 tests`).
- `npm --prefix apps/desktop run build`: PASS (Vite production build successful).

## Manual Scenarios Executed
- Normal flow: verified the Settings panel render includes a top-level `Settings` label with `Changelog + Experiments` and `Proposals` grouped underneath.
- Edge flow: verified runtime-offline error copy is scoped to runtime-backed surfaces (`changelog` and `proposals`) and no longer uses the broader "changelog, proposals, and settings" failure wording.

## UI Visual Smoke Check
- No live desktop screenshot was captured in this run.
- UI smoke evidence is based on deterministic Settings panel render assertions and successful desktop build.

## Copy Regression Sweep
- Reviewed all newly introduced/changed user-facing strings in Settings-related surfaces:
  - `Settings` section label and supporting discoverability copy.
  - Runtime-offline error wording for runtime-backed surfaces.
- Result: PASS (no wording implies local settings are unavailable).

## Criteria-to-Evidence Mapping
- Settings surface is clearly labeled/discoverable -> `apps/desktop/src/settingsPanel.tsx` + `apps/desktop/src/settingsPanel.test.tsx` (`renders a clearly labeled settings section`) -> PASS.
- Runtime-unavailable messaging no longer claims settings cannot be loaded -> `apps/desktop/src/App.tsx` + `apps/desktop/src/settingsPanel.test.tsx` (`shows runtime-offline error copy without implying settings are unavailable`) -> PASS.
- Regression test added/updated for runtime-unavailable UI state and copy -> `apps/desktop/src/settingsPanel.test.tsx` (new discoverability + runtime-offline copy assertions) -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- The E-0002 tier-2 micro-validation probes should still be rerun with fresh human observers to close the original usability finding loop.

Suggested commit message: `T-0017: improve settings discoverability and scope runtime-offline messaging`

Next-step suggestion: PM should review `T-0017` in `review/` and accept it to `done/` after confirming E-0002 probe rerun expectations.
