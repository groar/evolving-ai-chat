from __future__ import annotations

import json
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_RELEASE_CHANNEL = "stable"
ALLOWED_RELEASE_CHANNELS = {"stable", "experimental"}
EXPERIMENTAL_FLAG_KEYS = {"show_runtime_diagnostics"}
CHANGELOG_MAX_ITEMS = 20
CURRENT_TICKET_ID = "T-0008"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


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
                  flags_changed_json TEXT
                );
                """
            )

            version_row = connection.execute("SELECT version FROM schema_version LIMIT 1").fetchone()
            if version_row is None:
                connection.execute("INSERT INTO schema_version(version) VALUES (?)", (1,))

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
    ) -> None:
        normalized_channel = channel if channel in ALLOWED_RELEASE_CHANNELS else DEFAULT_RELEASE_CHANNEL
        normalized_flags = [flag_key for flag_key in (flags_changed or []) if flag_key in EXPERIMENTAL_FLAG_KEYS]
        connection.execute(
            """
            INSERT INTO changelog_entries(created_at, title, summary, channel, ticket_id, flags_changed_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                utc_now_iso(),
                title,
                summary,
                normalized_channel,
                ticket_id,
                json.dumps(normalized_flags, separators=(",", ":")),
            ),
        )

    def _list_changelog_locked(self, connection: sqlite3.Connection, limit: int = CHANGELOG_MAX_ITEMS) -> list[dict[str, Any]]:
        rows = connection.execute(
            """
            SELECT created_at, title, summary, channel, ticket_id, flags_changed_json
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
                    "flags_changed": flags_changed,
                }
            )
        return entries

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

            return {
                "active_conversation_id": active_id,
                "conversations": [dict(row) for row in conversations],
                "messages": [dict(row) for row in messages],
                "settings": self._read_release_settings_locked(connection),
                "changelog": self._list_changelog_locked(connection),
            }

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

            fresh_id = self._create_conversation_locked(connection, title="Today's Session")
            self._set_active_conversation_id(connection, fresh_id)
            self._initialize_release_settings(connection)
            self.append_event_locked(connection, event_type="local_data_reset", payload={"ok": True})
            return fresh_id
