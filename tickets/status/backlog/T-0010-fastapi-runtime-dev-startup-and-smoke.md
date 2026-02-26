# T-0010: FastAPI runtime dev startup + smoke verification

## Metadata
- ID: T-0010
- Status: backlog
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Make the Python FastAPI runtime runnable end-to-end in a normal dev environment (with pinned deps) and add a deterministic smoke check that validates the same `/health` + chat payload contract used by the desktop UI.

## Context
T-0004 established the UI↔runtime contract and added a FastAPI skeleton, but the FastAPI path could not be executed in the restricted sandbox environment (missing `uvicorn` and no network egress for installing deps). This ticket hardens the “real” runtime path so the project stays aligned with `STATUS.md` and the M0 epic intent.

## References
- `STATUS.md`
- `tickets/status/done/T-0004-local-runtime-api-and-ui-integration.md`
- `tickets/meta/qa/2026-02-26-qa-checkpoint-t0004.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] Running the FastAPI runtime in a normal dev environment is a documented, copy-pastable flow (including dependency installation) and results in a listening server.
- [ ] The FastAPI runtime exposes `GET /health` and a chat endpoint that conforms to the payload contract expected by the desktop UI.
- [ ] A deterministic smoke command exists that:
  - starts (or assumes) the FastAPI runtime,
  - sends at least one chat request,
  - asserts the response includes `reply`, `model_id`, `created_at`, and `cost`,
  - exits non-zero on failure.
- [ ] The smoke output is captured to a file suitable for linking from tickets moved to `review/`.

## Subtasks
- [ ] Pin/verify Python dependencies for the runtime (including `uvicorn`) and document install/run steps.
- [ ] Ensure runtime endpoints match the UI contract (update pydantic models if needed).
- [ ] Add/update a smoke script for the FastAPI path and document usage.

## Notes
Non-goal: solving offline dependency installation in restricted sandboxes (that can be handled as part of T-0007, if desired).

## Change Log
- 2026-02-26: Ticket created (follow-up to accept T-0004 with Node stub allowed for now).
