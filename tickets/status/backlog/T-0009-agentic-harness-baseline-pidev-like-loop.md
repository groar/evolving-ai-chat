# T-0009: Agentic harness baseline (pi.dev-like loop)

## Metadata
- ID: T-0009
- Status: backlog
- Priority: P3
- Type: spike
- Area: core
- Epic: E-0001
- Owner: pm-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Choose and document the initial agentic coding harness workflow (pi.dev-like “agents open PRs/tickets”) so self-evolution uses traceable, reviewable changes.

## Scope Update (Optional)
If we discover constraints (offline-only, no network, or platform limits), re-scope to a local-only harness that still produces auditable diffs and validation artifacts.

## Context
- We want agentic coding, but it must fit the repo’s ticket-driven workflow and validation gates.

## References
- `STATUS.md`
- `tickets/meta/feedback/inbox/F-20260226-001-self-evolving-desktop-ai-chat.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] The harness workflow is documented in this ticket Notes, including:
  - how a change proposal is generated,
  - where diffs/patches live,
  - how validation gates are run,
  - how approvals happen,
  - rollback path.
- [ ] The chosen approach produces artifacts linkable from tickets (`Evidence` section).
- [ ] Any required secrets/credentials handling is explicitly called out as a constraint.

## Subtasks
- [ ] Evaluate “pi.dev-like PR loop” vs local-only patch workflow.
- [ ] Recommend one with tradeoffs and a v1 adoption plan.

## Change Log
- 2026-02-26: Ticket created.

