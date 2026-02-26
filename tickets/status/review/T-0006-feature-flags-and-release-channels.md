# T-0006: Feature flags and release channels (stable/experimental)

## Metadata
- ID: T-0006
- Status: review
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Introduce feature flags and two release channels (stable vs experimental) so the product can evolve without breaking daily use.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Let experiments ship safely.
  - Provide a user-visible “what mode am I in?” control.
- Non-goals:
  - Complex remote config or multi-user flag targeting.
- Rules and state transitions:
  - Channel is a persisted setting: `stable` or `experimental`.
  - Default channel is `stable`.
  - Channel and flags are local-only settings (no remote config in v1).
  - In `stable`, experimental-only UI elements are hidden and experimental flags are not user-toggleable.
  - In `experimental`, a basic Settings surface allows opting into/out of experimental flags.
  - Experimental features must be gated by flags and default off in `stable`.
- Validation plan:
  - Deterministic: toggling channel changes the active feature set in a testable way.

## References
- `STATUS.md`
- `tickets/status/done/T-0002-define-autonomy-and-data-boundary-defaults.md`
- `tickets/status/done/T-0005-storage-conversations-and-event-log-sqlite.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [x] A persisted `channel` setting exists: `stable` (default) or `experimental` (opt-in).
- [x] At least one trivial UI feature is gated behind an experimental-only flag (to prove the mechanism).
- [x] The current channel is visible in the UI.

## UX Acceptance Criteria (Only If `Area: ui`)
- [x] Channel toggle copy is clear and does not imply unsafe autonomy.
- [x] Channel toggle copy must not imply data sharing/sync; keep expectations local-only.

## Subtasks
- [x] Implement flag storage (SQLite) and access pattern.
- [x] Add a basic Settings UI for channel.
- [x] Gate one small feature behind a flag.

## QA Evidence Links (Required For `review/`/`done/`)
- QA checkpoint: `tickets/meta/qa/2026-02-26-qa-checkpoint-t0006.md`

## Evidence (Verification)
- Runtime release settings + flags:
  - Added persisted release settings in `apps/desktop/runtime/storage.py`:
    - `release_channel` setting (`stable` default, `experimental` opt-in)
    - `experimental_flags_json` setting for local-only experimental toggles
    - active-flag computation (`active_flags`) that only enables experimental flags in the `experimental` channel
  - Added runtime setting APIs in `apps/desktop/runtime/main.py`:
    - `GET /settings`
    - `POST /settings/channel`
    - `POST /settings/flags/{flag_key}`
- UI channel + gated feature:
  - Updated `apps/desktop/src/App.tsx` to:
    - render a left-rail local-only Settings card with Stable/Experimental channel controls
    - show current channel in the top-bar channel pill
    - allow experimental flag toggling only when channel is `experimental`
    - gate a small runtime diagnostics card behind `show_runtime_diagnostics`
  - Updated `apps/desktop/src/styles.css` for the Settings card and diagnostics card UI states.
- Documentation:
  - Updated `apps/desktop/README.md` with release channel behavior and local-only guardrails.
- Commands run:
  - `npm run build` -> PASS.
  - `npm run smoke:storage` -> PASS.
  - `npm run smoke` with Python FastAPI runtime -> FAIL (`No module named uvicorn` in local Python env).
  - `npm run smoke` with Node runtime fallback (`runtime:stub:node`) -> PASS.

## QA Summary
- Automatic QA phase completed for this software/behavior ticket.
- Outcome: PASS with no blocking defects.
- Checkpoint: `tickets/meta/qa/2026-02-26-qa-checkpoint-t0006.md`
- Residual risks recorded in QA checkpoint:
  - Python FastAPI smoke unavailable in this environment due missing `uvicorn`.
  - Visual desktop UI interaction not executed under headless constraints.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/` (sequenced after T-0007 to keep the pickup queue non-empty).
- 2026-02-26: Moved to `in-progress/` and implemented persisted release channel/flags in runtime storage and APIs.
- 2026-02-26: Added local-only release channel settings UI and experimental diagnostics card gated by `show_runtime_diagnostics`.
- 2026-02-26: Recorded implementation evidence (`build`, `smoke:storage`, runtime smoke via Node fallback) and moved to `review/`.
- 2026-02-26: Completed automatic QA phase; no blocking findings. QA evidence linked in ticket.
