import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator

from dotenv import load_dotenv

# Load .env from runtime dir so PATCH_AGENT_*, OPENAI_API_KEY, etc. are available
_load_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_load_env_path)

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from openai import AuthenticationError, RateLimitError

from .adapters.anthropic_adapter import MissingApiKeyError as AnthropicMissingApiKeyError
from .adapters.openai_adapter import MissingApiKeyError as OpenAIMissingApiKeyError
from .adapters.registry import list_models
from .adapters.router import ChatRouter
from .agent.apply_pipeline import ApplyPipeline, RollbackError
from .agent.patch_agent import HarnessUnavailableError, MalformedPatchError, PiDevPatchAgent, validate_scope
from .agent.patch_storage import PatchStorage
from .models import (
    AddValidationRunRequest,
    ApiKeysStatus,
    ChangeProposal,
    ChatRequest,
    ChatResponse,
    CodePatchRequest,
    RerunAssistantRequest,
    RerunAssistantResponse,
    CodePatchResponse,
    ConfigureRequest,
    CreateProposalRequest,
    DeleteDataResponse,
    FeatureFlagUpdateRequest,
    HealthResponse,
    ModelEntry,
    NewConversationRequest,
    NewConversationResponse,
    PatchStatusResponse,
    PatchLogResponse,
    PatchSummary,
    PersonaAddition,
    RollbackRequest,
    RollbackResponse,
    UpdateConversationRequest,
    ReleaseChannelUpdateRequest,
    RuntimeSettingsResponse,
    RuntimeStateResponse,
    UpdateProposalDecisionRequest,
)
from .storage import RuntimeStorage

_REPO_ROOT = Path(__file__).resolve().parents[3]
# Canonical patch id from patch_agent._new_patch_id(): PA-YYYYMMDD-<8 hex>
_CANONICAL_PATCH_ID_RE = re.compile(r"^PA-\d{8}-[a-f0-9]{8}$")

chat_router = ChatRouter()
patch_agent = PiDevPatchAgent()
patch_storage = PatchStorage()
storage = RuntimeStorage()
apply_pipeline = ApplyPipeline(
    repo_root=_REPO_ROOT,
    patch_storage=patch_storage,
    metrics_storage=storage,
)


def get_chat_router() -> ChatRouter:
    """FastAPI dependency hook for injecting ChatRouter (overridable in tests)."""
    return chat_router


def _format_assistant_meta(
    model_id: str,
    created_at: str,
    cost: float,
    prompt_tokens: int,
    completion_tokens: int,
) -> str:
    """
    Format message meta for display. Per T-0040: show tokens and approximate cost (~$X.XXX).
    When usage unavailable (total 0), show minimal meta without cost to avoid broken UI.
    """
    total = prompt_tokens + completion_tokens
    if total == 0:
        return f"{model_id} | {created_at}"
    token_str = f"{prompt_tokens:,} prompt + {completion_tokens:,} completion"
    if cost >= 0.01:
        cost_str = f"~${cost:.2f}"
    elif cost >= 0.001:
        cost_str = f"~${cost:.3f}"
    elif cost > 0:
        cost_str = f"~${cost:.4f}"
    else:
        cost_str = "~$0"
    return f"{model_id} | {token_str} · {cost_str} (est.)"


