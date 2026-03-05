# PM Checkpoint — T-0080 Acceptance

**Date**: 2026-03-05  
**Type**: Post-QA acceptance  

## What was accepted

**T-0080: Fix test_apply_rollback.py — Git Operations in CI/Sandbox** — confirmed accepted in ticket and treated as moved from `review/` to `done/`.

Shippable because:

- Git-dependent tests in `test_apply_rollback.py` are now gated behind an explicit `RUN_INTEGRATION_TESTS=1` flag and marked as integration tests, so default `uv run pytest` in sandbox/CI exits 0 without `.git/hooks` permission errors.
- Integration coverage remains available when a real git environment is present, preserving confidence in `_init_git_repo` behavior without requiring it for every run.
- QA checkpoint `2026-03-05-qa-T-0080.md` recorded: default run passes with integration tests skipped and a clear skip message; targeted integration run passes when enabled.
- The change is confined to tests; production apply/rollback logic in `agent/patch_agent.py` is unchanged, aligning with M11’s goal of restoring a trustworthy green baseline without altering runtime behavior.

## Queue / board update

- T-0080 is treated as accepted and in `tickets/status/done/` alongside T-0078 and T-0079.
- All three M11 implementation tickets (T-0078, T-0079, T-0080) are now complete; `tickets/status/ready/ORDER.md` has been updated to reflect an empty ready queue pending the next PM replenishment from backlog.

## Validation testing

- Deterministic validation only; no tier-2/3 external user validation required (`Area: core`, test harness change only).
- QA evidence for T-0080 plus T-0078/T-0079 together demonstrates that the previously failing runtime test files now pass or are cleanly skipped under documented conditions, moving M11 close to its green-baseline goal.

## PM process note

- For future test suites that depend on external tools (like git), prefer explicit integration markers + env flags over relying on CI filesystem behavior; this keeps default runs fast and reliable while preserving deeper coverage when needed.

## Suggested commit message (PM perspective)

```text
test(m11): finalize git-dependent apply/rollback tests and accept T-0080
```

