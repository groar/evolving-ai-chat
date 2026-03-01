# T-0023: Runtime-offline banner persists when runtime is running

## Metadata
- ID: T-0023
- Status: done
- Priority: P1
- Type: bug
- Epic: E-0003
- Owner: ai-agent
- Created: 2026-02-28
- Updated: 2026-03-01

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
  - Runtime smoke (managed FastAPI + contract checks): `tickets/meta/qa/artifacts/runtime-smoke/2026-03-01T08-39-00-312Z/smoke-fastapi.log`.
  - QA checkpoint: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0023-reopen.md`.
- Screenshots/video: none
- Automated checks:
  - `npm --prefix apps/desktop test -- appShell.test.tsx` (PASS)
  - `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime/test_proposals.py` (PASS)
  - `cd apps/desktop && npm run smoke:fastapi` (PASS)

## References
- Feedback: `tickets/meta/feedback/inbox/F-20260228-003-e0002-probe-failed-runtime-offline-and-settings-confusion.md`
- Related UX epic: `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md`

## Acceptance Criteria (Fix + Verify)
- [x] Root cause is fixed (runtime reachability detection reflects reality).
- [x] Reproduction steps no longer fail.
- [x] Regression test added/updated (offline -> online transition or “runtime running” state).
- [x] No regression in core chat flow and runtime-offline UX behavior.

## Subtasks
- [x] Reproduce locally with logs (verify `/state` reachability and error details)
- [x] Implement fix
- [x] Add/adjust tests
- [x] Validate fix via QA scenario
- [x] Update docs/copy if needed

## Notes
Reopened after user report on 2026-03-01. Root cause identified as missing CORS middleware in the runtime API: desktop WebView requests to `http://127.0.0.1:8787` were blocked by origin policy, which the app surfaced as `offline` despite the runtime process being healthy.

## Change Log
- 2026-02-28: Bug ticket created from E-0002 micro-validation probe results (T-0018).
- 2026-02-28: Added automatic `/state` retry polling while runtime is offline so the banner clears as soon as the runtime becomes reachable without requiring manual retry.
- 2026-02-28: Added regression coverage for offline auto-retry gating in `apps/desktop/src/appShell.test.tsx`.
- 2026-02-28: Accepted to `done/` after QA checkpoint (`tickets/meta/qa/2026-02-28-qa-checkpoint-t0023.md`).
- 2026-03-01: Reopened after user report that runtime-offline state persisted.
- 2026-03-01: Added FastAPI CORS middleware for Tauri/local dev origins in `apps/desktop/runtime/main.py`.
- 2026-03-01: Added regression coverage asserting CORS middleware configuration in `apps/desktop/runtime/test_proposals.py`.
- 2026-03-01: Revalidated with runtime unit tests and managed FastAPI smoke; accepted back to `done/` after QA checkpoint (`tickets/meta/qa/2026-03-01-qa-checkpoint-t0023-reopen.md`).
