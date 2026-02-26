# T-0005: Storage — conversations and event log (SQLite)

## Metadata
- ID: T-0005
- Status: backlog
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Persist conversations and a minimal event log locally (SQLite) to enable continuity, analytics-lite, and later “friction signal” detection.

## Context
- Self-evolution requires memory of what happened (at least locally) and a durable record of changes/validation results.

## References
- `STATUS.md`
- `tickets/status/backlog/T-0002-define-autonomy-and-data-boundary-defaults.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] Conversations and messages are persisted locally in SQLite.
- [ ] On app restart, the last opened conversation can be restored.
- [ ] A minimal event log table exists for recording:
  - message sent/received,
  - runtime errors,
  - validation runs (later tickets can expand fields).
- [ ] There is a documented way to delete all local data (even if via a dev command initially).

## Subtasks
- [ ] Define SQLite schema for conversations/messages/events.
- [ ] Implement read/write paths in runtime (or UI if local-only).
- [ ] Add a basic data deletion pathway and document it.

## Change Log
- 2026-02-26: Ticket created.

