"""
OpenAI ChatCompletions adapter.

Uses OPENAI_API_KEY from environment. Pricing constants are approximate and may be stale.
"""

import os
from datetime import datetime, timezone
from typing import AsyncIterator

from openai import AsyncOpenAI, OpenAI
from openai import AuthenticationError, RateLimitError

# USD per 1M tokens — approximate, may be stale (as of 2026-03-01)
PRICING: dict[str, tuple[float, float]] = {
    "gpt-4o-mini": (0.15, 0.60),   # input, output
    "gpt-4o": (2.50, 10.00),
}

# Context window limits (tokens) per model — approximate; TODO: use tiktoken for exact counts
CONTEXT_LIMITS: dict[str, int] = {
    "gpt-4o-mini": 8192,
    "gpt-4o": 128000,
}
DEFAULT_CONTEXT_LIMIT = 8192
BUDGET_FRACTION = 0.8  # Use up to 80% of context for history + prompt


def _estimate_tokens(text: str) -> int:
    """Rough token estimate: words * 1.3. TODO: replace with tiktoken for accuracy."""
    return max(1, int(len(text.split()) * 1.3))


def _truncate_history(
    history: list[dict[str, str]],
    current_message: str,
    model: str,
    budget_fraction: float = BUDGET_FRACTION,
) -> list[dict[str, str]]:
    """Drop oldest history messages until estimated tokens are under budget. Current message is never dropped."""
    limit = CONTEXT_LIMITS.get(model, DEFAULT_CONTEXT_LIMIT)
    budget = int(limit * budget_fraction)
    current_tokens = _estimate_tokens(current_message)
    if current_tokens >= budget:
        return []  # Even current message exceeds budget; send empty history

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
        history: list[dict[str, str]] | None = None,
    ) -> tuple[str, str, float]:
        """
        Send a message with optional conversation history. Returns (reply, model_id, cost_usd).
        model_id defaults to gpt-4o-mini.
        history: list of {"role": "user"|"assistant", "content": "..."}; oldest first.
        """
        model = model_id or "gpt-4o-mini"
        raw_history = [{"role": m["role"], "content": m["content"]} for m in (history or [])]
        truncated = _truncate_history(raw_history, message, model)
        messages = truncated + [{"role": "user", "content": message}]
        resp = self._openai.chat.completions.create(
            model=model,
            messages=messages,
        )
        choice = resp.choices[0]
        reply = choice.message.content or ""
        usage = resp.usage
        prompt_tokens = usage.prompt_tokens if usage else 0
        completion_tokens = usage.completion_tokens if usage else 0
        cost = _compute_cost(model, prompt_tokens, completion_tokens)
        return reply, model, cost

    async def chat_stream(
        self,
        message: str,
        model_id: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncIterator[dict]:
        """
        Stream chat tokens. Yields {"delta": "..."} for each content chunk,
        then {"done": true, "model_id": "...", "cost": ...} at the end.
        On error yields {"error": "<code>"} and stops.
        """
        api_key = self._api_key or os.environ.get("OPENAI_API_KEY")
        if not api_key or not str(api_key).strip():
            yield {"error": "api_key_not_set"}
            return
        model = model_id or "gpt-4o-mini"
        raw_history = [{"role": m["role"], "content": m["content"]} for m in (history or [])]
        truncated = _truncate_history(raw_history, message, model)
        messages = truncated + [{"role": "user", "content": message}]
        try:
            client = AsyncOpenAI(api_key=api_key)
            stream = await client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
            )
            usage = None
            async for chunk in stream:
                if getattr(chunk, "usage", None):
                    usage = chunk.usage
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield {"delta": delta.content}
            prompt_tokens = usage.prompt_tokens if usage else 0
            completion_tokens = usage.completion_tokens if usage else 0
            cost = _compute_cost(model, prompt_tokens, completion_tokens)
            yield {"done": True, "model_id": model, "cost": cost}
        except AuthenticationError:
            yield {"error": "api_key_invalid"}
        except RateLimitError:
            yield {"error": "rate_limit"}
        except Exception as error:
            yield {"error": "model_error", "detail": str(error)}


class MissingApiKeyError(Exception):
    """Raised when OPENAI_API_KEY is not set."""
