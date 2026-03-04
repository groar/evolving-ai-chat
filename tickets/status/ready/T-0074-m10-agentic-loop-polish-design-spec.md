# T-0074: M10 Agentic Loop Polish — Design Spec

## Metadata
- ID: T-0074
- Status: ready
- Priority: P1
- Type: spec
- Area: core
- Epic: E-0013
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
Produce a concrete design spec that resolves the three open questions left over from M8 before any M10 implementation begins: (1) how accepted patches go live without a manual restart (live-apply / hot-reload), (2) what changes to the prompt strategy or allowlist will improve patch quality, and (3) how the agent's patch scope is formally enforced. The output is a filled `Design Spec` section in this ticket (or a linked `docs/m10-agentic-loop-polish.md` doc) plus the creation of scoped implementation tickets (T-0075+) ready for pickup.

## Context
- M8 shipped the end-to-end self-modification loop. Three questions were left open in STATUS.md:
  1. Build step: hot-reload on patch accept, or full Tauri rebuild? What is the minimum viable "change is live" signal?
  2. Patch scope guard: UI-only allowlist, prompt constraint, or both?
  3. Diff UI: unified diff view inline, or a dedicated "Proposed Changes" panel? (lower priority; include only if it blocks the other two)
- M8 tier-2 validation noted: "patch quality variable (model/prompt tuning can be a follow-up)."
- Solving these before implementation prevents wasted cycles and keeps patch quality on a clear trajectory.

## References
- `STATUS.md` — "Open Questions" section
- `docs/m8-code-loop.md` — M8 canonical spec
- `apps/desktop/runtime/agent/patch_agent.py` — current patch agent
- `apps/desktop/runtime/adapters/router.py` — current adapter routing
- `tickets/meta/epics/E-0013-m10-agentic-loop-polish.md`

## Acceptance Criteria
- [ ] Design spec resolves the live-apply question: chosen mechanism documented with rationale; alternative(s) noted with why they were ruled out.
- [ ] Design spec resolves the scope-guard question: UI-only allowlist, prompt constraint, or both; exact allowlist or constraint documented.
- [ ] Design spec resolves the patch-quality question: specific prompt changes, few-shot examples, or other mechanism identified; a measurable proxy for quality improvement defined (e.g., "acceptance rate" tracked in agent logs, or a heuristic eval).
- [ ] At least one scoped implementation ticket (T-0075+) created per resolved open question and moved to `tickets/status/ready/` with full DoR (acceptance criteria, scope bounds, sequencing).
- [ ] `tickets/status/ready/ORDER.md` updated with T-0075+ in correct pickup order.
- [ ] `tickets/meta/epics/E-0013-m10-agentic-loop-polish.md` updated with linked implementation tickets.

## Design Spec (to be filled by implementer)
Use this section — or a linked `docs/m10-agentic-loop-polish.md` — to record the spec before creating T-0075+.

- Goals:
- Non-goals:
- Rules and state transitions:
- User-facing feedback plan:
- Scope bounds:
- Edge cases / failure modes:
- Validation plan:

## Subtasks
- [ ] Review M8 code: `patch_agent.py`, `router.py`, and frontend patch acceptance flow
- [ ] Research hot-reload options for Tauri + React (Vite HMR vs full rebuild vs runtime JS swap)
- [ ] Decide and document scope guard mechanism
- [ ] Identify 2-3 concrete prompt quality improvements
- [ ] Write implementation tickets (T-0075+) with design spec inline
- [ ] Update E-0013 linked-tickets table
- [ ] Update ORDER.md

## Notes
This is a spec/research ticket. Implementation should not begin before this ticket is done. If the implementer discovers that one question requires a separate spike, split it into a subtask ticket and keep T-0074 as the coordinating spec.

## Change Log
- 2026-03-04: Ticket created by PM; placed in ready/ as first M10 pickup.
