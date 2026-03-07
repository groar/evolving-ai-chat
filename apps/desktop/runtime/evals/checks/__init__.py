"""Check modules and registry for the eval harness."""

from __future__ import annotations

from pathlib import Path
from typing import Callable

from . import files_in_allowlist as _files_in_allowlist
from . import patch_applies_cleanly as _patch_applies_cleanly
from . import npm_validate_passes as _npm_validate_passes
from .result import CheckResult

__all__ = ["CheckResult", "get_check_fn"]


def _run_patch_applies_cleanly(inputs: dict, repo_root: Path) -> CheckResult:
    return _patch_applies_cleanly.run(inputs, repo_root)


def _run_files_in_allowlist(inputs: dict, repo_root: Path) -> CheckResult:
    return _files_in_allowlist.run(inputs, repo_root)


def _run_npm_validate_passes(inputs: dict, repo_root: Path) -> CheckResult:
    return _npm_validate_passes.run(inputs, repo_root)


_CHECK_REGISTRY: dict[str, Callable[[dict, Path], CheckResult]] = {
    "patch_applies_cleanly": _run_patch_applies_cleanly,
    "files_in_allowlist": _run_files_in_allowlist,
    "npm_validate_passes": _run_npm_validate_passes,
}


def get_check_fn(check_type: str) -> Callable[[dict, Path], CheckResult] | None:
    """Return the run function for a check type, or None if unknown."""
    return _CHECK_REGISTRY.get(check_type)
