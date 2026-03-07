# T-0091: Retry with failure context — one auto-retry on retriable failures

## Metadata
- ID: T-0091
- Status: ready
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
- [ ] Retry fires automatically on `eval_blocked`, `validation_failed`, or `patch_apply_failed` failures.
- [ ] Retry does NOT fire on `scope_blocked`, `base_ref_mismatch`, `harness_unavailable`, or `patch_timeout`.
- [ ] The retry prompt includes: original change request, failure reason + details (from structured eval/validation output), and the failed diff.
- [ ] The retry prompt uses the PREVIOUS ATTEMPT section of the structured prompt template (T-0089).
- [ ] Max 1 retry (configurable but defaulting to 1).
- [ ] `PatchArtifact.status` gains a `retrying` value. State transitions: `pending_apply → applying → [failure] → retrying → applying → applied` or `→ apply_failed (retry_exhausted)`.
- [ ] On retry exhaustion, status is `apply_failed` with `failure_reason` containing `"retry_exhausted"` and user-facing message: "The coding agent couldn't produce a working change after two attempts. Try refining your feedback and running again."
- [ ] Frontend polling treats `retrying` as an in-progress state (shows working indicator).
- [ ] `uv run pytest` exits 0. At least one test exercises the retry path (mock a retriable failure, verify re-invocation with context).

## Dependencies / Sequencing
- Depends on: T-0089 (prompt template with PREVIOUS ATTEMPT section), T-0090 (structured eval failure results)
- Blocks: none

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Add `retrying` status to `PatchArtifact` model
- [ ] Implement retry logic in the patch generation / apply flow
- [ ] Construct retry context (failure reason + details + failed diff)
- [ ] Wire retry context into the PREVIOUS ATTEMPT prompt section
- [ ] Update frontend to treat `retrying` as in-progress
- [ ] Add unit tests for retry trigger conditions, retry prompt construction, and exhaustion behavior

## Notes
- The retry runs with the same `base_ref` as the original attempt. If the base ref becomes stale during the retry, the base_ref guard will catch it (non-retriable).
- Retry delay is 0s — the retry runs immediately after failure detection.

## Change Log
- 2026-03-07: Ticket created from M13 design spec §9 (rank 3).
