"""
Model registry: provider, model ID, display name, required API key.
Defines the set of models available for selection.
"""

from typing import TypedDict

# Provider identifier (matches api_key key in ConfigureRequest)
ProviderId = str

# Model identifier as used by the provider API (e.g. gpt-4o, claude-3-5-sonnet-20241022)
ModelId = str


class ModelEntry(TypedDict):
    provider: ProviderId
    model_id: ModelId
    display_name: str


# Registry: model_id -> ModelEntry (first model_id in each provider is default for that provider)
MODEL_REGISTRY: list[ModelEntry] = [
    {"provider": "openai", "model_id": "gpt-4o-mini", "display_name": "GPT-4o Mini"},
    {"provider": "openai", "model_id": "gpt-4o", "display_name": "GPT-4o"},
    {"provider": "anthropic", "model_id": "claude-3-5-sonnet-20241022", "display_name": "Claude Sonnet"},
    {"provider": "anthropic", "model_id": "claude-3-5-haiku-20241022", "display_name": "Claude Haiku"},
]

DEFAULT_MODEL_ID = "gpt-4o-mini"


def get_model(model_id: str) -> ModelEntry | None:
    """Return the registry entry for a model_id, or None if unknown."""
    for entry in MODEL_REGISTRY:
        if entry["model_id"] == model_id:
            return entry
    return None


def model_id_to_provider(model_id: str) -> ProviderId | None:
    """Return the provider for a model_id, or None if unknown."""
    entry = get_model(model_id)
    return entry["provider"] if entry else None


def list_models() -> list[ModelEntry]:
    """Return all models in registry order."""
    return list(MODEL_REGISTRY)
