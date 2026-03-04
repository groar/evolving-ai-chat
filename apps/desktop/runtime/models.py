from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(default="", max_length=16000)


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(default="", max_length=4000)
    model_id: str | None = None  # Overrides default gpt-4o-mini when set
    history: list[HistoryMessage] | None = None  # Prior turns for multi-turn context
    system_prompt: str | None = None  # Optional system message for persona/tone (T-0055)


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    model_id: str
    created_at: str
    cost: float
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


class ConversationSummary(BaseModel):
    conversation_id: str
    title: str
    created_at: str
    updated_at: str


class MessageRecord(BaseModel):
    message_id: int
    conversation_id: str
    role: str
    text: str
    meta: str | None = None
    created_at: str


class ModelEntry(BaseModel):
    provider: str
    model_id: str
    display_name: str


class ApiKeysStatus(BaseModel):
    openai: bool = False
    anthropic: bool = False


class PersonaAddition(BaseModel):
    text: str
    added_at: str


class PatchSummary(BaseModel):
    """Lightweight patch artifact summary for the /state response and Changelog UI."""
    id: str
    status: str
    title: str
    description: str
    unified_diff: str = ""
    created_at: str
    failure_reason: str | None = None
    applied_at: str | None = None
    reverted_at: str | None = None


class PatchLogResponse(BaseModel):
    """Response body for GET /patches/{patch_id}/log."""
    patch_id: str
    log_text: str
    created_at: str


class RuntimeStateResponse(BaseModel):
    active_conversation_id: str
    conversations: list[ConversationSummary]
    messages: list[MessageRecord]
    settings: "RuntimeSettings"
    changelog: list["ChangelogEntry"] = Field(default_factory=list)
    proposals: list["ChangeProposal"] = Field(default_factory=list)
    persona_additions: list[PersonaAddition] = Field(default_factory=list)
    api_key_configured: bool = False
    api_keys: ApiKeysStatus = Field(default_factory=ApiKeysStatus)
    models: list[ModelEntry] = Field(default_factory=list)
    conversation_cost_total: float | None = None  # Sum of assistant message costs (approx)
    patches: list[PatchSummary] = Field(default_factory=list)


class RuntimeSettings(BaseModel):
    channel: Literal["stable", "experimental"]
    experimental_flags: dict[str, bool]
    active_flags: dict[str, bool]


class ChangelogEntry(BaseModel):
    created_at: str
    title: str
    summary: str
    channel: Literal["stable", "experimental"]
    ticket_id: str | None = None
    proposal_id: str | None = None
    flags_changed: list[str] = Field(default_factory=list)


class ValidationRunSummary(BaseModel):
    validation_run_id: str
    status: Literal["passing", "failing"]
    summary: str = Field(default="", max_length=4000)
    artifact_refs: list[str] = Field(default_factory=list)
    created_at: str


class ProposalDecision(BaseModel):
    status: Literal["pending", "accepted", "rejected"]
    decided_at: str | None = None
    notes: str | None = Field(default=None, max_length=4000)


class ChangeProposal(BaseModel):
    proposal_id: str
    created_at: str
    title: str = Field(max_length=240)
    rationale: str = Field(default="", max_length=4000)
    source_feedback_ids: list[str] = Field(default_factory=list)
    diff_summary: str = Field(default="", max_length=8000)
    risk_notes: str = Field(default="", max_length=4000)
    validation_runs: list[ValidationRunSummary] = Field(default_factory=list)
    decision: ProposalDecision
    improvement_class: str | None = None


class NewConversationRequest(BaseModel):
    title: str = Field(default="New Conversation", max_length=120)
    set_active: bool = True


class NewConversationResponse(BaseModel):
    conversation_id: str


class UpdateConversationRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)


class HealthResponse(BaseModel):
    ok: bool


class DeleteDataResponse(BaseModel):
    ok: bool
    active_conversation_id: str


class RuntimeSettingsResponse(BaseModel):
    settings: RuntimeSettings


class ReleaseChannelUpdateRequest(BaseModel):
    channel: Literal["stable", "experimental"]


class FeatureFlagUpdateRequest(BaseModel):
    enabled: bool


class CreateProposalRequest(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    rationale: str = Field(default="", max_length=4000)
    source_feedback_ids: list[str] = Field(default_factory=list)
    diff_summary: str = Field(default="", max_length=8000)
    risk_notes: str = Field(default="", max_length=4000)
    improvement_class: str = Field(default="settings-trust-microcopy-v1", max_length=64)


class AddValidationRunRequest(BaseModel):
    validation_run_id: str | None = Field(default=None, max_length=120)
    status: Literal["passing", "failing"]
    summary: str = Field(default="", max_length=4000)
    artifact_refs: list[str] = Field(default_factory=list)


class UpdateProposalDecisionRequest(BaseModel):
    status: Literal["pending", "accepted", "rejected"]
    notes: str | None = Field(default=None, max_length=4000)


class ConfigureRequest(BaseModel):
    """Runtime configuration (e.g. API keys from in-app settings)."""
    openai_api_key: str | None = Field(default=None, max_length=4000)
    anthropic_api_key: str | None = Field(default=None, max_length=4000)


# ---------------------------------------------------------------------------
# M8 agent code-patch models (T-0059)
# ---------------------------------------------------------------------------

class CodePatchRequest(BaseModel):
    """Request body for POST /agent/code-patch (spec §4)."""
    feedback_id: str = Field(min_length=1, max_length=120)
    feedback_title: str = Field(min_length=1, max_length=240)
    feedback_summary: str = Field(default="", max_length=4000)
    feedback_area: str = Field(min_length=1, max_length=120)
    base_ref: str = Field(default="", max_length=120)


class CodePatchResponse(BaseModel):
    """Response body for POST /agent/code-patch (spec §4)."""
    patch_id: str
    status: str
    title: str | None = None
    description: str | None = None
    eta_seconds: int | None = None
    scope_violations: list[str] | None = None


class PatchStatusResponse(BaseModel):
    """Response body for GET /agent/patch-status/{patch_id}."""
    patch_id: str
    status: str
    title: str | None = None
    description: str | None = None
    unified_diff: str = ""
    files_changed: list[str] | None = None
    scope_violations: list[str] | None = None
    failure_reason: str | None = None
    applied_at: str | None = None
    git_commit_sha: str | None = None
    reverted_at: str | None = None
    revert_commit_sha: str | None = None


# ---------------------------------------------------------------------------
# M8 rollback models (T-0060)
# ---------------------------------------------------------------------------

class RollbackRequest(BaseModel):
    """Request body for POST /agent/rollback (spec §3.4)."""
    patch_id: str = Field(min_length=1, max_length=120)


class RollbackResponse(BaseModel):
    """Response body for POST /agent/rollback."""
    patch_id: str
    status: str  # reverted | rollback_conflict | rollback_unavailable | not_applied
    revert_commit_sha: str | None = None
    reason: str | None = None


