# T-0013: Change proposal artifact (format + storage)

## Metadata
- ID: T-0013
- Status: review
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0002
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-27

## Summary
Define and persist a local "change proposal" artifact that links feedback to a bounded proposed change, with validation results and an accept/reject decision record.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Make proposals auditable and reviewable (what changes, why, risk).
  - Provide a stable container to attach validation outputs.
- Non-goals:
  - Full git-PR workflow.
  - Multi-proposal dependency graphs.
- Rules and state transitions:
  - Proposal fields (minimum):
    - `proposal_id`, `created_at`, `title`, `rationale`,
    - `source_feedback_ids` (0+),
    - `diff_summary` (human readable; can be empty initially),
    - `risk_notes`,
    - `validation_runs` (0+ summary objects),
    - `decision` (`pending`, `accepted`, `rejected`) with timestamp and optional notes.
  - A proposal is not eligible for acceptance unless the most recent validation run is passing.
  - If rejected, record a note (why) but do not generate a changelog entry.
- User-facing feedback plan:
  - v1 can keep proposals visible only in a settings/dev surface.
- Scope bounds:
  - Local-only persistence.
  - Only store summaries and references to validation artifacts (avoid large blobs in DB if possible).
- Edge cases / failure modes:
  - Corrupt proposal storage: show non-blocking error; allow creating a new proposal.
- Validation plan:
  - Deterministic: unit test the model/serialization; smoke flow for create + attach validation summary.

## Context
Without a durable proposal artifact, the loop cannot be audited or repeated safely.

## References
- `STATUS.md`
- `tickets/meta/epics/E-0002-m1-first-self-improvement-cycle.md`
- `tickets/status/done/T-0007-validation-gates-and-sandboxed-verification-runner.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [x] Proposal format is documented and implemented (model + persistence).
- [x] A proposal can reference 1+ feedback items and store a validation summary.
- [x] Accept/reject decisions are persisted with timestamps and notes.
- [x] Acceptance is blocked when validation is failing.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-02-27-qa-checkpoint-t0013.md`
- Screenshots/artifacts: `tickets/meta/qa/artifacts/runtime-smoke/` (storage smoke output in terminal log)

## Evidence (Verification)
- Tests run:
  - `npm run smoke:storage` (pass; includes proposal create + validation summary flow checks).
  - `python3 -m unittest runtime.test_proposals` (blocked in this environment: `ModuleNotFoundError: No module named 'pydantic'`).
- Manual checks performed:
  - Reviewed new API decision guard logic to confirm `accepted` is rejected unless the most recent validation run is `passing`.
  - Verified proposal records include feedback IDs, validation runs, and decision metadata in runtime state payload.
- Screenshots/logs/notes:
  - Console output confirms proposal smoke assertions pass (feedback linkage + validation run persistence).

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-27: Moved to `ready/` after M1 loop spec completed.
- 2026-02-27: Moved to `in-progress/` for implementation pickup.
- 2026-02-27: Implemented proposal persistence, API endpoints, acceptance guardrail, and smoke coverage.
- 2026-02-27: Moved to `review/` with implementation evidence and QA checkpoint link.
