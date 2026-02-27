# T-0014: Python runtime deps and test bootstrap (FastAPI + pydantic)

## Metadata
- ID: T-0014
- Status: review
- Priority: P1
- Type: chore
- Area: core
- Epic: E-0002
- Owner: ai-agent
- Created: 2026-02-27
- Updated: 2026-02-27

## Summary
Track and install required Python runtime dependencies so FastAPI smoke and runtime unit tests can run deterministically (no reliance on global user Python installs).

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Make `apps/desktop` runtime scripts runnable in a clean environment (FastAPI/uvicorn).
  - Make runtime unit tests runnable (for example `runtime/test_proposals.py`).
  - Reduce recurring QA/verification gaps caused by missing Python dependencies.
- Non-goals:
  - Packaging the runtime for distribution.
  - Adding CI in this ticket (allowed as a follow-up, but not required).
- Rules and state transitions:
  - Python dependencies are declared in versioned project files (not ad-hoc local installs).
  - Canonical execution path uses the declared environment (for example `uv run ...`), so evidence is reproducible.
- User-facing feedback plan:
  - None (developer workflow only).
- Scope bounds:
  - Minimal dependency set required to run the runtime and unit tests.
  - Document the exact commands for smoke + tests.
- Edge cases / failure modes:
  - If `uv` is unavailable, document a deterministic fallback (`python3 -m venv` + `pip install`) but keep declared deps as source of truth.
- Validation plan:
  - Deterministic: runtime unit test(s) execute successfully and desktop fastapi smoke runs.

## Context
Multiple tickets have recorded blocked verification because Python deps are missing in the execution environment (for example `uvicorn` and `pydantic`). This undermines the "validate" leg of the loop.

## References
- `STATUS.md`
- `docs/m1-first-improvement-loop.md`
- `tickets/status/done/T-0006-feature-flags-and-release-channels.md` (FastAPI smoke blocked by missing `uvicorn`)
- `tickets/status/done/T-0013-change-proposal-artifact.md` (unit tests blocked by missing `pydantic`)

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [x] Python dependencies required by `apps/desktop/runtime/` are declared in this repo (single canonical place).
- [x] `cd apps/desktop && npm run runtime:fastapi` starts successfully in a clean environment (no missing imports).
- [x] `cd apps/desktop && npm run smoke:fastapi` passes.
- [x] `cd apps/desktop && python3 -m unittest runtime/test_proposals.py` passes when run in the declared environment.
- [x] `apps/desktop/README.md` documents the canonical commands to install/sync Python deps and run the above checks.

## Dependencies / Sequencing (Optional)
- Blocks:
  - T-0015 (proposal accept should create a changelog entry) by enabling runtime tests to execute.
  - T-0016 (proposals UI panel) by restoring end-to-end fastapi smoke confidence.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-02-27-qa-checkpoint-t0014.md`
- Screenshots/artifacts:
  - `tickets/meta/qa/artifacts/runtime-smoke/2026-02-27T17-15-39-984Z/smoke-fastapi.log`
  - `tickets/meta/qa/artifacts/runtime-smoke/2026-02-27T17-21-55-811Z/smoke-fastapi.log`

## Evidence (Verification)
- Tests run:
  - `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime/test_proposals.py` -> PASS (`Ran 2 tests in 0.009s`).
  - `cd apps/desktop && npm run smoke:fastapi` -> PASS.
- Manual checks performed:
  - `cd apps/desktop && npm run runtime:fastapi` (launched in background), then `curl http://127.0.0.1:8787/health` -> `{"ok":true}`.
- Screenshots/logs/notes:
  - `/tmp/t0014-runtime.log` (uvicorn startup/health/shutdown log for direct runtime command check).
  - `/tmp/t0014-health.json` (health probe response).

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates

## Notes
- Keep dependency scope minimal: likely `fastapi`, `uvicorn`, `pydantic` (plus any transitive needs).

## Change Log
- 2026-02-27: Ticket created.
- 2026-02-27: Added `pydantic` to runtime dependencies, switched runtime/smoke scripts to `uv run --with-requirements`, and updated desktop README with canonical dependency sync + verification commands.
