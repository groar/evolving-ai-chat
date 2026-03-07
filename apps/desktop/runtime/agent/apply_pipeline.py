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

import json
import logging
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import TYPE_CHECKING

from .patch_agent import PatchArtifact
from .patch_storage import PatchStorage

if TYPE_CHECKING:
    from ..storage import RuntimeStorage

logger = logging.getLogger(__name__)

_VALIDATE_TIMEOUT = 120
_GIT_TIMEOUT = 30
_PATCH_TIMEOUT = 180
_EVALS_TIMEOUT = 60


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
        metrics_storage: "RuntimeStorage | None" = None,
    ) -> None:
        self._repo_root = repo_root
        self._storage = patch_storage
        self._metrics_storage = metrics_storage
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
            self._run_evals(artifact)
            commit_sha = self._apply_and_commit(artifact)

            artifact.status = "applied"
            artifact.applied_at = datetime.now(timezone.utc).isoformat()
            artifact.git_commit_sha = commit_sha
            self._storage.save(artifact)
            self._trigger_reload()

            logger.info("patch %s applied → commit %s", artifact.id, commit_sha)

            if self._metrics_storage:
                self._metrics_storage.log_patch_metrics(
                    patch_id=artifact.id,
                    feedback_id=artifact.feedback_id or "",
                    final_status="applied",
                    agent_model=artifact.agent_model or "",
                    files_changed_count=len(artifact.files_changed),
                    unified_diff=artifact.unified_diff or "",
                    created_at=artifact.created_at,
                    resolved_at=artifact.applied_at or "",
                )

        except ApplyError as exc:
            artifact.status = "apply_failed"
            artifact.failure_reason = exc.reason
            if exc.details:
                artifact.description = (
                    (artifact.description or "") + f"\n\nFailure details: {exc.details}"
                )
            self._storage.save(artifact)
            logger.warning("patch %s apply_failed reason=%s", artifact.id, exc.reason)

            if self._metrics_storage:
                self._metrics_storage.log_patch_metrics(
                    patch_id=artifact.id,
                    feedback_id=artifact.feedback_id or "",
                    final_status="apply_failed",
                    agent_model=artifact.agent_model or "",
                    files_changed_count=len(artifact.files_changed),
                    unified_diff=artifact.unified_diff or "",
                    created_at=artifact.created_at,
                    resolved_at=datetime.now(timezone.utc).isoformat(),
                )

        except Exception:  # noqa: BLE001
            artifact.status = "apply_failed"
            artifact.failure_reason = "unexpected_error"
            self._storage.save(artifact)
            logger.exception("patch %s unexpected error during apply", artifact.id)

            if self._metrics_storage:
                try:
                    self._metrics_storage.log_patch_metrics(
                        patch_id=artifact.id,
                        feedback_id=artifact.feedback_id or "",
                        final_status="apply_failed",
                        agent_model=artifact.agent_model or "",
                        files_changed_count=len(artifact.files_changed),
                        unified_diff=artifact.unified_diff or "",
                        created_at=artifact.created_at,
                        resolved_at=datetime.now(timezone.utc).isoformat(),
                    )
                except Exception:  # noqa: BLE001
                    pass

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
    # Step 2.5: advisory eval harness (M12, T-0083)
    # ------------------------------------------------------------------

    def _run_evals(self, artifact: PatchArtifact) -> None:
        """Run eval harness. Blocking check failures raise ApplyError(eval_blocked, structured_details).

        If evals/ or evals/cases/ is absent, skips silently. Advisory failures are logged
        to artifact.log_text. When any case with blocking=true fails (expectation not matched),
        raises ApplyError with JSON details for retry (T-0091).
        """
        runtime_dir = Path(__file__).resolve().parent.parent
        evals_dir = runtime_dir / "evals"
        cases_dir = evals_dir / "cases"
        if not evals_dir.exists() or not cases_dir.exists():
            return
        if not (artifact.unified_diff or "").strip():
            return

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".patch", delete=False, encoding="utf-8"
        ) as f:
            f.write(artifact.unified_diff or "")
            patch_path = f.name

        def _append_log(line: str) -> None:
            prefix = (artifact.log_text or "").strip()
            artifact.log_text = f"{prefix}\n{line}".strip() if prefix else line

        try:
            cmd = [
                "uv", "run", "python", "evals/run.py",
                "--patch-file", patch_path,
                "--repo-root", str(self._repo_root),
            ]
            result = subprocess.run(
                cmd,
                cwd=str(runtime_dir),
                capture_output=True,
                text=True,
                timeout=_EVALS_TIMEOUT,
            )
            data = None
            try:
                data = json.loads(result.stdout or "{}")
            except (json.JSONDecodeError, TypeError):
                pass

            if data and "results" in data:
                results = data.get("results") or []
                total = data.get("total", 0)
                passed_count = data.get("passed", 0)
                failed_count = data.get("failed", 0)
                blocking_failures: list[dict] = []
                for r in results:
                    is_blocking = r.get("blocking", False)
                    expectation_matched = r.get("passed", False)
                    if is_blocking and not expectation_matched:
                        blocking_failures.append({
                            "check_type": r.get("check_type", ""),
                            "case_id": r.get("case_id", ""),
                            "message": r.get("message", ""),
                            "details": r.get("details") if isinstance(r.get("details"), dict) else {},
                        })
                    elif not expectation_matched:
                        _append_log(
                            f"Eval (advisory) {r.get('check_type', '?')}: {r.get('message', '')}"
                        )
                _append_log(f"Eval: {passed_count}/{total} passed, {failed_count} failed.")
                if blocking_failures:
                    details_str = json.dumps({"blocking_failures": blocking_failures})
                    raise ApplyError("eval_blocked", details_str)
            else:
                if result.returncode != 0:
                    logger.warning(
                        "patch %s eval harness exited %s; output unparseable, continuing",
                        artifact.id, result.returncode,
                    )
                    _append_log(
                        f"Eval: run.py exited {result.returncode}; output could not be parsed."
                    )
        except ApplyError:
            raise
        except subprocess.TimeoutExpired:
            logger.warning(
                "patch %s eval harness timed out after %ss; apply continues",
                artifact.id, _EVALS_TIMEOUT,
            )
            _append_log(f"Eval: timed out after {_EVALS_TIMEOUT}s; apply continued.")
        finally:
            try:
                os.unlink(patch_path)
            except OSError:
                pass

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
        except subprocess.TimeoutExpired:
            raise ApplyError(
                "patch_timeout",
                f"patch command timed out after {_PATCH_TIMEOUT}s",
            )
    finally:
        os.unlink(patch_file)
