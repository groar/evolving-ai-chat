import json
from datetime import datetime, timezone
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from openai import AuthenticationError, RateLimitError

from .adapters import OpenAIAdapter
from .adapters.openai_adapter import MissingApiKeyError
from .models import (
    AddValidationRunRequest,
    ChangeProposal,
    ChatRequest,
    ChatResponse,
    ConfigureRequest,
    CreateProposalRequest,
    DeleteDataResponse,
    FeatureFlagUpdateRequest,
    HealthResponse,
    NewConversationRequest,
    NewConversationResponse,
    ReleaseChannelUpdateRequest,
    RuntimeSettingsResponse,
    RuntimeStateResponse,
    UpdateProposalDecisionRequest,
)
from .storage import RuntimeStorage

chat_adapter = OpenAIAdapter()

app = FastAPI(title="Evolving AI Chat Runtime", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(tauri://localhost|http://localhost(?::\d+)?|http://127\.0\.0\.1(?::\d+)?)$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
storage = RuntimeStorage()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(ok=True)


@app.get("/state", response_model=RuntimeStateResponse)
def state() -> RuntimeStateResponse:
    state_data = dict(storage.get_state())
    state_data["api_key_configured"] = chat_adapter.has_api_key()
    return RuntimeStateResponse(**state_data)


@app.get("/settings", response_model=RuntimeSettingsResponse)
def runtime_settings() -> RuntimeSettingsResponse:
    return RuntimeSettingsResponse(settings=storage.get_release_settings())


@app.post("/settings/channel", response_model=RuntimeSettingsResponse)
def update_release_channel(payload: ReleaseChannelUpdateRequest) -> RuntimeSettingsResponse:
    try:
        settings = storage.set_release_channel(payload.channel)
        return RuntimeSettingsResponse(settings=settings)
    except ValueError as error:
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/settings/channel"})
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/settings/flags/{flag_key}", response_model=RuntimeSettingsResponse)
def update_feature_flag(flag_key: str, payload: FeatureFlagUpdateRequest) -> RuntimeSettingsResponse:
    try:
        settings = storage.set_experimental_flag(flag_key, payload.enabled)
        return RuntimeSettingsResponse(settings=settings)
    except ValueError as error:
        detail = str(error)
        status_code = 409 if "only be changed in experimental channel" in detail else 400
        storage.append_event("runtime_error", {"detail": detail, "endpoint": "/settings/flags/{flag_key}"})
        raise HTTPException(status_code=status_code, detail=detail) from error


@app.post("/settings/experiments/reset", response_model=RuntimeSettingsResponse)
def reset_experimental_flags() -> RuntimeSettingsResponse:
    settings = storage.reset_experiments()
    return RuntimeSettingsResponse(settings=settings)


@app.post("/configure")
def configure(payload: ConfigureRequest) -> dict:
    """Configure runtime (e.g. API key from in-app settings). Env var takes priority at startup."""
    chat_adapter.configure(payload.openai_api_key or "")
    return {"ok": True}


@app.get("/proposals", response_model=list[ChangeProposal])
def list_change_proposals() -> list[ChangeProposal]:
    return [ChangeProposal(**proposal) for proposal in storage.list_proposals()]


@app.post("/proposals", response_model=ChangeProposal)
def create_change_proposal(payload: CreateProposalRequest) -> ChangeProposal:
    proposal = storage.create_proposal(
        title=payload.title,
        rationale=payload.rationale,
        source_feedback_ids=payload.source_feedback_ids,
        diff_summary=payload.diff_summary,
        risk_notes=payload.risk_notes,
    )
    return ChangeProposal(**proposal)


@app.post("/proposals/{proposal_id}/validation-runs", response_model=ChangeProposal)
def add_proposal_validation_run(proposal_id: str, payload: AddValidationRunRequest) -> ChangeProposal:
    try:
        proposal = storage.add_proposal_validation_run(
            proposal_id,
            status=payload.status,
            summary=payload.summary,
            artifact_refs=payload.artifact_refs,
            validation_run_id=payload.validation_run_id,
        )
        return ChangeProposal(**proposal)
    except ValueError as error:
        storage.append_event(
            "runtime_error",
            {"detail": str(error), "endpoint": "/proposals/{proposal_id}/validation-runs"},
        )
        status_code = 404 if "does not exist" in str(error) else 400
        raise HTTPException(status_code=status_code, detail=str(error)) from error


@app.post("/proposals/{proposal_id}/decision", response_model=ChangeProposal)
def update_proposal_decision(proposal_id: str, payload: UpdateProposalDecisionRequest) -> ChangeProposal:
    try:
        proposal = storage.update_proposal_decision(
            proposal_id,
            status=payload.status,
            notes=payload.notes,
        )
        return ChangeProposal(**proposal)
    except ValueError as error:
        detail = str(error)
        storage.append_event("runtime_error", {"detail": detail, "endpoint": "/proposals/{proposal_id}/decision"})
        if "does not exist" in detail:
            raise HTTPException(status_code=404, detail=detail) from error
        if "requires a passing latest validation run" in detail:
            raise HTTPException(status_code=409, detail=detail) from error
        raise HTTPException(status_code=400, detail=detail) from error


def _chat_json(payload: ChatRequest) -> ChatResponse | JSONResponse:
    """Non-streaming chat path. Returns JSON response."""
    request_text = payload.message.strip()
    if not request_text:
        raise HTTPException(status_code=422, detail="Message is required.")

    try:
        active_id = storage.get_state()["active_conversation_id"]
        conversation_id = payload.conversation_id or active_id
        storage.set_active_conversation(conversation_id)

        history_dicts: list[dict[str, str]] = []
        if payload.history:
            history_dicts = [
                {"role": m.role, "content": m.content}
                for m in payload.history
            ]
        reply, model_id, cost = chat_adapter.chat(
            message=request_text,
            model_id=payload.model_id,
            history=history_dicts,
        )
        created_at = datetime.now(timezone.utc).isoformat()
        response = ChatResponse(
            conversation_id=conversation_id,
            reply=reply,
            model_id=model_id,
            created_at=created_at,
            cost=cost,
        )

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
    except MissingApiKeyError:
        storage.append_event("runtime_error", {"error": "api_key_not_set", "endpoint": "/chat"})
        return JSONResponse(status_code=503, content={"error": "api_key_not_set"})
    except AuthenticationError:
        storage.append_event("runtime_error", {"error": "api_key_invalid", "endpoint": "/chat"})
        return JSONResponse(status_code=401, content={"error": "api_key_invalid"})
    except RateLimitError:
        storage.append_event("runtime_error", {"error": "rate_limit", "endpoint": "/chat"})
        return JSONResponse(status_code=429, content={"error": "rate_limit"})
    except ValueError as error:
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/chat"})
        raise HTTPException(status_code=404, detail=str(error)) from error
    except HTTPException:
        raise
    except Exception as error:
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/chat"})
        return JSONResponse(
            status_code=502,
            content={"error": "model_error", "detail": str(error)},
        )


async def _stream_chat_sse(payload: ChatRequest) -> AsyncIterator[str]:
    """Yield SSE-formatted events for streaming chat."""
    request_text = payload.message.strip()
    if not request_text:
        yield f"data: {json.dumps({'error': 'message_required'})}\n\n"
        return

    try:
        active_id = storage.get_state()["active_conversation_id"]
        conversation_id = payload.conversation_id or active_id
        storage.set_active_conversation(conversation_id)
        storage.append_message(conversation_id, role="user", text=request_text)
        storage.append_event(
            "message_sent",
            {"conversation_id": conversation_id, "role": "user", "text_length": len(request_text)},
        )
    except Exception as error:
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/chat"})
        yield f"data: {json.dumps({'error': 'model_error', 'detail': str(error)})}\n\n"
        return

    history_dicts: list[dict[str, str]] = []
    if payload.history:
        history_dicts = [{"role": m.role, "content": m.content} for m in payload.history]

    accumulated = []
    model_id = "gpt-4o-mini"
    cost = 0.0

    async for event in chat_adapter.chat_stream(
        message=request_text,
        model_id=payload.model_id,
        history=history_dicts,
    ):
        if "error" in event:
            err_code = event["error"]
            storage.append_event("runtime_error", {"error": err_code, "endpoint": "/chat"})
            reply_so_far = "".join(accumulated)
            if reply_so_far:
                created_at = datetime.now(timezone.utc).isoformat()
                assistant_meta = f"stream_error | {created_at}"
                storage.append_message(
                    conversation_id, role="assistant", text=reply_so_far, meta=assistant_meta
                )
            yield f"data: {json.dumps(event)}\n\n"
            return
        if "delta" in event:
            accumulated.append(event["delta"])
            yield f"data: {json.dumps(event)}\n\n"
        if event.get("done"):
            model_id = event.get("model_id", "gpt-4o-mini")
            cost = event.get("cost", 0.0)
            reply = "".join(accumulated)
            created_at = datetime.now(timezone.utc).isoformat()
            assistant_meta = f"{model_id} | {created_at} | ${cost:.2f}"
            storage.append_message(conversation_id, role="assistant", text=reply, meta=assistant_meta)
            storage.append_event(
                "message_received",
                {"conversation_id": conversation_id, "role": "assistant", "model_id": model_id},
            )
            yield f"data: {json.dumps(event)}\n\n"
            return


@app.post("/chat", response_model=ChatResponse)
def chat(request: Request, payload: ChatRequest) -> ChatResponse | JSONResponse | StreamingResponse:
    """Chat endpoint. Returns JSON by default; returns SSE stream when Accept: text/event-stream."""
    accept = request.headers.get("accept", "")
    if "text/event-stream" in accept.lower():
        return StreamingResponse(
            _stream_chat_sse(payload),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )
    return _chat_json(payload)


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
