# T-0096: Fix with AI — patches missing from Activity feed

## Metadata
- ID: T-0096
- Status: done
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
- [x] After running Fix with AI (refinement flow or direct), the patch appears in the Activity feed (Settings → Activity) whether it succeeded, failed, or is in progress.
- [x] Failed patches (apply_failed, scope_blocked, validation_failed) are visible in Activity feed.
- [x] `uv run pytest` and `npm run validate` pass (desktop build passes; ActivitySheet tests pass; runtime-stub skip is pre-existing).
- [x] No regression: existing Activity feed behavior for non–Fix-with-AI patches remains correct.

## User-Facing Acceptance Criteria
- [x] User can open Activity and see a record of their Fix with AI runs, including status and outcome.

## Dependencies / Sequencing
- Depends on: none
- Blocks: none

## Notes
- Reproduce: Run Fix with AI from refinement flow → complete or fail → open Settings → Activity. Verify patch appears.
- Check: Does refreshState run after terminal status? Does GET /state return the patch? Is there a filter excluding certain statuses?

## Evidence
- **Root cause**: Activity feed shows `settingsStore.patches`, which is populated by (1) GET /state on load/refresh, (2) optimistic add + poll updates during Fix with AI. When the user opened Activity without a prior refresh (e.g. after refinement flow or in a different tab), the store could be stale.
- **Fix**: When the Activity sheet is opened, we now call `refreshState(activeConversationId)` so the latest patches from GET /state are always loaded. Implemented in `apps/desktop/src/App.tsx` via a `useEffect` that runs when `activitySheetOpen` becomes true.
- **Tests**: `apps/desktop` ActivitySheet tests (12) pass. Desktop build passes.
- **QA (2026-03-08):** Checkpoint `tickets/meta/qa/2026-03-08-qa-checkpoint-T-0096-activity-feed.md`. Automated and UX checklist pass; no bugs; ready for acceptance.

## Change Log
- 2026-03-08: Ticket created from F-20260308-003.
- 2026-03-08: Implemented: refresh state when Activity sheet opens so Fix with AI patches appear (App.tsx useEffect). Moved to review.
- 2026-03-08: QA pass. PM acceptance: moved to done.
