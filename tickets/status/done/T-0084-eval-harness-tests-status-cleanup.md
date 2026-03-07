# T-0084: Eval Harness Test Coverage + STATUS.md Cleanup

## Metadata
- ID: T-0084
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0015
- Owner: ai-agent
- Created: 2026-03-05
- Updated: 2026-03-06

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
- [x] `apps/desktop/runtime/test_evals.py` exists with at least two tests: one invoking `run.py` against the good fixture (expecting exit 0), one against the bad fixture (expecting exit 1 or appropriate non-zero).
- [x] Tests verify JSON stdout structure (total, passed, failed, results array).
- [x] `uv run pytest apps/desktop/runtime/test_evals.py` exits 0.
- [x] `uv run pytest` (full suite) exits 0 — no regressions.
- [x] STATUS.md "Known gaps" no longer lists "No eval harness".

## Evidence
- `apps/desktop/runtime/test_evals.py`: 6 tests — good case (exit 0 + JSON structure), bad case (expectation-matched semantics: exit 0 when patch correctly fails to apply), cases-dir (both results). Harness design: a case with `expect result: fail` "passes" when the check fails (expectation matched).
- STATUS.md: "No eval harness" replaced with strikethrough and M12 completion note.
- Full suite: `uv run pytest` → 71 passed, 13 skipped (2026-03-06).

## Dependencies / Sequencing
- Depends on: T-0082 (eval harness must exist)
- Can run in parallel with T-0083

## Subtasks
- [x] Create `test_evals.py` with subprocess-based test fixtures
- [x] Test good-patch case (exit 0, correct JSON)
- [x] Test bad-patch case (expectation-matched: exit 0 when patch fails as expected)
- [x] Update STATUS.md — remove "No eval harness" known gap
- [x] Verify full test suite passes

## Notes
- Effort estimate: S (small).
- Tests should use `subprocess.run()` to invoke `run.py` — matching the real integration path.
- Consider edge case tests (empty cases dir, malformed YAML) as stretch goals for M13+.

## Change Log
- 2026-03-05: Ticket created by PM run (M12 queue replenishment from T-0081 spec).
- 2026-03-06: Implemented test_evals.py (6 subprocess-based tests), updated STATUS.md known gaps, moved to review.
- 2026-03-06: QA passed (2026-03-06-qa-T-0084.md). PM accepted; moved to done.
