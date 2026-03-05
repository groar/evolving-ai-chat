# T-0080: Fix test_apply_rollback.py — Git Operations in CI/Sandbox

## Metadata
- ID: T-0080
- Status: ready
- Priority: P1
- Type: bug
- Area: core
- Epic: E-0014
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
`test_apply_rollback.py` fails with `CalledProcessError: git init exit 1` and stderr `.git/hooks/: Operation not permitted` when run under the Cursor IDE sandbox or CI environments that block filesystem operations on `.git/hooks/`. Root cause (from T-0077 triage): the test calls real `subprocess.run(["git", "init", ...])` via `_init_git_repo`, which the sandbox blocks at hooks creation. Fix by either (a) mocking git subprocess calls for unit tests, (b) setting `git init --template=` (empty template dir) so hooks are not created, or (c) marking git-dependent tests with `@pytest.mark.integration` and skipping them unless `RUN_INTEGRATION_TESTS=1` is set. Document which tests require a real git environment and how to run them.

## Context
- T-0077 (M11 triage) pinpointed the root cause; this ticket implements the fix.
- Effort estimate from triage: M (1–3 h).
- This fix must not break the production apply/rollback logic in `agent/patch_agent.py` — only test isolation changes.

## References
- `apps/desktop/runtime/test_apply_rollback.py`
- `apps/desktop/runtime/agent/patch_agent.py` (`_init_git_repo` function)
- T-0077 (root-cause table), E-0014 (M11 epic)

## Design Spec

### Goals
- Make `uv run pytest runtime/test_apply_rollback.py` pass (or controllably skip integration tests) without requiring a real git environment.
- Preserve full integration-test coverage for environments where git is available.

### Non-Goals
- Changing production apply/rollback behavior.
- Removing all git coverage from the test suite (integration tests should remain, just skippable).

### Rules and State Transitions
- Unit tests: mock `subprocess.run` so no real git calls are made; test logic/state transitions only.
- Integration tests: remain as-is but are skipped unless `RUN_INTEGRATION_TESTS=1` env var is set (or `@pytest.mark.integration` marker + `pytest -m integration`).
- Alternatively, if `git init --template=` (empty template) avoids the `.git/hooks/` restriction entirely, prefer that simpler fix.

### Scope Bounds
- Changes confined to `test_apply_rollback.py` and, if needed, a `conftest.py` fixture.
- No changes to production source files unless required to enable clean dependency injection for git subprocess calls.

### Edge Cases / Failure Modes
| Scenario | Handling |
|---|---|
| `--template=` fix does not work in sandbox | Fall back to mock strategy or integration marker. |
| Mocking makes tests meaningless (only mocks, no real behavior) | Preserve at least one integration test with the marker; document it. |

### Validation Plan
- `uv run pytest runtime/test_apply_rollback.py -v` exits 0 in a sandboxed/CI environment.
- `RUN_INTEGRATION_TESTS=1 uv run pytest runtime/test_apply_rollback.py -v -m integration` passes in an environment with real git available.

## Acceptance Criteria
- [ ] `uv run pytest runtime/test_apply_rollback.py -v` exits 0 in the sandbox/Cursor environment (no `Operation not permitted` error).
- [ ] If integration markers are used, `uv run pytest runtime/test_apply_rollback.py -v` (without the marker flag) skips integration tests with an explicit skip message explaining how to run them.
- [ ] A brief comment or docstring in `test_apply_rollback.py` documents the environment requirement for integration tests.
- [ ] No production code behavior is changed.
- [ ] `uv run pytest runtime/test_chat.py runtime/test_proposals.py` is not broken by this change.

## Dependencies / Sequencing
- Depends on: T-0077 (done).
- Blocks: none (T-0078 and T-0079 are independent).
- Sequencing notes: recommend this as last pickup in the batch since it has the most design options to evaluate.

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Read `test_apply_rollback.py` and `patch_agent.py` to understand `_init_git_repo` usage
- [ ] Try `git init --template=` in a test fixture first (simplest fix)
- [ ] If that fails in sandbox, apply mock strategy or integration marker approach
- [ ] Run `uv run pytest runtime/test_apply_rollback.py -v` — exits 0
- [ ] Run full `uv run pytest runtime/` — no new failures introduced
- [ ] Document integration test run requirements

## Notes
Fix strategy priority order from T-0077:
1. **`--template=` flag**: pass `["git", "init", "--template=", ...]` to skip hooks directory creation. Simplest; try first.
2. **Mock subprocess**: patch `subprocess.run` in unit tests to avoid any real git call. More work but more portable.
3. **Integration marker**: annotate tests that need real git with `@pytest.mark.integration` and add `conftest.py` logic to skip unless `RUN_INTEGRATION_TESTS=1`. Keeps the tests runnable in CI-with-git and sandboxed environments.

## Change Log
- 2026-03-04: Ticket created by PM run (M11 queue replenishment from T-0077 triage output).
