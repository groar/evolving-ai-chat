"""Tests for M8 apply/rollback pipeline (T-0060).

Unit tests cover:
  - base_ref mismatch → apply_failed
  - build-gate failure → apply_failed, no git commit
  - rollback on a non-applied artifact → RollbackError
  - rollback conflict handling
  - rollback_unavailable when commit SHA is gone

Integration tests (real git repo, npm validate mocked):
  - apply a patch → verify git commit exists → rollback → verify revert commit
  - build-gate failure → verify no git commit was created
  - POST /agent/rollback endpoint wiring
"""

from __future__ import annotations

import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import SkipTest
from unittest.mock import MagicMock, patch as mock_patch

import pytest
from fastapi.testclient import TestClient

from runtime.agent.apply_pipeline import ApplyError, ApplyPipeline, RollbackError, _apply_patch
from runtime.agent.patch_agent import PatchArtifact
from runtime.agent.patch_storage import PatchStorage
from runtime.main import app
from runtime.storage import RuntimeStorage

# Integration tests create real git repos. The sandbox restricts writes to
# the system temp dir (/var/folders), so we root test repos inside the workspace.
_WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
_TEST_TMP_BASE = _WORKSPACE_ROOT / ".test-tmp"
_TEST_TMP_BASE.mkdir(exist_ok=True)

# Integration tests rely on a real git binary and filesystem permissions that allow
# creating `.git/hooks/`. In sandboxed/CI environments where this is blocked, they
# are skipped unless RUN_INTEGRATION_TESTS=1 is set.
_RUN_INTEGRATION_TESTS = os.environ.get("RUN_INTEGRATION_TESTS") == "1"


# ---------------------------------------------------------------------------
# Fixture helpers
# ---------------------------------------------------------------------------

_APP_TSX_ORIGINAL = "// Evolving AI Chat\nimport React from 'react';\n"
_APP_TSX_PATCHED = "// Evolving AI Chat — your personal assistant\nimport React from 'react';\n"

_STUB_DIFF = (
    "--- a/apps/desktop/src/App.tsx\n"
    "+++ b/apps/desktop/src/App.tsx\n"
    "@@ -1,2 +1,2 @@\n"
    "-// Evolving AI Chat\n"
    "+// Evolving AI Chat — your personal assistant\n"
    " import React from 'react';\n"
)


def _init_git_repo(repo: Path) -> None:
    """Initialise a git repo with git config, apps/desktop/src/App.tsx, and an initial commit.

    In environments where git cannot create .git/hooks (for example the Cursor sandbox),
    these tests are treated as integration tests and are skipped unless RUN_INTEGRATION_TESTS=1.
    """
    if not _RUN_INTEGRATION_TESTS:
        raise SkipTest(
            "Integration git repo setup requires a real git environment; "
            "set RUN_INTEGRATION_TESTS=1 to run these tests."
        )
    subprocess.run(["git", "init", "--template=", str(repo)], check=True, capture_output=True)
    subprocess.run(
        ["git", "config", "user.email", "ci@test.local"],
        cwd=str(repo), check=True, capture_output=True,
    )
    subprocess.run(
        ["git", "config", "user.name", "CI Test"],
        cwd=str(repo), check=True, capture_output=True,
    )
    src = repo / "apps" / "desktop" / "src"
    src.mkdir(parents=True)
    (src / "App.tsx").write_text(_APP_TSX_ORIGINAL, encoding="utf-8")
    subprocess.run(["git", "add", "."], cwd=str(repo), check=True, capture_output=True)
    subprocess.run(
        ["git", "commit", "-m", "initial"],
        cwd=str(repo), check=True, capture_output=True,
    )


def _head_sha(repo: Path) -> str:
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=str(repo), capture_output=True, text=True,
    )
    return result.stdout.strip()


def _git_log_oneline(repo: Path, n: int = 5) -> str:
    result = subprocess.run(
        ["git", "log", "--oneline", f"-{n}"],
        cwd=str(repo), capture_output=True, text=True,
    )
    return result.stdout


