# E-0007: M6 — First Agent-Proposed Change from Real Usage

## Metadata
- ID: E-0007
- Status: active
- Owner: pm-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Goal
Ship the first agent-proposed change driven by real usage signal. The system observes a concrete pattern (explicit feedback or implicit friction), generates a proposal artifact, runs validation, and the user accepts — landing a real improvement. This validates the product thesis: the observe-propose-validate loop can deliver value.

## Rationale
- M5 (E-0006) tier-3 validation completed: base chat is adequate for daily use; proceed to self-evolution.
- M1 (E-0002) built the infrastructure: feedback capture, proposal artifact, settings panel, changelog. The loop exists but has not yet produced a change from real usage.
- M6 is the moment the "evolving" promise becomes tangible — user expects "learns & improves from my feedback and usage" (tier-3 verbatim).

## Definition of Done
- At least one concrete change is proposed by the system (runtime/agent) from real usage signal (explicit feedback or defined implicit trigger).
- Proposal flows through existing pipeline: proposal artifact → validation → user accept/reject → changelog (if accepted).
- The change lands and is visible to the user (e.g. UI tweak, copy change, or one narrow improvement class).
- Deterministic verification: smoke flow from feedback/signal → proposal → accept → changelog.

## Validation Plan
- Tier 1 (deterministic): Smoke test the end-to-end loop; proposal artifact and changelog entry verified.
- Tier 2 (micro-validation, internal): After first landed change, probe: "Do you understand what changed and why?" (10 seconds). Record in PM checkpoint.
- Decision this informs: "Does the loop deliver a tangible, comprehensible improvement?"

## Non-goals
- Multiple simultaneous proposals.
- Fully autonomous shipping without user approve.
- Broad "AI plans roadmap" behavior.
- Deep product integrations beyond one narrow improvement class.

## Linked Feedback
- F-20260301-002 (product design review; M5/M6 sequence)
- E-0006 tier-3 results (proceed decision; user anticipates evolving promise)

## Linked Tickets
- T-0045 M6 scope: define improvement class, trigger, and first instance
- T-0011, T-0012, T-0013, T-0015, T-0016 (existing loop infrastructure)

## Progress (Ticket Status)
- Done: _(none)_
- Ready: T-0045 (rank 2 — scope first)
- Backlog: _(none)_

## Notes
- Improvement class must be narrow: e.g. UI microcopy, one settings default, or one prompt/routing tweak. Avoid scope creep.
- E-0002 (M1) spec in `docs/m1-first-improvement-loop.md` defines artifact format and loop phases; M6 implements the first real instance.
