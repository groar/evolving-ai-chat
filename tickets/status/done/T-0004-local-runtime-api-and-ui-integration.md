# T-0004: Local runtime API and UI integration (stub agent)

## Metadata
- ID: T-0004
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Add a local runtime service (FastAPI) and connect the desktop UI to it so sending a message yields a response (initially stubbed).

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Establish the app↔runtime boundary early (permissions, observability, future tools).
- Non-goals:
  - Full multi-model routing and tool execution in v1.
- Rules and state transitions:
  - UI sends a message payload; runtime returns a response payload with provenance fields.
  - If runtime is down, UI shows a clear error and retry.
- Validation plan:
  - Deterministic: a smoke test that sends a message and receives a stub response.

## References
- `STATUS.md`
- `tickets/meta/epics/E-0001-m0-end-to-end-safe-change-loop.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [x] A local runtime service can be started in dev and exposes `GET /health` (FastAPI preferred; Node stub acceptable for now).
- [x] The desktop UI can send a message to the runtime and render the runtime’s response.
- [x] The response payload includes at least: `model_id` (or `stub`), `created_at`, and `cost` (can be 0 for stub).
- [x] Runtime-down behavior is handled gracefully (error + retry).

## Subtasks
- [x] Create runtime project skeleton (FastAPI + pydantic models).
- [x] Add stub “echo”/placeholder agent response.
- [x] Wire UI to call runtime endpoint.
- [x] Add minimal smoke instructions to ticket Evidence section.

## QA Evidence Links (Required For `review/`/`done/`)
- QA checkpoint: `tickets/meta/qa/2026-02-26-qa-checkpoint-t0004.md`

## Evidence (Verification)
- Runtime implementation:
  - Added `apps/desktop/runtime/main.py` and `apps/desktop/runtime/models.py` with FastAPI + pydantic payload contract.
  - Added `apps/desktop/runtime/requirements.txt` and `npm run runtime:stub` startup command.
- UI integration:
  - Updated `apps/desktop/src/App.tsx` to parse/render `reply`, `model_id`, `created_at`, and `cost`.
  - Added explicit runtime retry action when runtime is unavailable.
- Smoke and build checks:
  - `npm run build` -> PASS.
  - `npm test` -> no test files found (exit 1).
  - `node scripts/smoke.mjs` with runtime process up -> PASS (`Runtime health endpoint`, `Runtime chat payload contract`).
- Environment limits in this run:
  - Direct FastAPI runtime execution failed in sandbox due missing local Python packages (`No module named uvicorn`) and no network access for package download.
  - Added `npm run runtime:stub:node` fallback for local offline validation of the same payload contract.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/`.
- 2026-02-26: Moved to `in-progress/` for implementation.
- 2026-02-26: Implemented local runtime contract (FastAPI skeleton + UI integration) and recorded validation evidence.
- 2026-02-26: Moved to `review/` for QA validation.
- 2026-02-26: QA checkpoint completed; no blocking defects found.
- 2026-02-26: Accepted by PM and moved to `done/` (FastAPI hardening tracked separately).
