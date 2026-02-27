# QA Checkpoint - 2026-02-27 (T-0015)

## Scope Tested
- Ticket: T-0015 (`tickets/status/review/T-0015-proposal-accept-creates-changelog-entry.md`)
- Area: runtime proposal decision -> changelog linkage/idempotency

## Automated Test Outcomes
- `cd apps/desktop && UV_CACHE_DIR=/tmp/uv-cache uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime/test_proposals.py`: PASS (`Ran 4 tests in 0.016s`).
- `cd apps/desktop && npm test -- src/settingsPanel.test.tsx`: PASS (`3 passed`).

## Manual Scenarios Executed
- Normal flow scenario: created proposal, added passing validation run, accepted proposal, and verified exactly one linked changelog entry with `proposal_id` and `ticket_id=T-0015`.
- Edge-case scenario: created proposal and rejected it, then verified no changelog entry linked to that `proposal_id`.

## UI Visual Smoke Check
- Not run in desktop UI session for this checkpoint; verification used deterministic runtime/state checks plus renderer test coverage for changelog metadata rendering.

## Criteria-to-Evidence Mapping
- Accepting a proposal creates a changelog entry linked to `proposal_id` -> `runtime/test_proposals.py::test_acceptance_requires_passing_latest_validation_run` + runtime manual command output (`accept_entries 1 T-0015`) -> PASS.
- Rejecting creates no changelog entry -> `runtime/test_proposals.py::test_rejection_does_not_create_changelog_entry` + runtime manual command output (`reject_entries 0`) -> PASS.
- Re-accepting does not create duplicates -> `runtime/test_proposals.py::test_acceptance_requires_passing_latest_validation_run` (re-accept assertion) -> PASS.
- Entry appears in `GET /state` and is rendered in settings changelog metadata -> `runtime/storage.py` state listing + `src/settingsPanel.test.tsx` (`proposal_id` rendering assertion) -> PASS.
- Safe fallback title/summary when proposal content is empty -> `runtime/test_proposals.py::test_acceptance_falls_back_to_safe_changelog_copy` -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- No live desktop screenshot was captured in this run; UI-level evidence remains test-based for changelog metadata display.

Suggested commit message: `T-0015: link accepted proposals to single changelog entries`

Next-step suggestion: PM should review `T-0015` in `review/` and move it to `done/` if this QA evidence is acceptable.
