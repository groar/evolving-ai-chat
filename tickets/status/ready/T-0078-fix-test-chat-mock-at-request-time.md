# T-0078: Fix test_chat.py — Apply Chat Mock at Request Time

## Metadata
- ID: T-0078
- Status: ready
- Priority: P1
- Type: bug
- Area: core
- Epic: E-0014
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
`test_chat.py` currently fails with `AssertionError: 502 != 200` on all chat-endpoint tests. Root cause (from T-0077 triage): the test patches `runtime.main.chat_router.chat`, but the mock is not applied at request time when `TestClient` processes the request — the real adapter is invoked, raises an exception, and the FastAPI error handler returns 502. Fix by patching at the correct point of use (e.g. via FastAPI `dependency_overrides` or by patching the underlying adapter directly so all code paths see the test double) and verify all existing chat tests pass.

## Context
- T-0077 (M11 triage) identified the exact failure mode; this ticket implements the fix.
- No new behavior is introduced; the goal is test isolation, not production changes.
- Effort estimate from triage: M (1–3 h).

## References
- `apps/desktop/runtime/test_chat.py`
- `apps/desktop/runtime/main.py` (TestClient is created against this app)
- `apps/desktop/runtime/agent/` (OpenAI adapter used by chat router)
- T-0077 (root-cause table), E-0014 (M11 epic)

## Acceptance Criteria
- [ ] `uv run pytest runtime/test_chat.py -v` exits 0 from `apps/desktop/`.
- [ ] All tests in `test_chat.py` that were previously failing with 502 now pass.
- [ ] No live network calls are made during the test run (mock fully isolates the adapter).
- [ ] Production code in `main.py` or the chat router is only changed if required to allow clean dependency injection; no behavior changes for end users.
- [ ] `uv run pytest runtime/test_proposals.py runtime/test_apply_rollback.py` is not broken by this change (no cross-test regressions).

## Dependencies / Sequencing
- Depends on: T-0077 (done — root-cause table and fix strategy available).
- Blocks: none (T-0079 and T-0080 are independent).
- Sequencing notes: T-0078, T-0079, T-0080 can be executed in any order; recommend T-0079 first (smallest effort) if parallelism is not available, but T-0078 first if M (chat) risk is highest priority.

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Read `test_chat.py` and `main.py` to confirm mock injection point
- [ ] Apply fix (dependency_overrides or correct patch target)
- [ ] Run `uv run pytest runtime/test_chat.py -v` — all pass
- [ ] Run full `uv run pytest runtime/` — no new failures introduced

## Notes
Fix strategy from T-0077: patch at point of use. Options:
1. Use FastAPI `app.dependency_overrides` to inject a fake chat function before the TestClient is created.
2. Patch the adapter (e.g. `openai.AsyncOpenAI` or the relevant adapter method) at the source so no real HTTP call is made.
3. If the router creates its own client at import time, restructure to accept a dependency-injectable factory.
Prefer option 1 (dependency_overrides) as it is cleanest and avoids touching production code structure.

## Change Log
- 2026-03-04: Ticket created by PM run (M11 queue replenishment from T-0077 triage output).
