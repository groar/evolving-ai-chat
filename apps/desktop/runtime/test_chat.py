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

            def fake_chat(message: str, model_id: str | None = None):
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

            def fake_chat(message: str, model_id: str | None = None):
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


class ChatEndpointErrorTests(unittest.TestCase):
    def test_missing_api_key_returns_503(self) -> None:
        from runtime.adapters.openai_adapter import MissingApiKeyError

        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "runtime.db")

            def fake_chat_missing_key(*args, **kwargs):
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
