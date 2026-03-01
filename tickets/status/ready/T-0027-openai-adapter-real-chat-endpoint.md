# T-0027: OpenAI adapter + real chat endpoint

## Metadata
- ID: T-0027
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0004
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Replace the stub response in the FastAPI `/chat` endpoint with a real OpenAI ChatCompletions call. The API key is read from the `OPENAI_API_KEY` environment variable. The default model is `gpt-4o-mini` (low cost, fast). The existing payload contract (`reply`, `model_id`, `created_at`, `cost`) is preserved so the frontend requires no changes in this ticket.

## Design Spec

- Goals:
  - Make the chat produce a real AI response in the simplest, most correct way possible.
  - Preserve the existing payload contract so no frontend changes are required in this ticket.
- Non-goals:
  - Streaming responses (T-0028).
  - Multi-turn conversation context (T-0029).
  - In-app API key configuration (T-0030).
  - Multi-provider support (future epic).
- Rules and state transitions:
  - On `POST /chat`, read `OPENAI_API_KEY` from env. If missing, return HTTP 503 with body `{"error": "api_key_not_set"}`.
  - Call `openai.chat.completions.create` with `model` defaulting to `gpt-4o-mini` (overridable by `model_id` in the request payload).
  - Populate `cost` using the response's `usage.prompt_tokens` and `usage.completion_tokens` with published pricing for the selected model (store as float USD, 6 decimal places). Use a constants map for known models; fall back to `0.0` for unknown models.
  - On OpenAI `AuthenticationError`: return HTTP 401 with `{"error": "api_key_invalid"}`.
  - On OpenAI `RateLimitError`: return HTTP 429 with `{"error": "rate_limit"}`.
  - On other OpenAI errors: return HTTP 502 with `{"error": "model_error", "detail": "<message>"}`.
- User-facing feedback plan:
  - The UI already handles runtime error states (retry button). No new UI copy required in this ticket; the existing error surfaces cover the new error codes.
- Scope bounds:
  - Changes confined to `apps/desktop/runtime/` (Python files only).
  - No frontend changes.
  - No database changes.
- Edge cases / failure modes:
  - Empty `message` in payload: return HTTP 422 (pydantic validation, already handled).
  - Network timeout from OpenAI: propagate as 502.
  - `OPENAI_API_KEY` set but org suspended: caught by `AuthenticationError`.
- Validation plan:
  - Unit tests with mocked `openai` client (no real API calls in CI).
  - Manual smoke test with a real key in a dev environment.
  - Existing smoke script (`npm run smoke:fastapi`) updated to assert `model_id != "stub"`.

## Context
The FastAPI runtime has been returning `{"reply": "stub response", "model_id": "stub", "cost": 0}` since T-0004. The polished UI shell (T-0026) and validated UX hierarchy (E-0003) are in place. The last gap before the app fulfills its core promise ("AI chat") is swapping the stub for a real model call. Starting with a single provider (OpenAI) and a single model keeps the blast radius small.

## References
- `STATUS.md` — Known gaps: "MVP chat experience"
- `tickets/status/done/T-0004-local-runtime-api-and-ui-integration.md`
- `tickets/status/done/T-0010-fastapi-runtime-dev-startup-and-smoke.md`
- `tickets/meta/epics/E-0004-m3-real-ai-chat.md`

## Acceptance Criteria
- [ ] `POST /chat` with a valid `OPENAI_API_KEY` env var returns a real AI response (non-stub `reply`, `model_id != "stub"`, `cost > 0`).
- [ ] `POST /chat` with no `OPENAI_API_KEY` returns HTTP 503 with `{"error": "api_key_not_set"}`.
- [ ] `POST /chat` with an invalid key returns HTTP 401 with `{"error": "api_key_invalid"}`.
- [ ] `POST /chat` when OpenAI rate-limits returns HTTP 429 with `{"error": "rate_limit"}`.
- [ ] Default model is `gpt-4o-mini`; a `model_id` field in the request payload overrides it.
- [ ] `cost` field is populated as a float USD value (not always 0.0 for a real response).
- [ ] Unit tests cover: happy path (mocked), missing API key, invalid key, rate limit, and model override.
- [ ] Existing smoke script (`npm run smoke:fastapi`) updated to assert `model_id != "stub"`.
- [ ] `openai` dependency added to `apps/desktop/runtime/requirements.txt`.
- [ ] No linter or pydantic validation errors in the runtime.

## Dependencies / Sequencing
- Depends on: T-0004, T-0010 (FastAPI skeleton in place).
- Blocks: T-0028 (streaming), T-0029 (conversation context).
- Sequencing notes: T-0030 (API key settings) can be worked in parallel but T-0027 is the P1 prerequisite for all M3 value.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: (to be filled after implementation)
- Screenshots/artifacts: (smoke log to be attached)

## Evidence (Verification)
- Tests run: (to be filled)
- Manual checks performed: (to be filled)
- Screenshots/logs/notes: (to be filled)

## Subtasks
- [ ] Add `openai` to `requirements.txt`
- [ ] Implement `OpenAIAdapter` class in `apps/desktop/runtime/adapters/openai_adapter.py`
- [ ] Update `POST /chat` handler to call the adapter (env var key, model routing, cost calc)
- [ ] Implement error mapping (AuthenticationError → 401, RateLimitError → 429, others → 502)
- [ ] Write unit tests with mocked openai client
- [ ] Update smoke script assertions (`model_id != "stub"`)
- [ ] Update runtime README with new env var docs

## Notes
Pricing constants for cost calculation (as of 2026-03-01):
- `gpt-4o-mini`: input $0.15/1M tokens, output $0.60/1M tokens
- `gpt-4o`: input $2.50/1M tokens, output $10.00/1M tokens
These are approximate; store them in a `PRICING` dict in the adapter and document that they may be stale.

## Change Log
- 2026-03-01: Ticket created by PM.
