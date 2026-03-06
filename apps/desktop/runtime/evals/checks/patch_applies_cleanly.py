"""Check that a unified diff applies cleanly (patch -p1 --dry-run, fallback git apply --check)."""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from .result import CheckResult

logger = logging.getLogger(__name__)

_IGNORE_PATTERNS = (
    "node_modules",
    ".vite",
    "dist",
    "build",
    "__pycache__",
    "*.pyc",
    ".pytest_cache",
)


def run(inputs: dict, repo_root: Path) -> CheckResult:
    """Run the patch_applies_cleanly check. Uses patch -p1 --dry-run; fallback git apply --check."""
    patch_content = inputs.get("patch_content") or inputs.get("patch_inline")
    if not patch_content or not patch_content.strip():
        return CheckResult(
            passed=False,
            message="No patch content (patch_content or patch_inline required)",
            details={},
        )

    target_dir = inputs.get("target_dir")
    if target_dir is not None:
        target_path = Path(target_dir)
        if not target_path.is_absolute():
            target_path = repo_root / target_dir
        work_dir = target_path
        cleanup_temp = False
    else:
        # Temp copy of apps/desktop (mirror apply_pipeline._sandboxed_validate)
        desktop_dir = repo_root / "apps" / "desktop"
        if not desktop_dir.exists():
            return CheckResult(
                passed=False,
                message=f"Desktop directory not found: {desktop_dir}",
                details={},
            )
        tmp = tempfile.mkdtemp(prefix="evals-patch-")
        tmp_path = Path(tmp)
        tmp_apps = tmp_path / "apps"
        tmp_apps.mkdir()
        tmp_desktop = tmp_apps / "desktop"
        shutil.copytree(
            desktop_dir,
            tmp_desktop,
            ignore=shutil.ignore_patterns(*_IGNORE_PATTERNS),
        )
        real_nm = desktop_dir / "node_modules"
        if real_nm.exists():
            (tmp_desktop / "node_modules").symlink_to(real_nm, target_is_directory=True)
        work_dir = tmp_path
        cleanup_temp = True

    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".patch", delete=False, encoding="utf-8"
        ) as f:
            f.write(patch_content)
            patch_file = f.name
        try:
            # Prefer patch -p1 --dry-run (matches production apply path)
            result = _run_patch_dry_run(patch_file, work_dir)
            if result is not None:
                return result
            # Fallback: git apply --check
            result = _run_git_apply_check(patch_file, work_dir)
            if result is not None:
                return result
            return CheckResult(
                passed=False,
                message="No patch tool available (tried patch and git apply)",
                details={},
            )
        finally:
            os.unlink(patch_file)
    finally:
        if cleanup_temp and work_dir.exists():
            shutil.rmtree(work_dir, ignore_errors=True)


def _run_patch_dry_run(patch_file: str, cwd: Path) -> CheckResult | None:
    """Run patch -p1 --dry-run. Returns CheckResult, or None if patch not found."""
    try:
        proc = subprocess.run(
            ["patch", "-p1", "--dry-run", "--input", patch_file],
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=60,
        )
    except FileNotFoundError:
        logger.warning("patch not on PATH; falling back to git apply --check")
        return None
    if proc.returncode == 0:
        return CheckResult(
            passed=True,
            message="Patch applies cleanly (dry-run)",
            details={"stderr": proc.stderr or "", "stdout": proc.stdout or ""},
        )
    return CheckResult(
        passed=False,
        message=f"patch -p1 --dry-run failed: {(proc.stderr or proc.stdout or '').strip()[:400]}",
        details={"returncode": proc.returncode, "stderr": proc.stderr, "stdout": proc.stdout},
    )


def _run_git_apply_check(patch_file: str, cwd: Path) -> CheckResult | None:
    """Run git apply --check. Returns CheckResult, or None if git not available."""
    try:
        proc = subprocess.run(
            ["git", "apply", "--check", patch_file],
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=60,
        )
    except FileNotFoundError:
        return None
    if proc.returncode == 0:
        return CheckResult(
            passed=True,
            message="Patch applies cleanly (git apply --check)",
            details={"stderr": proc.stderr or "", "stdout": proc.stdout or ""},
        )
    return CheckResult(
        passed=False,
        message=f"git apply --check failed: {(proc.stderr or proc.stdout or '').strip()[:400]}",
        details={"returncode": proc.returncode, "stderr": proc.stderr, "stdout": proc.stdout},
    )
