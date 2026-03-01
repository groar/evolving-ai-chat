# QA Checkpoint - 2026-03-01 (T-0023 Reopen)

## Scope Tested
- Ticket: T-0023 (`tickets/status/review/T-0023-runtime-offline-banner-persists-when-runtime-running.md`)
- Area: runtime reachability from desktop app shell when runtime process is already running
- Risk focus: false `offline` classification caused by request-origin rejection

## Automated Test Outcomes
- `npm --prefix apps/desktop test -- appShell.test.tsx`: PASS (`1 file, 8 tests`)
- `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime/test_proposals.py`: PASS (`5 tests`)
- `cd apps/desktop && npm run smoke:fastapi`: PASS
  - Artifact: `tickets/meta/qa/artifacts/runtime-smoke/2026-03-01T08-39-00-312Z/smoke-fastapi.log`

## Manual Scenarios Executed
- Scenario replay from user report: reviewed runtime API stack and confirmed previous runtime server had no CORS middleware, which can surface as network failure (`offline`) in desktop WebView despite runtime health.
- Post-fix verification: runtime API now includes explicit CORS configuration for `tauri://localhost`, `http://localhost:*`, and `http://127.0.0.1:*`.

## UX/UI Design QA (Required If `Area: ui`)
- Not required (`Area: ui` is not set on T-0023).

## Copy Regression Sweep (Only If User-Facing Text Changed)
- Not required (no copy changes in this reopen fix).

## Criteria-to-Evidence Mapping
- Runtime reachability detection reflects reality when runtime is running -> CORS support added for desktop/local origins in `apps/desktop/runtime/main.py` -> PASS.
- Regression test covers recurrence guard -> `apps/desktop/runtime/test_proposals.py` validates CORS middleware config -> PASS.
- No regression in runtime contract behavior -> managed `smoke:fastapi` run above -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- No browser-level screenshot evidence was captured in this run; if the user still reports failures, collect network console output from Tauri devtools for endpoint-level diagnostics.

Suggested commit message: `fix(runtime): restore runtime reachability by allowing desktop origins (T-0023)`

Next-step suggestion: PM should accept T-0023 from `review/` to `done/` if this reopen QA evidence is sufficient.
