"""Check that after applying the patch, npm run validate exits 0 in apps/desktop."""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from .result import CheckResult

_VALIDATE_TIMEOUT = 120
_IGNORE_PATTERNS = (
    "node_modules",
    ".vite",
    "dist",
    "build",
    "__pycache__",
    "*.pyc",
    ".pytest_cache",
)


def _apply_patch(patch_content: str, work_dir: Path, strip: int = 1) -> None:
    """Apply unified diff with patch -p<strip>. Raises on failure."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".patch", delete=False, encoding="utf-8"
    ) as f:
        f.write(patch_content)
        patch_file = f.name
    try:
        proc = subprocess.run(
            ["patch", "-p{}".format(strip), "--input", patch_file],
            cwd=str(work_dir),
            capture_output=True,
            text=True,
            timeout=60,
        )
        if proc.returncode != 0:
            raise RuntimeError(
                (proc.stderr or proc.stdout or "patch failed").strip()[:500]
            )
    finally:
        try:
            os.unlink(patch_file)
        except OSError:
            pass


def run(inputs: dict, repo_root: Path) -> CheckResult:
    """Apply patch to a temp copy of apps/desktop, run npm run validate."""
    patch_content = inputs.get("patch_content") or inputs.get("patch_inline")
    if not patch_content or not patch_content.strip():
        return CheckResult(
            passed=False,
            message="No patch content (patch_content or patch_inline required)",
            details={},
        )

    desktop_dir = repo_root / "apps" / "desktop"
    if not desktop_dir.exists():
        return CheckResult(
            passed=False,
            message=f"Desktop directory not found: {desktop_dir}",
            details={},
        )

    npm_cmd = inputs.get("npm_cmd") or os.environ.get("NPM_CMD", "npm")
    tmp = tempfile.mkdtemp(prefix="evals-npm-validate-")
    tmp_path = Path(tmp)
    try:
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
            (tmp_desktop / "node_modules").symlink_to(
                real_nm, target_is_directory=True
            )
        _apply_patch(patch_content, tmp_path, strip=1)
        result = subprocess.run(
            [npm_cmd, "run", "validate"],
            cwd=str(tmp_desktop),
            capture_output=True,
            text=True,
            timeout=_VALIDATE_TIMEOUT,
        )
        if result.returncode == 0:
            return CheckResult(
                passed=True,
                message="npm run validate passed",
                details={"stdout": (result.stdout or "")[-500:], "stderr": (result.stderr or "")[-500:]},
            )
        stdout_snippet = (result.stdout or "")[-1500:]
        stderr_snippet = (result.stderr or "")[-1500:]
        details = {
            "returncode": result.returncode,
            "stdout": stdout_snippet,
            "stderr": stderr_snippet,
        }
        return CheckResult(
            passed=False,
            message=f"npm run validate exited {result.returncode}",
            details=details,
        )
    finally:
        shutil.rmtree(tmp_path, ignore_errors=True)
