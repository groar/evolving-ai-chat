"""Unit tests for M8 agent harness integration (T-0059).

Covers: successful patch generation, scope-blocked response, malformed agent
response (no changes), harness timeout, not-installed error, in-flight guard,
and the GET /agent/patch-status/{patch_id} endpoint.
"""

from __future__ import annotations

import json
import os
import sqlite3
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from runtime.agent.patch_agent import (
    HarnessUnavailableError,
    MalformedPatchError,
    PatchArtifact,
    PiDevPatchAgent,
    _compute_diff,
    validate_scope,
)
from runtime.agent.patch_storage import PatchStorage
from runtime.main import app
from runtime.storage import RuntimeStorage


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _stub_agent(repo_root: Path | None = None) -> PiDevPatchAgent:
    """Return a PiDevPatchAgent pre-configured for stub (offline) mode."""
    agent = PiDevPatchAgent.__new__(PiDevPatchAgent)
    agent._use_stub = True
    agent._repo_root = repo_root or Path("/tmp")
    agent._api_key = ""
    agent._provider = "anthropic"
    agent._model = ""
    return agent


def _real_agent(repo_root: Path | None = None) -> PiDevPatchAgent:
    """Return a PiDevPatchAgent configured for real (non-stub) mode."""
    agent = PiDevPatchAgent.__new__(PiDevPatchAgent)
    agent._use_stub = False
    agent._repo_root = repo_root or Path("/tmp")
    agent._api_key = "fake-key"
    agent._provider = "anthropic"
    agent._model = ""
    return agent


def _feedback(
    fid: str = "FB-test-001",
    title: str = "Welcome feels robotic",
    summary: str = "First message is too stiff.",
    area: str = "ui.chat",
) -> dict:
    return {"id": fid, "title": title, "summary": summary, "area": area}


# ---------------------------------------------------------------------------
# validate_scope
# ---------------------------------------------------------------------------

class ValidateScopeTests(unittest.TestCase):
    def test_in_scope_file_passes(self) -> None:
        self.assertEqual(validate_scope(["apps/desktop/src/App.tsx"]), [])

    def test_package_json_blocked(self) -> None:
        # package.json is outside allowlist (apps/desktop/src/, runtime/, tickets/, docs/, tests/)
        violations = validate_scope(["package.json"])
        self.assertEqual(violations, ["package.json"])

    def test_mixed_returns_only_violations(self) -> None:
        violations = validate_scope([
            "apps/desktop/src/App.tsx",
            "apps/desktop/runtime/main.py",
            "apps/desktop/src/components/Chat.tsx",
            "package.json",
        ])
        # runtime/, src/ allowed; package.json blocked
        self.assertEqual(violations, ["package.json"])

    def test_empty_list_passes(self) -> None:
        self.assertEqual(validate_scope([]), [])

    def test_nested_src_path_passes(self) -> None:
        self.assertEqual(
            validate_scope(["apps/desktop/src/components/sidebar/Nav.tsx"]), []
        )

    def test_runtime_tickets_docs_tests_allowed(self) -> None:
        allowed = [
            "apps/desktop/runtime/main.py",
            "apps/desktop/runtime/agent/patch_storage.py",
            "tickets/status/ready/T-0001-foo.md",
            "docs/m8-code-loop.md",
            "tests/AGENTS.md",
        ]
        self.assertEqual(validate_scope(allowed), [])


# ---------------------------------------------------------------------------
# _compute_diff
# ---------------------------------------------------------------------------

