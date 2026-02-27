# QA Checkpoint - 2026-02-27 (T-0014)

## Scope Tested
- Ticket: T-0014 (`tickets/status/done/T-0014-python-runtime-deps-and-test-bootstrap.md`)
- Area: Python runtime dependency bootstrap for FastAPI runtime + runtime tests

## Automated Test Outcomes
- `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime/test_proposals.py`: PASS (`Ran 2 tests in 0.009s`).
- `cd apps/desktop && npm run smoke:fastapi`: PASS.
- `cd apps/desktop && npm run smoke:fastapi -- --assume-running`: PASS.

## Manual Scenarios Executed
- Normal flow scenario: started runtime via `cd apps/desktop && npm run runtime:fastapi`, probed `GET /health`, and confirmed `{"ok":true}` response with clean startup/shutdown logs.
- Edge-case scenario: validated `smoke:fastapi -- --assume-running` path against a separately running runtime process to confirm smoke checks succeed without managed startup.

## UI Visual Smoke Check
- Not executed in a live desktop UI session for this run. Scope is runtime/bootstrap behavior and deterministic command-path validation.

## Criteria-to-Evidence Mapping
- Runtime dependencies declared in-repo and canonicalized -> `apps/desktop/runtime/requirements.txt` + runtime scripts in `apps/desktop/package.json` + managed smoke launcher in `apps/desktop/scripts/smoke-fastapi.mjs` -> PASS.
- `npm run runtime:fastapi` starts with declared deps -> `/tmp/t0014-runtime.log` startup and health probe evidence -> PASS.
- `npm run smoke:fastapi` passes -> artifact `tickets/meta/qa/artifacts/runtime-smoke/2026-02-27T17-15-39-984Z/smoke-fastapi.log` -> PASS.
- Runtime unit tests pass in declared environment -> unittest output captured in run log -> PASS.
- README documents canonical dependency sync and verification commands -> `apps/desktop/README.md` -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Commands now require `uv`; fallback setup is documented, but teams without `uv` installed must use the venv fallback path before running runtime/smoke commands.

Suggested commit message: `T-0014: bootstrap desktop runtime Python deps via uv and validate fastapi/test flows`

Next-step suggestion: PM should review `T-0014` in `review/` and move it to `done/` if this QA evidence is acceptable.
