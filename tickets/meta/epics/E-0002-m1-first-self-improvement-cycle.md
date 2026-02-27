# E-0002: M1 — First self-improvement cycle

## Metadata
- ID: E-0002
- Status: active
- Owner: pm-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Goal
Ship the first full "observe -> propose -> validate -> release" improvement cycle in a way that is boring, safe, and repeatable.

## Definition of Done
- The app can capture at least one explicit feedback item in-app (a user can report friction/suggestion without leaving the product).
- The system can generate a small change proposal artifact (bounded diff + rationale + risk notes) from that feedback.
- Validation gates run for the proposal and results are attached to the proposal/ticket.
- The user can accept/reject and see the outcome reflected in:
  - the settings "Changelog + Experiments" surface, and
  - the ticket/board history (traceability).

## Validation Plan
- Default: tier 2 targeted micro-validation (internal, project sponsor) once there is at least one concrete proposal to evaluate.
- Probes (answer in 1-2 sentences each):
  - In Settings, what do you think "Switch to Stable" does? What do you think it does not do?
  - What do you think "Reset Experiments" does? Would you expect it to affect your conversations/data?
  - After using the changelog once, do you feel you can understand "what changed + why" in under 10 seconds?
- Evidence: record results in the implementing ticket's Evidence section or link to a dated PM checkpoint entry.

## Non-goals
- Fully autonomous shipping without review.
- Broad "AI plans your roadmap" behavior.
- Deep product integrations beyond the first loop.

## Linked Feedback
- F-20260226-001

## Linked Tickets
- T-0011 M1 spec: define the first improvement loop (doc)
- T-0012 In-app feedback capture (explicit)
- T-0013 Change proposal artifact (format + storage)

## Progress (Ticket Status)
- Done:
  - T-0011 M1 spec: define the first improvement loop (doc)
- Next up:
  - T-0012
- Planned:
  - T-0012, T-0013

## Notes
Keep this milestone constrained: aim for one narrow class of improvements (for example, UI microcopy or one settings tweak) so the loop can be proven quickly.
