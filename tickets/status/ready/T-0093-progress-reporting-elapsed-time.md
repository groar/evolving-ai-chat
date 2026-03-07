# T-0093: Progress reporting — elapsed-time in poll response + frontend counter

## Metadata
- ID: T-0093
- Status: ready
- Priority: P2
- Type: feature
- Area: core, ui
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07

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
- [ ] `PatchArtifact` (or the status response model) gains `started_at: str | None` and `elapsed_seconds: int | None` fields.
- [ ] When `pi` is invoked, `started_at` is recorded as an ISO timestamp.
- [ ] `GET /agent/patch-status/{patch_id}` includes `started_at` and `elapsed_seconds` (computed server-side) for in-flight patches.
- [ ] `PatchNotification` displays elapsed time during `pending`/`applying`/`retrying` states, formatted as "Working on your change… (Xs)" with a live-updating counter (updates at poll frequency or via local timer).
- [ ] Elapsed time is not shown for terminal states (`applied`, `apply_failed`, etc.).
- [ ] `uv run pytest` exits 0.
- [ ] `npm run validate` passes in `apps/desktop/`.

## User-Facing Acceptance Criteria
- [ ] The user can see how long the agent has been working, giving confidence it is not stuck.

## Dependencies / Sequencing
- Depends on: none (independent of other M13 tickets)
- Blocks: none

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Add `started_at` tracking to patch agent invocation
- [ ] Add `started_at` and `elapsed_seconds` to status response model
- [ ] Update poll endpoint to compute and return elapsed time
- [ ] Update `PatchNotification` to display live elapsed-time counter
- [ ] Add tests (response model, elapsed computation)

## Notes
- Streaming stdout capture (approach 2 in the spec) is a future enhancement, not in M13 scope.
- The frontend poll interval is 1.5s. The elapsed counter can either update at poll frequency or use a local `setInterval` for smoother display, resynchronizing on each poll response.

## Change Log
- 2026-03-07: Ticket created from M13 design spec §9 (rank 5).
