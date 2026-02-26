# QA Checkpoint - 2026-02-26 (T-0005)

## Scope Tested
- Ticket: T-0005 (`tickets/status/review/T-0005-storage-conversations-and-event-log-sqlite.md`)
- Area: SQLite-backed conversation persistence, event logging, and local reset flow

## Automated Test Outcomes
- `npm run build` (apps/desktop): PASS.
- `npm run smoke:storage` (apps/desktop): PASS.
  - Verified persisted messages and active conversation restore after runtime re-instantiation.
  - Verified delete-local-data reset behavior.
- `npm run smoke` with `node scripts/runtime-stub.mjs` active: PASS (`Runtime health endpoint`, `Runtime chat payload contract`).
- `npm test` (apps/desktop): FAIL (`No test files found`), treated as coverage gap.

## Manual Scenarios Executed
- Normal flow scenario:
  - Load runtime state, create/select a conversation, send chat message via `/chat`, and confirm persisted transcript returned by `/state`.
  - Result: PASS.
- Edge-case scenario:
  - Trigger `DELETE /data` reset and confirm fresh conversation state with empty message list.
  - Result: PASS.

## Copy Regression Sweep
- Reviewed user-facing additions in `apps/desktop/src/App.tsx`:
  - `Conversation List (SQLite)` (`App.tsx:194`)
  - `+ New Conversation` (`App.tsx:211`)
  - `Delete Local Data` / `Resetting...` (`App.tsx:214`)
  - `Loading local state...` (`App.tsx:231`)
- Findings: no typos, no misleading claims beyond implemented behavior.

## UI Visual Smoke Check
- UI project detected; visual launch/screenshot not executed in this QA run due headless environment constraints.
- Functional UI behavior was validated via API/state flow checks and implementation review.

## Criteria-to-Evidence Mapping
- Conversations/messages persisted in SQLite -> `runtime/storage.py` schema + `npm run smoke:storage` -> PASS.
- Last opened conversation restored on restart -> `settings.last_opened_conversation_id` behavior + `smoke:storage` restore checks -> PASS.
- Minimal event log exists for message and runtime error events -> `events` table + `main.py` event appends for `message_sent`, `message_received`, `runtime_error` -> PASS.
- Delete local data pathway exists -> `DELETE /data` endpoint + UI `Delete Local Data` action + reset smoke checks -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- No Vitest unit/integration tests exist yet for conversation state transitions.
- FastAPI runtime path depends on local Python package availability (`fastapi`, `uvicorn`) for full local app execution; offline environments may need the Node fallback.

Suggested commit message: `feat(T-0005): add SQLite conversation persistence, event log, and local data reset`

Next-step suggestion: PM should review and accept `T-0005` from `review/` to `done/`.
