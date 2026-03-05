# T-0081: M12 Design Spec — Eval Harness Architecture and Integration

## Metadata
- ID: T-0081
- Status: ready
- Priority: P1
- Type: spec
- Area: core
- Epic: E-0015
- Owner: ai-agent
- Created: 2026-03-05
- Updated: 2026-03-05

## Summary
Produce a concrete design spec for the M12 lightweight eval harness: confirm the `evals/` directory architecture, the first deterministic check type, the YAML/JSON case format, the entry point contract (`uv run python evals/run.py`), and how the harness integrates with `patch_agent.py`'s apply flow. Output: (a) a complete design spec in this ticket, and (b) an M12 implementation ticket list (T-0082+) ready for PM to create and queue.

This is a spec ticket: no production code is changed. The implementation agent reads the existing eval harness sketch from T-0077, inspects relevant files (`patch_agent.py`, the existing test/runtime structure), and resolves any open design questions before implementation begins.

## Context
- The eval harness is the last "known gap" in STATUS.md after M11.
- T-0077 Notes provides a design sketch: `evals/run.py`, `evals/cases/`, `evals/checks/`, a YAML case format, and a preferred standalone entry point (`uv run python evals/run.py`).
- The harness does not need to be comprehensive in M12 — one working deterministic check (e.g., `patch_applies_cleanly`) is sufficient to prove the pattern and unblock future checks.
- Integration with `patch_agent.py` should be lightweight: run evals after `validate_patch` and before `apply_patch`; if evals fail, treat as validation failure.

## References
- T-0077 Notes: eval harness design sketch
- `apps/desktop/runtime/agent/patch_agent.py` — apply/validate flow
- `apps/desktop/runtime/` — existing directory structure
- `STATUS.md` — "No eval harness" known gap
- `tickets/meta/epics/E-0015-m12-eval-harness.md`

## Design Spec

### Goals
- Define the `evals/` directory layout (location, modules, case format).
- Define the entry point contract: inputs, outputs, exit codes.
- Define the first check type and case schema.
- Define the integration hook in `patch_agent.py` (where evals run, how failures are reported).
- Produce a scoped M12 implementation ticket list.

### Non-Goals
- Building a full CI pipeline or multi-case eval suite in M12.
- Prompt/LLM-based scoring (deterministic only in M12).
- Changing `patch_agent.py` apply/rollback logic beyond adding one optional eval call.

### Open Design Questions (resolve in this spec)
1. **Location**: `apps/desktop/runtime/evals/` (co-located with runtime) vs. repo-root `evals/`? Recommend co-located with runtime since all current tooling lives there.
2. **Case format**: YAML vs. JSON? Recommend YAML (more readable, easy to hand-edit).
3. **First check type**: `patch_applies_cleanly` (does `git apply --check` succeed?) or a simpler file-level check? Confirm with reference to how `patch_agent.py` applies patches.
4. **Integration mode**: hard gate (eval failure = patch rejected) vs. advisory (eval failure = warning, user can still accept)? Recommend advisory for M12 (preserves existing flow; gate can be added in M13+).
5. **Test coverage**: pytest fixture that runs `run.py` against a known-good and known-bad fixture patch? Or separate test file?

### Scope Bounds
- Read: `patch_agent.py`, `apps/desktop/runtime/` directory layout, T-0077 Notes.
- Write: only this ticket file (Design Spec section, Evidence, Notes/implementation ticket list).
- No production code changes.

### Edge Cases / Failure Modes
| Scenario | Handling |
|---|---|
| `evals/cases/` is empty | `run.py` exits 0 with "no cases found, skipping" message. |
| A check module raises an unhandled exception | `run.py` exits 1 with the error traceback. |
| `git apply --check` is not available in environment | Document as known limitation; skip check gracefully with a warning. |
| `patch_agent.py` integration: evals fail | Report as advisory warning in validation result; do not auto-reject in M12. |

### Validation Plan
- Spec ticket: done when Design Spec and implementation ticket list are recorded in Evidence/Notes.
- No QA run needed; doc review by PM suffices.
- Implementation tickets (T-0082+) will carry their own acceptance criteria and deterministic test coverage.

## Acceptance Criteria
- [ ] Design Spec section is fully populated: architecture, case format, entry point contract, first check type, integration approach, open questions resolved.
- [ ] Implementation ticket list is in the Notes section with at least one ticket per major deliverable (entry point + first check, integration hook, test coverage).
- [ ] No production source code was modified by this ticket.
- [ ] Notes section either contains a concrete eval harness design or documents a decision to narrow scope further (with rationale).

## Dependencies / Sequencing
- Depends on: T-0077 (eval sketch, already done), T-0078–T-0080 (green test baseline, done).
- Blocks: T-0082+ (M12 implementation tickets).
- Sequencing: must complete before any M12 implementation tickets.

## Evidence (Verification)
- Doc review: PM to verify Design Spec and implementation ticket list are present and actionable.

## Notes
Implementation ticket list (to be filled by agent completing this ticket).

## Change Log
- 2026-03-05: Ticket created by PM run (M12 scoping; eval harness deferred from M11/T-0077).
