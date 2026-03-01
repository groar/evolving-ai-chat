"""Unit tests for chat endpoint with mocked OpenAI client."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from openai import AuthenticationError, RateLimitError


def _make_openai_error_response(status_code: int) -> MagicMock:
    r = MagicMock()
    r.status_code = status_code
    return r

from runtime.adapters.openai_adapter import _estimate_tokens, _truncate_history
from runtime.main import app
from runtime.storage import RuntimeStorage


def _make_client(db_path: str) -> TestClient:
    """Create TestClient with app configured to use a temp db."""
    storage = RuntimeStorage(db_path=db_path)
    with patch("runtime.main.storage", storage):
        return TestClient(app)


class ChatEndpointHappyPathTests(unittest.TestCase):
    def test_chat_returns_real_response_when_api_key_set(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            def fake_chat(message: str, model_id: str | None = None, history=None):
                return "Hello, human!", "gpt-4o-mini", 0.000015

            with patch("runtime.main.chat_adapter.chat", fake_chat):
                client = _make_client(db_path)
                resp = client.post("/chat", json={"message": "hello"})

            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("reply", data)
            self.assertEqual(data["reply"], "Hello, human!")
            self.assertNotEqual(data["model_id"], "stub")
            self.assertGreater(data["cost"], 0)
            self.assertIn("created_at", data)

    def test_chat_model_override_from_request(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            def fake_chat(message: str, model_id: str | None = None, history=None):
                return "Hi", model_id or "gpt-4o-mini", 0.001

            with patch("runtime.main.chat_adapter.chat", fake_chat):
                client = _make_client(db_path)
                resp = client.post(
                    "/chat",
                    json={"message": "hi", "model_id": "gpt-4o"},
                )

            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["model_id"], "gpt-4o")

    def test_chat_with_history_passes_to_adapter(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            seen_history: list[dict[str, str]] | None = None

            def fake_chat(message: str, model_id: str | None = None, history=None):
                nonlocal seen_history
                seen_history = history
                return "reply two", "gpt-4o-mini", 0.00002

            with patch("runtime.main.chat_adapter.chat", fake_chat):
                client = _make_client(db_path)
                resp = client.post(
                    "/chat",
                    json={
                        "message": "and second?",
                        "history": [
                            {"role": "user", "content": "first"},
                            {"role": "assistant", "content": "reply one"},
                        ],
                    },
                )

            self.assertEqual(resp.status_code, 200)
            self.assertIsNotNone(seen_history)
            self.assertEqual(len(seen_history), 2)
            self.assertEqual(seen_history[0]["role"], "user")
            self.assertEqual(seen_history[0]["content"], "first")
            self.assertEqual(seen_history[1]["role"], "assistant")
            self.assertEqual(seen_history[1]["content"], "reply one")

    def test_chat_empty_history_backward_compatible(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            seen_history: list[dict[str, str]] | None = None

            def fake_chat(message: str, model_id: str | None = None, history=None):
                nonlocal seen_history
                seen_history = history
                return "Hi", "gpt-4o-mini", 0.00001

            with patch("runtime.main.chat_adapter.chat", fake_chat):
                client = _make_client(db_path)
                resp = client.post("/chat", json={"message": "hello", "history": []})

            self.assertEqual(resp.status_code, 200)
            self.assertEqual(seen_history, [])

    def test_chat_no_history_field_backward_compatible(self) -> None:
        """When history is absent from payload, adapter receives empty list (single-turn)."""
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            seen_history: list[dict[str, str]] | None = None

            def fake_chat(message: str, model_id: str | None = None, history=None):
                nonlocal seen_history
                seen_history = history if history is not None else []
                return "Hi", "gpt-4o-mini", 0.00001

            with patch("runtime.main.chat_adapter.chat", fake_chat):
                client = _make_client(db_path)
                resp = client.post("/chat", json={"message": "hello"})

            self.assertEqual(resp.status_code, 200)
            self.assertEqual(seen_history, [])


class TruncationTests(unittest.TestCase):
    def test_estimate_tokens_rough_proxy(self) -> None:
        self.assertEqual(_estimate_tokens(""), 1)
        self.assertGreaterEqual(_estimate_tokens("hello world"), 1)
        self.assertGreater(_estimate_tokens("a b c d e"), _estimate_tokens("a b"))

    def test_truncate_history_drops_oldest_when_over_budget(self) -> None:
        # gpt-4o-mini limit 8192, 80% = 6553. ~1.3 tokens per word.
        # "word " * 5000 ≈ 5000 words ≈ 6500 tokens - over budget for current msg + history
        long_msg = "word " * 5000
        short_msg = "hi"
        history = [
            {"role": "user", "content": long_msg},
            {"role": "assistant", "content": long_msg},
            {"role": "user", "content": short_msg},
        ]
        result = _truncate_history(history, "last question", "gpt-4o-mini")
        # Oldest (first) message should be dropped; we keep newest that fit
        self.assertLess(len(result), len(history))
        # Current message "last question" + some history should fit
        total_est = sum(_estimate_tokens(m["content"]) for m in result) + _estimate_tokens("last question")
        self.assertLessEqual(total_est, 8192 * 0.8 + 100)  # Allow small margin

    def test_truncate_history_keeps_all_when_under_budget(self) -> None:
        history = [
            {"role": "user", "content": "hello"},
            {"role": "assistant", "content": "hi there"},
        ]
        result = _truncate_history(history, "bye", "gpt-4o-mini")
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["content"], "hello")
        self.assertEqual(result[1]["content"], "hi there")


class ChatEndpointErrorTests(unittest.TestCase):
    def test_missing_api_key_returns_503(self) -> None:
        from runtime.adapters.openai_adapter import MissingApiKeyError

        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            def fake_chat_missing_key(*args: object, **kwargs: object):
                raise MissingApiKeyError()

            with patch(
                "runtime.main.chat_adapter.chat",
                side_effect=fake_chat_missing_key,
            ):
                client = _make_client(db_path)
                resp = client.post("/chat", json={"message": "hello"})

        self.assertEqual(resp.status_code, 503)
        self.assertEqual(resp.json(), {"error": "api_key_not_set"})

    def test_invalid_api_key_returns_401(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            def fake_chat_401(*args, **kwargs):
                raise AuthenticationError(
                    "Invalid key",
                    response=_make_openai_error_response(401),
                    body={},
                )

            with patch.dict(
                os.environ, {"OPENAI_API_KEY": "invalid"}, clear=False
            ):
                with patch(
                    "runtime.main.chat_adapter.chat",
                    side_effect=fake_chat_401,
                ):
                    client = _make_client(db_path)
                    resp = client.post("/chat", json={"message": "hello"})

        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json(), {"error": "api_key_invalid"})

    def test_rate_limit_returns_429(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            def fake_chat_429(*args, **kwargs):
                raise RateLimitError(
                    "Rate limited",
                    response=_make_openai_error_response(429),
                    body={},
                )

            with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-test"}, clear=False):
                with patch(
                    "runtime.main.chat_adapter.chat",
                    side_effect=fake_chat_429,
                ):
                    client = _make_client(db_path)
                    resp = client.post("/chat", json={"message": "hello"})

        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.json(), {"error": "rate_limit"})

    def test_empty_message_returns_422(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")
            client = _make_client(db_path)
            resp = client.post("/chat", json={"message": "   "})
        self.assertEqual(resp.status_code, 422)


class ChatStreamingTests(unittest.TestCase):
    def test_chat_with_accept_sse_returns_streaming_response(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            async def fake_stream(message: str, model_id=None, history=None):
                yield {"delta": "Hello"}
                yield {"delta": " world"}
                yield {"done": True, "model_id": "gpt-4o-mini", "cost": 0.00001}

            with patch("runtime.main.chat_adapter.chat_stream", fake_stream):
                client = _make_client(db_path)
                resp = client.post(
                    "/chat",
                    json={"message": "hi"},
                    headers={"Accept": "text/event-stream"},
                )
            self.assertEqual(resp.status_code, 200)
            self.assertIn("text/event-stream", resp.headers.get("content-type", ""))
            text = resp.text
            self.assertIn("data: ", text)
            self.assertIn("Hello", text)
            self.assertIn("world", text)
            self.assertIn("done", text)


class ConfigureEndpointTests(unittest.TestCase):
    def test_configure_accepts_key_and_returns_ok(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")
            with patch("runtime.main.chat_adapter") as mock_adapter:
                client = _make_client(db_path)
                resp = client.post(
                    "/configure",
                    json={"openai_api_key": "sk-test-key"},
                )
                self.assertEqual(resp.status_code, 200)
                self.assertEqual(resp.json(), {"ok": True})
                mock_adapter.configure.assert_called_once_with("sk-test-key")

    def test_state_includes_api_key_configured(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")
            with patch("runtime.main.chat_adapter") as mock_adapter:
                mock_adapter.has_api_key.return_value = True
                client = _make_client(db_path)
                resp = client.get("/state")
                self.assertEqual(resp.status_code, 200)
                self.assertTrue(resp.json().get("api_key_configured"))
