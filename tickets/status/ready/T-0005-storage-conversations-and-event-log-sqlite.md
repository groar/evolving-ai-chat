# T-0005: Storage — conversations and event log (SQLite)

## Metadata
- ID: T-0005
- Status: ready
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

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Persist conversations/messages so the app can restore state after restart.
  - Record a minimal append-only event log for “what happened” (messages, errors, later validation runs).
  - Keep v1 local-only and easy to reset (delete all data).
- Non-goals:
  - Sync, multi-device, or multi-user.
  - Full analytics pipeline or complex querying.
  - Encryption-at-rest (can be a follow-up if needed).
- Rules and state transitions:
  - Conversations are identified by a stable `conversation_id` and contain ordered messages.
  - Messages are append-only; edits/deletes (if needed later) should be modeled as additional events.
  - On startup, the app restores the “last opened conversation” if it still exists; otherwise it opens a new empty conversation.
  - Event log is append-only and records at least: `event_type`, `created_at`, and a JSON `payload`.
  - “Delete all local data” removes conversations/messages/events (and resets “last opened conversation”).
- User-facing feedback plan:
  - After restart, the previously active conversation is visible and continues.
  - If the user triggers data deletion, the UI clearly returns to a fresh state.
- Scope bounds:
  - Minimal schema sufficient for: list conversations, load messages, append message, log events.
  - Keep schema versioning simple (single `schema_version` table/row).
- Edge cases / failure modes:
  - DB missing/corrupt: create a fresh DB and log an error event.
  - Large messages: store as TEXT; avoid unbounded growth concerns for v1 (add follow-up if needed).
  - Future migrations: bump schema version and provide a minimal migration path.
- Validation plan:
  - Deterministic: a smoke check that writes a conversation + message, restarts the app/runtime, and confirms it can be read back.
  - Deterministic: a smoke check that “delete all local data” results in an empty state.

## References
- `STATUS.md`
- `tickets/status/done/T-0002-define-autonomy-and-data-boundary-defaults.md`

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
- [ ] Decide initial ownership of persistence (runtime-first preferred; UI-only acceptable if clearly documented).
- [ ] Implement read/write paths (create/load conversation, append messages, append events).
- [ ] Add a basic “delete all local data” pathway and document it.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/` with design spec for schema + reset semantics.
