# T-0093: Progress reporting — elapsed-time in poll response + frontend counter

## Metadata
- ID: T-0093
- Status: done
- Priority: P2
- Type: feature
- Area: core, ui
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07 (implementation complete)

## Summary
Track when the `pi` subprocess starts and expose `elapsed_seconds` and `started_at` in the `GET /agent/patch-status/{patch_id}` poll response. Update `PatchNotification` on the frontend to show a live-updating elapsed-time counter during in-progress states (e.g., "Working on your change… (45s)").

## Context
- The `pi` subprocess runs for up to 600s. The frontend only sees "working on a change" with no incremental progress information.
- The M13 design spec (§8) defines elapsed-time reporting as the M13-scoped approach (streaming stdout capture deferred to a future milestone).

## References
- `docs/m13-self-evolve-reliability.md` — §8 (Progress Reporting)
- `apps/desktop/runtime/agent/patch_agent.py` — `_call_pi()` subprocess invocation
- `apps/desktop/runtime/main.py` — `GET /agent/patch-status/{patch_id}` endpoint
- `apps/desktop/src/PatchNotification.tsx` — status banner
- `apps/desktop/src/hooks/useRuntime.ts` — status polling

## Feedback References
- F-20260307-001

## Acceptance Criteria
- [x] `PatchArtifact` (or the status response model) gains `started_at: str | None` and `elapsed_seconds: int | None` fields.
- [x] When `pi` is invoked, `started_at` is recorded as an ISO timestamp.
- [x] `GET /agent/patch-status/{patch_id}` includes `started_at` and `elapsed_seconds` (computed server-side) for in-flight patches.
- [x] `PatchNotification` displays elapsed time during `pending`/`applying`/`retrying` states, formatted as "Working on your change… (Xs)" with a live-updating counter (updates at poll frequency or via local timer).
- [x] Elapsed time is not shown for terminal states (`applied`, `apply_failed`, etc.).
- [x] `uv run pytest` exits 0.
- [x] `npm run validate` passes in `apps/desktop/`.

## User-Facing Acceptance Criteria
- [x] The user can see how long the agent has been working, giving confidence it is not stuck.

## Dependencies / Sequencing
- Depends on: none (independent of other M13 tickets)
- Blocks: none

## Evidence (Verification)
- Tests run: `uv run pytest` — 109 passed, 13 skipped (10 new T-0093 tests in `StartedAtTrackingTests`, `ElapsedSecondsTests`, `PatchStatusElapsedEndpointTests`). `npm run validate` — 121 passed (2 test descriptions updated to match new copy).
- Manual checks performed: `_compute_elapsed_seconds` confirmed to return `None` for all 6 terminal statuses and non-negative int for all 4 in-flight statuses.
- Screenshots/logs/notes: `PatchNotification` now renders "Working on your change… (Xs)" for pending/applying/retrying with a 1s local `setInterval` re-syncing against server `elapsed_seconds`.

## Subtasks
- [x] Add `started_at` tracking to patch agent invocation
- [x] Add `started_at` and `elapsed_seconds` to status response model
- [x] Update poll endpoint to compute and return elapsed time
- [x] Update `PatchNotification` to display live elapsed-time counter
- [x] Add tests (response model, elapsed computation)

## Notes
- Streaming stdout capture (approach 2 in the spec) is a future enhancement, not in M13 scope.
- The frontend poll interval is 1.5s. The elapsed counter can either update at poll frequency or use a local `setInterval` for smoother display, resynchronizing on each poll response.

## Change Log
- 2026-03-07: Ticket created from M13 design spec §9 (rank 5).
- 2026-03-07: Implementation complete. `started_at` added to `PatchArtifact`; `PatchStatusResponse` gains `started_at`/`elapsed_seconds`; `_compute_elapsed_seconds` added to `main.py`; `PatchNotification` gets `useElapsedCounter` hook with 1s local timer; 9 new tests (3 classes). Both test suites green.
- 2026-03-07: QA passed. Minor QA fix: `started_at` reset to `None` on `retrying` transition. PM accepted; moved to done.
