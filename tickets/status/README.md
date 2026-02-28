# Ticket Status Board

This folder contains live ticket files organized by status.

- `backlog/` new approved work
- `ready/` scoped and next-up work (`ready/ORDER.md` defines pickup order)
- `in-progress/` active implementation
- `blocked/` paused due to blockers
- `review/` awaiting QA (if software/behavior changed) and acceptance/review
- `done/` accepted complete work
- `cancelled/` intentionally dropped work

Only ticket files (`T-*.md`) should move across these folders. Supporting docs like `ready/ORDER.md` stay in place.

## Ownership And Responsibility
- PM owns `ready/` quality (DoR) and `ready/ORDER.md`, and is the default acceptor for `done/`.
- Implementation agent owns `in-progress/` execution and prepares the `review/` handoff with verification evidence.
- QA agent validates tickets in `review/` (software/behavior changes only), creates bug tickets, and documents results.
- Any role can move a ticket to `blocked/` when a blocker is discovered, but must record the blocker and next action.

## Definition Of Ready (DoR)
A ticket is eligible for `ready/` when:
- [ ] Summary and context are clear and non-contradictory.
- [ ] Acceptance criteria are observable/testable (not implementation steps).
- [ ] References link to the relevant product/technical intent.
- [ ] Scope is bounded (explicit non-goals or out-of-scope notes if needed).
- [ ] Major unknowns are resolved or explicitly called out as assumptions.
- [ ] If `Area: ui`, UX acceptance criteria are present.
- [ ] If behavior is design-ambiguous or introduces new rules/state transitions, a `Design Spec` section is included in the ticket before implementation.
- [ ] If the ticket changes end-user behavior, include at least one acceptance criterion verifiable from a user flow.

## Definition Of Done (DoD)
A ticket is eligible for `done/` when:
- [ ] Acceptance criteria are satisfied and verified (tests, manual checks, or both).
- [ ] Any required docs are updated.
- [ ] Evidence of verification is recorded in the ticket (or linked from it).
- [ ] If software/behavior changed, QA validation evidence is captured (or a waiver is recorded).
- [ ] Follow-ups are ticketed (not left as “TODO” in notes).
- [ ] If `Area: ui`, UX acceptance criteria are verified and evidence is recorded (notes and/or screenshots).
  - Evidence expectation: at least 1 screenshot (or detailed notes if screenshots are not feasible) covering the primary affected view; include empty/error state screenshots when the ticket touches those states.
- [ ] If user-facing text changed, a copy regression sweep was performed (typos, ambiguity, implication control, and term consistency).

Note: external user validation is not a default DoD requirement for every ticket. Require it only when the ticket or owning epic explicitly depends on user-report outcomes; otherwise prefer deterministic checks and internal verification evidence.
