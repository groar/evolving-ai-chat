from __future__ import annotations

import json
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


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
                """
            )

            version_row = connection.execute("SELECT version FROM schema_version LIMIT 1").fetchone()
            if version_row is None:
                connection.execute("INSERT INTO schema_version(version) VALUES (?)", (1,))

            active_id = self._get_active_conversation_id(connection)
            if not active_id:
                created_id = self._create_conversation_locked(connection, title="Today's Session")
                self._set_active_conversation_id(connection, created_id)

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

    def _set_active_conversation_id(self, connection: sqlite3.Connection, conversation_id: str) -> None:
        connection.execute(
            """
            INSERT INTO settings(key, value)
            VALUES ('last_opened_conversation_id', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (conversation_id,),
        )

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
            }

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

            fresh_id = self._create_conversation_locked(connection, title="Today's Session")
            self._set_active_conversation_id(connection, fresh_id)
            self.append_event_locked(connection, event_type="local_data_reset", payload={"ok": True})
            return fresh_id
