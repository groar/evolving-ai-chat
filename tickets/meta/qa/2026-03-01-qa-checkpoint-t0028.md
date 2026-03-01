# QA Checkpoint - 2026-03-01 (T-0028)

## Scope Tested
- Ticket: T-0028 (`tickets/status/review/T-0028-streaming-chat-response.md`)
- Area: Streaming chat response, SSE, streaming cursor, auto-scroll

## Automated Test Outcomes
- `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime.test_chat runtime.test_proposals`: PASS (20 tests).
- `cd apps/desktop && npm run build`: PASS.
- `ChatStreamingTests.test_chat_with_accept_sse_returns_streaming_response`: PASS — verifies SSE format and delta/done events.

## Manual Scenarios Executed
- Backend: Accept: text/event-stream returns StreamingResponse with text/event-stream content-type.
- Frontend: sendMessage requests with Accept: text/event-stream; when response is SSE, consumes stream and accumulates deltas.
- Fallback: when Content-Type is application/json (Node stub), uses existing JSON path.
- Cursor: streaming message bubble shows blinking cursor during stream.
- Auto-scroll: transcriptEndRef scrolls into view when streamingText updates.
- Smoke: `smoke.mjs` includes "Streaming chat returns SSE format" check (requires OPENAI_API_KEY for full pass).

## Criteria-to-Evidence Mapping
- POST /chat with Accept: text/event-stream returns SSE -> `ChatStreamingTests` + smoke -> PASS.
- UI shows tokens progressively -> frontend stream consumer + setStreamingText -> implemented.
- Blinking cursor -> `.streaming-cursor` CSS animation -> implemented.
- Auto-scroll -> transcriptEndRef + useEffect on streamingText -> implemented.
- Fallback for non-SSE runtime -> Content-Type check, JSON path when not text/event-stream -> implemented.
- Stream error -> setRuntimeIssue on error event -> implemented.
- Unit test -> ChatStreamingTests -> PASS.
- Smoke updated -> smoke.mjs "Streaming chat returns SSE format" -> implemented.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Manual smoke with OPENAI_API_KEY and streaming UX not executed in this run. User should run app with key and verify tokens appear progressively with blinking cursor.

**Suggested commit message:** `T-0028: Streaming chat response (SSE)`

**Next-step suggestion:** PM should review T-0028 in `review/`. If satisfied, accept to `done/`. Optional: run app with OPENAI_API_KEY and verify streaming UX before acceptance.
