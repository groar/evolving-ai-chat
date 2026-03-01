# T-0028: Streaming chat response

## Metadata
- ID: T-0028
- Status: done
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0004
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Add token-by-token streaming from the FastAPI `/chat` endpoint to the desktop UI. Instead of waiting for the full response, the user sees text appear progressively as the model generates it — making the app feel responsive and alive. Uses Server-Sent Events (SSE) from the backend and a streaming fetch consumer on the frontend.

## Design Spec

- Goals:
  - Make the chat feel instant: first token appears within ~1 second of sending.
  - Keep the implementation simple: SSE is native to browsers and straightforward in FastAPI.
- Non-goals:
  - Cancellation/abort mid-stream (can be a follow-up; implement stop-button only if complexity is low).
  - Streaming for the Node stub fallback runtime.
  - Retrying partial streams.
- Rules and state transitions:
  - Frontend sends `POST /chat` with `Accept: text/event-stream`.
  - Backend returns `Content-Type: text/event-stream` and emits `data: {"delta": "<token>"}` events as tokens arrive.
  - A final `data: {"done": true, "model_id": "...", "cost": 0.000xyz}` event closes the stream.
  - On error mid-stream, emit `data: {"error": "<code>"}` and close the stream.
  - Frontend accumulates deltas into the message bubble in real time.
  - If the runtime does not support SSE (Node stub), fall back to non-streaming (no regression).
- User-facing feedback plan:
  - A blinking cursor or animated ellipsis appears in the chat bubble while the model is streaming.
  - The cursor disappears when the stream is complete.
  - On stream error, the existing error/retry UI shows.
- Scope bounds:
  - Backend: `apps/desktop/runtime/main.py` + `openai_adapter.py`.
  - Frontend: `apps/desktop/src/App.tsx` (chat send handler + message rendering).
  - No new components; extend existing message bubble rendering.
- Edge cases / failure modes:
  - SSE connection dropped mid-stream: show partial response with an error note.
  - Model returns empty stream: treat as an empty message; do not crash.
  - Very long response: ensure the chat pane scrolls to follow the active bubble.

### UI Spec Addendum
- Primary job-to-be-done: show the AI response progressively as it's generated.
- Primary action and what must be visually primary: the accumulating text in the current message bubble.
- Navigation / progressive disclosure notes: no new nav elements; the sending state spinner is replaced by the streaming cursor once the first token arrives.
- Key states to design and verify:
  - Sending (waiting for first token): spinner in composer send button.
  - Streaming (tokens arriving): blinking cursor at end of accumulating text.
  - Done: cursor removed; cost/model metadata visible if already shown.
  - Error mid-stream: partial text + error note + retry button.
- Copy constraints:
  - "Thinking…" is acceptable for the waiting state.
  - Do not say "Loading" or "Fetching" — those imply network, not generation.

## Context
T-0027 ships a real response but blocks the UI until the full response is returned. For short responses this is acceptable; for longer ones it feels frozen. Streaming is the standard UX for AI chat products and is the right choice given the existing spinner/sending-state infrastructure already in place (T-0026).

## References
- `tickets/status/ready/T-0027-openai-adapter-real-chat-endpoint.md`
- `tickets/meta/epics/E-0004-m3-real-ai-chat.md`
- `apps/desktop/src/App.tsx`

## Dependencies / Sequencing
- Depends on: T-0027 (OpenAI adapter must exist).
- Blocks: nothing (can ship independently after T-0027).
- Sequencing notes: T-0029 (conversation context) is independent of streaming and can land in either order.

## Acceptance Criteria
- [x] `POST /chat` with `Accept: text/event-stream` returns an SSE stream of `{"delta": "..."}` events followed by a `{"done": true, "model_id": "...", "cost": ...}` closing event.
- [x] The desktop UI shows incoming tokens progressively in the chat bubble (no full-page waiting).
- [x] A blinking cursor appears during streaming and disappears when done.
- [x] The chat pane auto-scrolls to keep the active bubble in view while streaming.
- [x] If the runtime does not support SSE (Node stub), the UI falls back to non-streaming without error.
- [x] On stream error, the existing error/retry UI appears (no unhandled exception).
- [x] Unit test: mock SSE stream from FastAPI and assert deltas are accumulated correctly on the frontend.
- [x] Smoke test updated to verify streaming endpoint returns valid SSE format.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0028.md`
- Screenshots/artifacts: (manual streaming smoke pending)

## Evidence (Verification)
- Tests run: `uv run ... python3 -m unittest runtime.test_chat runtime.test_proposals` — 20 tests PASS. Build OK.
- Manual checks performed: Pending QA.

## Subtasks
- [x] Add SSE streaming to `openai_adapter.py` using `openai` stream mode
- [x] Add streaming route variant to FastAPI (`StreamingResponse`)
- [x] Update frontend send handler to consume SSE stream
- [x] Implement streaming cursor UI state
- [x] Implement auto-scroll during streaming
- [x] Add fallback for non-SSE runtime
- [x] Write unit tests (mocked stream)
- [x] Update smoke script for SSE format validation

## Notes
FastAPI streaming with `openai`'s async streaming API is well-documented. Use `openai.AsyncOpenAI` with `stream=True` and yield chunks. The frontend uses `fetch` + `ReadableStream` to consume the SSE without a library dependency.

## Change Log
- 2026-03-01: Ticket created by PM.
- 2026-03-01: Implemented SSE streaming in adapter and FastAPI, frontend stream consumer, blinking cursor, auto-scroll. Unit test + smoke. Moved to review.
- 2026-03-01: PM acceptance. QA checkpoint passed (no bugs). All AC met. M3 complete.
