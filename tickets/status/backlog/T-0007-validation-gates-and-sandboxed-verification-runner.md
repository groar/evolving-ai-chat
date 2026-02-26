# T-0007: Validation gates and sandboxed verification runner

## Metadata
- ID: T-0007
- Status: backlog
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Add a validation gate that runs tests/smoke checks in an isolated environment before any agent-proposed change is accepted/applied.

## Context
- “Self-evolving” is only viable if regressions are caught early and consistently.

## References
- `STATUS.md`
- `tickets/meta/epics/E-0001-m0-end-to-end-safe-change-loop.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] There is a single command (documented) that runs:
  - runtime tests,
  - UI tests,
  - a basic end-to-end smoke flow.
- [ ] The command can be executed in an isolated sandbox (e.g., container) with least-privilege defaults.
- [ ] Validation output is captured as an artifact (file) that can be linked from tickets moved to `review/`.

## Subtasks
- [ ] Define the standard validation command(s).
- [ ] Add sandbox execution wrapper (initially minimal).
- [ ] Document how to interpret results and where artifacts land.

## Change Log
- 2026-02-26: Ticket created.

