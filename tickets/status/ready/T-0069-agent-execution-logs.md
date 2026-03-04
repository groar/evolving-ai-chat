# T-0069: Agent execution logs — per-patch expandable log in Activity sheet

## Metadata
- ID: T-0069
- Status: ready
- Priority: P2
- Type: feature
- Area: ui, runtime
- Epic: E-0011
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
Surface the raw agent execution log (stdout/stderr from `patch_agent.py`) for each patch as an expandable "Agent log" hidden detail inside the Activity sheet (T-0067). This is a power-user / debug feature — it should never be primary UI, but should be accessible without leaving the app for users who want to understand what the agent did during a specific change.

## Design Spec

### Goals
- For each patch entry in the Activity sheet, provide access to the agent's raw execution output (tool calls, reasoning, errors).
- Keep it hidden by default — one extra expand step below the diff.
- Connect the frontend log display to a backend storage/retrieval path.

### Non-goals
- Do not stream live logs to the UI (real-time streaming is a future enhancement).
- Do not format or parse the log content — render as raw text in a monospace scroll box.
- Do not add filtering, search, or export in this ticket.
- Do not surface logs outside the Activity sheet.

### Data path design
The execution log must be persisted and associated with a `patch_id` so it can be retrieved later.

**Backend changes (Python runtime)**:
1. In `patch_agent.py`, capture all agent stdout/stderr and structured tool-call events during a run.
2. After the run completes (success or failure), write the log to a new SQLite table `patch_logs`:
   - Schema: `(id INTEGER PK, patch_id TEXT UNIQUE, log_text TEXT, created_at TEXT)`
   - `patch_id` matches the `run_id` / patch identifier used in the existing patch state.
3. Expose a new FastAPI endpoint: `GET /patches/{patch_id}/log` → returns `{ patch_id, log_text, created_at }` or 404 if no log exists.
4. Logs are append-only; no deletion (unless the user deletes local data via Danger Zone, which should wipe `patch_logs` too).

**Frontend changes**:
1. In the expanded card view in `ActivitySheet`, below the diff view, add a hidden `<details>` block: `<summary>Agent log ↓</summary>`.
2. When `<details>` is opened, trigger a `GET /patches/{patch_id}/log` call.
3. Display the log in a `<pre className="font-mono text-xs bg-panel overflow-auto max-h-60">` block.
4. Loading state: "Loading log…" text while the request is in-flight.
5. Error state: "Log not available." if 404 or network error.
6. For patches where no `patch_id` is available (runtime changelog entries, not patch entries): hide the "Agent log" details entirely.

### Rules and state transitions
1. Log is loaded lazily (on `<details>` open) — not pre-fetched with the patch list.
2. Log content is never truncated server-side; the frontend `max-h-60` scroll handles long logs.
3. If the runtime is offline: "Log not available (runtime offline)." error state.
4. Existing patches (pre-T-0069) will have no log — show "Log not available for this change." without an error icon (informational, not an error).

### User-facing feedback plan
- In the Activity sheet, each expanded patch card shows a collapsed "Agent log ↓" section below the diff.
- User clicks "Agent log ↓" → log loads and displays as raw monospace text.
- The section is visually subordinate (smaller text, muted bg) — clearly a debug/detail feature.

### Scope bounds
- Backend: 1 new SQLite table + 1 new endpoint + log capture in `patch_agent.py`.
- Frontend: 1 new `<details>` block per card in `ActivitySheet` + 1 lazy fetch.
- No changes to existing patch apply/rollback flow.

### Edge cases / failure modes
- `patch_agent.py` crashes before writing log: log entry absent → "Log not available." state.
- Very large logs (>100 KB): `max-h-60` scroll; no truncation needed at this scale.
- Concurrent log requests (user opens multiple cards): each request is independent; no race condition.

### Validation plan
- Backend: pytest test for `GET /patches/{patch_id}/log` (happy path, 404 for unknown id).
- Frontend: unit test for "Agent log" section rendering (loading, error, content states).
- Manual: trigger a patch run, open Activity, expand card, expand "Agent log", verify log appears.

