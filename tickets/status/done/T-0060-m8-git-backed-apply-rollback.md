# T-0060: M8 git-backed apply and rollback

## Metadata
- ID: T-0060
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-02
- Accepted: 2026-03-02

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
- [x] After a patch artifact reaches `status: pending_apply`, the runtime automatically starts the apply pipeline (no manual trigger needed).
- [x] Apply pipeline steps execute in order: (1) base_ref check, (2) write patch to temp copy, (3) run `npm run validate`, (4) on pass: write to working copy + git commit, (5) trigger Vite hot-reload or rebuild.
- [x] Commit message format: `agent(m8): <title> [PA-<id>]`.
- [x] On build-gate failure: artifact set to `apply_failed` with `reason: validation_failed` + captured test output; no commit created; source files unchanged.
- [x] On base_ref mismatch: artifact set to `apply_failed` with `reason: base_ref_mismatch`; source files unchanged.
- [x] `POST /agent/rollback` accepts `{ patch_id }` and runs `git revert <git_commit_sha> --no-edit` for applied patches.
- [x] On revert success: artifact status set to `reverted`, `revert_commit_sha` recorded, rebuild triggered.
- [x] On revert conflict: abort revert (no partial state), artifact status `rollback_conflict`, user-facing reason returned.
- [x] `git_commit_sha` and `revert_commit_sha` are recorded in the patch artifact JSON.
- [x] Integration test: apply a real patch to a test fixture → verify git log has the expected commit → rollback → verify git log has revert commit.
- [x] Integration test: build-gate failure → no commit in git log.

## Dependencies / Sequencing
- Depends on: T-0059 (patch artifacts).
- Blocks: T-0061 (UI reads status transitions from this layer).

## Evidence (Verification)
- **New file**: `apps/desktop/runtime/agent/apply_pipeline.py` — `ApplyPipeline` class with:
  - `_check_base_ref()`: compares artifact `base_ref` against `git rev-parse HEAD`; raises `ApplyError("base_ref_mismatch")` on drift
  - `_sandboxed_validate()`: copies `apps/desktop/` to temp dir (mirroring repo layout), applies unified diff via `patch -p1`, runs `npm run validate`; raises `ApplyError("validation_failed")` on non-zero exit; real files never touched
  - `_apply_and_commit()`: applies diff to real working copy, `git add`, `git commit -m "agent(m8): <title> [PA-<id>]"`, captures SHA
  - `rollback()`: `git cat-file -e` reachability check → `git revert <sha> --no-edit` → on conflict: `git revert --abort`, status `rollback_conflict`
- **Modified**: `apps/desktop/runtime/models.py` — `RollbackRequest`, `RollbackResponse` models added
- **Modified**: `apps/desktop/runtime/main.py` — `POST /agent/rollback` endpoint; `ApplyPipeline` instantiated; `POST /agent/code-patch` triggers `apply_pipeline.apply()` via `BackgroundTasks`
- **New test file**: `apps/desktop/runtime/test_apply_rollback.py` — 17 tests, all green:
  - `test_apply_creates_git_commit` — verifies commit message and git log
  - `test_apply_then_rollback` — end-to-end: apply → verify commit → rollback → verify revert commit + file restoration
  - `test_build_gate_failure_no_git_commit` — mocked validation failure → `apply_failed`, HEAD unchanged
  - `test_base_ref_mismatch_no_git_commit` — wrong `base_ref` → `apply_failed`, source files unchanged
  - `test_rollback_conflict_sets_status_and_raises` — mocked `git revert` conflict → `rollback_conflict` in storage
  - `test_apply_git_commit_sha_and_revert_sha_recorded_in_storage` — both SHAs persisted to JSON
  - Endpoint tests: 404 on unknown patch, rollback success → `reverted`, conflict → `rollback_conflict`
  - Helper tests: `_apply_patch` correct application, empty/malformed diff errors
- **Test run**: `17 passed, 0 failed` (run: `uv run --with pytest --with httpx ...`); existing 27 T-0059 tests unaffected

## Subtasks
- [x] Apply pipeline (base_ref check, temp copy + validate, git commit, hot-reload)
- [x] Rollback endpoint (`POST /agent/rollback`, `git revert`, conflict handling)
- [x] Artifact status transitions wired end-to-end
- [x] Integration tests (apply + rollback, build failure, revert conflict)

## Change Log
- 2026-03-01: Created from T-0058 design spec (M8 implementation ticket 2 of 3).
- 2026-03-02: Implementation complete. `ApplyPipeline` class, `POST /agent/rollback` endpoint, background apply trigger. 17 integration tests, all green.
- 2026-03-02: QA PASS — 44/44 tests (17 new + 27 regression). No blocking findings. `.test-tmp/` added to `.gitignore`. Accepted by PM.
