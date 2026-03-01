"""
OpenAI ChatCompletions adapter.

Uses OPENAI_API_KEY from environment. Pricing constants are approximate and may be stale.
"""

import os
from datetime import datetime, timezone

from openai import OpenAI
from openai import AuthenticationError, RateLimitError

# USD per 1M tokens — approximate, may be stale (as of 2026-03-01)
PRICING: dict[str, tuple[float, float]] = {
    "gpt-4o-mini": (0.15, 0.60),   # input, output
    "gpt-4o": (2.50, 10.00),
}


def _compute_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Compute cost in USD, 6 decimal places. Returns 0.0 for unknown models."""
    rates = PRICING.get(model)
    if not rates:
        return 0.0
    input_rate, output_rate = rates
    cost = (prompt_tokens * input_rate + completion_tokens * output_rate) / 1_000_000
    return round(cost, 6)


class OpenAIAdapter:
    """Thin wrapper for OpenAI ChatCompletions API."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self._client: OpenAI | None = None

    def has_api_key(self) -> bool:
        """Return True if a non-empty API key is configured (env or runtime)."""
        key = self._api_key or os.environ.get("OPENAI_API_KEY")
        return bool(key and str(key).strip())

    def configure(self, api_key: str) -> None:
        """Set API key at runtime (overrides env for this session)."""
        if api_key and str(api_key).strip():
            self._api_key = str(api_key).strip()
            self._client = None  # Reset client so it uses new key
        else:
            self._api_key = None
            self._client = None

    @property
    def _openai(self) -> OpenAI:
        if self._client is None:
            if not self._api_key:
                raise MissingApiKeyError()
            self._client = OpenAI(api_key=self._api_key)
        return self._client

    def chat(
        self,
        message: str,
        model_id: str | None = None,
    ) -> tuple[str, str, float]:
        """
        Send a single user message and return (reply, model_id, cost_usd).
        model_id defaults to gpt-4o-mini.
        """
        model = model_id or "gpt-4o-mini"
        resp = self._openai.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": message}],
        )
        choice = resp.choices[0]
        reply = choice.message.content or ""
        usage = resp.usage
        prompt_tokens = usage.prompt_tokens if usage else 0
        completion_tokens = usage.completion_tokens if usage else 0
        cost = _compute_cost(model, prompt_tokens, completion_tokens)
        return reply, model, cost


class MissingApiKeyError(Exception):
    """Raised when OPENAI_API_KEY is not set."""
