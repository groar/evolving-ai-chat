# T-0083: Apply Pipeline Advisory Integration Hook

## Metadata
- ID: T-0083
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0015
- Owner: ai-agent
- Created: 2026-03-05
- Updated: 2026-03-05

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
- [ ] `ApplyPipeline` has a `_run_evals()` method that: writes `unified_diff` to a temp file, invokes `evals/run.py` as a subprocess, captures JSON stdout, and appends a summary to `artifact.log_text`.
- [ ] `_run_evals()` is called in `apply()` after `_sandboxed_validate()` and before `_apply_and_commit()`.
- [ ] Advisory mode: if `run.py` exits non-zero, a warning is logged but `ApplyError` is NOT raised — the apply continues.
- [ ] If `evals/` directory or `evals/cases/` does not exist, `_run_evals()` skips silently (no error, no warning).
- [ ] Subprocess timeout is 60 seconds; on timeout, a warning is logged and apply continues.
- [ ] `uv run pytest` (full suite) exits 0 — no regressions to existing apply/rollback tests.
- [ ] Existing apply flow behavior is unchanged when `evals/` is absent.

## Dependencies / Sequencing
- Depends on: T-0082 (eval harness must exist)
- Blocks: none directly (T-0084 can run in parallel)

## Subtasks
- [ ] Add `_run_evals()` method to `ApplyPipeline`
- [ ] Insert `_run_evals()` call in `apply()` between validate and apply steps
- [ ] Handle subprocess timeout, missing directory, and non-zero exit gracefully
- [ ] Verify existing apply/rollback tests still pass
- [ ] Manual verify: apply flow with evals/ present shows eval results in artifact log

## Notes
- Effort estimate: S (small).
- No new fields on `PatchArtifact` in M12 — eval results go into `log_text`.
- The subprocess invocation: `uv run python evals/run.py --patch-file <temp> --repo-root <repo>`.

## Change Log
- 2026-03-05: Ticket created by PM run (M12 queue replenishment from T-0081 spec).
