# T-0077: M11 Design Spec — Test Suite Failure Triage and Eval Harness Groundwork

## Metadata
- ID: T-0077
- Status: done
- Priority: P1
- Type: spec
- Area: core
- Epic: E-0014
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04 (triage completed)

## Summary
Investigate and document the root causes of the three pre-existing pytest failures in the desktop runtime test suite, then produce a concrete implementation plan (scoped tickets) for fixing each failure. As a secondary output, draft a minimal eval harness design so M11 can optionally lay that groundwork alongside the test fixes.

This is a spec/triage ticket: the implementation agent reads the failing tests, identifies root causes, and outputs: (a) a root-cause table, (b) a fix plan per file, (c) an M11 implementation ticket list, and (d) an optional eval harness design sketch. No production code changes are made in this ticket.

## Context
After M10, the agentic self-modification loop is fully functional. However, the runtime test suite has three persistent failures that were deferred during M8–M10:

1. **`test_chat.py`** — HTTP 502 errors: the test likely calls a live OpenAI endpoint (or the runtime is not properly mocked) and gets a 502 from the server. Root cause: missing mock/fixture isolation.
2. **`test_proposals.py`** — `AttributeError` on `sqlite3.Row`: a column access on a Row object fails — possible schema drift (a column was renamed/removed in a migration) or incorrect cursor factory configuration.
3. **`test_apply_rollback.py`** — `git init` sandbox restriction: the test calls `git init` in a temp directory and the sandbox blocks it. Root cause: git operations need to be mocked or run in an explicit temp-dir fixture outside sandbox constraints.

These failures mean `uv run pytest` never exits 0, which undermines the CI trustworthiness for the self-modification loop.

## References
- `apps/desktop/runtime/test_chat.py`
- `apps/desktop/runtime/test_proposals.py`
- `apps/desktop/runtime/test_apply_rollback.py`
- QA checkpoint `tickets/meta/qa/2026-03-04-qa-T-0076.md` (pre-existing failures noted)
- `tickets/meta/epics/E-0014-m11-test-suite-green-baseline.md`
- `STATUS.md` — Known gaps: pre-existing test failures, eval harness

## Design Spec

### Goals
- Understand the exact failure mode of each of the 3 failing test files.
- Produce a concrete, scoped fix plan that can be implemented ticket-by-ticket.
- Optionally, design a minimal eval harness stub that can score one agent patch proposal.

### Non-Goals
- Fixing the failures in this ticket (triage only; fixes go in T-0078+).
- Building a full eval pipeline or automated CI system.
- Changing any production source code.

### Investigation Protocol
For each failing test file, the implementation agent should:
1. Read the test file to understand what it tests and how it runs.
2. Run `uv run pytest <file> -v 2>&1 | head -60` to capture the actual failure message.
3. Identify root cause (mock gap, schema drift, git sandbox restriction, etc.).
4. Propose a minimal fix strategy (mock injection, schema fix, fixture change).
5. Estimate effort: S (< 1h), M (1–3h), L (3–8h).

### Output Requirements
The implementation agent completing this ticket must produce:

1. **Root-cause table** in the ticket Evidence section:
   | Test file | Failure type | Root cause | Fix strategy | Effort |
   |---|---|---|---|---|

2. **Implementation ticket list** in the ticket Notes section: proposed T-0078, T-0079, T-0080 (or similar) with one-line summaries, ready to be created as ticket files by PM.

3. **Eval harness design sketch** (optional; in Notes): describe the minimum viable `evals/` directory structure, one behavior check format, and how it integrates with `uv run pytest` or a separate `uv run python evals/run.py` entry point.

### Scope Bounds
- Read: `apps/desktop/runtime/test_chat.py`, `test_proposals.py`, `test_apply_rollback.py`, and any source files they import.
- Run: `uv run pytest` with individual file targeting.
- Write: only this ticket file (Evidence, Notes sections).
- No production source changes.

### Edge Cases / Failure Modes
| Scenario | Handling |
|---|---|
| Failure is non-deterministic (flaky) | Document as flaky; propose a retry fixture or isolation improvement. |
| Fix would require changing the production API surface | Flag as scope-escalation risk; PM decides whether to include in M11 or defer. |
| Eval harness design is unclear | Skip the eval harness output; note "deferred to M12" in the Notes section. |

### Validation Plan
- This is a triage/spec ticket: done when the root-cause table and implementation ticket list are recorded in Evidence/Notes.
- No tests needed for a spec ticket; doc review suffices.

## Acceptance Criteria
- [x] Root-cause table is populated in the Evidence section with a row for each of the 3 failing test files.
- [x] Each row contains: failure type, root cause (specific — not just "unknown"), proposed fix strategy, and effort estimate.
- [x] Implementation ticket list in Notes section contains at least one ticket per failing file (may batch two if tightly coupled).
- [x] Notes section either contains an eval harness design sketch or a documented decision to defer it.
- [x] No production source code was modified by this ticket.

## Dependencies / Sequencing
- Depends on: none (all prerequisite work is done; T-0074–T-0076 complete).
- Blocks: T-0078+ (implementation tickets, to be created by PM after this triage).
- Sequencing: must complete before any M11 implementation tickets.

