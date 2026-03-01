# QA Checkpoint - 2026-03-01 (T-0027)

## Scope Tested
- Ticket: T-0027 (`tickets/status/review/T-0027-openai-adapter-real-chat-endpoint.md`)
- Area: OpenAI adapter, real chat endpoint, error mapping

## Automated Test Outcomes
- `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime.test_proposals runtime.test_chat`: PASS (11 tests).
- `cd apps/desktop && npm run build`: PASS.

## Manual Scenarios Executed
- Normal flow: unit tests cover happy path (mocked real response, model_id != stub, cost > 0).
- Error flows: unit tests cover missing API key (503), invalid key (401), rate limit (429), empty message (422), model override.
- Smoke: `npm run smoke:fastapi` requires `OPENAI_API_KEY` for full pass; without key, /chat returns 503 as designed. Smoke script asserts `model_id !== "stub"` when a 200 is received.

## Criteria-to-Evidence Mapping
- Real AI response with valid key -> `runtime.test_chat.ChatEndpointHappyPathTests.test_chat_returns_real_response_when_api_key_set` -> PASS.
- 503 when no key -> `test_missing_api_key_returns_503` -> PASS.
- 401 when invalid key -> `test_invalid_api_key_returns_401` -> PASS.
- 429 on rate limit -> `test_rate_limit_returns_429` -> PASS.
- Default model + override -> `test_chat_model_override_from_request` -> PASS.
- Cost populated -> happy path asserts `cost > 0` -> PASS.
- Unit tests cover all error paths -> 6 chat tests in `runtime.test_chat` -> PASS.
- Smoke assertion model_id != stub -> `apps/desktop/scripts/smoke.mjs` -> implemented.
- openai in requirements.txt -> `runtime/requirements.txt` -> added.
- No linter errors -> runtime code passes unittest and build.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Manual smoke with real `OPENAI_API_KEY` not executed in this run (requires user key). Manual verification recommended before PM acceptance.

Suggested commit message: `T-0027: OpenAI adapter + real chat endpoint`

Next-step suggestion: PM should review T-0027 in `review/`. If satisfied with unit test coverage and design spec adherence, accept to `done/`. Optional: run `npm run smoke:fastapi` with `OPENAI_API_KEY` set for manual end-to-end validation before acceptance.
