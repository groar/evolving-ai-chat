"""
Anthropic Claude adapter.

Uses ANTHROPIC_API_KEY from environment. Implements the same interface as OpenAIAdapter.
Pricing constants are approximate and may be stale.
"""

from __future__ import annotations

import os
from typing import AsyncIterator

# USD per 1M tokens — approximate, may be stale (as of 2026-03-01)
PRICING: dict[str, tuple[float, float]] = {
    "claude-3-5-sonnet-20241022": (3.00, 15.00),  # input, output
    "claude-3-5-haiku-20241022": (0.80, 4.00),
}

CONTEXT_LIMITS: dict[str, int] = {
    "claude-3-5-sonnet-20241022": 200000,
    "claude-3-5-haiku-20241022": 200000,
}
DEFAULT_CONTEXT_LIMIT = 200000
BUDGET_FRACTION = 0.8


def _estimate_tokens(text: str) -> int:
    """Rough token estimate: words * 1.3."""
    return max(1, int(len(text.split()) * 1.3))


def _truncate_history(
    history: list[dict[str, str]],
    current_message: str,
    model: str,
    budget_fraction: float = BUDGET_FRACTION,
) -> list[dict[str, str]]:
    """Drop oldest history until estimated tokens are under budget."""
    limit = CONTEXT_LIMITS.get(model, DEFAULT_CONTEXT_LIMIT)
    budget = int(limit * budget_fraction)
    current_tokens = _estimate_tokens(current_message)
    if current_tokens >= budget:
        return []
    remaining = budget - current_tokens
    result: list[dict[str, str]] = []
    for msg in reversed(history):
        msg_tokens = _estimate_tokens(msg.get("content", ""))
        if msg_tokens <= remaining:
            result.insert(0, msg)
            remaining -= msg_tokens
        else:
            break
    return result


def _compute_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Compute cost in USD, 6 decimal places."""
    rates = PRICING.get(model)
    if not rates:
        return 0.0
    input_rate, output_rate = rates
    cost = (prompt_tokens * input_rate + completion_tokens * output_rate) / 1_000_000
    return round(cost, 6)


class AnthropicAdapter:
    """Thin wrapper for Anthropic Messages API."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self._client = None

    def has_api_key(self) -> bool:
        key = self._api_key or os.environ.get("ANTHROPIC_API_KEY")
        return bool(key and str(key).strip())

    def configure(self, api_key: str) -> None:
        if api_key and str(api_key).strip():
            self._api_key = str(api_key).strip()
            self._client = None
        else:
            self._api_key = None
            self._client = None

    def _get_client(self):
        from anthropic import Anthropic

        if self._client is None:
            if not self._api_key:
                raise MissingApiKeyError()
            self._client = Anthropic(api_key=self._api_key)
        return self._client

    def chat(
        self,
        message: str,
        model_id: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> tuple[str, str, float]:
        """
        Send a message. Returns (reply, model_id, cost_usd).
        model_id defaults to claude-3-5-haiku-20241022.
        """
        model = model_id or "claude-3-5-haiku-20241022"
        raw_history = [{"role": m["role"], "content": m["content"]} for m in (history or [])]
        truncated = _truncate_history(raw_history, message, model)
        messages = truncated + [{"role": "user", "content": message}]

        client = self._get_client()
        resp = client.messages.create(
            model=model,
            max_tokens=4096,
            messages=messages,
        )

        reply = ""
        for block in resp.content:
            if hasattr(block, "text") and block.text:
                reply += block.text

        usage = resp.usage
        prompt_tokens = usage.input_tokens if usage else 0
        completion_tokens = usage.output_tokens if usage else 0
        cost = _compute_cost(model, prompt_tokens, completion_tokens)
        return reply, model, cost, prompt_tokens, completion_tokens

    async def chat_stream(
        self,
        message: str,
        model_id: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncIterator[dict]:
        """
        Stream chat tokens. Yields {"delta": "..."} then {"done": true, "model_id": "...", "cost": ...}.
        On error yields {"error": "<code>"} and stops.
        """
        api_key = self._api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not api_key or not str(api_key).strip():
            yield {"error": "api_key_not_set"}
            return

        model = model_id or "claude-3-5-haiku-20241022"
        raw_history = [{"role": m["role"], "content": m["content"]} for m in (history or [])]
        truncated = _truncate_history(raw_history, message, model)
        messages = truncated + [{"role": "user", "content": message}]

        try:
            from anthropic import AsyncAnthropic

            client = AsyncAnthropic(api_key=api_key)
            async with client.messages.stream(
                model=model,
                max_tokens=4096,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    if text:
                        yield {"delta": text}
                final = await stream.get_final_message()
                usage = getattr(final, "usage", None)
                prompt_tokens = usage.input_tokens if usage else 0
                completion_tokens = usage.output_tokens if usage else 0
                cost = _compute_cost(model, prompt_tokens, completion_tokens)
                yield {"done": True, "model_id": model, "cost": cost, "prompt_tokens": prompt_tokens, "completion_tokens": completion_tokens}
        except Exception as error:
            err_str = str(error).lower()
            if "authentication" in err_str or "401" in err_str or "invalid" in err_str:
                yield {"error": "api_key_invalid"}
            elif "rate" in err_str or "429" in err_str:
                yield {"error": "rate_limit"}
            else:
                yield {"error": "model_error", "detail": str(error)}


class MissingApiKeyError(Exception):
    """Raised when ANTHROPIC_API_KEY is not set."""
