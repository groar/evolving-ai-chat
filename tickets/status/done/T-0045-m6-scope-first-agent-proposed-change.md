# T-0045: M6 scope — First agent-proposed change from real usage

## Metadata
- ID: T-0045
- Status: done
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
- [x] Spec document (or addendum) defines:
  - Exactly one improvement class for M6 (e.g. "UI microcopy in empty state" or "settings default value").
  - Trigger: explicit feedback from in-app capture, or a defined implicit signal (e.g. repeated friction pattern).
  - First concrete example: what change would be proposed, from what signal, and how validation runs.
- [x] At least one implementation ticket is created or identified to execute the first instance.
- [x] Doc links from E-0007 and is referenced in acceptance evidence.

## Evidence (Verification)
- Doc review: spec covers improvement class, trigger, and first example. M6 addendum in `docs/m1-first-improvement-loop.md` defines `settings-trust-microcopy-v1`, explicit in-app feedback trigger, rule-based proposal generation, and first example (Improvements section label clarification).
- Implementation ticket(s) created and linked to E-0007: T-0046 in backlog.

## Change Log
- 2026-03-01: Ticket created; moved to ready (rank 2). PM run 24.
- 2026-03-01: Moved to in-progress. Added M6 addendum to `docs/m1-first-improvement-loop.md`. Created T-0046, linked to E-0007. Moved to review.
- 2026-03-01: Doc review PASS (`tickets/meta/qa/2026-03-01-doc-review-t0045.md`). PM acceptance. Moved to done.
