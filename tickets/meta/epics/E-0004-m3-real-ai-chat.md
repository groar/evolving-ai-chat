# E-0004: M3 — Real AI Chat ("First Live Message")

## Metadata
- ID: E-0004
- Status: in-progress
- Owner: pm-agent
- Created: 2026-03-01
- Updated: 2026-03-01 (T-0027 shipped)

## Goal
Replace the stub chat response with a real LLM call so the user can send a message and receive an intelligent AI response. This is the core value loop — without it, everything else is scaffolding.

## Definition of Done
- The user can type a message in the chat composer, send it, and receive a real AI response (not a stub).
- At least one model provider (OpenAI) is fully wired: API key configurable, response visible in the chat pane.
- Responses stream token-by-token so the interface feels responsive.
- Prior conversation messages are passed as context (multi-turn history works).
- The user can configure their API key inside the app (no manual env-var setup required).
- All core behaviors are covered by deterministic tests or smoke checks.

## Validation Plan
- Default: tier 1 deterministic (unit/smoke tests for each ticket).
- After T-0027 ships: tier 2 micro-validation (internal, project sponsor) — confirm the response
  feels correct, trustworthy, and easy to understand.
- Probes (run once T-0027 + T-0028 land):
  - After sending a message, does the response feel natural and relevant?
  - Is it clear which model responded and approximately what it cost?
  - What would you do if the AI's response was wrong?
- Evidence: record in the T-0027 Evidence section or a dated PM checkpoint.
- Epic-level user-report gate: record probe results in E-0004 Notes once M3 ships.

## Non-goals
- Multi-provider support (Anthropic/Google) in this milestone; one provider is enough to prove the loop.
- Prompt engineering or system-prompt customization.
- Autonomous response routing or agent tool execution.
- Any self-modification or proposal pipeline changes.

## Linked Feedback
- (none yet; tickets follow from known gap in STATUS.md)

## Linked Tickets
- T-0027 OpenAI adapter + real chat endpoint (P1)
- T-0028 Streaming chat response (P2)
- T-0029 Conversation context — multi-turn history (P2)
- T-0030 API key configuration in Settings (P2)

## Progress (Ticket Status)
- Done:
  - T-0027 OpenAI adapter + real chat endpoint
- Ready:
  - T-0028 Streaming chat response
  - T-0029 Conversation context — multi-turn history
  - T-0030 API key configuration in Settings

## Notes
The app has had a polished UI shell since T-0026, validated UX clarity since E-0003, and the full change-loop infrastructure since E-0001/E-0002. The glaring gap is: no real AI. This milestone closes that gap in the simplest reasonable way (one provider, streaming, context, key config).
