# QA Checkpoint - 2026-02-26

## Scope Tested
- Ticket: T-0003 (`tickets/status/review/T-0003-desktop-app-skeleton-tauri-react.md`)
- Area: desktop UI shell + runtime-unavailable handling

## Automated Test Outcomes
- `npm run build` (apps/desktop): PASS.
- `npm test` (apps/desktop): FAIL (`No test files found`), treated as coverage gap rather than behavior failure.
- `npm run smoke` with runtime down: FAIL as expected (`fetch failed`), validating runtime-unavailable path.
- `npm run smoke` with `npm run runtime:stub` active: PASS (`Runtime health endpoint`).
- `npm run tauri:dev` startup probe: PASS (Vite started, Rust build finished, app process started).

## Manual Scenarios Executed
- Normal flow scenario: local runtime available + smoke check passes for `/health`.
- Edge-case scenario: runtime unavailable + smoke check fails deterministically and matches expected unavailable behavior.

## UI Visual Smoke Check
- Startup-level UI smoke executed via `tauri:dev` launch probe.
- No screenshot captured in this run due non-interactive/headless execution environment.
- Startup logs captured in run output and referenced in ticket evidence.

## Criteria-to-Evidence Mapping
- Tauri app launches without startup errors -> `npm run tauri:dev` probe PASS -> PASS.
- Conversation list/transcript/composer present -> implementation file review (`apps/desktop/src/App.tsx`) + prior implementation evidence -> PASS.
- Keyboard-usable send flow -> Enter-key handler in `App.tsx` and focus management with `inputRef` -> PASS.
- Runtime unavailable error UI -> alert block + runtime-down smoke behavior -> PASS.
- Stable vs experimental indicator placeholder visible -> `channel-pill` renders `Stable (default)` in `App.tsx` -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- No unit/integration tests exist yet for desktop UI behavior; only smoke/build/startup verification was run.
- No screenshot artifact was produced in this checkpoint.

Suggested commit message: `QA: validate T-0003 desktop skeleton and attach smoke/startup evidence`