## Evidence (Verification)
- Tests run: none (spec ticket; doc review only).
- Manual checks performed:
  - Ran `uv run --with-requirements runtime/requirements.txt python -m pytest runtime/test_chat.py runtime/test_proposals.py runtime/test_apply_rollback.py -v` from `apps/desktop/`; captured failure output for each file.
  - **test_chat.py**: Multiple tests fail with `AssertionError: 502 != 200`. The endpoint returns 502 because unhandled exceptions in `main.py` are converted to 502 (model_error). The tests patch `runtime.main.chat_router.chat`, but the mock is not applied at request time when TestClient runs the app, so the real adapter is invoked (or an exception is raised) and the handler returns 502.
  - **test_proposals.py**: Failures with `AttributeError: 'sqlite3.Row' object has no attribute 'get'` in `storage.py` line 806: `row.get("improvement_class", "")`. Code assumes row is dict-like; `sqlite3.Row` does not implement `.get()`.
  - **test_apply_rollback.py**: Failures in `_init_git_repo`: `git init` fails with `Operation not permitted` on `.git/hooks/` when run under sandbox (e.g. Cursor/CI). stderr: `.../.git/hooks/: Operation not permitted`.
- Doc review: PM to verify root-cause table and implementation ticket list are present and actionable.

### Root-cause table
| Test file | Failure type | Root cause | Fix strategy | Effort |
|-----------|--------------|------------|--------------|--------|
| test_chat.py | HTTP 502 (AssertionError: 502 != 200) | Mock of `runtime.main.chat_router.chat` is not applied when the FastAPI TestClient handles the request; real adapter runs or exception is caught and returned as 502. | Patch at point of use: ensure the app uses the patched router (e.g. patch before client is created, or use FastAPI `dependency_overrides` to inject a fake chat dependency). Alternatively patch the adapter used by the router so all code paths see the mock. | M |
| test_proposals.py | AttributeError: 'sqlite3.Row' object has no attribute 'get' | In `storage.py` (e.g. line 806) code uses `row.get("improvement_class", "")`. `sqlite3.Row` supports only indexing (`row["key"]`), not `.get()`. | Replace `row.get("improvement_class", "")` (and any other `row.get(...)`) with dict-like access: e.g. `row["improvement_class"] if "improvement_class" in row.keys() else ""` or a small helper that wraps Row for optional keys. Audit storage for all `row.get` on sqlite3.Row. | S |
| test_apply_rollback.py | CalledProcessError: git init exit 1; stderr `.git/hooks/: Operation not permitted` | Sandbox (Cursor/CI) blocks creation of `.git/hooks/` during `git init`. Tests use real `subprocess.run(["git", "init", ...])` in `_init_git_repo`. | Use a temp dir outside the sandbox-restricted tree for git repos, or mock `subprocess.run` / git operations in unit tests and keep integration tests that need real git in a separate marker (e.g. `@pytest.mark.integration`) run only when git is allowed; or configure git to skip hooks in test (e.g. `--template=` or `init.templateDir` empty). | M |

## Subtasks
- [x] Read `test_chat.py` and run to capture failure
- [x] Read `test_proposals.py` and run to capture failure
- [x] Read `test_apply_rollback.py` and run to capture failure
- [x] Populate root-cause table in Evidence
- [x] Propose M11 implementation ticket list in Notes
- [x] Sketch optional eval harness design in Notes

## Notes
Implementation ticket list (to be filled by agent completing this ticket):

- **T-0078** — Fix test_chat.py: apply chat mock at request time (dependency_overrides or correct patch target so POST /chat uses test double; ensure 502 goes away and all chat tests pass). Effort: M.
- **T-0079** — Fix test_proposals.py: replace sqlite3.Row.get() usage in storage with Row-safe access for optional columns (e.g. improvement_class). Effort: S.
- **T-0080** — Fix test_apply_rollback.py: make git-dependent tests pass in CI/sandbox (mock git for unit tests and/or allow real git for integration tests via env or fixture; document run requirements). Effort: M.

Eval harness design sketch (optional M11 groundwork):

- **Directory**: `apps/desktop/runtime/evals/` (or repo-root `evals/` if shared across apps).
- **Layout**: `evals/run.py` (entry point), `evals/cases/` (YAML or JSON behavior cases), `evals/checks/` (one module per check type, e.g. "patch_applies_cleanly", "prompt_contains_instruction").
- **One behavior check format**: Each case file defines: `id`, `description`, `patch_ref` (or inline diff), `expect`: list of checks (e.g. `{ "type": "patch_applies", "repo_fixture": "minimal_ts" }`). Runner applies patch (or runs agent proposal), runs checks, returns pass/fail per case.
- **Integration**: Either (a) `uv run pytest evals/` with pytest-collected case files and a fixture that runs the runner, or (b) `uv run python evals/run.py --case evals/cases/foo.yaml` for a standalone script that exits 0 iff all checks pass. Prefer (b) for M11 stub so CI can run `uv run python evals/run.py` without tying to pytest lifecycle. Eval harness can be expanded in M12.

## Change Log
- 2026-03-04: Ticket created by PM run (M11 scoping / queue replenishment).
- 2026-03-04: Triage completed. Root-cause table, implementation tickets T-0078–T-0080, and eval harness sketch added. No production code changed.
- 2026-03-04: PM acceptance (doc review). Spec ticket; no QA run. Accepted and moved to done.
