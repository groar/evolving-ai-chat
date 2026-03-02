"""
Apply and rollback pipeline for M8 patch artifacts (spec §§3.3, 3.4, 7).

T-0060 responsibilities:
  - base_ref guard: reject apply if HEAD has drifted since patch was generated.
  - Sandboxed build gate: copy desktop dir to temp, apply diff, run npm run validate.
    On failure → apply_failed, no source files modified.
  - Atomic git commit: apply diff to real working copy, git add, git commit with
    message format "agent(m8): <title> [PA-<id>]".
  - Rebuild trigger: best-effort (Vite HMR watches filesystem changes automatically).
  - Rollback: git revert <sha> --no-edit, capture revert SHA, handle conflicts.
"""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from .patch_agent import PatchArtifact
from .patch_storage import PatchStorage

logger = logging.getLogger(__name__)

_VALIDATE_TIMEOUT = 120
_GIT_TIMEOUT = 30
_PATCH_TIMEOUT = 30


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class ApplyError(Exception):
    """Raised when the apply pipeline cannot proceed."""

    def __init__(self, reason: str, details: str = "") -> None:
        super().__init__(reason)
        self.reason = reason
        self.details = details


class RollbackError(Exception):
    """Raised when rollback cannot proceed."""

    def __init__(self, reason: str, details: str = "") -> None:
        super().__init__(reason)
        self.reason = reason
        self.details = details


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

