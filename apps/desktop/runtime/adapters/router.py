"""
Chat router: selects adapter by model_id and routes requests.
"""

from __future__ import annotations

from typing import AsyncIterator

from .anthropic_adapter import AnthropicAdapter, MissingApiKeyError as AnthropicMissingApiKeyError
from .openai_adapter import MissingApiKeyError as OpenAIMissingApiKeyError
from .openai_adapter import OpenAIAdapter
from .registry import DEFAULT_MODEL_ID, model_id_to_provider


class ChatRouter:
    """Routes chat requests to the appropriate provider adapter."""

    def __init__(self) -> None:
        self._openai = OpenAIAdapter()
        self._anthropic = AnthropicAdapter()

    def configure(
        self,
        openai_api_key: str | None = None,
        anthropic_api_key: str | None = None,
    ) -> None:
        """Configure API keys. Only updates providers whose key is not None."""
        if openai_api_key is not None:
            self._openai.configure(openai_api_key or "")
        if anthropic_api_key is not None:
            self._anthropic.configure(anthropic_api_key or "")

    def has_key_for_model(self, model_id: str) -> bool:
        """Return True if the selected model's provider has an API key configured."""
        provider = model_id_to_provider(model_id)
        if provider == "openai":
            return self._openai.has_api_key()
        if provider == "anthropic":
            return self._anthropic.has_api_key()
        return False

    def has_any_key(self) -> bool:
        """Return True if at least one provider has an API key."""
        return self._openai.has_api_key() or self._anthropic.has_api_key()

    def get_api_keys_status(self) -> dict[str, bool]:
        """Return per-provider API key status."""
        return {
            "openai": self._openai.has_api_key(),
            "anthropic": self._anthropic.has_api_key(),
        }

    def get_adapter_for_model(self, model_id: str):
        """Return the adapter instance for the given model_id. Raises if unknown model."""
        provider = model_id_to_provider(model_id)
        if provider == "openai":
            return self._openai
        if provider == "anthropic":
            return self._anthropic
        raise ValueError(f"Unknown model: {model_id}")

    def chat(
        self,
        message: str,
        model_id: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> tuple[str, str, float, int, int]:
        """Route to the appropriate adapter. Returns (reply, model_id, cost_usd, prompt_tokens, completion_tokens)."""
        model = model_id or DEFAULT_MODEL_ID
        adapter = self.get_adapter_for_model(model)
        return adapter.chat(message=message, model_id=model, history=history)

    async def chat_stream(
        self,
        message: str,
        model_id: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncIterator[dict]:
        """Route streaming to the appropriate adapter."""
        model = model_id or DEFAULT_MODEL_ID
        adapter = self.get_adapter_for_model(model)
        async for event in adapter.chat_stream(
            message=message, model_id=model, history=history
        ):
            yield event


def is_missing_api_key_error(exc: BaseException) -> bool:
    """Return True if the exception indicates a missing API key."""
    return isinstance(
        exc,
        (OpenAIMissingApiKeyError, AnthropicMissingApiKeyError),
    )
