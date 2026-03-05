# T-0084: Eval Harness Test Coverage + STATUS.md Cleanup

## Metadata
- ID: T-0084
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0015
- Owner: ai-agent
- Created: 2026-03-05
- Updated: 2026-03-05

## Summary
Add `test_evals.py` to `apps/desktop/runtime/` with pytest-based tests that invoke `evals/run.py` as a subprocess against known-good and known-bad fixture patches, asserting correct exit codes and JSON output. Remove the "No eval harness" known gap from STATUS.md. Verify the full test suite stays green.

## Context
- T-0081 Design Spec specifies `test_evals.py` with subprocess-based tests following the existing pattern (`test_chat.py`, `test_proposals.py`).
- This is the final M12 ticket — it closes the eval harness known gap in STATUS.md and ensures the harness has regression coverage.

## References
- T-0081: Design Spec — test coverage section
- T-0082: Eval harness core (dependency — provides `evals/run.py` and fixture cases)
- `apps/desktop/runtime/test_chat.py`, `test_proposals.py` — existing test patterns
- `STATUS.md` — "No eval harness" known gap to remove
- `tickets/meta/epics/E-0015-m12-eval-harness.md`

## Acceptance Criteria
- [ ] `apps/desktop/runtime/test_evals.py` exists with at least two tests: one invoking `run.py` against the good fixture (expecting exit 0), one against the bad fixture (expecting exit 1 or appropriate non-zero).
- [ ] Tests verify JSON stdout structure (total, passed, failed, results array).
- [ ] `uv run pytest apps/desktop/runtime/test_evals.py` exits 0.
- [ ] `uv run pytest` (full suite) exits 0 — no regressions.
- [ ] STATUS.md "Known gaps" no longer lists "No eval harness".

## Dependencies / Sequencing
- Depends on: T-0082 (eval harness must exist)
- Can run in parallel with T-0083

## Subtasks
- [ ] Create `test_evals.py` with subprocess-based test fixtures
- [ ] Test good-patch case (exit 0, correct JSON)
- [ ] Test bad-patch case (exit non-zero, correct JSON)
- [ ] Update STATUS.md — remove "No eval harness" known gap
- [ ] Verify full test suite passes

## Notes
- Effort estimate: S (small).
- Tests should use `subprocess.run()` to invoke `run.py` — matching the real integration path.
- Consider edge case tests (empty cases dir, malformed YAML) as stretch goals for M13+.

## Change Log
- 2026-03-05: Ticket created by PM run (M12 queue replenishment from T-0081 spec).