class ComputeDiffTests(unittest.TestCase):
    def test_no_changes_returns_empty(self) -> None:
        before = {"apps/desktop/src/App.tsx": "const x = 1;\n"}
        after = {"apps/desktop/src/App.tsx": "const x = 1;\n"}
        changed, diff = _compute_diff(before, after)
        self.assertEqual(changed, [])
        self.assertEqual(diff, "")

    def test_changed_file_appears_in_output(self) -> None:
        before = {"apps/desktop/src/App.tsx": "const x = 1;\n"}
        after = {"apps/desktop/src/App.tsx": "const x = 2;\n"}
        changed, diff = _compute_diff(before, after)
        self.assertEqual(changed, ["apps/desktop/src/App.tsx"])
        self.assertIn("apps/desktop/src/App.tsx", diff)
        self.assertIn("-const x = 1;", diff)
        self.assertIn("+const x = 2;", diff)

    def test_multiple_changed_files(self) -> None:
        before = {
            "apps/desktop/src/A.tsx": "a\n",
            "apps/desktop/src/B.tsx": "b\n",
        }
        after = {
            "apps/desktop/src/A.tsx": "a2\n",
            "apps/desktop/src/B.tsx": "b\n",
        }
        changed, _ = _compute_diff(before, after)
        self.assertEqual(changed, ["apps/desktop/src/A.tsx"])


# ---------------------------------------------------------------------------
# PiDevPatchAgent — stub mode
# ---------------------------------------------------------------------------

class PiDevStubTests(unittest.TestCase):
    def setUp(self) -> None:
        self.agent = _stub_agent()

    def test_returns_patch_artifact(self) -> None:
        artifact = self.agent.generate_patch(_feedback(), base_ref="abc1234")
        self.assertIsInstance(artifact, PatchArtifact)

    def test_artifact_fields(self) -> None:
        artifact = self.agent.generate_patch(_feedback(), base_ref="abc1234")
        self.assertEqual(artifact.feedback_id, "FB-test-001")
        self.assertEqual(artifact.base_ref, "abc1234")
        self.assertEqual(artifact.status, "pending_apply")
        self.assertTrue(artifact.id.startswith("PA-"))
        self.assertEqual(artifact.scope_violations, [])

    def test_stub_files_changed_are_in_scope(self) -> None:
        artifact = self.agent.generate_patch(_feedback(), base_ref="abc1234")
        for path in artifact.files_changed:
            self.assertEqual(
                validate_scope([path]),
                [],
                f"Stub produced out-of-scope file: {path}",
            )

    def test_api_key_not_stored_in_artifact(self) -> None:
        self.agent._api_key = "sk-ant-secret123"
        artifact = self.agent.generate_patch(_feedback(), base_ref="abc1234")
        artifact_json = json.dumps(artifact.to_dict())
        self.assertNotIn("sk-ant-secret123", artifact_json)
        self.assertNotIn("secret", artifact_json)

    def test_existing_artifact_id_used_on_retry(self) -> None:
        """T-0091: when existing_artifact_id is provided (retry path), returned artifact has that id."""
        artifact = self.agent.generate_patch(
            _feedback(),
            base_ref="abc1234",
            retry_context="Previous failure: validation_failed",
            existing_artifact_id="PA-20260307-deadbeef",
            existing_created_at="2026-03-07T10:00:00+00:00",
        )
        self.assertEqual(artifact.id, "PA-20260307-deadbeef")
        self.assertEqual(artifact.created_at, "2026-03-07T10:00:00+00:00")
        self.assertEqual(artifact.status, "pending_apply")


# ---------------------------------------------------------------------------
# PiDevPatchAgent — real mode subprocess errors
# ---------------------------------------------------------------------------

class PiDevHarnessErrorTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        repo_root = Path(self._tmpdir.name)
        self.agent = _real_agent(repo_root=repo_root)

    def tearDown(self) -> None:
        self._tmpdir.cleanup()

    def _run_with_subprocess_result(self, returncode: int, stdout: str, stderr: str) -> None:
        """Patch subprocess.run to return a fake CompletedProcess."""
        fake = MagicMock(spec=subprocess.CompletedProcess)
        fake.returncode = returncode
        fake.stdout = stdout
        fake.stderr = stderr
        with (
            patch("runtime.agent.patch_agent._git_diff", return_value=([], "")),
            patch("runtime.agent.patch_agent.subprocess.run", return_value=fake),
        ):
            return self.agent._call_pi(_feedback(), "abc1234")

    def test_pi_not_installed_raises_harness_unavailable(self) -> None:
        with (
            patch("runtime.agent.patch_agent.subprocess.run",
                  side_effect=FileNotFoundError("pi: command not found")),
        ):
            with self.assertRaises(HarnessUnavailableError) as ctx:
                self.agent._call_pi(_feedback(), "abc1234")
        self.assertIn("not found", str(ctx.exception).lower())

    def test_pi_timeout_raises_harness_unavailable(self) -> None:
        with (
            patch("runtime.agent.patch_agent.subprocess.run",
                  side_effect=subprocess.TimeoutExpired(cmd="pi", timeout=600)),
        ):
            with self.assertRaises(HarnessUnavailableError) as ctx:
                self.agent._call_pi(_feedback(), "abc1234")
        self.assertIn("timed out", str(ctx.exception).lower())

    def test_pi_exit_code_2_raises_harness_unavailable(self) -> None:
        with self.assertRaises(HarnessUnavailableError):
            self._run_with_subprocess_result(returncode=2, stdout="", stderr="fatal error")

    def test_pi_no_file_changes_raises_malformed_patch(self) -> None:
        """When pi exits successfully but git diff finds no changes, raise MalformedPatchError."""
        fake = MagicMock(spec=subprocess.CompletedProcess)
        fake.returncode = 0
        fake.stdout = "I looked at the code but made no changes."
        fake.stderr = ""
        with (
            patch("runtime.agent.patch_agent._git_diff", return_value=([], "")),
            patch("runtime.agent.patch_agent.subprocess.run", return_value=fake),
        ):
            with self.assertRaises(MalformedPatchError):
                self.agent._call_pi(_feedback(), "abc1234")

    def test_pi_produces_changes_returns_artifact(self) -> None:
        fake = MagicMock(spec=subprocess.CompletedProcess)
        fake.returncode = 0
        fake.stdout = "Updated the welcome copy to be more conversational."
        fake.stderr = ""
        stub_diff = "--- a/apps/desktop/src/App.tsx\n+++ b/apps/desktop/src/App.tsx\n"
        with (
            patch("runtime.agent.patch_agent._git_diff",
                  return_value=(["apps/desktop/src/App.tsx"], stub_diff)),
            patch("runtime.agent.patch_agent.subprocess.run", return_value=fake),
        ):
            artifact = self.agent._call_pi(_feedback(), "abc1234")
        self.assertIsInstance(artifact, PatchArtifact)
        self.assertEqual(artifact.status, "pending_apply")
        self.assertIn("apps/desktop/src/App.tsx", artifact.files_changed)
        self.assertIn("apps/desktop/src/App.tsx", artifact.unified_diff)

    def test_api_key_not_in_artifact_after_real_call(self) -> None:
        self.agent._api_key = "sk-ant-topsecret"
        fake = MagicMock(spec=subprocess.CompletedProcess)
        fake.returncode = 0
        fake.stdout = "Updated copy."
        fake.stderr = ""
        stub_diff = "--- a/apps/desktop/src/App.tsx\n+++ b/apps/desktop/src/App.tsx\n"
        with (
            patch("runtime.agent.patch_agent._git_diff",
                  return_value=(["apps/desktop/src/App.tsx"], stub_diff)),
            patch("runtime.agent.patch_agent.subprocess.run", return_value=fake),
        ):
            artifact = self.agent._call_pi(_feedback(), "abc1234")
        artifact_json = json.dumps(artifact.to_dict())
        self.assertNotIn("sk-ant-topsecret", artifact_json)

    def test_prompt_contains_feedback(self) -> None:
        """Prompt includes the feedback text."""
        fake = MagicMock(spec=subprocess.CompletedProcess)
        fake.returncode = 0
        fake.stdout = "Done."
        fake.stderr = ""
        stub_diff = "--- a/tickets/x.md\n+++ b/tickets/x.md\n"
        with (
            patch("runtime.agent.patch_agent._git_diff",
                  return_value=(["tickets/x.md"], stub_diff)),
            patch("runtime.agent.patch_agent.subprocess.run", return_value=fake) as mock_run,
        ):
            self.agent._call_pi(_feedback(summary="First message is too stiff."), "abc1234")
        cmd = mock_run.call_args[0][0]
        prompt = cmd[cmd.index("-p") + 1]
        self.assertIn("First message is too stiff.", prompt)
        self.assertNotIn("--append-system-prompt", cmd)


