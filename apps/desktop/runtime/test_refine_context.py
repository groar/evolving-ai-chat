"""Tests for T-0092: GET /agent/refine-context endpoint and RefinedSpec model.

Covers:
- Endpoint returns context from listed docs when they exist.
- Missing docs are skipped and listed in docs_missing.
- Context is capped at the char budget.
- CodePatchRequest accepts refined_spec (schema test).
- RefinedSpec fields validate correctly.
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from runtime.main import app
from runtime.models import CodePatchRequest, RefinedSpec


class TestRefineContextEndpoint(unittest.TestCase):
    """GET /agent/refine-context endpoint tests."""

    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_returns_200_with_context_structure(self) -> None:
        response = self.client.get("/agent/refine-context")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("context", data)
        self.assertIn("docs_included", data)
        self.assertIn("docs_missing", data)
        self.assertIsInstance(data["docs_included"], list)
        self.assertIsInstance(data["docs_missing"], list)

    def test_returns_ok_when_config_missing(self) -> None:
        """Endpoint succeeds in degraded mode when config file is absent."""
        with patch("runtime.main._REFINE_CONTEXT_DOCS_PATH", Path("/nonexistent/path.json")):
            response = self.client.get("/agent/refine-context")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # No docs loaded — context is empty, everything is missing or just empty
        self.assertEqual(data["docs_included"], [])
        self.assertEqual(data["context"], "")

    def test_skips_missing_docs_with_warning(self) -> None:
        """Docs listed in the config that don't exist appear in docs_missing."""
        config = {
            "version": "1",
            "docs": ["NONEXISTENT_FILE.md", "ALSO_MISSING.md"],
        }
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as tmp:
            json.dump(config, tmp)
            tmp_path = Path(tmp.name)

        try:
            with patch("runtime.main._REFINE_CONTEXT_DOCS_PATH", tmp_path):
                response = self.client.get("/agent/refine-context")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["docs_included"], [])
            self.assertIn("NONEXISTENT_FILE.md", data["docs_missing"])
            self.assertIn("ALSO_MISSING.md", data["docs_missing"])
            self.assertEqual(data["context"], "")
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_includes_real_doc_contents(self) -> None:
        """A real doc gets included in context with its path as a heading."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_root = Path(tmpdir)
            doc_path = tmp_root / "FAKE_STATUS.md"
            doc_path.write_text("# Fake status\nThis is the product status.", encoding="utf-8")

            config = {"version": "1", "docs": ["FAKE_STATUS.md"]}
            config_path = tmp_root / "refine-context-docs.json"
            config_path.write_text(json.dumps(config), encoding="utf-8")

            with (
                patch("runtime.main._REFINE_CONTEXT_DOCS_PATH", config_path),
                patch("runtime.main._REPO_ROOT", tmp_root),
            ):
                response = self.client.get("/agent/refine-context")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("FAKE_STATUS.md", data["docs_included"])
        self.assertIn("FAKE_STATUS.md", data["context"])
        self.assertIn("Fake status", data["context"])

    def test_context_truncated_at_budget(self) -> None:
        """Documents that exceed the char budget are truncated."""
        large_content = "x" * 40_000  # exceeds 32 000 char budget
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_root = Path(tmpdir)
            doc_path = tmp_root / "BIG.md"
            doc_path.write_text(large_content, encoding="utf-8")

            config = {"version": "1", "docs": ["BIG.md"]}
            config_path = tmp_root / "refine-context-docs.json"
            config_path.write_text(json.dumps(config), encoding="utf-8")

            with (
                patch("runtime.main._REFINE_CONTEXT_DOCS_PATH", config_path),
                patch("runtime.main._REPO_ROOT", tmp_root),
            ):
                response = self.client.get("/agent/refine-context")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("BIG.md", data["docs_included"])
        self.assertIn("truncated", data["context"])
        # Context must be within budget (heading + content + truncation note)
        self.assertLess(len(data["context"]), 40_000)

    def test_second_doc_skipped_when_budget_exhausted(self) -> None:
        """When budget is full after the first doc, remaining docs go to docs_missing."""
        large_content = "y" * 33_000
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_root = Path(tmpdir)
            (tmp_root / "BIG.md").write_text(large_content, encoding="utf-8")
            (tmp_root / "SMALL.md").write_text("small", encoding="utf-8")

            config = {"version": "1", "docs": ["BIG.md", "SMALL.md"]}
            config_path = tmp_root / "refine-context-docs.json"
            config_path.write_text(json.dumps(config), encoding="utf-8")

            with (
                patch("runtime.main._REFINE_CONTEXT_DOCS_PATH", config_path),
                patch("runtime.main._REPO_ROOT", tmp_root),
            ):
                response = self.client.get("/agent/refine-context")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("SMALL.md", data["docs_missing"])


class TestRefinedSpecModel(unittest.TestCase):
    """RefinedSpec and updated CodePatchRequest schema tests."""

    def test_refined_spec_defaults(self) -> None:
        spec = RefinedSpec()
        self.assertEqual(spec.raw_description, "")
        self.assertIsNone(spec.refinement_conversation_id)

    def test_refined_spec_with_values(self) -> None:
        spec = RefinedSpec(
            raw_description="**Goal**: Make greeting friendlier",
            refinement_conversation_id="conv-refine-abc",
        )
        self.assertEqual(spec.raw_description, "**Goal**: Make greeting friendlier")
        self.assertEqual(spec.refinement_conversation_id, "conv-refine-abc")

    def test_code_patch_request_accepts_refined_spec(self) -> None:
        req = CodePatchRequest(
            feedback_id="F-001",
            feedback_title="Friendlier greeting",
            feedback_summary="The greeting feels robotic.",
            feedback_area="ui",
            refined_spec=RefinedSpec(
                raw_description="**Goal**: Warmer welcome message",
            ),
        )
        assert req.refined_spec is not None
        self.assertEqual(req.refined_spec.raw_description, "**Goal**: Warmer welcome message")

    def test_code_patch_request_without_refined_spec(self) -> None:
        """refined_spec is optional — existing callers without it still work."""
        req = CodePatchRequest(
            feedback_id="F-002",
            feedback_title="Some feedback",
            feedback_summary="Details here.",
            feedback_area="ui",
        )
        self.assertIsNone(req.refined_spec)

    def test_refined_spec_raw_description_max_length(self) -> None:
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            RefinedSpec(raw_description="x" * 8001)


class TestCodePatchEndpointWithRefinedSpec(unittest.TestCase):
    """POST /agent/code-patch accepts refined_spec and uses it in the prompt."""

    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_accepts_refined_spec_field(self) -> None:
        """Endpoint returns a valid response when refined_spec is provided (stub mode)."""
        with patch("runtime.main.patch_agent") as mock_agent:
            from runtime.agent.patch_agent import PatchArtifact
            import datetime as _dt
            stub = PatchArtifact(
                id="PA-20260307-aabbccdd",
                created_at=_dt.datetime.now().isoformat(),
                feedback_id="F-001",
                base_ref="HEAD",
                status="pending_apply",
                title="Agent change",
                description="stub",
                files_changed=["apps/desktop/src/App.tsx"],
                unified_diff="--- a/x\n+++ b/x\n",
                scope_violations=[],
                agent_model="stub",
                agent_harness="stub-v1",
            )
            mock_agent.generate_patch.return_value = stub

            response = self.client.post(
                "/agent/code-patch",
                json={
                    "feedback_id": "F-001",
                    "feedback_title": "Friendlier greeting",
                    "feedback_summary": "The greeting feels robotic.",
                    "feedback_area": "ui",
                    "refined_spec": {
                        "raw_description": "**Goal**: Warmer welcome\n**Current behavior**: Cold greeting\n**Desired behavior**: Warm greeting\n**Constraints**: Layout unchanged",
                        "refinement_conversation_id": "conv-123",
                    },
                },
            )

        self.assertIn(response.status_code, (200, 409))
        if response.status_code == 200:
            data = response.json()
            self.assertIn("patch_id", data)
        # Verify refined_spec_text was passed in the feedback dict
        if mock_agent.generate_patch.called:
            call_args = mock_agent.generate_patch.call_args
            feedback_arg = call_args[0][0] if call_args[0] else call_args[1].get("feedback", {})
            self.assertIn("refined_spec_text", feedback_arg)
            self.assertIn("**Goal**", feedback_arg["refined_spec_text"])


if __name__ == "__main__":
    unittest.main()