def _make_artifact(patch_id: str, repo: Path) -> PatchArtifact:
    return PatchArtifact(
        id=patch_id,
        created_at="2026-03-02T00:00:00+00:00",
        feedback_id="FB-test-001",
        base_ref=_head_sha(repo),
        status="pending_apply",
        title="Updated welcome copy",
        description="Changed the greeting to be more conversational.",
        files_changed=["apps/desktop/src/App.tsx"],
        unified_diff=_STUB_DIFF,
        scope_violations=[],
        agent_model="stub",
        agent_harness="stub-v1",
    )


# ---------------------------------------------------------------------------
# Unit tests — ApplyPipeline internals
# ---------------------------------------------------------------------------

@pytest.mark.integration
class BaseRefCheckTests(unittest.TestCase):
    def _make_pipeline(self, repo: Path) -> ApplyPipeline:
        storage = PatchStorage(storage_dir=repo / "patches")
        return ApplyPipeline(repo_root=repo, patch_storage=storage)

    def test_matching_base_ref_passes(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            repo = Path(tmp) / "repo"
            repo.mkdir()
            _init_git_repo(repo)
            pipeline = self._make_pipeline(repo)
            sha = _head_sha(repo)
            # Should not raise
            pipeline._check_base_ref(sha)

    def test_short_sha_prefix_passes(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            repo = Path(tmp) / "repo"
            repo.mkdir()
            _init_git_repo(repo)
            pipeline = self._make_pipeline(repo)
            sha = _head_sha(repo)[:7]
            pipeline._check_base_ref(sha)

    def test_wrong_sha_raises_base_ref_mismatch(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            repo = Path(tmp) / "repo"
            repo.mkdir()
            _init_git_repo(repo)
            pipeline = self._make_pipeline(repo)
            with self.assertRaises(ApplyError) as ctx:
                pipeline._check_base_ref("deadbeef00000000000000000000000000000000")
            self.assertEqual(ctx.exception.reason, "base_ref_mismatch")


@pytest.mark.integration
class RollbackErrorConditionsTests(unittest.TestCase):
    def _make_pipeline_and_storage(self, repo: Path) -> tuple[ApplyPipeline, PatchStorage]:
        storage = PatchStorage(storage_dir=repo / "patches")
        return ApplyPipeline(repo_root=repo, patch_storage=storage), storage

    def test_rollback_non_applied_artifact_raises(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            repo = Path(tmp) / "repo"
            repo.mkdir()
            _init_git_repo(repo)
            pipeline, storage = self._make_pipeline_and_storage(repo)
            artifact = _make_artifact("PA-not-applied", repo)
            artifact.status = "pending_apply"
            storage.save(artifact)
            with self.assertRaises(RollbackError) as ctx:
                pipeline.rollback(artifact)
            self.assertEqual(ctx.exception.reason, "not_applied")

    def test_rollback_missing_commit_sha_raises(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            repo = Path(tmp) / "repo"
            repo.mkdir()
            _init_git_repo(repo)
            pipeline, storage = self._make_pipeline_and_storage(repo)
            artifact = _make_artifact("PA-no-sha", repo)
            artifact.status = "applied"
            artifact.git_commit_sha = None
            storage.save(artifact)
            with self.assertRaises(RollbackError) as ctx:
                pipeline.rollback(artifact)
            self.assertEqual(ctx.exception.reason, "no_commit_sha")


# ---------------------------------------------------------------------------
# Integration tests — real git repo, npm validate mocked
# ---------------------------------------------------------------------------

@pytest.mark.integration
class ApplyIntegrationTests(unittest.TestCase):
    """Real git operations; _sandboxed_validate is mocked to skip npm."""

    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE)
        tmp = Path(self._tmpdir.name)
        self._repo = tmp / "repo"
        self._repo.mkdir()
        _init_git_repo(self._repo)

        self._patch_dir = tmp / "patches"
        self._storage = PatchStorage(storage_dir=self._patch_dir)
        self._pipeline = ApplyPipeline(
            repo_root=self._repo,
            patch_storage=self._storage,
        )

    def tearDown(self) -> None:
        self._tmpdir.cleanup()

    def test_apply_creates_git_commit(self) -> None:
        """Successful apply: correct commit message, git log updated, artifact applied."""
        artifact = _make_artifact("PA-int-001", self._repo)
        self._storage.save(artifact)

        initial_sha = _head_sha(self._repo)

        with mock_patch.object(self._pipeline, "_sandboxed_validate"):
            updated = self._pipeline.apply(artifact)

        self.assertEqual(updated.status, "applied")
        self.assertIsNotNone(updated.applied_at)
        self.assertIsNotNone(updated.git_commit_sha)
        self.assertNotEqual(updated.git_commit_sha, initial_sha)

        log = _git_log_oneline(self._repo)
        self.assertIn("agent(m8):", log)
        self.assertIn("PA-int-001", log)
        self.assertIn("Updated welcome copy", log)

        # Verify file was actually modified
        content = (self._repo / "apps" / "desktop" / "src" / "App.tsx").read_text()
        self.assertIn("your personal assistant", content)

    def test_apply_then_rollback(self) -> None:
        """Apply followed by rollback: revert commit exists, artifact shows reverted."""
        artifact = _make_artifact("PA-int-002", self._repo)
        self._storage.save(artifact)

        with mock_patch.object(self._pipeline, "_sandboxed_validate"):
            applied = self._pipeline.apply(artifact)

        self.assertEqual(applied.status, "applied")
        apply_sha = applied.git_commit_sha
        self.assertIsNotNone(apply_sha)

        reverted = self._pipeline.rollback(applied)

        self.assertEqual(reverted.status, "reverted")
        self.assertIsNotNone(reverted.reverted_at)
        self.assertIsNotNone(reverted.revert_commit_sha)
        self.assertNotEqual(reverted.revert_commit_sha, apply_sha)

        log = _git_log_oneline(self._repo, n=5)
        self.assertIn("Revert", log)

        # File content should be restored to original
        content = (self._repo / "apps" / "desktop" / "src" / "App.tsx").read_text()
        self.assertIn("// Evolving AI Chat\n", content)

    def test_build_gate_failure_no_git_commit(self) -> None:
        """Build-gate failure: artifact is apply_failed, no new git commit is created."""
        artifact = _make_artifact("PA-int-003", self._repo)
        self._storage.save(artifact)

        initial_sha = _head_sha(self._repo)

        with mock_patch.object(
            self._pipeline,
            "_sandboxed_validate",
            side_effect=ApplyError("validation_failed", "lint: 3 errors"),
        ):
            updated = self._pipeline.apply(artifact)

        self.assertEqual(updated.status, "apply_failed")
        self.assertEqual(updated.failure_reason, "validation_failed")
        self.assertIsNone(updated.git_commit_sha)

        # HEAD must not have moved
        self.assertEqual(_head_sha(self._repo), initial_sha)

        # Git log should only show the initial commit
        log = _git_log_oneline(self._repo)
        self.assertNotIn("agent(m8):", log)

    def test_base_ref_mismatch_no_git_commit(self) -> None:
        """base_ref mismatch: artifact apply_failed, source files unchanged."""
        artifact = _make_artifact("PA-int-004", self._repo)
        artifact.base_ref = "deadbeef00000000000000000000000000000000"
        self._storage.save(artifact)

        initial_sha = _head_sha(self._repo)
        initial_content = (self._repo / "apps" / "desktop" / "src" / "App.tsx").read_text()

        updated = self._pipeline.apply(artifact)

        self.assertEqual(updated.status, "apply_failed")
        self.assertEqual(updated.failure_reason, "base_ref_mismatch")
        self.assertEqual(_head_sha(self._repo), initial_sha)
        content = (self._repo / "apps" / "desktop" / "src" / "App.tsx").read_text()
        self.assertEqual(content, initial_content)

    def test_rollback_conflict_sets_status_and_raises(self) -> None:
        """Simulated revert conflict: artifact set to rollback_conflict, error raised."""
        artifact = _make_artifact("PA-int-005", self._repo)
        artifact.status = "applied"
        artifact.git_commit_sha = _head_sha(self._repo)
        self._storage.save(artifact)

        with mock_patch("runtime.agent.apply_pipeline._git") as mock_git:
            # cat-file succeeds (commit reachable), then revert fails (conflict)
            cat_ok = MagicMock()
            cat_ok.returncode = 0
            revert_fail = MagicMock()
            revert_fail.returncode = 1
            revert_fail.stderr = "CONFLICT (content): Merge conflict in App.tsx"
            abort_ok = MagicMock()
            abort_ok.returncode = 0
            mock_git.side_effect = [cat_ok, revert_fail, abort_ok]

            with self.assertRaises(RollbackError) as ctx:
                self._pipeline.rollback(artifact)

        self.assertEqual(ctx.exception.reason, "rollback_conflict")

        latest = self._storage.load("PA-int-005")
        self.assertIsNotNone(latest)
        self.assertEqual(latest.status, "rollback_conflict")  # type: ignore[union-attr]

    def test_apply_git_commit_sha_and_revert_sha_recorded_in_storage(self) -> None:
        """Verify both git_commit_sha and revert_commit_sha are persisted to storage."""
        artifact = _make_artifact("PA-int-006", self._repo)
        self._storage.save(artifact)

        with mock_patch.object(self._pipeline, "_sandboxed_validate"):
            applied = self._pipeline.apply(artifact)

        stored = self._storage.load("PA-int-006")
        self.assertIsNotNone(stored)
        self.assertEqual(stored.git_commit_sha, applied.git_commit_sha)  # type: ignore[union-attr]

        reverted = self._pipeline.rollback(applied)

        stored2 = self._storage.load("PA-int-006")
        self.assertIsNotNone(stored2)
        self.assertEqual(stored2.revert_commit_sha, reverted.revert_commit_sha)  # type: ignore[union-attr]
        self.assertIsNotNone(stored2.revert_commit_sha)  # type: ignore[union-attr]


# ---------------------------------------------------------------------------
# Integration tests — POST /agent/rollback endpoint wiring
# ---------------------------------------------------------------------------

@pytest.mark.integration
class RollbackEndpointTests(unittest.TestCase):
    """Tests for POST /agent/rollback via FastAPI TestClient."""

    def _make_applied_artifact(self, patch_id: str, git_sha: str) -> PatchArtifact:
        return PatchArtifact(
            id=patch_id,
            created_at="2026-03-02T00:00:00+00:00",
            feedback_id="FB-rollback-test",
            base_ref=git_sha,
            status="applied",
            title="Endpoint rollback test",
            description="Test.",
            files_changed=["apps/desktop/src/App.tsx"],
            unified_diff=_STUB_DIFF,
            scope_violations=[],
            agent_model="stub",
            agent_harness="stub-v1",
            git_commit_sha=git_sha,
        )

    def _ctx(self, patch_dir: Path, pipeline: ApplyPipeline):
        db_fd, db_path = tempfile.mkstemp(suffix=".db", dir=_TEST_TMP_BASE)
        os.close(db_fd)
        storage = RuntimeStorage(db_path=db_path)
        ps = PatchStorage(storage_dir=patch_dir)
        return (
            mock_patch("runtime.main.storage", storage),
            mock_patch("runtime.main.patch_storage", ps),
            mock_patch("runtime.main.apply_pipeline", pipeline),
            ps,
        )

    def test_rollback_nonexistent_patch_returns_404(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            patch_dir = Path(tmp) / "patches"
            pipeline = MagicMock()
            ctx = self._ctx(patch_dir, pipeline)
            with ctx[0], ctx[1], ctx[2]:
                client = TestClient(app)
                resp = client.post("/agent/rollback", json={"patch_id": "PA-doesnotexist"})
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(resp.json()["error"], "patch_not_found")

    def test_rollback_success_returns_reverted(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            tmp_path = Path(tmp)
            repo = tmp_path / "repo"
            repo.mkdir()
            _init_git_repo(repo)

            patch_dir = tmp_path / "patches"
            ps = PatchStorage(storage_dir=patch_dir)
            pipeline = ApplyPipeline(repo_root=repo, patch_storage=ps)

            sha = _head_sha(repo)
            artifact = self._make_applied_artifact("PA-ep-001", sha)
            ps.save(artifact)

            db_fd, db_path = tempfile.mkstemp(suffix=".db", dir=_TEST_TMP_BASE)
            os.close(db_fd)
            storage = RuntimeStorage(db_path=db_path)

            with (
                mock_patch("runtime.main.storage", storage),
                mock_patch("runtime.main.patch_storage", ps),
                mock_patch("runtime.main.apply_pipeline", pipeline),
                mock_patch.object(pipeline, "rollback") as mock_rollback,
            ):
                reverted_artifact = PatchArtifact(
                    id="PA-ep-001",
                    created_at="2026-03-02T00:00:00+00:00",
                    feedback_id="FB-rollback-test",
                    base_ref=sha,
                    status="reverted",
                    title="Endpoint rollback test",
                    description="Test.",
                    files_changed=["apps/desktop/src/App.tsx"],
                    unified_diff=_STUB_DIFF,
                    scope_violations=[],
                    agent_model="stub",
                    agent_harness="stub-v1",
                    git_commit_sha=sha,
                    revert_commit_sha="revertsha123",
                )
                mock_rollback.return_value = reverted_artifact

                client = TestClient(app)
                resp = client.post("/agent/rollback", json={"patch_id": "PA-ep-001"})

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "reverted")
        self.assertEqual(data["revert_commit_sha"], "revertsha123")

    def test_rollback_conflict_returns_conflict_status(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            patch_dir = Path(tmp) / "patches"
            ps = PatchStorage(storage_dir=patch_dir)

            tmp_repo = Path(tmp) / "repo"
            tmp_repo.mkdir(parents=True)
            _init_git_repo(tmp_repo)
            pipeline = ApplyPipeline(repo_root=tmp_repo, patch_storage=ps)

            sha = _head_sha(tmp_repo)
            artifact = self._make_applied_artifact("PA-ep-002", sha)
            ps.save(artifact)

            db_fd, db_path = tempfile.mkstemp(suffix=".db", dir=_TEST_TMP_BASE)
            os.close(db_fd)
            storage = RuntimeStorage(db_path=db_path)

            conflict_artifact = PatchArtifact(
                id="PA-ep-002",
                created_at="2026-03-02T00:00:00+00:00",
                feedback_id="FB-rollback-test",
                base_ref=sha,
                status="rollback_conflict",
                title="Endpoint rollback test",
                description="Test.",
                files_changed=["apps/desktop/src/App.tsx"],
                unified_diff=_STUB_DIFF,
                scope_violations=[],
                agent_model="stub",
                agent_harness="stub-v1",
                git_commit_sha=sha,
                failure_reason="revert_conflict",
            )

            with (
                mock_patch("runtime.main.storage", storage),
                mock_patch("runtime.main.patch_storage", ps),
                mock_patch("runtime.main.apply_pipeline", pipeline),
                mock_patch.object(
                    pipeline,
                    "rollback",
                    side_effect=RollbackError("rollback_conflict", "Merge conflict"),
                ),
                mock_patch.object(ps, "load", return_value=conflict_artifact),
            ):
                client = TestClient(app)
                resp = client.post("/agent/rollback", json={"patch_id": "PA-ep-002"})

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "rollback_conflict")
        self.assertEqual(data["reason"], "rollback_conflict")


# ---------------------------------------------------------------------------
# Unit tests — _apply_patch helper
# ---------------------------------------------------------------------------

class ApplyPatchHelperTests(unittest.TestCase):
    def test_applies_diff_to_file(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "apps" / "desktop" / "src").mkdir(parents=True)
            target = tmp_path / "apps" / "desktop" / "src" / "App.tsx"
            target.write_text(_APP_TSX_ORIGINAL, encoding="utf-8")

            _apply_patch(_STUB_DIFF, tmp_path, strip=1)

            content = target.read_text(encoding="utf-8")
            self.assertIn("your personal assistant", content)
            self.assertNotIn("// Evolving AI Chat\n", content)

    def test_empty_diff_raises_apply_error(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            with self.assertRaises(ApplyError) as ctx:
                _apply_patch("", Path(tmp), strip=1)
            self.assertEqual(ctx.exception.reason, "empty_or_malformed_patch")

    def test_malformed_diff_raises_apply_error(self) -> None:
        with tempfile.TemporaryDirectory(dir=_TEST_TMP_BASE) as tmp:
            with self.assertRaises(ApplyError) as ctx:
                _apply_patch("this is not a valid diff", Path(tmp), strip=1)
            self.assertIn(ctx.exception.reason, ("patch_apply_failed", "empty_or_malformed_patch"))


if __name__ == "__main__":
    unittest.main()
