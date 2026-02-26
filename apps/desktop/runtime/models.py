from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(default="", max_length=4000)


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    model_id: str
    created_at: str
    cost: float


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


class RuntimeStateResponse(BaseModel):
    active_conversation_id: str
    conversations: list[ConversationSummary]
    messages: list[MessageRecord]
    settings: "RuntimeSettings"
    changelog: list["ChangelogEntry"] = Field(default_factory=list)


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
    flags_changed: list[str] = Field(default_factory=list)


class NewConversationRequest(BaseModel):
    title: str = Field(default="New Conversation", max_length=120)
    set_active: bool = True


class NewConversationResponse(BaseModel):
    conversation_id: str


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


def make_chat_response(conversation_id: str, message: str) -> ChatResponse:
    created_at = datetime.now(timezone.utc).isoformat()
    return ChatResponse(
        conversation_id=conversation_id,
        reply=f"stub: {message}",
        model_id="stub",
        created_at=created_at,
        cost=0,
    )
