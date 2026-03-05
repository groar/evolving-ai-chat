# E-0014: M11 — Test Suite Green Baseline

## Metadata
- ID: E-0014
- Milestone: M11
- Status: complete
- Priority: P1
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-05

## Goal
Restore a reliable green test baseline across the desktop runtime test suite so the self-modification loop has a trustworthy CI anchor. The three pre-existing pytest failures (`test_chat.py`, `test_proposals.py`, `test_apply_rollback.py`) were deferred during M8–M10 because they were orthogonal to the feature work; they must now be addressed before the loop ships changes with confidence.

Secondary goal: lay the groundwork for a lightweight eval harness that can gate agent-proposed patches by behavior/prompt correctness — addressing the last "known gap" in STATUS.md.

## Problem Statement
After M10, the self-modification loop is end-to-end functional. However, the CI baseline is not green:
- `test_chat.py`: HTTP 502 failures — likely the OpenAI adapter or runtime needs mock isolation in tests.
- `test_proposals.py`: `AttributeError` on `sqlite3.Row` — likely a schema migration drift or cursor-handling bug introduced during storage refactors.
- `test_apply_rollback.py`: `git init` restricted in sandbox — tests may need to mock git operations or use a temp repo fixture.

These failures mean a developer (or agent) cannot tell at a glance whether a code change introduced a regression. That erodes trust in the automated loop.

## Definition of Done
- [x] T-0077 done: triage report produced; root causes identified for all 3 failures; M11 implementation tickets scoped.
- [x] T-0078+: All three failing test files pass (or are cleanly skipped as documented integration tests) under `uv run pytest` with a clean fixture strategy.
- [x] Frontend: `npm run validate` continues to pass (no regressions). Verified by inspection 2026-03-05: M11 changes were confined to Python test files (`apps/desktop/runtime/tests/`); no frontend source was modified; frontend validation is unaffected.
- [x] Tier-1 validation: `uv run pytest` exits with 0 (excluding any test explicitly marked `@pytest.mark.skip` with a documented reason). QA checkpoints 2026-03-05-qa-T-0078/T-0079/T-0080 confirm all three previously failing test files now pass or are cleanly skipped.
- [ ] Optional: lightweight eval harness stub (`evals/`) — **deferred to M12 (E-0015)**. Design sketch exists in T-0077 Notes; implementation scoped in T-0081.

## Implementation Tickets
| Ticket | Title | Status |
|--------|--------|--------|
| T-0077 | M11 design spec — test failure triage + eval harness groundwork | done |
| T-0078 | Fix test_chat.py (chat mock at request time) | done |
| T-0079 | Fix test_proposals.py (sqlite3.Row.get) | done |
| T-0080 | Fix test_apply_rollback.py (git/sandbox) | done |

## Feedback References
- QA checkpoint `2026-03-04-qa-T-0076.md`: notes 3 pre-existing failures.
- STATUS.md "Known gaps" section (pre-existing test failures, eval harness).
- E-0013 DoD item: "Tier-1 deterministic validation: tests cover live-apply signal and scope enforcement" — partially met (component tests pass; E2E deferred; broader test suite not green).

## Change Log
- 2026-03-04: Epic created. T-0077 (design spec / triage) added as first ready ticket.
- 2026-03-04: T-0077 completed; root-cause table and T-0078–T-0080 implementation list produced. PM to create T-0078–T-0080 and replenish ready queue.
- 2026-03-04: PM run created T-0078, T-0079, T-0080 ticket files and added to ready queue (ORDER.md updated). Epic status updated to in-progress.
- 2026-03-05: T-0078, T-0079, and T-0080 implemented, QA validated, and accepted into `done/`. Frontend DoD item verified by inspection (no frontend changes in M11). Eval harness deferred to M12 (E-0015 / T-0081). Epic closed as complete. **Unlocks**: M12 (E-0015) can now build the eval harness on a trustworthy green CI baseline, enabling automated patch quality gates in the self-modification loop.
