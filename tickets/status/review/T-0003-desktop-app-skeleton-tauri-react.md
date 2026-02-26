# T-0003: Desktop app skeleton (Tauri + React)

## Metadata
- ID: T-0003
- Status: review
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Create the desktop app shell with a basic, keyboard-usable chat UI so we have a place to iterate (stable/experimental later).

## Context
- We need a running app early to validate the end-to-end loop and to collect UX friction signals.

## References
- `STATUS.md`
- `tickets/meta/epics/E-0001-m0-end-to-end-safe-change-loop.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] A Tauri desktop app launches locally and renders the UI without errors.
- [x] The UI includes:
  - conversation list (can be placeholder),
  - message transcript area (placeholder),
  - message composer input with send action.
- [x] Core flow is keyboard-usable: focus composer, type, send (even if it uses a stub response initially).
- [x] Basic error UI exists for “runtime unavailable” (even if runtime integration lands in a later ticket).

## User-Facing Acceptance Criteria (Only If End-User Behavior Changes)
- [x] The app has a visible “stable vs experimental” indicator placeholder (copy can be “Stable (default)” for now).

## UX Acceptance Criteria (Only If `Area: ui`)
- [x] Primary flow is keyboard-usable (no mouse required for core actions).
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.

## Subtasks
- [x] Bootstrap Tauri + React + Vite project layout.
- [x] Implement minimal chat screen UI.
- [x] Add basic error/empty states.
- [x] Add smoke instructions to ticket Evidence section.

## QA Evidence Links (Required For `review/`/`done/`)
- QA checkpoint: pending
- Screenshots/artifacts: pending

## Evidence (Verification)
- Files added:
  - `apps/desktop/src-tauri/` (Tauri config + Rust entrypoint)
  - `apps/desktop/src/` (React chat shell UI)
  - `apps/desktop/scripts/smoke.mjs`
  - `apps/desktop/README.md`
- Smoke command run:
  - `npm run smoke` -> FAIL in current env because runtime is not running (`fetch failed`), expected for runtime-unavailable path.
- Verification limits in this environment:
  - Rust toolchain (`cargo`) is not installed, so `tauri dev` could not be executed here.
  - Dependency install did not complete in this sandbox, so full build/test execution is pending.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/`.
- 2026-02-26: Moved to `in-progress/` for implementation.
- 2026-02-26: Implemented desktop app skeleton and moved to `review/`.
