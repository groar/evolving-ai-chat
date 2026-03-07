#!/usr/bin/env python3
"""Eval harness entry point. Run deterministic checks on YAML cases."""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Allow running from repo root or from runtime: uv run python apps/desktop/runtime/evals/run.py
_SCRIPT_DIR = Path(__file__).resolve().parent
_RUNTIME_DIR = _SCRIPT_DIR.parent
_REPO_ROOT_DEFAULT = _RUNTIME_DIR.parent.parent.parent  # runtime -> desktop -> apps -> repo
# Ensure runtime is on path so "evals" package can be imported when run as script
if _RUNTIME_DIR not in (Path(p).resolve() for p in sys.path):
    sys.path.insert(0, str(_RUNTIME_DIR))


def _find_repo_root(start: Path) -> Path | None:
    """Return repo root (directory containing .git) or None."""
    current = start.resolve()
    for _ in range(10):
        if (current / ".git").exists():
            return current
        parent = current.parent
        if parent == current:
            break
        current = parent
    return None


def _default_cases_dir() -> Path:
    return _SCRIPT_DIR / "cases"


def _load_yaml():
    try:
        import yaml
        return yaml
    except ImportError:
        raise SystemExit("pyyaml required. Add 'pyyaml' to requirements.txt and install.")


def _collect_case_paths(case_path: Path) -> list[Path]:
    """Return list of YAML case files (from a single file or a directory)."""
    if case_path.is_file():
        if case_path.suffix in (".yaml", ".yml"):
            return [case_path]
        return []
    if case_path.is_dir():
        return sorted(case_path.glob("*.yaml")) + sorted(case_path.glob("*.yml"))
    return []


def _load_case(file_path: Path) -> dict | None:
    """Load one YAML case file. Returns dict or None on parse error."""
    yaml = _load_yaml()
    try:
        data = yaml.safe_load(file_path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except Exception as e:
        logging.warning("Failed to load case %s: %s", file_path, e)
        return None


def _resolve_patch_content(
    case_inputs: dict,
    case_file_dir: Path,
    patch_file_override: Path | None,
) -> str | None:
    """Resolve patch content from case inputs and optional --patch-file override."""
    if patch_file_override is not None:
        if patch_file_override.exists():
            return patch_file_override.read_text(encoding="utf-8")
        return None
    if case_inputs.get("patch_inline"):
        return case_inputs["patch_inline"]
    rel = case_inputs.get("patch_file")
    if not rel:
        return None
    path = (case_file_dir / rel).resolve()
    if path.exists():
        return path.read_text(encoding="utf-8")
    return None


def _run_case(
    case_id: str,
    case_data: dict,
    case_file_dir: Path,
    repo_root: Path,
    patch_file_override: Path | None,
    verbose: bool,
) -> dict:
    """Run one case and return result dict for JSON output."""
    from evals.checks import get_check_fn, CheckResult

    check_type = case_data.get("check_type")
    blocking = bool(case_data.get("blocking", False))
    if not check_type:
        return {
            "case_id": case_id,
            "check_type": "",
            "passed": False,
            "expected": case_data.get("expect", {}).get("result", "?"),
            "message": "Missing check_type",
            "skipped": True,
            "blocking": blocking,
            "details": {},
        }
    fn = get_check_fn(check_type)
    if not fn:
        return {
            "case_id": case_id,
            "check_type": check_type,
            "passed": False,
            "expected": case_data.get("expect", {}).get("result", "pass"),
            "message": f"Unknown check_type: {check_type}",
            "skipped": True,
            "blocking": blocking,
            "details": {},
        }
    inputs = dict(case_data.get("inputs") or {})
    patch_content = _resolve_patch_content(inputs, case_file_dir, patch_file_override)
    if patch_content is not None:
        inputs["patch_content"] = patch_content
    expected = (case_data.get("expect") or {}).get("result", "pass")
    try:
        result: CheckResult = fn(inputs, repo_root)
    except Exception as e:
        if verbose:
            import traceback
            traceback.print_exc()
        return {
            "case_id": case_id,
            "check_type": check_type,
            "passed": False,
            "expected": expected,
            "message": f"Check raised: {e}",
            "skipped": False,
            "blocking": blocking,
            "details": {},
        }
    matched = (expected == "pass" and result.passed) or (expected == "fail" and not result.passed)
    blocking = bool(case_data.get("blocking", False))
    details = result.details if isinstance(result.details, dict) else {}
    return {
        "case_id": case_id,
        "check_type": check_type,
        "passed": matched,
        "expected": expected,
        "message": result.message,
        "skipped": False,
        "blocking": blocking,
        "details": details,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run eval harness cases")
    parser.add_argument(
        "--case",
        type=Path,
        default=None,
        help="Path to a single YAML case file or directory of cases (default: evals/cases/)",
    )
    parser.add_argument(
        "--patch-file",
        type=Path,
        default=None,
        help="Override patch source for all cases",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=None,
        help="Repository root (default: auto-detect)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print per-check details to stderr",
    )
    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG, format="%(message)s")

    repo_root = args.repo_root
    if repo_root is None:
        repo_root = _find_repo_root(_RUNTIME_DIR) or _REPO_ROOT_DEFAULT
    repo_root = repo_root.resolve()
    if not repo_root.exists():
        print("Runner error: repo-root does not exist", file=sys.stderr)
        return 2

    case_path = args.case if args.case is not None else _default_cases_dir()
    case_path = case_path.resolve()
    case_files = _collect_case_paths(case_path)
    if not case_files:
        print('{"total": 0, "passed": 0, "failed": 0, "skipped": 0, "results": []}', file=sys.stdout)
        print("No eval cases found, skipping.", file=sys.stderr)
        return 0

    patch_file_override = args.patch_file.resolve() if args.patch_file else None
    results = []
    for fp in case_files:
        case_data = _load_case(fp)
        if case_data is None:
            continue
        case_id = case_data.get("id") or fp.stem
        case_file_dir = fp.parent
        r = _run_case(
            case_id,
            case_data,
            case_file_dir,
            repo_root,
            patch_file_override,
            args.verbose,
        )
        results.append(r)

    passed = sum(1 for r in results if r.get("passed"))
    failed = sum(1 for r in results if not r.get("passed") and not r.get("skipped"))
    skipped = sum(1 for r in results if r.get("skipped"))
    total = len(results)
    all_matched = passed == total and failed == 0
    out = {
        "total": total,
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "results": results,
    }
    print(json.dumps(out, indent=2), file=sys.stdout)
    if all_matched:
        return 0
    if failed > 0:
        return 1  # at least one case did not match expectation
    return 2  # runner error (all skipped or other)


if __name__ == "__main__":
    sys.exit(main())
