# QA Checkpoint - 2026-02-27 (T-0013)

## Scope Tested
- Ticket: T-0013 (`tickets/status/review/T-0013-change-proposal-artifact.md`)
- Area: Runtime proposal artifact persistence + decision gating

## Automated Test Outcomes
- `npm run smoke:storage` (apps/desktop): PASS.
  - Includes proposal persistence checks for feedback references and validation summary attachment.
- `python3 -m unittest runtime.test_proposals` (apps/desktop): BLOCKED in this sandbox.
  - Error: `ModuleNotFoundError: No module named 'pydantic'`.

## Manual Scenarios Executed
- Normal flow scenario: reviewed storage/API implementation path for create proposal -> append validation run -> set accepted decision (`apps/desktop/runtime/storage.py`, `apps/desktop/runtime/main.py`) and confirmed expected state shape returned for proposal artifacts.
- Edge-case scenario: verified acceptance guard branch rejects `accepted` decision when the latest validation run is missing or failing (`Acceptance requires a passing latest validation run.`).

## UI Visual Smoke Check
- Not executed in a live desktop runtime in this sandbox. Scope is runtime/backend behavior; evidence is from deterministic storage smoke and implementation-path review.

## Criteria-to-Evidence Mapping
- Proposal format documented and implemented -> runtime models + SQLite `change_proposals` persistence and API contract (`apps/desktop/runtime/models.py`, `apps/desktop/runtime/storage.py`, `apps/desktop/runtime/main.py`, `apps/desktop/README.md`) -> PASS.
- Proposal references feedback and stores validation summaries -> `create_proposal` + `add_proposal_validation_run` and smoke assertions (`apps/desktop/runtime/storage.py`, `apps/desktop/runtime/smoke_storage.py`) -> PASS.
- Decisions persist with timestamp and notes -> `update_proposal_decision` writes status/timestamp/notes (`apps/desktop/runtime/storage.py`) -> PASS.
- Acceptance blocked on failing validation -> guard in `update_proposal_decision`; covered in `runtime/test_proposals.py` and logic review -> PASS (test execution blocked by missing dependency in this environment).

## Bugs Found
- None.

## Outstanding Risks / Gaps
- `runtime.test_proposals` could not run in this sandbox because Python runtime dependencies are not installed; this leaves a small gap in executed model-serialization evidence until dependencies are available.

Suggested commit message: `QA: validate T-0013 proposal artifact persistence and acceptance gating`

Next-step suggestion: PM should review `T-0013` in `review/` and move it to `done/` if the QA evidence is sufficient.
