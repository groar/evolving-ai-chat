from __future__ import annotations

import tempfile
from pathlib import Path

from storage import RuntimeStorage


def expect(condition: bool, label: str) -> None:
    if not condition:
        raise RuntimeError(f"FAIL: {label}")
    print(f"PASS: {label}")


def main() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        db_path = Path(temp_dir) / "smoke-runtime.db"
        first = RuntimeStorage(db_path=str(db_path))

        initial_state = first.get_state()
        conversation_id = initial_state["active_conversation_id"]

        first.append_message(conversation_id, role="user", text="hello")
        first.append_message(
            conversation_id,
            role="assistant",
            text="stub: hello",
            meta="stub | 2026-01-01T00:00:00+00:00 | $0.00",
        )
        first.append_event("message_sent", {"conversation_id": conversation_id})
        expect(len(first.get_messages(conversation_id)) == 2, "Messages persisted in SQLite")

        second = RuntimeStorage(db_path=str(db_path))
        restored_state = second.get_state()
        expect(
            restored_state["active_conversation_id"] == conversation_id,
            "Active conversation restored on runtime restart",
        )
        expect(len(second.get_messages(conversation_id)) == 2, "Messages readable after restart")

        new_id = second.reset_all()
        reset_state = second.get_state()
        expect(reset_state["active_conversation_id"] == new_id, "Delete local data resets active conversation")
        expect(len(reset_state["messages"]) == 0, "Delete local data clears messages")


if __name__ == "__main__":
    main()
