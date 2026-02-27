# T-0014: Python runtime deps and test bootstrap (FastAPI + pydantic)

## Metadata
- ID: T-0014
- Status: ready
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
- [ ] Python dependencies required by `apps/desktop/runtime/` are declared in this repo (single canonical place).
- [ ] `cd apps/desktop && npm run runtime:fastapi` starts successfully in a clean environment (no missing imports).
- [ ] `cd apps/desktop && npm run smoke:fastapi` passes.
- [ ] `cd apps/desktop && python3 -m unittest runtime/test_proposals.py` passes when run in the declared environment.
- [ ] `apps/desktop/README.md` documents the canonical commands to install/sync Python deps and run the above checks.

## Dependencies / Sequencing (Optional)
- Blocks:
  - T-0015 (proposal accept should create a changelog entry) by enabling runtime tests to execute.
  - T-0016 (proposals UI panel) by restoring end-to-end fastapi smoke confidence.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint:
- Screenshots/artifacts:

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Design updates
- [ ] Implementation
- [ ] Tests
- [ ] Documentation updates

## Notes
- Keep dependency scope minimal: likely `fastapi`, `uvicorn`, `pydantic` (plus any transitive needs).

## Change Log
- 2026-02-27: Ticket created.
