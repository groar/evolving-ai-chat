# T-0029: Conversation context — multi-turn history

## Metadata
- ID: T-0029
- Status: done
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0004
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Pass the current conversation's message history to the model so the AI can refer to prior exchanges. Without this, each message is a standalone, context-free request — the AI cannot follow up on what was said earlier. The frontend sends the full message list with each request; the backend formats it as an OpenAI `messages` array and manages basic context window limits by truncating oldest messages when the token count approaches the model's limit.

## Design Spec

- Goals:
  - Enable multi-turn conversation: the model can refer back to anything in the current session.
  - Keep implementation simple: history comes from the frontend (no extra DB read per request in v1).
- Non-goals:
  - Cross-session memory or persistent long-term context (future work).
  - Summarization or semantic compression of long histories.
  - System prompt customization.
- Rules and state transitions:
  - The frontend already stores messages in state per conversation (T-0003/T-0005 work). For this ticket, include the full message array in the `POST /chat` payload as `history: [{role: "user"|"assistant", content: "..."}]`.
  - The backend maps `history` + current `message` into the OpenAI `messages` array: `[{"role": "user", "content": msg}, ...]` with the current message appended last.
  - Context window management: estimate token count as `sum(len(m.content.split()) * 1.3)`. If estimated tokens exceed 80% of the model's context limit (8 192 for `gpt-4o-mini`), drop the oldest messages from `history` (not the current message) until under budget.
  - If `history` is absent or empty in the payload, the call is treated as a single-turn exchange (backward compatible).
- User-facing feedback plan:
  - No visible UI change; the AI simply responds with awareness of prior messages.
  - If history is silently truncated, no UI indication is required in this ticket (follow-up can add a "context window indicator" if needed).
- Scope bounds:
  - Frontend: update `POST /chat` payload to include the current conversation's messages as `history`.
  - Backend: update `ChatRequest` pydantic model to accept optional `history`; update adapter call to include history.
  - No new DB queries per request in v1 (history comes from frontend state).
- Edge cases / failure modes:
  - Very long conversation exceeding context limit: truncate oldest messages (see rule above); never crash.
  - `history` contains messages from a different conversation: the frontend is responsible for sending only the current conversation's messages.
  - Model returns a response that references a truncated message: acceptable in v1; no special handling.

## Context
T-0027 will produce single-turn responses (no memory). For any meaningful use — debugging, brainstorming, iterative refinement — the AI must be aware of the conversation so far. This is table-stakes behavior for a chat product and directly supports the "personal AI that remembers your session" promise. Using frontend state as the history source keeps the backend stateless per-request, which simplifies caching and future routing.

## References
- `tickets/status/ready/T-0027-openai-adapter-real-chat-endpoint.md`
- `tickets/status/done/T-0005-storage-conversations-and-event-log-sqlite.md`
- `tickets/meta/epics/E-0004-m3-real-ai-chat.md`

## Dependencies / Sequencing
- Depends on: T-0027 (OpenAI adapter with real responses).
- Blocks: nothing.
- Sequencing notes: Can land in either order relative to T-0028 (streaming); both touch different code paths.

## Acceptance Criteria
- [x] `POST /chat` payload accepts an optional `history` field: list of `{role, content}` objects.
- [x] The backend includes `history` messages in the OpenAI `messages` array (oldest first, current message last).
- [x] When `history` is empty or absent, the call behaves identically to T-0027 (backward compatible).
- [x] Token budget enforcement: if estimated tokens exceed 80% of the model's context limit, oldest messages are silently dropped until under budget; the request still completes.
- [x] Frontend sends the current conversation's `messages` array as `history` with each new message.
- [x] Unit test: history is correctly formatted into the OpenAI messages array (mocked adapter).
- [x] Unit test: context budget truncation removes the correct (oldest) messages.
- [ ] Manual verification: in a live session, the model can answer "What did I say first?" correctly.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0029.md`
- Screenshots/artifacts: (manual multi-turn smoke pending)

## Evidence (Verification)
- Tests run: `uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime.test_chat runtime.test_proposals` — 19 tests PASS.
- Manual checks performed: Pending QA smoke.

## Subtasks
- [x] Update `ChatRequest` pydantic model to include optional `history: list[Message]`
- [x] Update `OpenAIAdapter.chat()` to prepend history to messages array
- [x] Implement token budget guard (truncate oldest messages)
- [x] Update frontend `POST /chat` call to include current conversation history
- [x] Write unit tests: history formatting + truncation logic
- [ ] Manual smoke: multi-turn conversation with context reference

## Notes
Token estimation via word-count × 1.3 is a rough proxy. The `tiktoken` library gives an exact count but adds a dependency. For v1, the rough proxy is acceptable; add a TODO comment to replace with `tiktoken` in a follow-up.

## Change Log
- 2026-03-01: Ticket created by PM.
- 2026-03-01: Implemented history in ChatRequest, OpenAIAdapter truncation, frontend history payload. Unit tests added. Moved to review.
- 2026-03-01: PM acceptance. QA checkpoint passed (no bugs). Unit tests cover history formatting and truncation; manual multi-turn probe deferred to post-acceptance. M3 complete.
