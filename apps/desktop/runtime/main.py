from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    AddValidationRunRequest,
    ChangeProposal,
    ChatRequest,
    ChatResponse,
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
    make_chat_response,
)
from .storage import RuntimeStorage

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
    return RuntimeStateResponse(**storage.get_state())


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
