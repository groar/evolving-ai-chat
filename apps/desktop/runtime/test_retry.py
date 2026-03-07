"""Tests for T-0091: retry with failure context.

Unit tests cover:
  - _build_retry_context includes reason, details, and failed diff
  - _apply_with_retry: retriable failure → status retrying → one retry with context
  - _apply_with_retry: retriable then second apply fails → retry_exhausted
  - _apply_with_retry: non-retriable failure → no retry (single apply)
"""

from __future__ import annotations

import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch as mock_patch

from runtime.agent.patch_agent import PatchArtifact
from runtime.main import (
    _RETRIABLE_FAILURE_REASONS,
    _apply_with_retry,
    _build_retry_context,
    _RETRY_EXHAUSTED_MESSAGE,
)


def _make_artifact(
    patch_id: str = "PA-20260307-abc12345",
    status: str = "apply_failed",
    failure_reason: str | None = "eval_blocked",
    description: str = "Change request.\n\nFailure details: Blocking check failed.",
    unified_diff: str = "--- a/apps/desktop/src/App.tsx\n+++ b/apps/desktop/src/App.tsx\n",
) -> PatchArtifact:
    return PatchArtifact(
        id=patch_id,
        created_at="2026-03-07T12:00:00+00:00",
        feedback_id="FB-001",
        base_ref="abc1234",
        status=status,
        title="Agent change",
        description=description,
        files_changed=["apps/desktop/src/App.tsx"],
        unified_diff=unified_diff,
        scope_violations=[],
        agent_model="stub",
        agent_harness="stub-v1",
        failure_reason=failure_reason,
    )


class BuildRetryContextTests(unittest.TestCase):
    """Tests for _build_retry_context."""

    def test_includes_failure_reason(self) -> None:
        artifact = _make_artifact(failure_reason="validation_failed")
        ctx = _build_retry_context(artifact)
        self.assertIn("Failure reason: validation_failed", ctx)

    def test_includes_details_from_description(self) -> None:
        artifact = _make_artifact(description="Summary.\n\nFailure details: lint errors.")
        ctx = _build_retry_context(artifact)
        self.assertIn("Details:", ctx)
        self.assertIn("lint errors", ctx)

    def test_includes_failed_diff(self) -> None:
        artifact = _make_artifact(unified_diff="--- a/x\n+++ b/x\n@@ -1 +1 @@\n-old\n+new\n")
        ctx = _build_retry_context(artifact)
        self.assertIn("Failed diff:", ctx)
        self.assertIn("--- a/x", ctx)
        self.assertIn("+new", ctx)

    def test_handles_empty_description_and_diff(self) -> None:
        artifact = _make_artifact(description="", unified_diff="")
        ctx = _build_retry_context(artifact)
        self.assertIn("Failure reason: eval_blocked", ctx)


