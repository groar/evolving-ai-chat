from datetime import datetime, timezone

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(default="", max_length=4000)


class ChatResponse(BaseModel):
    reply: str
    model_id: str
    created_at: str
    cost: float

    @classmethod
    def from_message(cls, message: str) -> "ChatResponse":
        return cls(
            reply=f"stub: {message}",
            model_id="stub",
            created_at=datetime.now(timezone.utc).isoformat(),
            cost=0,
        )