app = FastAPI(title="Evolving AI Chat Runtime", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(tauri://localhost|http://localhost(?::\d+)?|http://127\.0\.0\.1(?::\d+)?)$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(ok=True)


@app.get("/state", response_model=RuntimeStateResponse)
def state() -> RuntimeStateResponse:
    state_data = dict(storage.get_state())
    state_data["api_key_configured"] = chat_router.has_any_key()
    state_data["api_keys"] = ApiKeysStatus(**chat_router.get_api_keys_status())
    state_data["models"] = [ModelEntry(**m) for m in list_models()]
    # conversation_cost_total is already in state_data from storage.get_state()
    state_data["patches"] = [
        PatchSummary(
            id=a.id,
            status=a.status,
            title=a.title,
            description=a.description,
            unified_diff=a.unified_diff,
            created_at=a.created_at,
            failure_reason=a.failure_reason,
            applied_at=a.applied_at,
            reverted_at=a.reverted_at,
        )
        for a in patch_storage.list_all()
        if _CANONICAL_PATCH_ID_RE.match(a.id)
    ]
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
    """Configure runtime (e.g. API keys from in-app settings). Omitted keys are left unchanged."""
    chat_router.configure(
        openai_api_key=payload.openai_api_key,
        anthropic_api_key=payload.anthropic_api_key,
    )
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
        improvement_class=payload.improvement_class or "settings-trust-microcopy-v1",
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


@app.delete("/persona/additions/{index}", response_model=list)
def remove_persona_addition(index: int) -> list:
    """Remove a persona addition by index. Returns updated persona_additions list."""
    try:
        updated = storage.remove_persona_addition(index)
        return [PersonaAddition(**a) for a in updated]
    except ValueError as error:
        storage.append_event(
            "runtime_error",
            {"detail": str(error), "endpoint": f"/persona/additions/{index}"},
        )
        raise HTTPException(status_code=400, detail=str(error)) from error


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


def _chat_json(payload: ChatRequest, router: ChatRouter) -> ChatResponse | JSONResponse:
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
        reply, model_id, cost, prompt_tokens, completion_tokens = router.chat(
            message=request_text,
            model_id=payload.model_id,
            history=history_dicts,
            system_prompt=payload.system_prompt,
        )
        created_at = datetime.now(timezone.utc).isoformat()
        total_tokens = prompt_tokens + completion_tokens
        response = ChatResponse(
            conversation_id=conversation_id,
            reply=reply,
            model_id=model_id,
            created_at=created_at,
            cost=cost,
            prompt_tokens=prompt_tokens if total_tokens > 0 else None,
            completion_tokens=completion_tokens if total_tokens > 0 else None,
            total_tokens=total_tokens if total_tokens > 0 else None,
        )

        storage.append_message(conversation_id, role="user", text=request_text)
        storage.append_event(
            "message_sent",
            {"conversation_id": conversation_id, "role": "user", "text_length": len(request_text)},
        )

        assistant_meta = _format_assistant_meta(
            model_id=model_id,
            created_at=created_at,
            cost=cost,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )
        storage.append_message(conversation_id, role="assistant", text=response.reply, meta=assistant_meta)
        storage.append_event(
            "message_received",
            {"conversation_id": conversation_id, "role": "assistant", "model_id": response.model_id},
        )
        storage.try_auto_title_from_first_message(conversation_id)
        return response
    except (OpenAIMissingApiKeyError, AnthropicMissingApiKeyError):
        storage.append_event("runtime_error", {"error": "api_key_not_set", "endpoint": "/chat"})
        return JSONResponse(status_code=503, content={"error": "api_key_not_set"})
    except ValueError as error:
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/chat"})
        if "Unknown model" in str(error):
            return JSONResponse(status_code=400, content={"error": "unknown_model", "detail": str(error)})
        raise HTTPException(status_code=404, detail=str(error)) from error
    except AuthenticationError:
        storage.append_event("runtime_error", {"error": "api_key_invalid", "endpoint": "/chat"})
        return JSONResponse(status_code=401, content={"error": "api_key_invalid"})
    except RateLimitError:
        storage.append_event("runtime_error", {"error": "rate_limit", "endpoint": "/chat"})
        return JSONResponse(status_code=429, content={"error": "rate_limit"})
    except HTTPException:
        raise
    except Exception as error:
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/chat"})
        return JSONResponse(
            status_code=502,
            content={"error": "model_error", "detail": str(error)},
        )


def _build_rerun_context(conversation_id: str, assistant_message_id: int) -> tuple[str, list[dict[str, str]]]:
    messages = storage.get_messages(conversation_id)
    target_idx = next(
        (i for i, m in enumerate(messages) if m["message_id"] == assistant_message_id and m["role"] == "assistant"),
        None,
    )
    if target_idx is None:
        raise ValueError("Assistant message does not exist in this conversation.")
    if target_idx == 0:
        raise ValueError("Cannot rerun the first assistant message without a user prompt.")

    prompt_idx = next((i for i in range(target_idx - 1, -1, -1) if messages[i]["role"] == "user"), None)
    if prompt_idx is None:
        raise ValueError("Could not find the user prompt for this assistant answer.")

    prompt_text = str(messages[prompt_idx]["text"])
    history = [
        {"role": str(m["role"]), "content": str(m["text"])}
        for m in messages[:prompt_idx]
        if m["role"] in {"user", "assistant"}
    ]
    return prompt_text, history


async def _stream_chat_sse(payload: ChatRequest, router: ChatRouter) -> AsyncIterator[str]:
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

    async for event in router.chat_stream(
        message=request_text,
        model_id=payload.model_id,
        history=history_dicts,
        system_prompt=payload.system_prompt,
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
            prompt_tokens = event.get("prompt_tokens", 0)
            completion_tokens = event.get("completion_tokens", 0)
            reply = "".join(accumulated)
            created_at = datetime.now(timezone.utc).isoformat()
            assistant_meta = _format_assistant_meta(
                model_id=model_id,
                created_at=created_at,
                cost=cost,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            )
            storage.append_message(conversation_id, role="assistant", text=reply, meta=assistant_meta)
            storage.append_event(
                "message_received",
                {"conversation_id": conversation_id, "role": "assistant", "model_id": model_id},
            )
            storage.try_auto_title_from_first_message(conversation_id)
            yield f"data: {json.dumps(event)}\n\n"
            return


@app.post("/chat", response_model=ChatResponse)
def chat(
    request: Request,
    payload: ChatRequest,
    router: ChatRouter = Depends(get_chat_router),
) -> ChatResponse | JSONResponse | StreamingResponse:
    """Chat endpoint. Returns JSON by default; returns SSE stream when Accept: text/event-stream."""
    accept = request.headers.get("accept", "")
    if "text/event-stream" in accept.lower():
        return StreamingResponse(
            _stream_chat_sse(payload, router),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )
    return _chat_json(payload, router)


@app.post("/chat/rerun", response_model=RerunAssistantResponse)
def rerun_assistant_answer(
    payload: RerunAssistantRequest,
    router: ChatRouter = Depends(get_chat_router),
) -> RerunAssistantResponse | JSONResponse:
    try:
        active_id = storage.get_state()["active_conversation_id"]
        conversation_id = payload.conversation_id or active_id
        storage.set_active_conversation(conversation_id)

        prompt_text, history = _build_rerun_context(conversation_id, payload.assistant_message_id)
        reply, model_id, cost, prompt_tokens, completion_tokens = router.chat(
            message=prompt_text,
            model_id=payload.model_id,
            history=history,
        )
        created_at = datetime.now(timezone.utc).isoformat()
        total_tokens = prompt_tokens + completion_tokens
        return RerunAssistantResponse(
            conversation_id=conversation_id,
            assistant_message_id=payload.assistant_message_id,
            reply=reply,
            model_id=model_id,
            created_at=created_at,
            cost=cost,
            prompt_tokens=prompt_tokens if total_tokens > 0 else None,
            completion_tokens=completion_tokens if total_tokens > 0 else None,
            total_tokens=total_tokens if total_tokens > 0 else None,
        )
    except (OpenAIMissingApiKeyError, AnthropicMissingApiKeyError):
        storage.append_event("runtime_error", {"error": "api_key_not_set", "endpoint": "/chat/rerun"})
        return JSONResponse(status_code=503, content={"error": "api_key_not_set"})
    except ValueError as error:
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/chat/rerun"})
        raise HTTPException(status_code=400, detail=str(error)) from error
    except AuthenticationError:
        storage.append_event("runtime_error", {"error": "api_key_invalid", "endpoint": "/chat/rerun"})
        return JSONResponse(status_code=401, content={"error": "api_key_invalid"})
    except RateLimitError:
        storage.append_event("runtime_error", {"error": "rate_limit", "endpoint": "/chat/rerun"})
        return JSONResponse(status_code=429, content={"error": "rate_limit"})
    except Exception as error:
        storage.append_event("runtime_error", {"detail": str(error), "endpoint": "/chat/rerun"})
        return JSONResponse(status_code=502, content={"error": "model_error", "detail": str(error)})


@app.post("/conversations", response_model=NewConversationResponse)
def create_conversation(payload: NewConversationRequest) -> NewConversationResponse:
    title = payload.title.strip() or "New Conversation"
    conversation_id = storage.create_conversation(title=title, set_active=payload.set_active)
    return NewConversationResponse(conversation_id=conversation_id)


@app.patch("/conversations/{conversation_id}", response_model=NewConversationResponse)
def update_conversation(conversation_id: str, payload: UpdateConversationRequest) -> NewConversationResponse:
    try:
        storage.update_conversation_title(conversation_id, payload.title)
        return NewConversationResponse(conversation_id=conversation_id)
    except ValueError as error:
        storage.append_event(
            "runtime_error",
            {"detail": str(error), "endpoint": f"/conversations/{conversation_id}"},
        )
        raise HTTPException(status_code=404, detail=str(error)) from error


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


# ---------------------------------------------------------------------------
# M8 agent code-patch endpoints (T-0059)
# ---------------------------------------------------------------------------

@app.post("/agent/code-patch", response_model=CodePatchResponse)
def agent_code_patch(
    payload: CodePatchRequest, background_tasks: BackgroundTasks
) -> CodePatchResponse | JSONResponse:
    """Generate a code patch from a feedback payload (spec §4).

    Triggers the agent harness, validates scope (Layer 2), stores the artifact,
    and returns immediately. The apply pipeline starts automatically in the
    background (T-0060); the frontend polls GET /agent/patch-status/{patch_id}.
    """
    if patch_storage.has_patch_in_flight():
        storage.append_event(
            "patch_in_progress",
            {"feedback_id": payload.feedback_id, "endpoint": "/agent/code-patch"},
        )
        return JSONResponse(
            status_code=409,
            content={
                "error": "patch_in_progress",
                "detail": "A patch is already being processed. Try again once it completes.",
            },
        )

    feedback = {
        "id": payload.feedback_id,
        "title": payload.feedback_title,
        "summary": payload.feedback_summary,
        "area": payload.feedback_area,
    }

    # Resolve base_ref from git HEAD when the frontend omits it
    base_ref = payload.base_ref
    if not base_ref:
        try:
            base_ref = subprocess.check_output(
                ["git", "rev-parse", "HEAD"],
                cwd=str(_REPO_ROOT),
                text=True,
            ).strip()
        except subprocess.SubprocessError:
            base_ref = "HEAD"

    try:
        artifact = patch_agent.generate_patch(feedback, base_ref)
    except HarnessUnavailableError as exc:
        storage.append_event(
            "patch_harness_unavailable",
            {"feedback_id": payload.feedback_id, "detail": str(exc)},
        )
        return JSONResponse(
            status_code=503,
            content={"error": "harness_unavailable", "detail": str(exc)},
        )
    except MalformedPatchError as exc:
        storage.append_event(
            "patch_malformed",
            {"feedback_id": payload.feedback_id, "detail": str(exc)},
        )
        return JSONResponse(
            status_code=422,
            content={"error": "malformed_patch", "detail": str(exc)},
        )

    # Layer 2 scope validation — runs after harness returns, before any file is written
    violations = validate_scope(artifact.files_changed)
    if violations:
        artifact.status = "scope_blocked"
        artifact.scope_violations = violations
        patch_storage.save(artifact)
        storage.log_patch_metrics(
            patch_id=artifact.id,
            feedback_id=artifact.feedback_id or "",
            final_status="scope_blocked",
            agent_model=artifact.agent_model or "",
            files_changed_count=len(artifact.files_changed),
            unified_diff=artifact.unified_diff or "",
            created_at=artifact.created_at,
            resolved_at=datetime.now(timezone.utc).isoformat(),
        )
        storage.append_event(
            "patch_scope_blocked",
            {"patch_id": artifact.id, "violations": violations},
        )
        return CodePatchResponse(
            patch_id=artifact.id,
            status="scope_blocked",
            scope_violations=violations,
        )

    patch_storage.save(artifact)
    if getattr(artifact, "log_text", None):
        storage.write_patch_log(artifact.id, artifact.log_text or "")
    storage.append_event(
        "patch_created",
        {"patch_id": artifact.id, "feedback_id": payload.feedback_id},
    )
    # Auto-start the apply pipeline in the background (spec §3.3, AC: no manual trigger)
    background_tasks.add_task(apply_pipeline.apply, artifact)
    return CodePatchResponse(
        patch_id=artifact.id,
        status=artifact.status,
        title=artifact.title,
        description=artifact.description,
        eta_seconds=15,
    )


@app.get("/patches/{patch_id}/log", response_model=PatchLogResponse)
def patch_log(patch_id: str) -> PatchLogResponse:
    """Return the stored agent execution log for a patch_id, or 404 if none exists."""
    row = storage.get_patch_log(patch_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Log not found for this patch.")
    return PatchLogResponse(**row)


@app.get("/agent/patch-status/{patch_id}", response_model=PatchStatusResponse)
def agent_patch_status(patch_id: str) -> PatchStatusResponse | JSONResponse:
    """Return current status of a patch artifact (spec §4)."""
    artifact = patch_storage.load(patch_id)
    if artifact is None:
        return JSONResponse(
            status_code=404,
            content={"error": "patch_not_found", "patch_id": patch_id},
        )
    return PatchStatusResponse(
        patch_id=artifact.id,
        status=artifact.status,
        title=artifact.title,
        description=artifact.description,
        unified_diff=artifact.unified_diff,
        files_changed=artifact.files_changed,
        scope_violations=artifact.scope_violations or None,
        failure_reason=artifact.failure_reason,
        applied_at=artifact.applied_at,
        git_commit_sha=artifact.git_commit_sha,
        reverted_at=artifact.reverted_at,
        revert_commit_sha=artifact.revert_commit_sha,
    )


@app.post("/agent/rollback", response_model=RollbackResponse)
def agent_rollback(payload: RollbackRequest) -> RollbackResponse | JSONResponse:
    """Rollback an applied patch artifact via git revert (spec §3.4).

    Accepts { patch_id } and runs `git revert <git_commit_sha> --no-edit`.
    Returns the new artifact status and revert commit SHA on success.
    """
    artifact = patch_storage.load(payload.patch_id)
    if artifact is None:
        return JSONResponse(
            status_code=404,
            content={"error": "patch_not_found", "patch_id": payload.patch_id},
        )

    try:
        updated = apply_pipeline.rollback(artifact)
        storage.append_event(
            "patch_reverted",
            {"patch_id": updated.id, "revert_commit_sha": updated.revert_commit_sha},
        )
        return RollbackResponse(
            patch_id=updated.id,
            status=updated.status,
            revert_commit_sha=updated.revert_commit_sha,
        )
    except RollbackError as exc:
        storage.append_event(
            "patch_rollback_failed",
            {"patch_id": payload.patch_id, "reason": exc.reason},
        )
        # Artifact was updated in storage by rollback(); reload for latest status
        latest = patch_storage.load(payload.patch_id) or artifact
        return RollbackResponse(
            patch_id=latest.id,
            status=latest.status,
            reason=exc.reason,
        )
