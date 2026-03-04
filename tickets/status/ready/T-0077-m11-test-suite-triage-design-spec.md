# T-0077: M11 Design Spec — Test Suite Failure Triage and Eval Harness Groundwork

## Metadata
- ID: T-0077
- Status: ready
- Priority: P1
- Type: spec
- Area: core
- Epic: E-0014
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

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
- [ ] Root-cause table is populated in the Evidence section with a row for each of the 3 failing test files.
- [ ] Each row contains: failure type, root cause (specific — not just "unknown"), proposed fix strategy, and effort estimate.
- [ ] Implementation ticket list in Notes section contains at least one ticket per failing file (may batch two if tightly coupled).
- [ ] Notes section either contains an eval harness design sketch or a documented decision to defer it.
- [ ] No production source code was modified by this ticket.

## Dependencies / Sequencing
- Depends on: none (all prerequisite work is done; T-0074–T-0076 complete).
- Blocks: T-0078+ (implementation tickets, to be created by PM after this triage).
- Sequencing: must complete before any M11 implementation tickets.

## Evidence (Verification)
- Tests run: none (spec ticket; doc review only).
- Manual checks performed: (to be filled by implementation agent)
- Doc review: PM to verify root-cause table and implementation ticket list are present and actionable.

## Subtasks
- [ ] Read `test_chat.py` and run to capture failure
- [ ] Read `test_proposals.py` and run to capture failure
- [ ] Read `test_apply_rollback.py` and run to capture failure
- [ ] Populate root-cause table in Evidence
- [ ] Propose M11 implementation ticket list in Notes
- [ ] Sketch optional eval harness design in Notes

## Notes
Implementation ticket list (to be filled by agent completing this ticket):

<!-- Placeholder — agent fill in after triage -->

## Change Log
- 2026-03-04: Ticket created by PM run (M11 scoping / queue replenishment).
