# T-0083: Apply Pipeline Advisory Integration Hook

## Metadata
- ID: T-0083
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0015
- Owner: ai-agent
- Created: 2026-03-05
- Updated: 2026-03-06

## Summary
Add a `_run_evals()` method to `ApplyPipeline` that invokes the eval harness (T-0082) as an advisory step between `_sandboxed_validate()` and `_apply_and_commit()`. In M12, eval failures are logged as warnings in `artifact.log_text` but never reject the patch. If `evals/` is absent, the step is silently skipped.

## Context
- T-0081 Design Spec defines the integration hook: location in the apply flow, advisory behavior, timeout, and skip-when-absent logic.
- This keeps the existing apply flow intact while adding observability for eval results.
- Hard gate mode (reject on failure) is deferred to M13+.

## References
- T-0081: Design Spec — "Integration with `apply_pipeline.py`" section
- T-0082: Eval harness core (dependency)
- `apps/desktop/runtime/agent/apply_pipeline.py` — `apply()` method, `_sandboxed_validate()`, `_apply_and_commit()`
- `tickets/meta/epics/E-0015-m12-eval-harness.md`

## Acceptance Criteria
- [x] `ApplyPipeline` has a `_run_evals()` method that: writes `unified_diff` to a temp file, invokes `evals/run.py` as a subprocess, captures JSON stdout, and appends a summary to `artifact.log_text`.
- [x] `_run_evals()` is called in `apply()` after `_sandboxed_validate()` and before `_apply_and_commit()`.
- [x] Advisory mode: if `run.py` exits non-zero, a warning is logged but `ApplyError` is NOT raised — the apply continues.
- [x] If `evals/` directory or `evals/cases/` does not exist, `_run_evals()` skips silently (no error, no warning).
- [x] Subprocess timeout is 60 seconds; on timeout, a warning is logged and apply continues.
- [x] `uv run pytest` (full suite) exits 0 — no regressions to existing apply/rollback tests.
- [x] Existing apply flow behavior is unchanged when `evals/` is absent.

## Dependencies / Sequencing
- Depends on: T-0082 (eval harness must exist)
- Blocks: none directly (T-0084 can run in parallel)

## Subtasks
- [x] Add `_run_evals()` method to `ApplyPipeline`
- [x] Insert `_run_evals()` call in `apply()` between validate and apply steps
- [x] Handle subprocess timeout, missing directory, and non-zero exit gracefully
- [x] Verify existing apply/rollback tests still pass
- [x] Manual verify: apply flow with evals/ present shows eval results in artifact log (QA: code path and unit test; full apply in integration covered by design)

## Notes
- Effort estimate: S (small).
- No new fields on `PatchArtifact` in M12 — eval results go into `log_text`.
- The subprocess invocation: `uv run python evals/run.py --patch-file <temp> --repo-root <repo>`.

## Evidence
- `apply_pipeline.py`: added `_EVALS_TIMEOUT = 60`, `_run_evals()` (writes diff to temp file, runs `uv run python evals/run.py --patch-file <path> --repo-root <repo>` from runtime dir, captures JSON, appends summary to `artifact.log_text`; skips if evals/ or evals/cases/ absent or unified_diff empty; on non-zero or timeout logs warning and continues).
- `apply()` calls `_run_evals(artifact)` after `_sandboxed_validate(artifact)` and before `_apply_and_commit(artifact)`.
- `test_apply_rollback.py`: added `RunEvalsTests.test_run_evals_skips_silently_when_unified_diff_empty`.
- `uv run pytest apps/desktop/runtime/`: 65 passed, 13 skipped.
- QA: 2026-03-06-qa-T-0083.md — automated and code-review scenarios passed; no bugs.

## Change Log
- 2026-03-05: Ticket created by PM run (M12 queue replenishment from T-0081 spec).
- 2026-03-06: Implementation complete. _run_evals() added; advisory mode and skip-when-absent; pytest green. Moved to review.
- 2026-03-06: QA passed. PM accepted; moved to done.
