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
        initial_settings = first.get_release_settings()
        expect(initial_settings["channel"] == "stable", "Release channel defaults to stable")
        expect(
            initial_settings["active_flags"].get("show_runtime_diagnostics") is False,
            "Experimental flags are inactive by default",
        )

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
        second.set_release_channel("experimental")
        second.set_experimental_flag("show_runtime_diagnostics", True)
        experimental_settings = second.get_release_settings()
        expect(experimental_settings["channel"] == "experimental", "Release channel can switch to experimental")
        expect(
            experimental_settings["active_flags"].get("show_runtime_diagnostics") is True,
            "Experimental flags activate in experimental channel",
        )
        second.set_release_channel("stable")
        stable_settings = second.get_release_settings()
        expect(
            stable_settings["active_flags"].get("show_runtime_diagnostics") is False,
            "Experimental flags are inactive in stable channel",
        )
        try:
            second.set_experimental_flag("show_runtime_diagnostics", False)
            raise RuntimeError("FAIL: Stable channel should block experimental flag writes")
        except ValueError:
            print("PASS: Stable channel blocks experimental flag writes")

        new_id = second.reset_all()
        reset_state = second.get_state()
        expect(reset_state["active_conversation_id"] == new_id, "Delete local data resets active conversation")
        expect(len(reset_state["messages"]) == 0, "Delete local data clears messages")
        expect(reset_state["settings"]["channel"] == "stable", "Delete local data resets release channel to stable")


if __name__ == "__main__":
    main()
