# T-0003: Desktop app skeleton (Tauri + React)

## Metadata
- ID: T-0003
- Status: ready
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
- [ ] The UI includes:
  - conversation list (can be placeholder),
  - message transcript area (placeholder),
  - message composer input with send action.
- [ ] Core flow is keyboard-usable: focus composer, type, send (even if it uses a stub response initially).
- [ ] Basic error UI exists for “runtime unavailable” (even if runtime integration lands in a later ticket).

## User-Facing Acceptance Criteria (Only If End-User Behavior Changes)
- [ ] The app has a visible “stable vs experimental” indicator placeholder (copy can be “Stable (default)” for now).

## UX Acceptance Criteria (Only If `Area: ui`)
- [ ] Primary flow is keyboard-usable (no mouse required for core actions).
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.

## Subtasks
- [ ] Bootstrap Tauri + React + Vite project layout.
- [ ] Implement minimal chat screen UI.
- [ ] Add basic error/empty states.
- [ ] Add smoke instructions to ticket Evidence section.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/`.
