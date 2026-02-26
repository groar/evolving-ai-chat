# T-0001: New project bootstrap checklist

## Metadata
- ID: T-0001
- Status: backlog
- Priority: P1
- Type: chore
- Epic: none
- Owner: ai-agent
- Created: 2026-02-15
- Updated: 2026-02-15

## Summary
Create a minimal bootstrap checklist so a fresh project can start using this scaffold with clear product docs, an initial ticket queue, and a defined first pickup order.

## Context
- New repositories need a consistent first setup pass to avoid ad-hoc process drift.
- This ticket ensures the PM, implementation, and QA workflows can start immediately.

## References
- `README.md`
- `AGENTS.md`
- `tickets/README.md`

## Feedback References (Optional)
- none

## Acceptance Criteria
- [ ] Product intent docs are added in the host project and linked from ticket references.
- [ ] At least three initial tickets exist in `tickets/status/backlog/` with testable acceptance criteria.
- [ ] At least one scoped ticket is moved to `tickets/status/ready/`.
- [ ] `tickets/status/ready/ORDER.md` lists the canonical ready-ticket pickup order.

## Subtasks
- [ ] Add or link product intent documents (PRD/MVP/roadmap/architecture as applicable).
- [ ] Draft initial backlog tickets for core milestones.
- [ ] Select first implementation ticket and move it to `ready/`.
- [ ] Update `ready/ORDER.md` with top-to-bottom execution order.
- [ ] Confirm metadata and change logs are current for newly created tickets.

## Notes
Keep this checklist intentionally minimal and adapt follow-up tickets to the host project's domain.

## Change Log
- 2026-02-15: Ticket created.
