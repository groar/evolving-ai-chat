# T-0075: M10 Live Apply — Hot-Reload After Patch Acceptance

## Metadata
- ID: T-0075
- Status: done
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0013
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
After a patch is applied (git commit made, files written), trigger a `window.location.reload()` so the running app immediately reflects the change — no manual restart required. Add a brief `"reloading"` display state to `PatchNotification` so the user sees "Applying your update — reloading…" for ~400ms before the page refreshes. Post-reload, the existing backend state re-surfaces the `applied` notification automatically.

## Design Spec
See `docs/m10-agentic-loop-polish.md` §3 for full rationale and alternatives considered.

### Goals
- Users see their accepted patch take effect within ~1 second, with no manual restart.
- Notification survives the page reload (driven by backend `/state`, not frontend memory).

### Non-Goals
- SSE/WebSocket real-time push.
- Vite HMR completion detection (HMR fires automatically in dev; reload ensures 100% coverage).
- Tauri full app restart.
- Backend changes — this is frontend-only.

### Rules and State Transitions

```
applied → (frontend: 400ms) → reloading (display only) → [window.location.reload()] → boot → applied (reappears)
```

- `"reloading"` is a display-only state in `PatchNotification`. It is **never** written to the backend or stored in Zustand.
- All other patch states (pending, applying, apply_failed, scope_blocked, reverted, etc.) are unchanged.

### User-Facing Feedback Plan
- `"reloading"` state copy: "Applying your update — reloading…" + spinner.
- After reload, notification returns showing "[description]. Undo?" (same as M8 `applied` state).
- No new error state: if the reload is blocked (rare browser restriction), the patch stays `applied` and the user can reload manually.

### Scope Bounds
- `apps/desktop/src/hooks/useRuntime.ts`: add 400ms delay + `window.location.reload()` call after `applied` is detected in `schedulePatchPoll`.
- `apps/desktop/src/PatchNotification.tsx`: add `"reloading"` to `PatchStatus` type and render copy/spinner for that state; `isSpinnerStatus` updated.
- No backend changes. No new npm packages. No new API endpoints.

### Edge Cases / Failure Modes
| Scenario | Handling |
|---|---|
| Browser blocks reload | Patch stays `applied`; user can reload manually. No error shown. |
| Reload races with ongoing poll | On reboot, `/state` returns correct patch status; poll resumes if needed. |
| User clicks "Undo" before 400ms delay | Cancel the reload timeout; proceed with rollback normally. |

## Context
- M8 spec §3.3 step 5 specifies "runtime triggers a Vite dev-server hot module reload (or full rebuild for production)" but this was not implemented.
- Currently, after `applied` is detected, `refreshState()` is called — this reloads data but not the React/JS code.
- In dev mode, Vite HMR fires automatically when files change. The page reload ensures the change is visible in both dev and production builds.

## References
- `docs/m10-agentic-loop-polish.md` §3
- `apps/desktop/src/hooks/useRuntime.ts` — `schedulePatchPoll` (lines ~605–670)
- `apps/desktop/src/PatchNotification.tsx` — `PatchStatus` type + render logic
- `tickets/meta/epics/E-0013-m10-agentic-loop-polish.md`

## Acceptance Criteria
- [ ] After a stub patch (PATCH_AGENT_STUB=true) reaches `applied`, the page reloads within ~1 second.
- [ ] During the ~400ms pre-reload window, PatchNotification shows "Applying your update — reloading…" with a spinner.
- [ ] After reload, PatchNotification reappears with the `applied` state: "[description]. Undo?"
- [ ] Clicking "Undo" before the reload fires cancels the reload and proceeds with rollback.
- [x] All 9 `PatchNotification` states (including reloading) render correctly — tests added.
- [x] `useRuntime` unit tests pass; no TypeScript errors — `npm run validate` passes.

## UI Spec Addendum
- Primary job: surface the "change is live" moment clearly without blocking the user.
- Primary action: automatic (no user action required for reload).
- Key states: `reloading` (transient, ~400ms), then back to `applied`.
- Copy constraint: must not say "Done" or "Complete" during `reloading` — the change isn't confirmed live until after the reload.

## Dependencies / Sequencing
- Depends on: T-0074 (design spec) — done.
- Blocks: nothing.
- Sequencing: can be picked up independently of T-0076.

## QA Evidence Links
- QA checkpoint: `tickets/meta/qa/2026-03-04-qa-T-0075.md`

## Evidence (Verification)
- Tests run: `npm run validate` passes (PatchNotification.test.tsx 55 tests; useRuntime.modelSelection.test.ts 5 tests).
- Manual checks performed: E2E with PATCH_AGENT_STUB deferred; steps documented in QA checkpoint.
- Screenshots/logs/notes: See `tickets/meta/qa/2026-03-04-qa-T-0075.md`.

## Subtasks
- [x] Add `"reloading"` to `PatchStatus` type in `PatchNotification.tsx`
- [x] Render `"reloading"` state: copy + spinner
- [x] Update `isSpinnerStatus` to include `"reloading"`
- [x] In `schedulePatchPoll` (useRuntime.ts): after `applied` detected, set display to `reloading`, wait 400ms, call `window.location.reload()`
- [x] Cancel reload timeout if "Undo" is clicked before it fires (via `cancelReloadIfScheduled` in `rollbackPatch`)
- [x] Update/add tests for new reload behavior (PatchNotification.test.tsx: reloading state, Undo during reload)
- [x] Verify all 9 patch states in PatchNotification render correctly

## Notes
The 400ms delay gives Vite HMR time to settle in dev mode. In production, the reload is the primary mechanism. The exact delay can be tuned if it feels too abrupt (bump to 600ms) or too slow (reduce to 200ms).

## Change Log
- 2026-03-04: Ticket created by implementation agent from T-0074 design spec.
- 2026-03-04: Implementation complete. PatchNotification: added `reloading` state + copy/spinner; useRuntime: 400ms delay, `window.location.reload()`, `cancelReloadIfScheduled` in rollbackPatch; App.tsx: display override for reloading. Tests added. Moved to review.
- 2026-03-04: QA PASS (2026-03-04-qa-T-0075.md). PM accepted; moved to done.
