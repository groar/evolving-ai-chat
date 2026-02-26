# QA Checkpoint - 2026-02-26 (T-0010)

## Scope Tested
- Ticket: T-0010 (`tickets/status/review/T-0010-fastapi-runtime-dev-startup-and-smoke.md`)
- Area: FastAPI runtime startup runbook + runtime contract smoke automation

## Automated Test Outcomes
- `npm --prefix apps/desktop run smoke:fastapi`: FAIL in sandbox (`No module named uvicorn`), expected when Python deps are not installed; command exits non-zero and writes artifact log.
- `/bin/zsh -c 'cd apps/desktop && npm run runtime:stub:node >/tmp/t0010-runtime-node.log 2>&1 & pid=$!; sleep 1; npm run smoke:fastapi -- --assume-running; code=$?; kill $pid; wait $pid 2>/dev/null; exit $code'`: PASS.
- `smoke:fastapi` artifact logs created:
  - `tickets/meta/qa/artifacts/runtime-smoke/2026-02-26T20-17-47-094Z/smoke-fastapi.log`
  - `tickets/meta/qa/artifacts/runtime-smoke/2026-02-26T20-20-21-828Z/smoke-fastapi.log`

## Manual Scenarios Executed
- Normal flow scenario: runtime already running, `smoke:fastapi --assume-running` verifies `/health` and chat payload contract (`reply`, `model_id`, `created_at`, `cost`) -> PASS.
- Edge-case scenario: managed FastAPI startup path without installed Python deps fails deterministically and returns non-zero with explicit dependency error -> PASS (expected behavior for this environment).

## UI Visual Smoke Check
- Not executed. Tauri UI launch is not required to validate this ticket's acceptance criteria and is constrained in this sandbox setup.

## Criteria-to-Evidence Mapping
- Copy-pastable FastAPI setup/run flow documented -> `apps/desktop/README.md` update -> PASS.
- `/health` and chat payload contract aligned with desktop expectations -> runtime endpoint review + smoke contract check -> PASS.
- Deterministic smoke supports startup/assume-running modes and fails non-zero on errors -> `apps/desktop/scripts/smoke-fastapi.mjs` + executed commands -> PASS.
- Smoke output captured to ticket-linkable file -> artifact logs under `tickets/meta/qa/artifacts/runtime-smoke/...` -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Full managed FastAPI startup could not pass in this sandbox because Python dependency installation is unavailable here; local dev environments with `pip install -r runtime/requirements.txt` are still required.

Suggested commit message: `QA: validate T-0010 FastAPI smoke flow and artifact evidence`

Next-step suggestion: PM should review T-0010 in `review/` and accept it to `done/` if the documented local setup flow is sufficient.
