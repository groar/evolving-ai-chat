# T-0023: Runtime-offline banner persists when runtime is running

## Metadata
- ID: T-0023
- Status: backlog
- Priority: P1
- Type: bug
- Epic: E-0003
- Owner: ai-agent
- Created: 2026-02-28
- Updated: 2026-02-28

## Summary
The desktop app can show the runtime-offline banner (“start the runtime, then retry”) even when the observer believes the runtime is running. This blocks chat sending, undermines trust, and invalidates usability probes that assume runtime-backed features are reachable.

## Impact
- Severity: S2
- User impact: fresh users perceive the app as broken and cannot send chat messages when the UI is stuck in “offline”.
- Scope: desktop app runtime detection and runtime-backed surfaces (chat, changelog, proposals).

## Environment
- Build/commit: unknown
- Runtime: macOS desktop (Tauri), local runtime expected at `127.0.0.1:8787`
- Seed/config: unknown

## Reproduction Steps
1. Start the runtime (FastAPI) with `npm run runtime:fastapi` in `/Users/alois/dev/software/evolving-ai-chat/apps/desktop`.
2. Start the desktop app with `npm run tauri:dev` in `/Users/alois/dev/software/evolving-ai-chat/apps/desktop`.
3. Observe the runtime status banner in the chat surface.

## Expected Behavior
If the runtime is reachable, the runtime-offline banner is not shown and chat sending is enabled.

## Actual Behavior
The runtime-offline banner can persist (“start the runtime, then retry”) despite the runtime reportedly running, leaving chat disabled.

## Evidence
- Logs:
  - Micro-validation report captured in `tickets/status/done/T-0018-rerun-e0002-micro-validation-probes.md`.
- Screenshots/video: none
- Failing test(s): none

## References
- Feedback: `tickets/meta/feedback/inbox/F-20260228-003-e0002-probe-failed-runtime-offline-and-settings-confusion.md`
- Related UX epic: `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md`

## Acceptance Criteria (Fix + Verify)
- [ ] Root cause is fixed (runtime reachability detection reflects reality).
- [ ] Reproduction steps no longer fail.
- [ ] Regression test added/updated (offline -> online transition or “runtime running” state).
- [ ] No regression in core chat flow and runtime-offline UX behavior.

## Subtasks
- [ ] Reproduce locally with logs (verify `/state` reachability and error details)
- [ ] Implement fix
- [ ] Add/adjust tests
- [ ] Validate fix via QA scenario
- [ ] Update docs/copy if needed

## Notes
This may be an actual runtime availability bug, a port/bind/permissions issue, or an error path incorrectly categorized as “offline”. The fix should ensure the UI distinguishes “offline” vs “runtime error” and surfaces actionable detail only in advanced views.

## Change Log
- 2026-02-28: Bug ticket created from E-0002 micro-validation probe results (T-0018).
