"""Tests for the eval harness (evals/run.py). T-0084.

Subprocess-based tests that invoke run.py against known-good and known-bad
fixture cases, asserting exit codes and JSON output structure.
"""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

_RUNTIME_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _RUNTIME_DIR.parents[2]  # runtime -> desktop -> apps; .git at parents[3]
_RUN_PY = _RUNTIME_DIR / "evals" / "run.py"
_CASES_DIR = _RUNTIME_DIR / "evals" / "cases"
_GOOD_CASE = _CASES_DIR / "good_patch_applies.yaml"
_BAD_CASE = _CASES_DIR / "bad_patch_applies.yaml"


def _run_evals(*args: str) -> subprocess.CompletedProcess:
    """Run evals/run.py with given args; cwd=repo root."""
    cmd = [sys.executable, str(_RUN_PY)] + list(args)
    return subprocess.run(
        cmd,
        cwd=str(_REPO_ROOT),
        capture_output=True,
        text=True,
        timeout=60,
    )


class EvalHarnessGoodCaseTests(unittest.TestCase):
    """Good-patch case: run.py should exit 0 and output valid JSON."""

    def test_good_case_exits_zero(self) -> None:
        result = _run_evals("--case", str(_GOOD_CASE))
        self.assertEqual(result.returncode, 0, f"stderr: {result.stderr}")

    def test_good_case_json_structure(self) -> None:
        result = _run_evals("--case", str(_GOOD_CASE))
        self.assertEqual(result.returncode, 0)
        data = json.loads(result.stdout)
        self.assertIn("total", data)
        self.assertIn("passed", data)
        self.assertIn("failed", data)
        self.assertIn("results", data)
        self.assertIsInstance(data["results"], list)
        self.assertGreaterEqual(data["total"], 1)
        self.assertGreaterEqual(data["passed"], 1)
        self.assertEqual(data["failed"], 0)


class EvalHarnessBadCaseTests(unittest.TestCase):
    """Bad-patch case: harness expects 'fail'; when patch does not apply, case passes (exit 0)."""

    def test_bad_case_exits_zero_when_expectation_matched(self) -> None:
        # Bad case has expect result "fail"; when the check fails (patch doesn't apply), that matches → exit 0
        result = _run_evals("--case", str(_BAD_CASE))
        self.assertEqual(result.returncode, 0, f"stderr: {result.stderr}")

    def test_bad_case_json_structure_and_fail_expected(self) -> None:
        result = _run_evals("--case", str(_BAD_CASE))
        data = json.loads(result.stdout)
        self.assertIn("total", data)
        self.assertIn("passed", data)
        self.assertIn("failed", data)
        self.assertIn("results", data)
        self.assertIsInstance(data["results"], list)
        self.assertGreaterEqual(data["total"], 1)
        # The case expects "fail"; the harness reports passed=True when actual result matches expected
        for r in data["results"]:
            if r.get("expected") == "fail":
                self.assertTrue(r.get("passed"), f"Bad case should pass (expectation matched): {r}")
                break
        else:
            self.fail("No result with expected 'fail' found")


class EvalHarnessCasesDirTests(unittest.TestCase):
    """Running against the whole cases dir runs both good and bad."""

    def test_cases_dir_exits_zero_when_all_expectations_matched(self) -> None:
        # Both good and bad cases have expectations; when both match, exit 0
        result = _run_evals("--case", str(_CASES_DIR))
        self.assertEqual(result.returncode, 0, f"stderr: {result.stderr}")

    def test_cases_dir_json_has_both_results(self) -> None:
        result = _run_evals("--case", str(_CASES_DIR))
        data = json.loads(result.stdout)
        self.assertEqual(data["total"], 2)
        self.assertIn("results", data)
        self.assertEqual(len(data["results"]), 2)
