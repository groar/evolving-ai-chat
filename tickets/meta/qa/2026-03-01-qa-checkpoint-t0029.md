# QA Checkpoint - 2026-03-01 (T-0029)

## Scope Tested
- Ticket: T-0029 (`tickets/status/review/T-0029-conversation-context-multi-turn-history.md`)
- Area: Conversation context, multi-turn history in chat

## Automated Test Outcomes
- `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime.test_chat runtime.test_proposals`: PASS (19 tests).
- `cd apps/desktop && npm run build`: (not run; T-0029 backend-only + frontend payload change; no build regression expected).

## Manual Scenarios Executed
- History formatting: `test_chat_with_history_passes_to_adapter` verifies history is passed correctly to adapter.
- Empty/absent history backward compat: `test_chat_empty_history_backward_compatible`, `test_chat_no_history_field_backward_compatible` -> PASS.
- Token budget truncation: `TruncationTests.test_truncate_history_drops_oldest_when_over_budget`, `test_truncate_history_keeps_all_when_under_budget` -> PASS.
- Smoke: `npm run smoke:fastapi` requires `OPENAI_API_KEY`; without key returns 503 as designed (unchanged from T-0027).

## Criteria-to-Evidence Mapping
- POST /chat accepts optional history -> `ChatRequest` model + `test_chat_with_history_passes_to_adapter` -> PASS.
- Backend includes history in OpenAI messages -> adapter `chat()` -> PASS.
- Empty/absent history backward compatible -> two unit tests -> PASS.
- Token budget truncation -> `TruncationTests` -> PASS.
- Frontend sends messages as history -> `App.tsx` sendMessage includes `history: messages.map(...)` -> implemented.
- Unit test history formatting -> `test_chat_with_history_passes_to_adapter` -> PASS.
- Unit test truncation -> `test_truncate_history_drops_oldest_when_over_budget` -> PASS.
- Manual multi-turn ("What did I say first?") -> pending user verification with live runtime + API key.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Manual smoke with real `OPENAI_API_KEY` and multi-turn conversation not executed in this run. User should run app, send a few messages, then ask "What did I say first?" to verify context awareness.

**Suggested commit message:** `T-0029: Conversation context — multi-turn history`

**Next-step suggestion:** PM should review T-0029 in `review/`. If satisfied, accept to `done/`. Optional: run app with `OPENAI_API_KEY` and verify multi-turn context ("What did I say first?") before acceptance.
