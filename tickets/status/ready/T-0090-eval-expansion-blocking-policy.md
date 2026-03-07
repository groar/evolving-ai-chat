# T-0090: Eval harness expansion — blocking policy + new checks

## Metadata
- ID: T-0090
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07

## Summary
Expand the eval harness from advisory-only to a blocking/advisory framework. Add two new eval checks (`files_in_allowlist` and `npm_validate_passes`) and make all three checks blocking. Modify `_run_evals()` in `apply_pipeline.py` to raise `ApplyError` when any blocking check fails, producing structured failure results that T-0091 (retry) can consume.

## Context
- Currently `_run_evals()` catches all exceptions and continues — even if every eval fails, the patch is still committed.
- The eval registry contains only `patch_applies_cleanly`.
- The M13 design spec (§5) defines the blocking vs. advisory policy and the two new checks.

## References
- `docs/m13-self-evolve-reliability.md` — §5 (Eval Policy: Blocking vs. Advisory)
- `apps/desktop/runtime/agent/apply_pipeline.py` — `_run_evals()` method (lines 298–359)
- `apps/desktop/runtime/evals/` — eval harness (`run.py`, `cases/`)
- `apps/desktop/runtime/config/patch-allowlist.json`

## Feedback References
- F-20260307-001

## Acceptance Criteria
- [ ] New eval case `files_in_allowlist`: parses file paths from diff headers, checks each against `patch-allowlist.json` patterns. Pass = all files match; fail = any file violates.
- [ ] New eval case `npm_validate_passes`: applies patch in a temp dir, runs `npm run validate` in `apps/desktop/`. Pass = exit code 0; fail = non-zero (stdout/stderr in details).
- [ ] Each eval case YAML gains an optional `blocking: true` field. Existing `patch_applies_cleanly` is updated to `blocking: true`.
- [ ] `_run_evals()` reads the blocking flag from each check result. If any blocking check fails, raises `ApplyError("eval_blocked", ...)` with structured failure details (check name, failure reason, output).
- [ ] Advisory failures continue to log to `artifact.log_text` without blocking apply.
- [ ] The structured failure details are sufficient for T-0091 (retry) to construct a useful retry prompt (check name + failure output + the failed diff).
- [ ] `uv run pytest` exits 0. New checks have unit tests.
- [ ] Existing `patch_applies_cleanly` continues to work as before but now in blocking mode.

## Dependencies / Sequencing
- Depends on: none
- Blocks: T-0091 (retry consumes structured eval failure results)

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Add `blocking` field to eval case YAML schema and update `patch_applies_cleanly` case
- [ ] Implement `files_in_allowlist` eval check + case YAML
- [ ] Implement `npm_validate_passes` eval check + case YAML
- [ ] Modify `_run_evals()` to enforce blocking policy (raise `ApplyError` on blocking failure)
- [ ] Add unit tests for new checks and blocking behavior
- [ ] Update `evals/run.py` output to include `blocking` flag per result

## Notes
- `npm_validate_passes` duplicates `_sandboxed_validate`. Once this check exists, `_sandboxed_validate` could be replaced by the eval framework. This refactoring is optional for M13.
- The eval harness output JSON should include per-check results with `{name, passed, blocking, details}` so downstream consumers (retry, logging) have structured data.

## Change Log
- 2026-03-07: Ticket created from M13 design spec §9 (rank 2).
