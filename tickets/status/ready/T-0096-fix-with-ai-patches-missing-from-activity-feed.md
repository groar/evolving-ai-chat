# T-0096: Fix with AI — patches missing from Activity feed

## Metadata
- ID: T-0096
- Status: ready
- Priority: P1
- Type: bug
- Area: ui, core
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08

## Summary
After running Fix with AI (from the refinement flow or directly), the evolution does not appear in the Activity feed. The user expects to see a record of the run there, including failed runs.

## Context
- User feedback F-20260308-003: "I can't see any trace of it in the Activity feed so that's a bug."
- Patches are sourced from GET /state → patch_storage.list_all(). Activity feed displays patches from settingsStore.patches.
- Hypothesis: State refresh timing when coming from refinement flow, or patches not being persisted/returned for refinement-initiated runs. Need to reproduce and root-cause.

## References
- `apps/desktop/src/activitySheet.tsx` — Activity feed UI
- `apps/desktop/src/hooks/useRuntime.ts` — requestPatch, refreshState, schedulePatchPoll
- `apps/desktop/runtime/main.py` — GET /state, patches in response
- `apps/desktop/runtime/agent/patch_storage.py` — list_all
- F-20260308-003

## Feedback References
- F-20260308-003

## Acceptance Criteria
- [ ] After running Fix with AI (refinement flow or direct), the patch appears in the Activity feed (Settings → Activity) whether it succeeded, failed, or is in progress.
- [ ] Failed patches (apply_failed, scope_blocked, validation_failed) are visible in Activity feed.
- [ ] `uv run pytest` and `npm run validate` pass.
- [ ] No regression: existing Activity feed behavior for non–Fix-with-AI patches remains correct.

## User-Facing Acceptance Criteria
- [ ] User can open Activity and see a record of their Fix with AI runs, including status and outcome.

## Dependencies / Sequencing
- Depends on: none
- Blocks: none

## Notes
- Reproduce: Run Fix with AI from refinement flow → complete or fail → open Settings → Activity. Verify patch appears.
- Check: Does refreshState run after terminal status? Does GET /state return the patch? Is there a filter excluding certain statuses?

## Change Log
- 2026-03-08: Ticket created from F-20260308-003.
