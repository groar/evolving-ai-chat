from __future__ import annotations

import json
import re
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_COST_RE = re.compile(r"~?\$([0-9.]+)")

DEFAULT_RELEASE_CHANNEL = "stable"
ALLOWED_RELEASE_CHANNELS = {"stable", "experimental"}
EXPERIMENTAL_FLAG_KEYS = {"show_runtime_diagnostics"}
CHANGELOG_MAX_ITEMS = 20
CURRENT_TICKET_ID = "T-0008"
PERSONA_ADDITIONS_MAX = 3
PERSONA_ADDITIONS_KEY = "persona_additions_json"
ALLOWED_DECISION_STATUS = {"pending", "accepted", "rejected"}
ALLOWED_VALIDATION_STATUS = {"passing", "failing"}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_cost_from_meta(meta: str | None) -> float | None:
    """Extract cost from meta string (handles ~$0.003 and $0.00 formats). Returns None if not found."""
    if not meta:
        return None
    m = _COST_RE.search(meta)
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def _sum_cost_from_messages(messages: list[dict[str, Any]]) -> float | None:
    """Sum cost from assistant message metas. Returns None if no costs found."""
    total = 0.0
    found = False
    for row in messages:
        if row.get("role") != "assistant":
            continue
        cost = _parse_cost_from_meta(row.get("meta"))
        if cost is not None:
            total += cost
            found = True
    return round(total, 6) if found else None


