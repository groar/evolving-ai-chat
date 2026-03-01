# T-0060: M8 git-backed apply and rollback

## Metadata
- ID: T-0060
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Implement the apply and rollback paths for accepted patch artifacts. On apply: run a sandboxed build gate (`npm run validate`) against the patch, write the diff to source files, and create a named git commit. On rollback: run `git revert` to create a revert commit, trigger rebuild, and update artifact status. Handle all failure modes (base_ref mismatch, build failure, revert conflict) with explicit status transitions and user-facing messages.

## Context
- Spec: `docs/m8-code-loop.md` §§3.3, 3.4, 7.
- Apply is triggered automatically after T-0059 creates a clean patch artifact (no user approval gate).
- Rollback is triggered by the user via the UI (T-0061) calling `POST /agent/rollback`.
- Git is the source of truth for versioning; every change lands as a traceable commit.

## References
- `docs/m8-code-loop.md`
- `apps/desktop/runtime/` (runtime server)

## Feedback References
- F-20260301-008

## Acceptance Criteria
- [ ] After a patch artifact reaches `status: pending_apply`, the runtime automatically starts the apply pipeline (no manual trigger needed).
- [ ] Apply pipeline steps execute in order: (1) base_ref check, (2) write patch to temp copy, (3) run `npm run validate`, (4) on pass: write to working copy + git commit, (5) trigger Vite hot-reload or rebuild.
- [ ] Commit message format: `agent(m8): <title> [PA-<id>]`.
- [ ] On build-gate failure: artifact set to `apply_failed` with `reason: validation_failed` + captured test output; no commit created; source files unchanged.
- [ ] On base_ref mismatch: artifact set to `apply_failed` with `reason: base_ref_mismatch`; source files unchanged.
- [ ] `POST /agent/rollback` accepts `{ patch_id }` and runs `git revert <git_commit_sha> --no-edit` for applied patches.
- [ ] On revert success: artifact status set to `reverted`, `revert_commit_sha` recorded, rebuild triggered.
- [ ] On revert conflict: abort revert (no partial state), artifact status `rollback_conflict`, user-facing reason returned.
- [ ] `git_commit_sha` and `revert_commit_sha` are recorded in the patch artifact JSON.
- [ ] Integration test: apply a real patch to a test fixture → verify git log has the expected commit → rollback → verify git log has revert commit.
- [ ] Integration test: build-gate failure → no commit in git log.

## Dependencies / Sequencing
- Depends on: T-0059 (patch artifacts).
- Blocks: T-0061 (UI reads status transitions from this layer).

## Evidence (Verification)
_(to be filled during implementation)_

## Subtasks
- [ ] Apply pipeline (base_ref check, temp copy + validate, git commit, hot-reload)
- [ ] Rollback endpoint (`POST /agent/rollback`, `git revert`, conflict handling)
- [ ] Artifact status transitions wired end-to-end
- [ ] Integration tests (apply + rollback, build failure, revert conflict)

## Change Log
- 2026-03-01: Created from T-0058 design spec (M8 implementation ticket 2 of 3).