# ---------------------------------------------------------------------------
# Prompt assembly (M13 T-0089)
# ---------------------------------------------------------------------------

class PromptAssemblyTests(unittest.TestCase):
    """Verify that _build_structured_prompt produces the M13 §7.1 multi-section template."""

    def setUp(self) -> None:
        self.agent = _real_agent()

    def _make_fake_subprocess(self, stdout: str = "") -> MagicMock:
        fake = MagicMock(spec=subprocess.CompletedProcess)
        fake.returncode = 0
        fake.stdout = stdout
        fake.stderr = ""
        return fake

    def test_prompt_contains_feedback(self) -> None:
        with patch("runtime.agent.patch_agent.subprocess.run",
                   return_value=self._make_fake_subprocess()):
            prompt = self.agent._build_structured_prompt("Add a dark mode toggle")
        self.assertIn("Feedback: Add a dark mode toggle", prompt)

    def test_change_request_in_feedback_line(self) -> None:
        with patch("runtime.agent.patch_agent.subprocess.run",
                   return_value=self._make_fake_subprocess()):
            prompt = self.agent._build_structured_prompt("Make the welcome message warmer")
        self.assertIn("Feedback: Make the welcome message warmer", prompt)

    def test_retry_context_appended_when_provided(self) -> None:
        retry_ctx = "Build failed: TypeScript error TS2345 in App.tsx"
        with patch("runtime.agent.patch_agent.subprocess.run",
                   return_value=self._make_fake_subprocess()):
            prompt = self.agent._build_structured_prompt("Some change", retry_context=retry_ctx)
        self.assertIn("Previous attempt failed", prompt)
        self.assertIn("Build failed: TypeScript error TS2345 in App.tsx", prompt)

    def test_retry_context_absent_without_value(self) -> None:
        with patch("runtime.agent.patch_agent.subprocess.run",
                   return_value=self._make_fake_subprocess()):
            prompt = self.agent._build_structured_prompt("Some change")
        self.assertNotIn("Previous attempt failed", prompt)


# ---------------------------------------------------------------------------
# PatchArtifact serialisation round-trip
# ---------------------------------------------------------------------------

class PatchArtifactSerializationTests(unittest.TestCase):
    def test_to_dict_from_dict_roundtrip(self) -> None:
        original = PatchArtifact(
            id="PA-20260301-abcd1234",
            created_at="2026-03-01T12:00:00+00:00",
            feedback_id="FB-001",
            base_ref="abc1234",
            status="pending_apply",
            title="Test patch",
            description="A description",
            files_changed=["apps/desktop/src/App.tsx"],
            unified_diff="--- a/...\n+++ b/...\n",
            scope_violations=[],
            agent_model="stub",
            agent_harness="stub-v1",
        )
        restored = PatchArtifact.from_dict(original.to_dict())
        self.assertEqual(restored.id, original.id)
        self.assertEqual(restored.status, original.status)
        self.assertEqual(restored.files_changed, original.files_changed)
        self.assertIsNone(restored.applied_at)


# ---------------------------------------------------------------------------
# POST /agent/code-patch endpoint
# ---------------------------------------------------------------------------