class RuntimeStorage:
    def __init__(self, db_path: str | None = None) -> None:
        default_path = Path(__file__).resolve().parent / "data" / "runtime.db"
        self.db_path = Path(db_path or os.environ.get("RUNTIME_DB_PATH") or default_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._lock, self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS schema_version (
                  version INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS conversations (
                  conversation_id TEXT PRIMARY KEY,
                  title TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS messages (
                  message_id INTEGER PRIMARY KEY AUTOINCREMENT,
                  conversation_id TEXT NOT NULL,
                  role TEXT NOT NULL,
                  text TEXT NOT NULL,
                  meta TEXT,
                  created_at TEXT NOT NULL,
                  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
                );

                CREATE TABLE IF NOT EXISTS events (
                  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                  event_type TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  payload TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS settings (
                  key TEXT PRIMARY KEY,
                  value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS changelog_entries (
                  changelog_id INTEGER PRIMARY KEY AUTOINCREMENT,
                  created_at TEXT NOT NULL,
                  title TEXT NOT NULL,
                  summary TEXT NOT NULL,
                  channel TEXT NOT NULL,
                  ticket_id TEXT,
                  flags_changed_json TEXT,
                  proposal_id TEXT
                );

                CREATE TABLE IF NOT EXISTS change_proposals (
                  proposal_id TEXT PRIMARY KEY,
                  created_at TEXT NOT NULL,
                  title TEXT NOT NULL,
                  rationale TEXT NOT NULL,
                  source_feedback_ids_json TEXT NOT NULL,
                  diff_summary TEXT NOT NULL,
                  risk_notes TEXT NOT NULL,
                  validation_runs_json TEXT NOT NULL,
                  decision_status TEXT NOT NULL,
                  decision_timestamp TEXT,
                  decision_notes TEXT
                );

                CREATE TABLE IF NOT EXISTS patch_logs (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  patch_id TEXT UNIQUE NOT NULL,
                  log_text TEXT NOT NULL,
                  created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS patch_metrics (
                  patch_id TEXT PRIMARY KEY,
                  feedback_id TEXT,
                  final_status TEXT,
                  agent_model TEXT,
                  files_changed_count INTEGER,
                  diff_lines_added INTEGER,
                  diff_lines_removed INTEGER,
                  created_at TEXT,
                  resolved_at TEXT
                );
                """
            )

            version_row = connection.execute("SELECT version FROM schema_version LIMIT 1").fetchone()
            if version_row is None:
                connection.execute("INSERT INTO schema_version(version) VALUES (?)", (1,))
            self._ensure_changelog_schema(connection)
            self._ensure_proposals_schema(connection)

            active_id = self._get_active_conversation_id(connection)
            if not active_id:
                created_id = self._create_conversation_locked(connection, title="Today's Session")
                self._set_active_conversation_id(connection, created_id)
            self._initialize_release_settings(connection)

    def _initialize_release_settings(self, connection: sqlite3.Connection) -> None:
        current_channel = self._get_setting(connection, "release_channel")
        if current_channel not in ALLOWED_RELEASE_CHANNELS:
            self._set_setting(connection, "release_channel", DEFAULT_RELEASE_CHANNEL)

        raw_flags = self._get_setting(connection, "experimental_flags_json")
        if raw_flags is None:
            self._set_setting(connection, "experimental_flags_json", "{}")
            return

        try:
            parsed = json.loads(raw_flags)
        except json.JSONDecodeError:
            self._set_setting(connection, "experimental_flags_json", "{}")
            return

        if not isinstance(parsed, dict):
            self._set_setting(connection, "experimental_flags_json", "{}")
            return

        normalized = {
            key: bool(value)
            for key, value in parsed.items()
            if isinstance(key, str) and key in EXPERIMENTAL_FLAG_KEYS
        }
        self._set_setting(connection, "experimental_flags_json", json.dumps(normalized, separators=(",", ":"), sort_keys=True))

    def _get_active_conversation_id(self, connection: sqlite3.Connection) -> str | None:
        row = connection.execute(
            "SELECT value FROM settings WHERE key = 'last_opened_conversation_id' LIMIT 1"
        ).fetchone()
        if row is None:
            return None

        conversation_id = str(row["value"])
        exists = connection.execute(
            "SELECT 1 FROM conversations WHERE conversation_id = ? LIMIT 1",
            (conversation_id,),
        ).fetchone()
        return conversation_id if exists else None

    def _get_setting(self, connection: sqlite3.Connection, key: str) -> str | None:
        row = connection.execute("SELECT value FROM settings WHERE key = ? LIMIT 1", (key,)).fetchone()
        if row is None:
            return None
        return str(row["value"])

    def _set_setting(self, connection: sqlite3.Connection, key: str, value: str) -> None:
        connection.execute(
            """
            INSERT INTO settings(key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, value),
        )

    def _set_active_conversation_id(self, connection: sqlite3.Connection, conversation_id: str) -> None:
        self._set_setting(connection, "last_opened_conversation_id", conversation_id)

    def _read_release_settings_locked(self, connection: sqlite3.Connection) -> dict[str, Any]:
        channel = self._get_setting(connection, "release_channel") or DEFAULT_RELEASE_CHANNEL
        if channel not in ALLOWED_RELEASE_CHANNELS:
            channel = DEFAULT_RELEASE_CHANNEL

        raw_flags = self._get_setting(connection, "experimental_flags_json") or "{}"
        try:
            parsed = json.loads(raw_flags)
        except json.JSONDecodeError:
            parsed = {}

        experimental_flags = {
            flag_key: bool(parsed.get(flag_key, False))
            for flag_key in sorted(EXPERIMENTAL_FLAG_KEYS)
        }
        active_flags = {
            flag_key: channel == "experimental" and enabled
            for flag_key, enabled in experimental_flags.items()
        }
        return {
            "channel": channel,
            "experimental_flags": experimental_flags,
            "active_flags": active_flags,
        }

    def _append_changelog_entry_locked(
        self,
        connection: sqlite3.Connection,
        *,
        title: str,
        summary: str,
        channel: str,
        ticket_id: str | None = CURRENT_TICKET_ID,
        flags_changed: list[str] | None = None,
        proposal_id: str | None = None,
    ) -> None:
        normalized_channel = channel if channel in ALLOWED_RELEASE_CHANNELS else DEFAULT_RELEASE_CHANNEL
        normalized_flags = [flag_key for flag_key in (flags_changed or []) if flag_key in EXPERIMENTAL_FLAG_KEYS]
        connection.execute(
            """
            INSERT INTO changelog_entries(created_at, title, summary, channel, ticket_id, flags_changed_json, proposal_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                utc_now_iso(),
                title,
                summary,
                normalized_channel,
                ticket_id,
                json.dumps(normalized_flags, separators=(",", ":")),
                proposal_id,
            ),
        )

    def _list_changelog_locked(self, connection: sqlite3.Connection, limit: int = CHANGELOG_MAX_ITEMS) -> list[dict[str, Any]]:
        rows = connection.execute(
            """
            SELECT created_at, title, summary, channel, ticket_id, flags_changed_json, proposal_id
            FROM changelog_entries
            ORDER BY created_at DESC, changelog_id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        entries: list[dict[str, Any]] = []
        for row in rows:
            raw_flags = row["flags_changed_json"] or "[]"
            try:
                parsed_flags = json.loads(raw_flags)
            except json.JSONDecodeError:
                parsed_flags = []
            flags_changed = [flag for flag in parsed_flags if isinstance(flag, str)]
            channel = row["channel"] if row["channel"] in ALLOWED_RELEASE_CHANNELS else DEFAULT_RELEASE_CHANNEL
            entries.append(
                {
                    "created_at": str(row["created_at"]),
                    "title": str(row["title"]),
                    "summary": str(row["summary"]),
                    "channel": channel,
                    "ticket_id": str(row["ticket_id"]) if row["ticket_id"] is not None else None,
                    "proposal_id": str(row["proposal_id"]) if row["proposal_id"] is not None else None,
                    "flags_changed": flags_changed,
                }
            )
        return entries

    def _ensure_changelog_schema(self, connection: sqlite3.Connection) -> None:
        columns = connection.execute("PRAGMA table_info(changelog_entries)").fetchall()
        column_names = {str(column["name"]) for column in columns}
        if "proposal_id" not in column_names:
            connection.execute("ALTER TABLE changelog_entries ADD COLUMN proposal_id TEXT")

    def _ensure_proposals_schema(self, connection: sqlite3.Connection) -> None:
        columns = connection.execute("PRAGMA table_info(change_proposals)").fetchall()
        column_names = {str(column["name"]) for column in columns}
        if "improvement_class" not in column_names:
            connection.execute(
                "ALTER TABLE change_proposals ADD COLUMN improvement_class TEXT DEFAULT 'settings-trust-microcopy-v1'"
            )

    def write_patch_log(self, patch_id: str, log_text: str) -> None:
        """Persist a raw agent execution log for the given patch_id."""
        created_at = utc_now_iso()
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                INSERT INTO patch_logs(patch_id, log_text, created_at)
                VALUES (?, ?, ?)
                ON CONFLICT(patch_id) DO UPDATE SET
                  log_text = excluded.log_text,
                  created_at = excluded.created_at
                """,
                (patch_id, log_text, created_at),
            )

    def get_patch_log(self, patch_id: str) -> dict[str, Any] | None:
        """Return a single patch log row for patch_id, or None if not found."""
        with self._lock, self._connect() as connection:
            row = connection.execute(
                """
                SELECT patch_id, log_text, created_at
                FROM patch_logs
                WHERE patch_id = ?
                LIMIT 1
                """,
                (patch_id,),
            ).fetchone()
            if row is None:
                return None
            return {
                "patch_id": str(row["patch_id"]),
                "log_text": str(row["log_text"]),
                "created_at": str(row["created_at"]),
            }

    def log_patch_metrics(
        self,
        patch_id: str,
        feedback_id: str,
        final_status: str,
        agent_model: str,
        files_changed_count: int,
        unified_diff: str,
        created_at: str,
        resolved_at: str,
    ) -> None:
        """Log patch outcome to patch_metrics table (T-0076). Best-effort; never blocks."""
        added = sum(1 for line in unified_diff.split("\n") if line.startswith("+") and not line.startswith("+++"))
        removed = sum(1 for line in unified_diff.split("\n") if line.startswith("-") and not line.startswith("---"))
        try:
            with self._lock, self._connect() as connection:
                connection.execute(
                    """
                    INSERT INTO patch_metrics(
                        patch_id, feedback_id, final_status, agent_model,
                        files_changed_count, diff_lines_added, diff_lines_removed,
                        created_at, resolved_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(patch_id) DO UPDATE SET
                        feedback_id = excluded.feedback_id,
                        final_status = excluded.final_status,
                        agent_model = excluded.agent_model,
                        files_changed_count = excluded.files_changed_count,
                        diff_lines_added = excluded.diff_lines_added,
                        diff_lines_removed = excluded.diff_lines_removed,
                        created_at = excluded.created_at,
                        resolved_at = excluded.resolved_at
                    """,
                    (
                        patch_id,
                        feedback_id,
                        final_status,
                        agent_model,
                        files_changed_count,
                        added,
                        removed,
                        created_at,
                        resolved_at,
                    ),
                )
        except Exception:  # noqa: BLE001
            import logging

            logging.getLogger(__name__).warning(
                "patch_metrics DB write failed for %s; apply flow continues",
                patch_id,
                exc_info=True,
            )

    def _read_persona_additions_locked(self, connection: sqlite3.Connection) -> list[dict[str, Any]]:
        raw = self._get_setting(connection, PERSONA_ADDITIONS_KEY)
        if raw is None:
            return []
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return []
        if not isinstance(parsed, list):
            return []
        return [
            {"text": str(item.get("text", "")), "added_at": str(item.get("added_at", ""))}
            for item in parsed
            if isinstance(item, dict) and item.get("text")
        ][:PERSONA_ADDITIONS_MAX]

    def _write_persona_additions_locked(
        self, connection: sqlite3.Connection, additions: list[dict[str, Any]]
    ) -> None:
        self._set_setting(
            connection,
            PERSONA_ADDITIONS_KEY,
            json.dumps(additions[:PERSONA_ADDITIONS_MAX], separators=(",", ":")),
        )

    def _extract_persona_sentence_from_diff_summary(self, diff_summary: str) -> str | None:
        """Extract the sentence to add from diff_summary. Format: Append "sentence" to the active system prompt."""
        if not diff_summary or not isinstance(diff_summary, str):
            return None
        s = diff_summary.strip()
        m = re.search(r'[Aa]ppend\s+["\'](.+?)["\']\s+to', s, re.DOTALL)
        if m:
            return m.group(1).strip()
        return None

    def _apply_persona_addition_locked(
        self,
        connection: sqlite3.Connection,
        diff_summary: str,
        proposal_title: str,
        proposal_id: str,
        replace_index: int | None = None,
    ) -> None:
        sentence = self._extract_persona_sentence_from_diff_summary(diff_summary)
        if not sentence or len(sentence) > 200:
            raise ValueError("Could not extract a valid persona sentence from the proposal (max 200 chars).")

        additions = self._read_persona_additions_locked(connection)

        if replace_index is not None and 0 <= replace_index < len(additions):
            additions[replace_index] = {"text": sentence, "added_at": utc_now_iso()}
            self._write_persona_additions_locked(connection, additions)
        elif len(additions) >= PERSONA_ADDITIONS_MAX:
            raise ValueError(
                f"Persona cap reached ({PERSONA_ADDITIONS_MAX} additions). Remove one from Settings → AI Persona first."
            )
        else:
            additions.append({"text": sentence, "added_at": utc_now_iso()})
            self._write_persona_additions_locked(connection, additions)

        release_channel = self._read_release_settings_locked(connection)["channel"]
        self._append_changelog_entry_locked(
            connection,
            title=f"system-prompt-persona-v1 | {proposal_title}",
            summary=diff_summary,
            channel=release_channel,
            ticket_id="T-0055",
            proposal_id=proposal_id,
        )

    def _proposal_changelog_fields(self, row: sqlite3.Row) -> tuple[str, str]:
        title = str(row["title"]).strip()
        if not title:
            title = "Proposal accepted"

        summary_candidates = [row["diff_summary"], row["rationale"]]
        summary = ""
        for candidate in summary_candidates:
            if not isinstance(candidate, str):
                continue
            trimmed = candidate.strip()
            if trimmed:
                summary = trimmed
                break
        if not summary:
            summary = "Accepted proposal recorded in local changelog."

        return title, summary

    def _create_conversation_locked(self, connection: sqlite3.Connection, title: str) -> str:
        conversation_id = str(uuid.uuid4())
        now = utc_now_iso()
        connection.execute(
            """
            INSERT INTO conversations(conversation_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            (conversation_id, title, now, now),
        )
        self.append_event_locked(
            connection,
            event_type="conversation_created",
            payload={"conversation_id": conversation_id, "title": title},
        )
        return conversation_id

    def _normalize_string_list(self, values: list[Any]) -> list[str]:
        normalized: list[str] = []
        for value in values:
            if not isinstance(value, str):
                continue
            trimmed = value.strip()
            if not trimmed:
                continue
            normalized.append(trimmed)
        return normalized

    def _normalize_validation_runs(self, raw_value: Any) -> list[dict[str, Any]]:
        if not isinstance(raw_value, list):
            return []

        normalized: list[dict[str, Any]] = []
        for item in raw_value:
            if not isinstance(item, dict):
                continue
            status = item.get("status")
            if status not in ALLOWED_VALIDATION_STATUS:
                continue

            created_at = item.get("created_at")
            validation_run_id = item.get("validation_run_id")
            if not isinstance(created_at, str) or not created_at:
                continue
            if not isinstance(validation_run_id, str) or not validation_run_id:
                continue

            summary = item.get("summary")
            artifact_refs = item.get("artifact_refs")
            normalized.append(
                {
                    "validation_run_id": validation_run_id,
                    "status": status,
                    "summary": summary if isinstance(summary, str) else "",
                    "artifact_refs": self._normalize_string_list(artifact_refs if isinstance(artifact_refs, list) else []),
                    "created_at": created_at,
                }
            )
        return normalized

    def _normalize_decision(self, status: Any, timestamp: Any, notes: Any) -> dict[str, Any]:
        normalized_status = status if status in ALLOWED_DECISION_STATUS else "pending"
        normalized_timestamp = timestamp if isinstance(timestamp, str) and timestamp else None
        normalized_notes = notes if isinstance(notes, str) and notes.strip() else None
        if normalized_status == "pending":
            normalized_timestamp = None
        return {
            "status": normalized_status,
            "decided_at": normalized_timestamp,
            "notes": normalized_notes,
        }

    def _deserialize_proposal_row(self, row: sqlite3.Row) -> dict[str, Any]:
        raw_feedback_ids = row["source_feedback_ids_json"] or "[]"
        raw_validation_runs = row["validation_runs_json"] or "[]"
        try:
            parsed_feedback_ids = json.loads(raw_feedback_ids)
        except json.JSONDecodeError:
            parsed_feedback_ids = []
        try:
            parsed_validation_runs = json.loads(raw_validation_runs)
        except json.JSONDecodeError:
            parsed_validation_runs = []

        out: dict[str, Any] = {
            "proposal_id": str(row["proposal_id"]),
            "created_at": str(row["created_at"]),
            "title": str(row["title"]),
            "rationale": str(row["rationale"]),
            "source_feedback_ids": self._normalize_string_list(
                parsed_feedback_ids if isinstance(parsed_feedback_ids, list) else []
            ),
            "diff_summary": str(row["diff_summary"]),
            "risk_notes": str(row["risk_notes"]),
            "validation_runs": self._normalize_validation_runs(parsed_validation_runs),
            "decision": self._normalize_decision(
                row["decision_status"],
                row["decision_timestamp"],
                row["decision_notes"],
            ),
        }
        if "improvement_class" in row.keys() and row["improvement_class"] is not None:
            out["improvement_class"] = str(row["improvement_class"])
        return out

    def _list_proposals_locked(self, connection: sqlite3.Connection) -> list[dict[str, Any]]:
        rows = connection.execute(
            """
            SELECT proposal_id, created_at, title, rationale, source_feedback_ids_json, diff_summary, risk_notes,
                   validation_runs_json, decision_status, decision_timestamp, decision_notes,
                   improvement_class
            FROM change_proposals
            ORDER BY created_at DESC, proposal_id DESC
            """
        ).fetchall()
        return [self._deserialize_proposal_row(row) for row in rows]

    def list_proposals(self) -> list[dict[str, Any]]:
        with self._lock, self._connect() as connection:
            return self._list_proposals_locked(connection)

    def create_proposal(
        self,
        *,
        title: str,
        rationale: str = "",
        source_feedback_ids: list[str] | None = None,
        diff_summary: str = "",
        risk_notes: str = "",
        improvement_class: str = "settings-trust-microcopy-v1",
    ) -> dict[str, Any]:
        proposal_id = str(uuid.uuid4())
        created_at = utc_now_iso()
        normalized_feedback_ids = self._normalize_string_list(source_feedback_ids or [])
        normalized_class = improvement_class.strip() or "settings-trust-microcopy-v1"
        if normalized_class not in ("settings-trust-microcopy-v1", "system-prompt-persona-v1"):
            normalized_class = "settings-trust-microcopy-v1"

        with self._lock, self._connect() as connection:
            connection.execute(
                """
                INSERT INTO change_proposals(
                  proposal_id, created_at, title, rationale, source_feedback_ids_json,
                  diff_summary, risk_notes, validation_runs_json, decision_status, decision_timestamp, decision_notes,
                  improvement_class
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?)
                """,
                (
                    proposal_id,
                    created_at,
                    title.strip(),
                    rationale.strip(),
                    json.dumps(normalized_feedback_ids, separators=(",", ":")),
                    diff_summary.strip(),
                    risk_notes.strip(),
                    "[]",
                    normalized_class,
                ),
            )
            self.append_event_locked(
                connection,
                event_type="change_proposal_created",
                payload={"proposal_id": proposal_id, "source_feedback_count": len(normalized_feedback_ids)},
            )
            row = connection.execute(
                """
                SELECT proposal_id, created_at, title, rationale, source_feedback_ids_json, diff_summary, risk_notes,
                       validation_runs_json, decision_status, decision_timestamp, decision_notes, improvement_class
                FROM change_proposals
                WHERE proposal_id = ?
                LIMIT 1
                """,
                (proposal_id,),
            ).fetchone()
            if row is None:
                raise RuntimeError("Proposal insert failed.")
            return self._deserialize_proposal_row(row)

    def add_proposal_validation_run(
        self,
        proposal_id: str,
        *,
        status: str,
        summary: str = "",
        artifact_refs: list[str] | None = None,
        validation_run_id: str | None = None,
    ) -> dict[str, Any]:
        if status not in ALLOWED_VALIDATION_STATUS:
            raise ValueError("Unsupported validation status.")

        with self._lock, self._connect() as connection:
            row = connection.execute(
                "SELECT validation_runs_json FROM change_proposals WHERE proposal_id = ? LIMIT 1",
                (proposal_id,),
            ).fetchone()
            if row is None:
                raise ValueError("Proposal does not exist.")

            try:
                parsed_runs = json.loads(row["validation_runs_json"] or "[]")
            except json.JSONDecodeError:
                parsed_runs = []
            normalized_runs = self._normalize_validation_runs(parsed_runs)
            next_run_id = validation_run_id.strip() if isinstance(validation_run_id, str) and validation_run_id.strip() else str(uuid.uuid4())
            normalized_runs.append(
                {
                    "validation_run_id": next_run_id,
                    "status": status,
                    "summary": summary.strip(),
                    "artifact_refs": self._normalize_string_list(artifact_refs or []),
                    "created_at": utc_now_iso(),
                }
            )

            connection.execute(
                """
                UPDATE change_proposals
                SET validation_runs_json = ?
                WHERE proposal_id = ?
                """,
                (json.dumps(normalized_runs, separators=(",", ":")), proposal_id),
            )
            self.append_event_locked(
                connection,
                event_type="change_proposal_validation_added",
                payload={"proposal_id": proposal_id, "status": status, "validation_run_id": next_run_id},
            )
            updated = connection.execute(
                """
                SELECT proposal_id, created_at, title, rationale, source_feedback_ids_json, diff_summary, risk_notes,
                       validation_runs_json, decision_status, decision_timestamp, decision_notes
                FROM change_proposals
                WHERE proposal_id = ?
                LIMIT 1
                """,
                (proposal_id,),
            ).fetchone()
            if updated is None:
                raise RuntimeError("Proposal update failed.")
            return self._deserialize_proposal_row(updated)

    def update_proposal_decision(self, proposal_id: str, *, status: str, notes: str | None = None) -> dict[str, Any]:
        if status not in ALLOWED_DECISION_STATUS:
            raise ValueError("Unsupported decision status.")

        normalized_notes = notes.strip() if isinstance(notes, str) and notes.strip() else None

        with self._lock, self._connect() as connection:
            row = connection.execute(
                """
                SELECT title, rationale, diff_summary, validation_runs_json, decision_status, decision_timestamp, decision_notes,
                       improvement_class
                FROM change_proposals
                WHERE proposal_id = ?
                LIMIT 1
                """,
                (proposal_id,),
            ).fetchone()
            if row is None:
                raise ValueError("Proposal does not exist.")

            try:
                parsed_runs = json.loads(row["validation_runs_json"] or "[]")
            except json.JSONDecodeError:
                parsed_runs = []
            normalized_runs = self._normalize_validation_runs(parsed_runs)

            if status == "accepted":
                latest_run = normalized_runs[-1] if normalized_runs else None
                if latest_run is None or latest_run.get("status") != "passing":
                    raise ValueError("Acceptance requires a passing latest validation run.")
                if row["decision_status"] == "accepted":
                    accepted_row = connection.execute(
                        """
                        SELECT proposal_id, created_at, title, rationale, source_feedback_ids_json, diff_summary, risk_notes,
                               validation_runs_json, decision_status, decision_timestamp, decision_notes
                        FROM change_proposals
                        WHERE proposal_id = ?
                        LIMIT 1
                        """,
                        (proposal_id,),
                    ).fetchone()
                    if accepted_row is None:
                        raise RuntimeError("Proposal read failed.")
                    return self._deserialize_proposal_row(accepted_row)

            decision_timestamp = utc_now_iso() if status != "pending" else None
            connection.execute(
                """
                UPDATE change_proposals
                SET decision_status = ?, decision_timestamp = ?, decision_notes = ?
                WHERE proposal_id = ?
                """,
                (status, decision_timestamp, normalized_notes, proposal_id),
            )
            self.append_event_locked(
                connection,
                event_type="change_proposal_decision_updated",
                payload={"proposal_id": proposal_id, "status": status},
            )
            if status == "accepted":
                improvement_class = str(row.get("improvement_class", "")).strip() or "settings-trust-microcopy-v1"
                if improvement_class == "system-prompt-persona-v1":
                    self._apply_persona_addition_locked(
                        connection,
                        diff_summary=str(row["diff_summary"]),
                        proposal_title=str(row["title"]),
                        proposal_id=proposal_id,
                    )
                else:
                    existing_entry = connection.execute(
                        """
                        SELECT changelog_id
                        FROM changelog_entries
                        WHERE proposal_id = ?
                        LIMIT 1
                        """,
                        (proposal_id,),
                    ).fetchone()
                    if existing_entry is None:
                        title, summary = self._proposal_changelog_fields(row)
                        release_channel = self._read_release_settings_locked(connection)["channel"]
                        self._append_changelog_entry_locked(
                            connection,
                            title=title,
                            summary=summary,
                            channel=release_channel,
                            ticket_id="T-0015",
                            proposal_id=proposal_id,
                        )
            updated = connection.execute(
                """
                SELECT proposal_id, created_at, title, rationale, source_feedback_ids_json, diff_summary, risk_notes,
                       validation_runs_json, decision_status, decision_timestamp, decision_notes
                FROM change_proposals
                WHERE proposal_id = ?
                LIMIT 1
                """,
                (proposal_id,),
            ).fetchone()
            if updated is None:
                raise RuntimeError("Proposal update failed.")
            return self._deserialize_proposal_row(updated)

    def list_conversations(self) -> list[dict[str, Any]]:
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                """
                SELECT conversation_id, title, created_at, updated_at
                FROM conversations
                ORDER BY updated_at DESC
                """
            ).fetchall()
            return [dict(row) for row in rows]

    def get_messages(self, conversation_id: str) -> list[dict[str, Any]]:
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                """
                SELECT message_id, conversation_id, role, text, meta, created_at
                FROM messages
                WHERE conversation_id = ?
                ORDER BY message_id ASC
                """,
                (conversation_id,),
            ).fetchall()
            return [dict(row) for row in rows]

    def get_state(self) -> dict[str, Any]:
        with self._lock, self._connect() as connection:
            active_id = self._get_active_conversation_id(connection)
            if not active_id:
                active_id = self._create_conversation_locked(connection, title="Today's Session")
                self._set_active_conversation_id(connection, active_id)

            conversations = connection.execute(
                """
                SELECT conversation_id, title, created_at, updated_at
                FROM conversations
                ORDER BY updated_at DESC
                """
            ).fetchall()
            messages = connection.execute(
                """
                SELECT message_id, conversation_id, role, text, meta, created_at
                FROM messages
                WHERE conversation_id = ?
                ORDER BY message_id ASC
                """,
                (active_id,),
            ).fetchall()

            cost_total = _sum_cost_from_messages([dict(row) for row in messages])

            persona_additions = self._read_persona_additions_locked(connection)

            return {
                "active_conversation_id": active_id,
                "conversations": [dict(row) for row in conversations],
                "messages": [dict(row) for row in messages],
                "settings": self._read_release_settings_locked(connection),
                "changelog": self._list_changelog_locked(connection),
                "proposals": self._list_proposals_locked(connection),
                "persona_additions": persona_additions,
                "conversation_cost_total": cost_total,
            }

    def remove_persona_addition(self, index: int) -> list[dict[str, Any]]:
        """Remove persona addition by index. Logs rollback changelog entry."""
        with self._lock, self._connect() as connection:
            additions = self._read_persona_additions_locked(connection)
            if index < 0 or index >= len(additions):
                raise ValueError("Invalid persona addition index.")
            removed = additions.pop(index)
            self._write_persona_additions_locked(connection, additions)
            release_channel = self._read_release_settings_locked(connection)["channel"]
            self._append_changelog_entry_locked(
                connection,
                title="system-prompt-persona-v1 | Persona change removed",
                summary=f"Removed: {removed.get('text', '')}",
                channel=release_channel,
                ticket_id="T-0055",
            )
            self.append_event_locked(
                connection,
                event_type="persona_addition_removed",
                payload={"index": index, "removed_text": removed.get("text", "")[:100]},
            )
            return self._read_persona_additions_locked(connection)

    def get_release_settings(self) -> dict[str, Any]:
        with self._lock, self._connect() as connection:
            return self._read_release_settings_locked(connection)

    def set_release_channel(self, channel: str) -> dict[str, Any]:
        if channel not in ALLOWED_RELEASE_CHANNELS:
            raise ValueError("Unsupported release channel.")
        with self._lock, self._connect() as connection:
            self._set_setting(connection, "release_channel", channel)
            self.append_event_locked(connection, "release_channel_updated", {"channel": channel})
            self._append_changelog_entry_locked(
                connection,
                title=f"Release channel set to {channel}",
                summary="Updated feature toggle channel preference. This does not roll back code or data.",
                channel=channel,
            )
            return self._read_release_settings_locked(connection)

    def set_experimental_flag(self, flag_key: str, enabled: bool) -> dict[str, Any]:
        if flag_key not in EXPERIMENTAL_FLAG_KEYS:
            raise ValueError("Unknown experimental flag.")
        with self._lock, self._connect() as connection:
            settings = self._read_release_settings_locked(connection)
            if settings["channel"] != "experimental":
                raise ValueError("Experimental flags can only be changed in experimental channel.")

            next_flags = dict(settings["experimental_flags"])
            next_flags[flag_key] = bool(enabled)
            self._set_setting(
                connection,
                "experimental_flags_json",
                json.dumps(next_flags, separators=(",", ":"), sort_keys=True),
            )
            self.append_event_locked(
                connection,
                "experimental_flag_updated",
                {"flag": flag_key, "enabled": bool(enabled)},
            )
            self._append_changelog_entry_locked(
                connection,
                title=f"{flag_key} {'enabled' if enabled else 'disabled'}",
                summary=f"Feature toggle rollback only: set {flag_key} to {'on' if enabled else 'off'}.",
                channel=settings["channel"],
                flags_changed=[flag_key],
            )
            return self._read_release_settings_locked(connection)

    def reset_experiments(self) -> dict[str, Any]:
        with self._lock, self._connect() as connection:
            settings = self._read_release_settings_locked(connection)
            next_flags = {flag_key: False for flag_key in settings["experimental_flags"]}
            changed_flags = [flag_key for flag_key, enabled in settings["experimental_flags"].items() if enabled]
            self._set_setting(
                connection,
                "experimental_flags_json",
                json.dumps(next_flags, separators=(",", ":"), sort_keys=True),
            )
            self.append_event_locked(
                connection,
                "experimental_flags_reset",
                {"changed_flags": changed_flags},
            )
            self._append_changelog_entry_locked(
                connection,
                title="Experiments reset",
                summary="Disabled all experimental feature toggles. This does not roll back code or stored data.",
                channel=settings["channel"],
                flags_changed=changed_flags,
            )
            return self._read_release_settings_locked(connection)

    def create_conversation(self, title: str = "New Conversation", set_active: bool = True) -> str:
        with self._lock, self._connect() as connection:
            conversation_id = self._create_conversation_locked(connection, title=title)
            if set_active:
                self._set_active_conversation_id(connection, conversation_id)
            return conversation_id

    def set_active_conversation(self, conversation_id: str) -> str:
        with self._lock, self._connect() as connection:
            exists = connection.execute(
                "SELECT 1 FROM conversations WHERE conversation_id = ? LIMIT 1",
                (conversation_id,),
            ).fetchone()
            if not exists:
                raise ValueError("Conversation does not exist.")
            self._set_active_conversation_id(connection, conversation_id)
            return conversation_id

    def update_conversation_title(self, conversation_id: str, title: str) -> None:
        """Update conversation title. Raises ValueError if conversation does not exist."""
        trimmed = title.strip() or "New Conversation"
        if len(trimmed) > 120:
            trimmed = trimmed[:120]
        with self._lock, self._connect() as connection:
            cur = connection.execute(
                "UPDATE conversations SET title = ?, updated_at = ? WHERE conversation_id = ?",
                (trimmed, utc_now_iso(), conversation_id),
            )
            if cur.rowcount == 0:
                raise ValueError("Conversation does not exist.")
            self.append_event_locked(
                connection,
                event_type="conversation_renamed",
                payload={"conversation_id": conversation_id, "title": trimmed},
            )

    def try_auto_title_from_first_message(self, conversation_id: str) -> None:
        """If conversation title is 'New Conversation', set it from first user message (truncated to 50 chars)."""
        with self._lock, self._connect() as connection:
            conv = connection.execute(
                "SELECT title FROM conversations WHERE conversation_id = ?",
                (conversation_id,),
            ).fetchone()
            if not conv or str(conv["title"]) != "New Conversation":
                return
            row = connection.execute(
                "SELECT text FROM messages WHERE conversation_id = ? AND role = 'user' ORDER BY message_id ASC LIMIT 1",
                (conversation_id,),
            ).fetchone()
            if not row:
                return
            text = str(row["text"]).strip()
            if not text:
                return
            title = text[:50] + ("..." if len(text) > 50 else "")
            connection.execute(
                "UPDATE conversations SET title = ?, updated_at = ? WHERE conversation_id = ?",
                (title, utc_now_iso(), conversation_id),
            )
            self.append_event_locked(
                connection,
                event_type="conversation_auto_titled",
                payload={"conversation_id": conversation_id, "title": title},
            )

    def append_message(self, conversation_id: str, role: str, text: str, meta: str | None = None) -> None:
        now = utc_now_iso()
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                INSERT INTO messages(conversation_id, role, text, meta, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (conversation_id, role, text, meta, now),
            )
            connection.execute(
                "UPDATE conversations SET updated_at = ? WHERE conversation_id = ?",
                (now, conversation_id),
            )

    def append_event(self, event_type: str, payload: dict[str, Any]) -> None:
        with self._lock, self._connect() as connection:
            self.append_event_locked(connection, event_type=event_type, payload=payload)

    def append_event_locked(
        self,
        connection: sqlite3.Connection,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        connection.execute(
            "INSERT INTO events(event_type, created_at, payload) VALUES (?, ?, ?)",
            (event_type, utc_now_iso(), json.dumps(payload, separators=(",", ":"), sort_keys=True)),
        )

    def reset_all(self) -> str:
        with self._lock, self._connect() as connection:
            connection.execute("DELETE FROM messages")
            connection.execute("DELETE FROM events")
            connection.execute("DELETE FROM conversations")
            connection.execute("DELETE FROM settings")
            connection.execute("DELETE FROM changelog_entries")
            connection.execute("DELETE FROM patch_logs")

            fresh_id = self._create_conversation_locked(connection, title="Today's Session")
            self._set_active_conversation_id(connection, fresh_id)
            self._initialize_release_settings(connection)
            self.append_event_locked(connection, event_type="local_data_reset", payload={"ok": True})
            return fresh_id
