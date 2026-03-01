from __future__ import annotations

import sqlite3
import tempfile
import unittest
from pathlib import Path

from fastapi.middleware.cors import CORSMiddleware

from runtime.main import app
from runtime.models import ChangeProposal, ProposalDecision, ValidationRunSummary
from runtime.storage import RuntimeStorage


class ProposalModelSerializationTests(unittest.TestCase):
    def test_change_proposal_serializes_and_roundtrips(self) -> None:
        proposal = ChangeProposal(
            proposal_id="proposal-1",
            created_at="2026-02-27T00:00:00+00:00",
            title="Improve feedback capture clarity",
            rationale="Users cannot find the feedback entrypoint quickly.",
            source_feedback_ids=["F-20260226-001"],
            diff_summary="Adds persistent proposal artifact to runtime storage.",
            risk_notes="Low risk; local storage schema change only.",
            validation_runs=[
                ValidationRunSummary(
                    validation_run_id="validation-1",
                    status="passing",
                    summary="Storage smoke checks passed.",
                    artifact_refs=["tickets/meta/qa/artifacts/runtime-smoke/sample.log"],
                    created_at="2026-02-27T00:10:00+00:00",
                )
            ],
            decision=ProposalDecision(status="pending", decided_at=None, notes=None),
        )

        dumped = proposal.model_dump()
        restored = ChangeProposal.model_validate(dumped)
        self.assertEqual(restored.proposal_id, proposal.proposal_id)
        self.assertEqual(restored.validation_runs[0].status, "passing")
        self.assertEqual(restored.source_feedback_ids, ["F-20260226-001"])


class ProposalStorageFlowTests(unittest.TestCase):
    def test_acceptance_requires_passing_latest_validation_run(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "runtime.db"
            storage = RuntimeStorage(db_path=str(db_path))
            created = storage.create_proposal(
                title="Proposal",
                rationale="Rationale",
                source_feedback_ids=["F-20260226-001"],
            )
            proposal_id = created["proposal_id"]

            with self.assertRaisesRegex(ValueError, "Acceptance requires a passing latest validation run"):
                storage.update_proposal_decision(proposal_id, status="accepted")

            failing = storage.add_proposal_validation_run(
                proposal_id,
                status="failing",
                summary="Smoke failed.",
                artifact_refs=["tickets/meta/qa/artifacts/runtime-smoke/failing.log"],
                validation_run_id="run-1",
            )
            self.assertEqual(failing["validation_runs"][-1]["status"], "failing")

            with self.assertRaisesRegex(ValueError, "Acceptance requires a passing latest validation run"):
                storage.update_proposal_decision(proposal_id, status="accepted")

            passing = storage.add_proposal_validation_run(
                proposal_id,
                status="passing",
                summary="Storage and API checks passed.",
                artifact_refs=["tickets/meta/qa/artifacts/runtime-smoke/passing.log"],
                validation_run_id="run-2",
            )
            self.assertEqual(passing["validation_runs"][-1]["status"], "passing")

            accepted = storage.update_proposal_decision(
                proposal_id,
                status="accepted",
                notes="Ready for release.",
            )
            self.assertEqual(accepted["decision"]["status"], "accepted")
            self.assertIsNotNone(accepted["decision"]["decided_at"])
            self.assertEqual(accepted["decision"]["notes"], "Ready for release.")

            state_after_accept = storage.get_state()
            linked_entries = [entry for entry in state_after_accept["changelog"] if entry.get("proposal_id") == proposal_id]
            self.assertEqual(len(linked_entries), 1)
            self.assertEqual(linked_entries[0]["title"], "Proposal")
            self.assertEqual(linked_entries[0]["summary"], "Rationale")
            self.assertEqual(linked_entries[0]["ticket_id"], "T-0015")

            accepted_again = storage.update_proposal_decision(
                proposal_id,
                status="accepted",
                notes="Second accept should be idempotent.",
            )
            self.assertEqual(accepted_again["decision"]["status"], "accepted")
            self.assertEqual(accepted_again["decision"]["notes"], "Ready for release.")
            state_after_reaccept = storage.get_state()
            linked_entries_after_reaccept = [
                entry for entry in state_after_reaccept["changelog"] if entry.get("proposal_id") == proposal_id
            ]
            self.assertEqual(len(linked_entries_after_reaccept), 1)

    def test_rejection_does_not_create_changelog_entry(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "runtime.db"
            storage = RuntimeStorage(db_path=str(db_path))
            created = storage.create_proposal(
                title="Reject Me",
                rationale="Not viable.",
                source_feedback_ids=["F-20260226-001"],
            )

            proposal_id = created["proposal_id"]
            rejected = storage.update_proposal_decision(
                proposal_id,
                status="rejected",
                notes="Rejected by reviewer.",
            )
            self.assertEqual(rejected["decision"]["status"], "rejected")
            linked_entries = [entry for entry in storage.get_state()["changelog"] if entry.get("proposal_id") == proposal_id]
            self.assertEqual(linked_entries, [])

    def test_acceptance_falls_back_to_safe_changelog_copy(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "runtime.db"
            storage = RuntimeStorage(db_path=str(db_path))
            created = storage.create_proposal(
                title="Original title",
                rationale="Original rationale.",
                source_feedback_ids=["F-20260226-001"],
            )
            proposal_id = created["proposal_id"]
            storage.add_proposal_validation_run(
                proposal_id,
                status="passing",
                summary="All checks passing.",
                artifact_refs=["tickets/meta/qa/artifacts/runtime-smoke/passing.log"],
                validation_run_id="run-fallback-1",
            )
            with sqlite3.connect(db_path) as connection:
                connection.execute(
                    """
                    UPDATE change_proposals
                    SET title = '', rationale = '', diff_summary = ''
                    WHERE proposal_id = ?
                    """,
                    (proposal_id,),
                )
            storage.update_proposal_decision(proposal_id, status="accepted")
            linked_entries = [entry for entry in storage.get_state()["changelog"] if entry.get("proposal_id") == proposal_id]
            self.assertEqual(len(linked_entries), 1)
            self.assertEqual(linked_entries[0]["title"], "Proposal accepted")
            self.assertEqual(linked_entries[0]["summary"], "Accepted proposal recorded in local changelog.")


class RuntimeCorsTests(unittest.TestCase):
    def test_runtime_has_cors_middleware_for_desktop_origins(self) -> None:
        cors_entries = [middleware for middleware in app.user_middleware if middleware.cls is CORSMiddleware]
        self.assertEqual(len(cors_entries), 1)
        cors_entry = cors_entries[0]
        self.assertEqual(
            cors_entry.kwargs.get("allow_origin_regex"),
            r"^(tauri://localhost|http://localhost(?::\d+)?|http://127\.0\.0\.1(?::\d+)?)$",
        )
        self.assertEqual(cors_entry.kwargs.get("allow_methods"), ["*"])
        self.assertEqual(cors_entry.kwargs.get("allow_headers"), ["*"])


if __name__ == "__main__":
    unittest.main()