class ApplyPipeline:
    """Apply/rollback pipeline for M8 patch artifacts (spec §§3.3, 3.4)."""

    def __init__(
        self,
        repo_root: Path,
        patch_storage: PatchStorage,
        npm_cmd: str | None = None,
    ) -> None:
        self._repo_root = repo_root
        self._storage = patch_storage
        # Allow override for testing without npm on PATH
        self._npm_cmd = npm_cmd or os.environ.get("NPM_CMD", "npm")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def apply(self, artifact: PatchArtifact) -> PatchArtifact:
        """Run the full apply pipeline. Mutates and returns the updated artifact.

        Status transitions:
          pending_apply → applying → applied          (success)
          pending_apply → applying → apply_failed     (base_ref mismatch / build gate / git error)
        """
        artifact.status = "applying"
        self._storage.save(artifact)

        try:
            self._check_base_ref(artifact.base_ref)
            self._sandboxed_validate(artifact)
            commit_sha = self._apply_and_commit(artifact)

            artifact.status = "applied"
            artifact.applied_at = datetime.now(timezone.utc).isoformat()
            artifact.git_commit_sha = commit_sha
            self._storage.save(artifact)
            self._trigger_reload()

            logger.info("patch %s applied → commit %s", artifact.id, commit_sha)

        except ApplyError as exc:
            artifact.status = "apply_failed"
            artifact.failure_reason = exc.reason
            if exc.details:
                artifact.description = (
                    (artifact.description or "") + f"\n\nFailure details: {exc.details}"
                )
            self._storage.save(artifact)
            logger.warning("patch %s apply_failed reason=%s", artifact.id, exc.reason)

        except Exception:  # noqa: BLE001
            artifact.status = "apply_failed"
            artifact.failure_reason = "unexpected_error"
            self._storage.save(artifact)
            logger.exception("patch %s unexpected error during apply", artifact.id)

        return artifact

    def rollback(self, artifact: PatchArtifact) -> PatchArtifact:
        """Run git revert for an applied artifact. Mutates and returns the updated artifact.

        Status transitions:
          applied → reverted           (success)
          applied → rollback_conflict  (git revert conflict)
          applied → rollback_unavailable (commit no longer reachable)

        Raises RollbackError after updating artifact status in storage on failure paths.
        """
        if artifact.status != "applied":
            raise RollbackError(
                "not_applied",
                f"Artifact {artifact.id} has status {artifact.status!r}; expected 'applied'",
            )
        if not artifact.git_commit_sha:
            raise RollbackError("no_commit_sha", "Artifact has no git_commit_sha recorded")

        sha = artifact.git_commit_sha

        # Verify commit is still reachable (not squashed/rebased away)
        check = _git(["cat-file", "-e", f"{sha}^{{commit}}"], self._repo_root, timeout=10)
        if check.returncode != 0:
            artifact.status = "rollback_unavailable"
            artifact.failure_reason = "commit_not_reachable"
            self._storage.save(artifact)
            raise RollbackError("rollback_unavailable", f"Commit {sha} is not reachable")

        # git revert --no-edit creates a new revert commit (spec §3.4)
        revert = _git(["revert", sha, "--no-edit"], self._repo_root, timeout=60)

        if revert.returncode != 0:
            # Abort to leave working tree clean (no partial state, spec §3.4)
            _git(["revert", "--abort"], self._repo_root, timeout=10)
            artifact.status = "rollback_conflict"
            artifact.failure_reason = "revert_conflict"
            self._storage.save(artifact)
            raise RollbackError("rollback_conflict", revert.stderr.strip()[:500])

        rev_sha_result = _git(["rev-parse", "HEAD"], self._repo_root, timeout=10)
        revert_sha = rev_sha_result.stdout.strip() if rev_sha_result.returncode == 0 else ""

        artifact.status = "reverted"
        artifact.reverted_at = datetime.now(timezone.utc).isoformat()
        artifact.revert_commit_sha = revert_sha
        self._storage.save(artifact)
        self._trigger_reload()

        logger.info("patch %s reverted → revert commit %s", artifact.id, revert_sha)

        return artifact

    # ------------------------------------------------------------------
    # Step 1: base_ref guard
    # ------------------------------------------------------------------

    def _check_base_ref(self, base_ref: str) -> None:
        """Reject apply if the working tree HEAD has drifted since patch was generated."""
        result = _git(["rev-parse", "HEAD"], self._repo_root, timeout=10)
        if result.returncode != 0:
            raise ApplyError("git_unavailable", result.stderr.strip()[:300])
        current_head = result.stdout.strip()
        # Accept if either is a prefix of the other (short vs full SHA comparison)
        short = min(len(base_ref), len(current_head))
        if not (current_head.startswith(base_ref) or base_ref.startswith(current_head[:short])):
            raise ApplyError(
                "base_ref_mismatch",
                f"Patch base_ref={base_ref!r} but current HEAD={current_head!r}",
            )

    # ------------------------------------------------------------------
    # Step 2: sandboxed build gate
    # ------------------------------------------------------------------

    def _sandboxed_validate(self, artifact: PatchArtifact) -> None:
        """Apply diff to a temp copy of the desktop dir and run npm run validate.

        The real working copy is never modified in this step.
        Raises ApplyError(validation_failed) if the gate exits non-zero.
        """
        desktop_dir = self._repo_root / "apps" / "desktop"
        if not desktop_dir.exists():
            raise ApplyError(
                "validation_failed",
                f"Desktop directory not found: {desktop_dir}",
            )

        with tempfile.TemporaryDirectory(prefix="m8-validate-") as tmp:
            tmp_path = Path(tmp)

            # Mirror repo layout so patch -p1 paths resolve: tmp/apps/desktop/src/...
            tmp_apps = tmp_path / "apps"
            tmp_apps.mkdir()
            tmp_desktop = tmp_apps / "desktop"

            shutil.copytree(
                desktop_dir,
                tmp_desktop,
                ignore=shutil.ignore_patterns(
                    "node_modules", ".vite", "dist", "build",
                    "__pycache__", "*.pyc", ".pytest_cache",
                ),
            )

            # Symlink node_modules to avoid re-running npm install
            real_nm = desktop_dir / "node_modules"
            if real_nm.exists():
                (tmp_desktop / "node_modules").symlink_to(
                    real_nm, target_is_directory=True
                )

            # Apply patch to temp copy (strip=1 matches `a/apps/desktop/src/...` paths)
            _apply_patch(artifact.unified_diff, tmp_path, strip=1)

            result = subprocess.run(
                [self._npm_cmd, "run", "validate"],
                cwd=str(tmp_desktop),
                capture_output=True,
                text=True,
                timeout=_VALIDATE_TIMEOUT,
            )
            if result.returncode != 0:
                details = (
                    (result.stdout or "")[-1500:] + "\n" + (result.stderr or "")[-1500:]
                ).strip()
                raise ApplyError("validation_failed", details)

    # ------------------------------------------------------------------
    # Step 3: atomic git commit
    # ------------------------------------------------------------------

    def _apply_and_commit(self, artifact: PatchArtifact) -> str:
        """Apply diff to real working copy, git add + git commit. Returns commit SHA."""
        # Apply to real working copy (strip=1 from repo_root)
        _apply_patch(artifact.unified_diff, self._repo_root, strip=1)

        add = _git(["add", "--"] + artifact.files_changed, self._repo_root)
        if add.returncode != 0:
            raise ApplyError("git_add_failed", add.stderr.strip()[:300])

        msg = f"agent(m8): {artifact.title} [{artifact.id}]"
        commit = _git(["commit", "-m", msg], self._repo_root)
        if commit.returncode != 0:
            raise ApplyError("git_commit_failed", commit.stderr.strip()[:300])

        rev = _git(["rev-parse", "HEAD"], self._repo_root, timeout=10)
        if rev.returncode != 0:
            raise ApplyError("git_rev_parse_failed", rev.stderr.strip()[:300])
        return rev.stdout.strip()

    # ------------------------------------------------------------------
    # Step 5: rebuild / hot-reload
    # ------------------------------------------------------------------

    def _trigger_reload(self) -> None:
        # Vite HMR watches the filesystem and reloads automatically when files change.
        # No explicit signal is needed in the current architecture; this is intentionally
        # a no-op stub that can be extended to post to the Vite WS or Tauri IPC later.
        pass


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _git(
    args: list[str],
    cwd: Path,
    timeout: int = _GIT_TIMEOUT,
) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git"] + args,
        cwd=str(cwd),
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def _apply_patch(unified_diff: str, cwd: Path, strip: int = 1) -> None:
    """Apply a unified diff string to files under cwd using the `patch` utility."""
    if not unified_diff.strip():
        raise ApplyError("empty_or_malformed_patch", "unified_diff is empty")

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".patch", delete=False, encoding="utf-8"
    ) as f:
        f.write(unified_diff)
        patch_file = f.name

    try:
        result = subprocess.run(
            ["patch", f"-p{strip}", "--input", patch_file],
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=_PATCH_TIMEOUT,
        )
        if result.returncode != 0:
            raise ApplyError(
                "patch_apply_failed",
                f"patch exited {result.returncode}: {result.stderr[:400]}",
            )
    finally:
        os.unlink(patch_file)