class CodePatchEndpointTests(unittest.TestCase):
    def _ctx(self, agent=None, patches_dir: Path | None = None):
        """Return a context manager that patches runtime globals for one test."""
        db_fd, db_path = tempfile.mkstemp(suffix=".db")
        os.close(db_fd)
        storage = RuntimeStorage(db_path=db_path)
        patch_dir = patches_dir or Path(tempfile.mkdtemp()) / "patches"
        ps = PatchStorage(storage_dir=patch_dir)
        ag = agent or _stub_agent()
        return (
            patch("runtime.main.storage", storage),
            patch("runtime.main.patch_storage", ps),
            patch("runtime.main.patch_agent", ag),
            ps,
            storage,
        )

    def _post_patch(self, client: TestClient) -> dict:
        resp = client.post("/agent/code-patch", json={
            "feedback_id": "FB-20260301-001",
            "feedback_title": "Welcome message feels robotic",
            "feedback_summary": "Too stiff.",
            "feedback_area": "ui.chat",
            "base_ref": "abc1234",
        })
        return resp

    def test_successful_patch_returns_pending_apply(self) -> None:
        ctx = self._ctx()
        with ctx[0], ctx[1], ctx[2]:
            client = TestClient(app)
            resp = self._post_patch(client)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["patch_id"].startswith("PA-"))
        self.assertEqual(data["status"], "pending_apply")
        self.assertIsNotNone(data.get("title"))
        self.assertEqual(data.get("eta_seconds"), 15)

    def test_scope_blocked_patch_returns_scope_blocked(self) -> None:
        ctx = self._ctx()
        storage = ctx[4]  # temp storage with known db_path
        out_of_scope_agent = MagicMock()
        out_of_scope_agent.generate_patch.return_value = PatchArtifact(
            id="PA-test-scope",
            created_at="2026-03-01T00:00:00+00:00",
            feedback_id="FB-001",
            base_ref="abc1234",
            status="pending_apply",
            title="Sneaky package.json change",
            description="Tries to edit package.json",
            files_changed=["package.json"],
            unified_diff="--- a/package.json\n",
            scope_violations=[],
            agent_model="stub",
            agent_harness="stub-v1",
        )
        with ctx[0], ctx[1], patch("runtime.main.patch_agent", out_of_scope_agent):
            client = TestClient(app)
            resp = client.post("/agent/code-patch", json={
                "feedback_id": "FB-scope-test",
                "feedback_title": "Modify package.json",
                "feedback_summary": "",
                "feedback_area": "core",
                "base_ref": "abc1234",
            })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "scope_blocked")
        self.assertIn("package.json", data["scope_violations"])

        # T-0076: scope_blocked path must log to patch_metrics
        with sqlite3.connect(storage.db_path) as conn:
            row = conn.execute(
                "SELECT patch_id, final_status, files_changed_count FROM patch_metrics WHERE patch_id = ?",
                ("PA-test-scope",),
            ).fetchone()
        self.assertIsNotNone(row, "patch_metrics must contain scope_blocked row")
        self.assertEqual(row[0], "PA-test-scope")
        self.assertEqual(row[1], "scope_blocked")
        self.assertEqual(row[2], 1)

    def test_harness_unavailable_returns_503(self) -> None:
        ctx = self._ctx()
        unavailable_agent = MagicMock()
        unavailable_agent.generate_patch.side_effect = HarnessUnavailableError("down")
        with ctx[0], ctx[1], patch("runtime.main.patch_agent", unavailable_agent):
            client = TestClient(app)
            resp = self._post_patch(client)
        self.assertEqual(resp.status_code, 503)
        self.assertEqual(resp.json()["error"], "harness_unavailable")

    def test_malformed_patch_returns_422(self) -> None:
        ctx = self._ctx()
        broken_agent = MagicMock()
        broken_agent.generate_patch.side_effect = MalformedPatchError("no changes")
        with ctx[0], ctx[1], patch("runtime.main.patch_agent", broken_agent):
            client = TestClient(app)
            resp = self._post_patch(client)
        self.assertEqual(resp.status_code, 422)
        self.assertEqual(resp.json()["error"], "malformed_patch")

    def test_patch_in_flight_returns_409(self) -> None:
        patch_dir = Path(tempfile.mkdtemp()) / "patches"
        ps = PatchStorage(storage_dir=patch_dir)
        # Seed an in-flight artifact
        ps.save(PatchArtifact(
            id="PA-inflight",
            created_at="2026-03-01T00:00:00+00:00",
            feedback_id="FB-old",
            base_ref="abc1234",
            status="applying",
            title="Old patch",
            description="",
            files_changed=["apps/desktop/src/App.tsx"],
            unified_diff="",
            scope_violations=[],
            agent_model="stub",
            agent_harness="stub-v1",
        ))
        ctx = self._ctx(patches_dir=patch_dir)
        with ctx[0], patch("runtime.main.patch_storage", ps), ctx[2]:
            client = TestClient(app)
            resp = self._post_patch(client)
        self.assertEqual(resp.status_code, 409)
        self.assertEqual(resp.json()["error"], "patch_in_progress")


