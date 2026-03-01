# T-0045: M6 scope — First agent-proposed change from real usage

## Metadata
- ID: T-0045
- Status: ready
- Priority: P1
- Type: docs
- Area: core
- Epic: E-0007
- Owner: pm-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Define the concrete scope for M6: which improvement class to target, what triggers proposal generation (explicit feedback vs implicit signal), and how the first instance will be implemented. Output: implementation-ready spec addendum or update to `docs/m1-first-improvement-loop.md`.

## Context
- E-0006 tier-3 validation completed: proceed to self-evolution.
- M1 (E-0002) infrastructure exists: feedback capture, proposal artifact, settings panel, changelog.
- M6 must ship one real change from usage signal. Scope is underspecified: improvement class, trigger mechanism, and first example need definition before implementation.

## References
- `docs/m1-first-improvement-loop.md`
- `tickets/meta/epics/E-0007-m6-first-agent-proposed-change.md`
- `STATUS.md`

## Acceptance Criteria
- [ ] Spec document (or addendum) defines:
  - Exactly one improvement class for M6 (e.g. "UI microcopy in empty state" or "settings default value").
  - Trigger: explicit feedback from in-app capture, or a defined implicit signal (e.g. repeated friction pattern).
  - First concrete example: what change would be proposed, from what signal, and how validation runs.
- [ ] At least one implementation ticket is created or identified to execute the first instance.
- [ ] Doc links from E-0007 and is referenced in acceptance evidence.

## Evidence (Verification)
- Doc review: spec covers improvement class, trigger, and first example.
- Implementation ticket(s) created and linked to E-0007.

## Change Log
- 2026-03-01: Ticket created; moved to ready (rank 2). PM run 24.
