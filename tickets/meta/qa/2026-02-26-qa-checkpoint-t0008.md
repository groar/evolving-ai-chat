# QA Checkpoint - 2026-02-26 (T-0008)

## Scope Tested
- Ticket: T-0008 (`tickets/status/review/T-0008-changelog-and-rollback-ux.md`)
- Area: UI + runtime settings/changelog behavior

## Automated Test Outcomes
- `npm test` (`apps/desktop`) -> PASS (`src/settingsPanel.test.tsx`, 3 tests).
- `npm run build` (`apps/desktop`) -> PASS.
- `npm run smoke:storage` (`apps/desktop`) -> PASS.
- `/bin/zsh -c 'cd apps/desktop && npm run runtime:stub:node >/tmp/t0008-runtime.log 2>&1 & pid=$!; sleep 1; npm run smoke; code=$?; kill $pid; wait $pid 2>/dev/null; exit $code'` -> PASS.

## Manual Scenarios Executed
- Normal flow scenario -> PASS:
  - Start runtime stub.
  - Switch to `experimental`.
  - Enable `show_runtime_diagnostics`.
  - Run `Reset Experiments`.
  - Verify diagnostics flag resets to `false` and changelog entries grow.
- Edge-case scenario -> PASS:
  - In `stable`, attempt `POST /settings/flags/show_runtime_diagnostics`.
  - Verify request is rejected with `409`.

## Copy Regression Sweep
Reviewed user-facing rollback/changelog copy for clarity and promise control:
- `apps/desktop/src/settingsPanel.tsx:54`
- `apps/desktop/src/settingsPanel.tsx:63`
- `apps/desktop/src/settingsPanel.tsx:75`
- `apps/desktop/src/settingsPanel.tsx:131`
- `apps/desktop/src/App.tsx:190`
- `apps/desktop/src/App.tsx:235`
- `apps/desktop/README.md:72`

Result: PASS. Copy consistently frames rollback as feature-toggle only and does not imply code/data rollback.

## UI Visual Smoke Check
- Not executed in this environment (desktop UI launch is constrained in sandboxed QA run).
- Mitigation: component-level deterministic tests cover changelog states and rollback confirmation gating.

## Criteria-to-Evidence Mapping
- Changelog view with empty + non-empty states -> `apps/desktop/src/settingsPanel.tsx` + `apps/desktop/src/settingsPanel.test.tsx` -> PASS.
- Rollback controls for switch-to-stable and reset-experiments with confirmation -> `apps/desktop/src/settingsPanel.tsx` + tests/manual scenario -> PASS.
- Individual experimental flag control in experimental channel -> runtime `POST /settings/flags/{flag_key}` behavior + manual flow -> PASS.
- Rollback copy clearly scoped to feature toggles only -> copy sweep lines listed above -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Full visual desktop interaction (Tauri window-level verification) was not run in this QA environment.

Suggested commit message: `QA: validate T-0008 changelog and rollback UX`

Next-step suggestion: PM should review `T-0008` in `review/` and accept it to `done/` if this QA evidence is sufficient.
