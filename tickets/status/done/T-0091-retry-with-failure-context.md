# T-0091: Retry with failure context — one auto-retry on retriable failures

## Metadata
- ID: T-0091
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07

## Summary
When a patch fails due to a retriable reason (eval_blocked, validation_failed, patch_apply_failed), automatically retry once by re-invoking the patch agent with an enriched prompt containing the failure reason, details, and the failed diff. Add a `retrying` status to `PatchArtifact`. If the retry also fails, set status to `apply_failed` with `failure_reason: "retry_exhausted"`.

## Context
- Currently when a patch fails, the user must manually re-trigger from the UI with no failure context fed back to the agent.
- The M13 design spec (§6) defines the retry strategy: max 1 retry, immediate (no delay), failure context injected via the PREVIOUS ATTEMPT section of the prompt template (T-0089).

## References
- `docs/m13-self-evolve-reliability.md` — §6 (Retry Strategy)
- `apps/desktop/runtime/agent/patch_agent.py` — `_call_pi()` and `generate_patch()`
- `apps/desktop/runtime/agent/apply_pipeline.py` — `apply()` method

## Feedback References
- F-20260307-001

## Acceptance Criteria
- [x] Retry fires automatically on `eval_blocked`, `validation_failed`, or `patch_apply_failed` failures.
- [x] Retry does NOT fire on `scope_blocked`, `base_ref_mismatch`, `harness_unavailable`, or `patch_timeout`.
- [x] The retry prompt includes: original change request, failure reason + details (from structured eval/validation output), and the failed diff.
- [x] The retry prompt uses the PREVIOUS ATTEMPT section of the structured prompt template (T-0089).
- [x] Max 1 retry (configurable but defaulting to 1).
- [x] `PatchArtifact.status` gains a `retrying` value. State transitions: `pending_apply → applying → [failure] → retrying → applying → applied` or `→ apply_failed (retry_exhausted)`.
- [x] On retry exhaustion, status is `apply_failed` with `failure_reason` containing `"retry_exhausted"` and user-facing message: "The coding agent couldn't produce a working change after two attempts. Try refining your feedback and running again."
- [x] Frontend polling treats `retrying` as an in-progress state (shows working indicator).
- [x] `uv run pytest` exits 0. At least one test exercises the retry path (mock a retriable failure, verify re-invocation with context).

## Dependencies / Sequencing
- Depends on: T-0089 (prompt template with PREVIOUS ATTEMPT section), T-0090 (structured eval failure results)
- Blocks: none

## Evidence (Verification)
- Tests run: `uv run pytest test_retry.py test_patch_agent.py` — 43 passed (8 in test_retry.py; 1 new in test_patch_agent: existing_artifact_id on stub). QA run (excl. integration): 49 passed.
- Manual checks performed: None (unit tests + code review; full E2E when runtime available).
- QA checkpoint: `tickets/meta/qa/2026-03-07-qa-T-0091.md` — PASS.

## Subtasks
- [x] Add `retrying` status to `PatchArtifact` model
- [x] Implement retry logic in the patch generation / apply flow
- [x] Construct retry context (failure reason + details + failed diff)
- [x] Wire retry context into the PREVIOUS ATTEMPT prompt section
- [x] Update frontend to treat `retrying` as in-progress
- [x] Add unit tests for retry trigger conditions, retry prompt construction, and exhaustion behavior

## Notes
- The retry runs with the same `base_ref` as the original attempt. If the base ref becomes stale during the retry, the base_ref guard will catch it (non-retriable).
- Retry delay is 0s — the retry runs immediately after failure detection.

## Change Log
- 2026-03-07: Ticket created from M13 design spec §9 (rank 3).
- 2026-03-07: Implementation complete. Added `retrying` to PatchArtifact; `_apply_with_retry` and `_build_retry_context` in main.py; `existing_artifact_id`/`existing_created_at` on generate_patch; frontend treats `retrying` as in-progress in PatchNotification and activitySheet; test_retry.py (8 tests) and test_patch_agent stub test for same-id retry. Moved to review.
- 2026-03-07: QA PASS — all acceptance criteria met; QA checkpoint `tickets/meta/qa/2026-03-07-qa-T-0091.md`. Accepted by PM. Moved to done.
