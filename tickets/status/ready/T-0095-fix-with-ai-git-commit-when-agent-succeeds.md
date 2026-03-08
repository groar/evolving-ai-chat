# T-0095: Fix with AI — git commit when agent succeeds

## Metadata
- ID: T-0095
- Status: ready
- Priority: P1
- Type: bug
- Area: core
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08

## Summary
When the Fix with AI flow completes successfully (pi agent produces the right result and diff), the apply pipeline can fail with `patch_timeout` before reaching git commit. The user expects changes to be committed when the agent succeeds. Currently, the sandboxed `npm run validate` step has a 180s timeout; if it exceeds that, the pipeline fails and no commit occurs.

## Context
- User feedback F-20260308-002: "Once the pi agent had finished shipping everything, nothing got git committed."
- Observed in PA-20260308-c4c0a418: pi produced valid diff and lifecycle artifacts; apply failed with `patch_timeout` during validate step.
- `_PATCH_TIMEOUT = 180` in `apply_pipeline.py`; sandboxed validate runs in temp copy.

## References
- `apps/desktop/runtime/agent/apply_pipeline.py` — `_PATCH_TIMEOUT`, `_sandboxed_validate`
- `docs/m13-self-evolve-reliability.md`
- F-20260308-002

## Feedback References
- F-20260308-002

## Acceptance Criteria
- [ ] When pi agent produces a valid diff and the apply pipeline runs, either:
  - (a) The validate step completes within a reasonable timeout and git commit succeeds, or
  - (b) The timeout is configurable/increased so typical runs complete, or
  - (c) A documented fallback path exists for when validate times out (e.g. user can retry with relaxed gate).
- [ ] `uv run pytest` exits 0.
- [ ] No regression: scope-blocked or validation-failed patches still do not get committed.

## User-Facing Acceptance Criteria
- [ ] User sees a git commit when the Fix with AI agent successfully produces and applies a change (under normal conditions).

## Dependencies / Sequencing
- Depends on: none
- Blocks: none

## Notes
- Root cause: `patch_timeout` during sandboxed validate. Options: increase timeout, make configurable via env, or add retry with extended timeout.
- T-0086 already addressed patch_timeout error reporting; this ticket focuses on ensuring commit happens when agent output is valid.

## Change Log
- 2026-03-08: Ticket created from F-20260308-002.
