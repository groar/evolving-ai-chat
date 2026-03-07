"""Check that all files touched by a unified diff are within the patch allowlist."""

from __future__ import annotations

import json
import re
from pathlib import Path

from .result import CheckResult


def _paths_from_diff(patch_content: str) -> set[str]:
    """Extract file paths from unified diff headers (--- a/path, +++ b/path)."""
    paths: set[str] = set()
    for line in patch_content.splitlines():
        if line.startswith("--- ") or line.startswith("+++ "):
            part = line[4:].strip()
            if part in ("/dev/null", "a/dev/null", "b/dev/null"):
                continue
            # Strip a/ or b/ prefix
            if part.startswith("a/") or part.startswith("b/"):
                part = part[2:]
            if part and part != "/dev/null":
                paths.add(part)
    return paths


def _load_allowlist(repo_root: Path) -> list[str]:
    """Load allow_patterns from runtime config."""
    config_path = repo_root / "apps" / "desktop" / "runtime" / "config" / "patch-allowlist.json"
    if not config_path.exists():
        return []
    try:
        data = json.loads(config_path.read_text(encoding="utf-8"))
        patterns = data.get("allow_patterns") or []
        return [str(p) for p in patterns if isinstance(p, str)]
    except (OSError, json.JSONDecodeError):
        return []


def run(inputs: dict, repo_root: Path) -> CheckResult:
    """Check that every file in the diff matches at least one allowlist pattern."""
    patch_content = inputs.get("patch_content") or inputs.get("patch_inline")
    if not patch_content or not patch_content.strip():
        return CheckResult(
            passed=False,
            message="No patch content (patch_content or patch_inline required)",
            details={},
        )

    paths = _paths_from_diff(patch_content)
    if not paths:
        return CheckResult(
            passed=True,
            message="No file paths in diff",
            details={"paths": []},
        )

    patterns = _load_allowlist(repo_root)
    if not patterns:
        return CheckResult(
            passed=False,
            message="Allowlist config not found or empty",
            details={"paths": list(paths)},
        )

    compiled: list[re.Pattern[str]] = []
    for p in patterns:
        try:
            compiled.append(re.compile(p))
        except re.error:
            continue

    violations: list[str] = []
    for path in sorted(paths):
        if not any(c.match(path) for c in compiled):
            violations.append(path)

    if not violations:
        return CheckResult(
            passed=True,
            message=f"All {len(paths)} file(s) in allowlist",
            details={"paths": list(paths)},
        )

    return CheckResult(
        passed=False,
        message=f"Files outside allowlist: {', '.join(violations[:5])}{' ...' if len(violations) > 5 else ''}",
        details={"paths": list(paths), "violations": violations},
    )
