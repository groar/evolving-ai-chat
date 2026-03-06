# T-0082: Eval Harness Core + First Check (`patch_applies_cleanly`)

## Metadata
- ID: T-0082
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0015
- Owner: ai-agent
- Created: 2026-03-05
- Updated: 2026-03-06

## Summary
Build the standalone eval harness at `apps/desktop/runtime/evals/` with a working entry point (`run.py`), YAML case loader, check registry, and the first deterministic check (`patch_applies_cleanly`). Include two built-in cases (one expecting pass, one expecting fail) with fixture diffs. Add `pyyaml` to `requirements.txt`. When complete, `uv run python apps/desktop/runtime/evals/run.py` should exit 0 with both cases matching their expectations.

## Context
- T-0081 (design spec) defines the full architecture, entry point contract, case schema, check module contract, and `patch_applies_cleanly` algorithm.
- This is the foundational M12 ticket — T-0083 (integration) and T-0084 (tests) depend on it.
- The harness mirrors the production apply path: `patch -p1 --dry-run` with a `git apply --check` fallback.

## References
- T-0081: Design Spec (architecture, contracts, schemas)
- `apps/desktop/runtime/agent/patch_agent.py` — production apply path
- `apps/desktop/runtime/agent/apply_pipeline.py` — `_apply_patch()` uses `patch -p1`
- `tickets/meta/epics/E-0015-m12-eval-harness.md`

## Acceptance Criteria
- [x] `apps/desktop/runtime/evals/` directory exists with the structure from T-0081: `__init__.py`, `run.py`, `checks/__init__.py`, `checks/patch_applies_cleanly.py`, `cases/good_patch_applies.yaml`, `cases/bad_patch_applies.yaml`, `cases/fixtures/good.diff`, `cases/fixtures/bad.diff`.
- [x] `uv run python apps/desktop/runtime/evals/run.py` exits 0 with JSON stdout showing both cases matching expectations (good→pass, bad→fail).
- [x] `run.py` supports `--case`, `--patch-file`, `--repo-root`, and `--verbose` CLI arguments per T-0081 spec.
- [x] `CheckResult` dataclass and check registry are in `checks/__init__.py`; `patch_applies_cleanly` implements the algorithm from T-0081 (dry-run with `patch`, fallback to `git apply --check`).
- [x] `pyyaml` is added to `requirements.txt`.
- [x] `uv run pytest` (full suite) still exits 0 — no regressions.

## Dependencies / Sequencing
- Depends on: T-0081 (done)
- Blocks: T-0083 (integration), T-0084 (tests)

## Subtasks
- [x] Create `evals/` directory structure (`__init__.py`, `run.py`, `checks/`, `cases/`)
- [x] Implement `CheckResult` dataclass and check registry in `checks/__init__.py`
- [x] Implement `patch_applies_cleanly` check per T-0081 algorithm
- [x] Implement YAML case loader and `run.py` entry point with CLI args
- [x] Create fixture diffs (`good.diff`, `bad.diff`) and YAML case files
- [x] Add `pyyaml` to `requirements.txt`
- [x] Verify: `uv run python apps/desktop/runtime/evals/run.py` exits 0
- [x] Verify: `uv run pytest` exits 0

## Notes
- Effort estimate: M (medium).
- Case schema and entry point contract are fully defined in T-0081 Design Spec section.
- Exit codes: 0 = all match, 1 = mismatch, 2 = runner error.
- When `evals/cases/` is empty, `run.py` exits 0 with `total: 0` and a stderr message.

## Evidence
- `evals/` created: `__init__.py`, `run.py`, `checks/__init__.py`, `checks/result.py`, `checks/patch_applies_cleanly.py`, `cases/good_patch_applies.yaml`, `cases/bad_patch_applies.yaml`, `cases/fixtures/good.diff`, `cases/fixtures/bad.diff`. CheckResult lives in `checks/result.py` and is re-exported from `checks/__init__.py` to avoid circular imports.
- `uv run python apps/desktop/runtime/evals/run.py` exits 0; JSON stdout shows `total: 2`, `passed: 2`, good-patch-applies (expect pass) and bad-patch-applies (expect fail) both matched.
- CLI: `--case`, `--patch-file`, `--repo-root`, `--verbose` implemented. Empty cases dir exits 0 with `total: 0` and stderr message.
- PyYAML added to root `pyproject.toml` (and `apps/desktop/runtime/requirements.txt`); `uv run pytest` exits 0 (64 passed, 13 skipped).
- QA: 2026-03-06-qa-T-0082.md — automated and manual scenarios passed; no bugs.

## Change Log
- 2026-03-05: Ticket created by PM run (M12 queue replenishment from T-0081 spec).
- 2026-03-06: Implementation complete. Eval harness with run.py, patch_applies_cleanly check, two YAML cases and fixture diffs; PyYAML in pyproject.toml and runtime requirements.txt. Moved to review.
- 2026-03-06: QA passed. PM accepted; moved to done.
