# E-0015: M12 — Lightweight Eval Harness

## Metadata
- ID: E-0015
- Milestone: M12
- Status: in-progress
- Priority: P1
- Owner: ai-agent
- Created: 2026-03-05
- Updated: 2026-03-05

## Goal
Build a minimal, runnable eval harness (`evals/`) that scores agent-proposed patches against at least one deterministic behavior check. This closes the last "known gap" in STATUS.md (no eval harness) and provides an automated quality gate that the self-modification loop can use to validate patch proposals before acceptance.

## Problem Statement
After M11, `uv run pytest` exits 0 and the CI baseline is green. However, the self-modification loop still lacks a mechanism to verify that a proposed patch preserves intended behavior beyond unit tests. A lightweight eval harness — one that can accept a patch diff and run deterministic checks against it — is the final missing piece for a trustworthy end-to-end loop.

The design sketch from T-0077 Notes defines the initial architecture:
- `evals/` directory with `run.py` entry point, `cases/` (YAML/JSON behavior cases), `checks/` (one module per check type).
- First check type: `patch_applies_cleanly` — verifies a patch can be applied without error.
- Integration: standalone script (`uv run python evals/run.py`) that exits 0 iff all checks pass; optionally called by `patch_agent.py` during validation.

## Definition of Done
- [ ] T-0081 done: design spec confirms architecture, case format, first check type, and integration approach with `patch_agent.py`.
- [ ] T-0082+: `evals/` directory exists with a working entry point and at least one deterministic behavior check.
- [ ] `uv run python evals/run.py --case evals/cases/example.yaml` (or equivalent) exits 0 on a valid patch and non-zero on an invalid/failing patch.
- [ ] Eval harness is documented in STATUS.md "Known gaps" (item removed) and in `docs/` (optional).
- [ ] `uv run pytest` continues to exit 0 (no regressions from eval harness additions).

## Implementation Tickets
| Ticket | Title | Status |
|--------|--------|--------|
| T-0081 | M12 design spec — eval harness architecture and integration | ready |

## Feedback References
- T-0077 Notes: eval harness design sketch (deferred from M11).
- STATUS.md "Known gaps": "No eval harness — lightweight prompt/behavior eval runner to gate agent-proposed changes automatically."

## Change Log
- 2026-03-05: Epic created. M11 deferred the eval harness stub; M12 picks it up. T-0081 (design spec) created as first ready ticket.