class ApplyWithRetryTests(unittest.TestCase):
    """Tests for _apply_with_retry: retriable vs non-retriable, exhaustion."""

    def test_retriable_failure_triggers_one_retry_and_succeeds(self) -> None:
        """First apply fails with eval_blocked; retry runs with context; second apply succeeds."""
        artifact = _make_artifact(status="pending_apply", failure_reason=None)
        feedback = {"id": "FB-001", "title": "Fix copy", "summary": "Make it warmer", "area": "ui"}
        apply_calls: list[PatchArtifact] = []

        def capture_apply(a: PatchArtifact) -> PatchArtifact:
            apply_calls.append(a)
            if len(apply_calls) == 1:
                a.status = "apply_failed"
                a.failure_reason = "eval_blocked"
                a.description = (a.description or "") + "\n\nFailure details: blocking check failed."
            else:
                a.status = "applied"
                a.applied_at = "2026-03-07T12:01:00+00:00"
                a.git_commit_sha = "def5678"
            return a

        retry_artifact = _make_artifact(
            patch_id=artifact.id,
            status="pending_apply",
            failure_reason=None,
            description="Retry attempt",
            unified_diff="--- a/apps/desktop/src/App.tsx\n+++ b/apps/desktop/src/App.tsx\n@@ -1 +1 @@\n-old\n+new\n",
        )

        with (
            mock_patch("runtime.main.apply_pipeline") as mock_pipeline,
            mock_patch("runtime.main.patch_storage") as mock_storage,
            mock_patch("runtime.main.patch_agent") as mock_agent,
            mock_patch("runtime.main.storage") as mock_storage_runtime,
        ):
            mock_pipeline.apply.side_effect = capture_apply
            mock_agent.generate_patch.return_value = retry_artifact
            _apply_with_retry(artifact, feedback)

        self.assertEqual(mock_pipeline.apply.call_count, 2)
        self.assertEqual(artifact.status, "applied")
        # Storage save called at least when setting retrying and when applying
        self.assertGreaterEqual(mock_storage.save.call_count, 2)
        # generate_patch called with retry_context and existing_artifact_id
        mock_agent.generate_patch.assert_called_once()
        call_kw = mock_agent.generate_patch.call_args[1]
        self.assertIn("retry_context", call_kw)
        self.assertIn("Failure reason: eval_blocked", call_kw["retry_context"])
        self.assertEqual(call_kw["existing_artifact_id"], artifact.id)
        self.assertEqual(call_kw["existing_created_at"], artifact.created_at)

    def test_retriable_then_second_apply_fails_sets_retry_exhausted(self) -> None:
        """First apply fails (retriable), retry runs, second apply also fails → retry_exhausted."""
        artifact = _make_artifact(status="pending_apply", failure_reason=None)
        feedback = {"id": "FB-001", "title": "Fix", "summary": "Fix it", "area": "ui"}

        retry_artifact = _make_artifact(patch_id=artifact.id, status="pending_apply", failure_reason=None)
        call_count = [0]

        def apply_twice_fail_second(a: PatchArtifact) -> PatchArtifact:
            call_count[0] += 1
            if call_count[0] == 1:
                a.status = "apply_failed"
                a.failure_reason = "eval_blocked"
            else:
                a.status = "apply_failed"
                a.failure_reason = "validation_failed"
            return a

        with (
            mock_patch("runtime.main.apply_pipeline") as mock_pipeline,
            mock_patch("runtime.main.patch_storage") as mock_storage,
            mock_patch("runtime.main.patch_agent") as mock_agent,
            mock_patch("runtime.main.storage") as mock_storage_runtime,
        ):
            mock_pipeline.apply.side_effect = apply_twice_fail_second
            mock_agent.generate_patch.return_value = retry_artifact
            _apply_with_retry(artifact, feedback)

        self.assertEqual(artifact.status, "apply_failed")
        self.assertEqual(artifact.failure_reason, "retry_exhausted")
        self.assertIn(_RETRY_EXHAUSTED_MESSAGE, artifact.description or "")

    def test_non_retriable_failure_no_retry(self) -> None:
        """base_ref_mismatch (non-retriable) → apply called once, no generate_patch."""
        artifact = _make_artifact(status="pending_apply", failure_reason=None)
        feedback = {"id": "FB-001", "title": "Fix", "summary": "Fix", "area": "ui"}

        def set_base_ref_fail(a: PatchArtifact) -> PatchArtifact:
            a.status = "apply_failed"
            a.failure_reason = "base_ref_mismatch"
            return a

        with (
            mock_patch("runtime.main.apply_pipeline") as mock_pipeline,
            mock_patch("runtime.main.patch_storage") as mock_storage,
            mock_patch("runtime.main.patch_agent") as mock_agent,
            mock_patch("runtime.main.storage") as mock_storage_runtime,
        ):
            mock_pipeline.apply.side_effect = set_base_ref_fail
            _apply_with_retry(artifact, feedback)

        self.assertEqual(mock_pipeline.apply.call_count, 1)
        mock_agent.generate_patch.assert_not_called()
        self.assertEqual(artifact.failure_reason, "base_ref_mismatch")

    def test_retriable_reasons_constants(self) -> None:
        """Sanity check: eval_blocked, validation_failed, patch_apply_failed are retriable."""
        self.assertIn("eval_blocked", _RETRIABLE_FAILURE_REASONS)
        self.assertIn("validation_failed", _RETRIABLE_FAILURE_REASONS)
        self.assertIn("patch_apply_failed", _RETRIABLE_FAILURE_REASONS)
        self.assertNotIn("scope_blocked", _RETRIABLE_FAILURE_REASONS)
        self.assertNotIn("base_ref_mismatch", _RETRIABLE_FAILURE_REASONS)
        self.assertNotIn("patch_timeout", _RETRIABLE_FAILURE_REASONS)