# ---------------------------------------------------------------------------
# GET /agent/patch-status/{patch_id} endpoint
# ---------------------------------------------------------------------------

class PatchStatusEndpointTests(unittest.TestCase):
    def test_existing_patch_returns_status(self) -> None:
        patch_dir = Path(tempfile.mkdtemp()) / "patches"
        ps = PatchStorage(storage_dir=patch_dir)
        ag = _stub_agent()

        db_fd, db_path = tempfile.mkstemp(suffix=".db")
        os.close(db_fd)
        storage = RuntimeStorage(db_path=db_path)

        with (
            patch("runtime.main.storage", storage),
            patch("runtime.main.patch_storage", ps),
            patch("runtime.main.patch_agent", ag),
        ):
            client = TestClient(app)
            # Create patch first
            resp = client.post("/agent/code-patch", json={
                "feedback_id": "FB-status-test",
                "feedback_title": "Test",
                "feedback_summary": "Summary",
                "feedback_area": "ui.chat",
                "base_ref": "abc1234",
            })
            self.assertEqual(resp.status_code, 200)
            patch_id = resp.json()["patch_id"]

            # Poll status
            resp2 = client.get(f"/agent/patch-status/{patch_id}")

        self.assertEqual(resp2.status_code, 200)
        data = resp2.json()
        self.assertEqual(data["patch_id"], patch_id)
        self.assertEqual(data["status"], "pending_apply")
        self.assertIsNotNone(data.get("files_changed"))

    def test_nonexistent_patch_returns_404(self) -> None:
        patch_dir = Path(tempfile.mkdtemp()) / "patches"
        ps = PatchStorage(storage_dir=patch_dir)
        db_fd, db_path = tempfile.mkstemp(suffix=".db")
        os.close(db_fd)
        storage = RuntimeStorage(db_path=db_path)

        with (
            patch("runtime.main.storage", storage),
            patch("runtime.main.patch_storage", ps),
        ):
            client = TestClient(app)
            resp = client.get("/agent/patch-status/PA-doesnotexist")

        self.assertEqual(resp.status_code, 404)
        self.assertEqual(resp.json()["error"], "patch_not_found")


# ---------------------------------------------------------------------------
# GET /patches/{patch_id}/log endpoint
# ---------------------------------------------------------------------------


class PatchLogEndpointTests(unittest.TestCase):
    def test_existing_log_returns_payload(self) -> None:
        db_fd, db_path = tempfile.mkstemp(suffix=".db")
        os.close(db_fd)
        storage = RuntimeStorage(db_path=db_path)
        storage.write_patch_log("PA-log-001", "example log text")

        with patch("runtime.main.storage", storage):
            client = TestClient(app)
            resp = client.get("/patches/PA-log-001/log")

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["patch_id"], "PA-log-001")
        self.assertEqual(data["log_text"], "example log text")
        self.assertIsInstance(data["created_at"], str)

    def test_missing_log_returns_404(self) -> None:
        db_fd, db_path = tempfile.mkstemp(suffix=".db")
        os.close(db_fd)
        storage = RuntimeStorage(db_path=db_path)

        with patch("runtime.main.storage", storage):
            client = TestClient(app)
            resp = client.get("/patches/PA-does-not-exist/log")

        self.assertEqual(resp.status_code, 404)