## UI Spec Addendum

- **Primary job-to-be-done**: inspect what the agent did during a specific change (debug / audit).
- **Primary action**: the expand ("Agent log ↓") trigger — it must not be prominent; it is a secondary-secondary action.
- **Navigation / progressive disclosure**: visible only inside an already-expanded card; collapsed by default; lazy-loaded.
- **Key states**:
  - Not loaded: "Agent log ↓" collapsed summary only.
  - Loading: "Loading log…" text.
  - Loaded: raw log in monospace scroll box.
  - Not available (no log): "Log not available for this change." (informational, muted).
  - Runtime offline: "Log not available (runtime offline)."
- **Copy constraints**:
  - Section trigger: "Agent log ↓" (on open: "Agent log ↑").
  - Must not imply: that the log is formatted, interpreted, or curated — it is raw output.
  - Must not imply: that all changes have logs — pre-T-0069 patches don't.

## Context
- Auditability principle (STATUS.md): "every shipped change ties back to a ticket, diff, and validation evidence." The agent log is raw validation evidence.
- User asked for this "more as a hidden option or log" — the nested `<details>` pattern matches that intent precisely.
- This ticket has a runtime data-path component; Area is `ui, runtime`.

## References
- `apps/desktop/runtime/agent/patch_agent.py`
- `apps/desktop/runtime/adapters/router.py` (FastAPI routes)
- `apps/desktop/src/` (ActivitySheet from T-0067 — must exist before implementation)
- `docs/design-guidelines.md` (T-0066)
- E-0011, F-20260304-003

## Feedback References
- F-20260304-003

## Acceptance Criteria
- [ ] Backend: `patch_logs` SQLite table exists (schema: `id, patch_id, log_text, created_at`).
- [ ] Backend: `patch_agent.py` writes captured execution output to `patch_logs` on run completion.
- [ ] Backend: `GET /patches/{patch_id}/log` returns `{ patch_id, log_text, created_at }` or 404.
- [ ] Frontend: each expanded patch card in Activity sheet has an "Agent log ↓" details section.
- [ ] Frontend: log loads lazily on `<details>` open; loading state and error states are handled.
- [ ] Frontend: log renders in monospace scroll box (max-h-60, overflow-auto).
- [ ] Frontend: `<details>` is hidden for non-patch entries (runtime changelog only).
- [ ] Test: pytest for `/patches/{patch_id}/log` (happy + 404).
- [ ] Test: frontend unit test for Agent log section (loading, error, content states).
- [ ] Manual: trigger a real patch run, verify log appears in Activity sheet.

## UX Acceptance Criteria
- [ ] "Agent log" is not visible until the user expands a patch card.
- [ ] "Agent log" section does not auto-expand — it requires a deliberate click.
- [ ] No content overflow; long logs are scrollable within the card.
- [ ] "Log not available" states are informational, not alarming.

## Dependencies / Sequencing
- Depends on: T-0067 (ActivitySheet — T-0069's UI home)
- Blocks: nothing
- Sequencing notes: rank 4 in E-0011 ready queue; pick up after T-0067 is accepted

## QA Evidence Links
- QA checkpoint: (to be filled)
- Screenshots/artifacts: (to be filled)

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Backend: create `patch_logs` table in SQLite init
- [ ] Backend: log capture in `patch_agent.py`
- [ ] Backend: `GET /patches/{patch_id}/log` endpoint in `router.py`
- [ ] Frontend: "Agent log ↓" `<details>` section in expanded card
- [ ] Frontend: lazy fetch hook/function
- [ ] Frontend: loading / error / content states
- [ ] Tests: pytest (backend), unit test (frontend)
- [ ] Manual verification

## Notes
- Log capture in `patch_agent.py` can use a `StringIO` buffer or in-memory list to collect stdout/stderr lines during the run, then write to SQLite at the end. Avoid writing to SQLite mid-run to prevent partial logs.
- Danger Zone "Delete Local Data" must also wipe `patch_logs` — verify this in implementation.

## Change Log
- 2026-03-04: Ticket created from F-20260304-003 / E-0011.
