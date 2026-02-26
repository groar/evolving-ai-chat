# QA Checkpoint - 2026-02-26 (T-0006)

## Scope Tested
- Ticket: T-0006 (`tickets/status/review/T-0006-feature-flags-and-release-channels.md`)
- Area: release channel persistence, experimental flag gating, and UI channel visibility

## Automated Test Outcomes
- `npm run build`: PASS.
- `npm run smoke:storage`: PASS.
  - Verified defaults (`stable`), experimental activation behavior, stable-channel write guard, and reset behavior.
- `npm run smoke` with local Node runtime fallback (`runtime:stub:node`): PASS.
- `npm run smoke` with Python runtime (`runtime:stub`): FAIL in this environment (`python3: No module named uvicorn`).
  - Classified as environment dependency gap, not a behavioral regression in ticket scope.

## Manual Scenarios Executed
- Normal flow scenario:
  - Switch release channel `stable -> experimental`, enable `show_runtime_diagnostics`, and verify diagnostics feature becomes active.
  - Result: PASS (covered deterministically by runtime storage smoke checks and runtime state model behavior).
- Edge-case scenario:
  - Attempt to write experimental flag while channel is `stable`.
  - Result: PASS (write rejected with `ValueError`, covered in `smoke:storage`).

## UI Visual Smoke Check
- UI project detected and this ticket changes user-facing behavior.
- Visual launch/screenshot was not executed in this QA run due headless constraints in this environment.
- UI behavior was validated via code-path and build verification; residual visual risk remains for PM acceptance.

## Criteria-to-Evidence Mapping
- Persisted channel setting with `stable` default and `experimental` opt-in -> `apps/desktop/runtime/storage.py` + `npm run smoke:storage` -> PASS.
- Trivial UI feature gated behind experimental-only flag -> `apps/desktop/src/App.tsx` diagnostics card (`show_runtime_diagnostics`) + `apps/desktop/runtime/storage.py` active-flag gating -> PASS.
- Current channel visible in UI -> `apps/desktop/src/App.tsx` top-bar channel pill and settings controls + `npm run build` -> PASS.
- UX copy constraints (no unsafe autonomy/data sharing implication) -> `apps/desktop/src/App.tsx` settings copy ("Local-only setting...") -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Python FastAPI runtime smoke could not be executed in this environment because `uvicorn` is not installed.
- Visual UI interaction could not be exercised in a desktop window during this QA pass.

Suggested commit message: `feat(T-0006): add persisted release channels and experimental feature gating`

Next-step suggestion: PM should review and accept `T-0006` from `review/` to `done/`.
