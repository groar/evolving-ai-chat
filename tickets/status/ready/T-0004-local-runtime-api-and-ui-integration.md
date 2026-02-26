# T-0004: Local runtime API and UI integration (stub agent)

## Metadata
- ID: T-0004
- Status: ready
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
- [ ] A local FastAPI service can be started in dev and exposes `GET /health`.
- [ ] The desktop UI can send a message to the runtime and render the runtime’s response.
- [ ] The response payload includes at least: `model_id` (or `stub`), `created_at`, and `cost` (can be 0 for stub).
- [ ] Runtime-down behavior is handled gracefully (error + retry).

## Subtasks
- [ ] Create runtime project skeleton (FastAPI + pydantic models).
- [ ] Add stub “echo”/placeholder agent response.
- [ ] Wire UI to call runtime endpoint.
- [ ] Add minimal smoke instructions to ticket Evidence section.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/`.
