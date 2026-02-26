from fastapi import FastAPI, HTTPException

from .models import (
    ChatRequest,
    ChatResponse,
    DeleteDataResponse,
    HealthResponse,
    NewConversationRequest,
    NewConversationResponse,
    RuntimeStateResponse,
    make_chat_response,
)
from .storage import RuntimeStorage

app = FastAPI(title="Evolving AI Chat Runtime", version="0.1.0")
storage = RuntimeStorage()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(ok=True)


@app.get("/state", response_model=RuntimeStateResponse)
def state() -> RuntimeStateResponse:
    return RuntimeStateResponse(**storage.get_state())


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    request_text = payload.message.strip()
    if not request_text:
        raise HTTPException(status_code=400, detail="Message is required.")

    try:
        active_id = storage.get_state()["active_conversation_id"]
        conversation_id = payload.conversation_id or active_id
        storage.set_active_conversation(conversation_id)
        response = make_chat_response(conversation_id=conversation_id, message=request_text)

        storage.append_message(conversation_id, role="user", text=request_text)
        storage.append_event(
            "message_sent",
            {"conversation_id": conversation_id, "role": "user", "text_length": len(request_text)},
        )

        assistant_meta = f"{response.model_id} | {response.created_at} | ${response.cost:.2f}"
        storage.append_message(conversation_id, role="assistant", text=response.reply, meta=assistant_meta)
        storage.append_event(
            "message_received",
            {"conversation_id": conversation_id, "role": "assistant", "model_id": response.model_id},
        )
        return response
    except ValueError as error:
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/chat"})
        raise HTTPException(status_code=404, detail=str(error)) from error
    except HTTPException:
        raise
    except Exception as error:  # pragma: no cover
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/chat"})
        raise HTTPException(status_code=500, detail="Runtime error while processing chat.") from error


@app.post("/conversations", response_model=NewConversationResponse)
def create_conversation(payload: NewConversationRequest) -> NewConversationResponse:
    title = payload.title.strip() or "New Conversation"
    conversation_id = storage.create_conversation(title=title, set_active=payload.set_active)
    return NewConversationResponse(conversation_id=conversation_id)


@app.post("/conversations/{conversation_id}/activate", response_model=NewConversationResponse)
def activate_conversation(conversation_id: str) -> NewConversationResponse:
    try:
        active_id = storage.set_active_conversation(conversation_id)
        return NewConversationResponse(conversation_id=active_id)
    except ValueError as error:
        storage.append_event(
            "runtime_error",
            {"detail": str(error), "endpoint": "/conversations/{conversation_id}/activate"},
        )
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.delete("/data", response_model=DeleteDataResponse)
def delete_local_data() -> DeleteDataResponse:
    active_conversation_id = storage.reset_all()
    return DeleteDataResponse(ok=True, active_conversation_id=active_conversation_id)
