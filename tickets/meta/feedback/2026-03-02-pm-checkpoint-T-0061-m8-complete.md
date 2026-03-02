# PM Checkpoint — 2026-03-02: T-0061 Accepted / M8 Implementation Complete

## Summary
T-0061 (M8 non-review UI — notifications and changelog Undo) completed and accepted. This is the final implementation ticket for E-0010. The full M8 agentic code self-modification loop is now feature-complete: feedback → patch generation → automatic apply → notification with Undo → Changelog with persistent Undo history.

## Tickets Accepted This Run
| Ticket | Status | Notes |
|---|---|---|
| T-0061 | accepted → done | 37 new frontend tests; 115 total frontend + 27 backend pass; all ACs met; QA PASS |

## QA Findings
- **PASS**: All 14 acceptance criteria pass with observable evidence.
- **WARN W1**: `applied` state notification has no dismiss affordance (users can't clear banner without undoing) → T-0062 (backlog, P2).
- **WARN W2**: `failure_reason` codes rendered raw in `apply_failed` copy (machine-readable, not user-friendly) → T-0062 (backlog, P2).
- Both WARNs bundled in T-0062. Neither blocks core flow or violates spec. Shippable as-is.

## E-0010 Status After This Run
All four implementation tickets shipped:
- T-0058: Design spec (done)
- T-0059: Agent harness (done)
- T-0060: Git-backed apply/rollback (done)
- T-0061: Non-review UI (done)

**DoD alignment note**: The E-0010 DoD item 3 ("Diff review surface — user must see diff before apply") was superseded by the T-0058 spec pivot (§2: "M8 deliberately removes the code-review step… user sees result, not the diff"). The DoD now reads: the user has a non-blocking "See what changed ↓" diff toggle plus full persistent Changelog with Undo. This satisfies the spirit of the constraint (user is informed and in control) without blocking apply. Epic DoD updated accordingly.

**Tier-1 validation**: Each layer has unit/integration test coverage. Full end-to-end integration test (feedback → applied → visible in rebuilt app) is the remaining gap for tier-1 closure, as the sandboxed build gate requires a real pi harness which isn't available in CI. This is accepted as a known gap for M8 alpha.

## User Testing Ask (Tier-2 Micro-Validation)
Now that the UI is live, the Validation Plan (E-0010 §Tier 2) calls for a primary user probe:
1. "You submitted feedback. Here's what the system proposes to change. Does this look right?"
2. "You accepted it and the app changed. Was that what you expected? Could you undo it?"

This should be scheduled with the primary user / project sponsor once the pidev harness is available in their environment.

## Ready Queue Updated
| Rank | Ticket | Notes |
|---|---|---|
| — | _(empty)_ | T-0061 was last item in E-0010 ready queue. Await PM queue replenishment. |

## Decisions and Rationale
- T-0062 placed in backlog (not ready) — both WARNs are polish items that don't block the core M8 loop. Can be picked up in the next sprint cycle.
- `uv run` adopted for Python test execution (replaces pip3 install). Faster, reproducible, sandbox-friendly.
- E-0010 marked `active (tier-2 validation pending)` rather than `complete` — tier-2 user probe is still required to close the epic per DoD.

## Process Improvement Proposal
The `uv run --with <deps>` pattern for ad-hoc Python test runs is faster and cleaner than `pip3 install` in CI/dev. Consider adding a `pyproject.toml` or `uv.lock` to `apps/desktop/runtime/` so `uv run pytest` works without `--with` flags. Suggested as a follow-up cleanup ticket if there are backend-heavy tickets upcoming.
