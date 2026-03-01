# T-0039: Model selector (multi-provider)

## Metadata
- ID: T-0039
- Status: backlog
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0006
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Let users select which AI model to use for their conversations. Support at minimum OpenAI (GPT-4o, GPT-4o-mini) and Anthropic (Claude Sonnet, Claude Haiku). Show the selected model in the chat pane and persist the preference per conversation or as a default.

## Design Spec
- Goals:
  - Users can switch models mid-session or set a default.
  - Each model provider requires its own API key (stored securely via Tauri secure store, building on T-0030).
  - Model provenance is visible on each response (which model generated it).
- Non-goals:
  - Automatic model routing/selection (that's a future self-evolution feature).
  - Cost optimization or model recommendation.
- Rules and state transitions:
  - Default model: configurable in Settings (defaults to the first available model with a valid API key).
  - Per-conversation override: selectable from a dropdown in the chat pane header or composer.
  - If the selected model's API key is missing, show an inline prompt to add it in Settings.
- User-facing feedback plan:
  - Selected model visible in the composer area or top bar.
  - Each assistant message shows which model generated it (in message meta).
- Scope bounds:
  - Two providers (OpenAI, Anthropic) for this ticket.
  - Additional providers (Google, local models) are follow-ups.
- Edge cases / failure modes:
  - No API keys configured: prompt user to add one in Settings.
  - API key invalid: show error inline, don't crash.
  - Model unavailable (rate limit, outage): show error, allow retry or switch model.
- Validation plan: deterministic tests for model selection state, API key gating, and error handling.

## Context
- T-0027 adds the first OpenAI adapter. This ticket generalizes to multi-provider.
- STATUS.md mentions "multi-model routing with clear provenance of outputs and costs."
- T-0030 adds API key configuration for OpenAI — this ticket extends it to Anthropic.

## References
- T-0027 (OpenAI adapter)
- T-0030 (API key configuration)
- `apps/desktop/runtime/main.py`
- `STATUS.md` (multi-model routing mention)
- E-0006-m5-conversational-ux-table-stakes.md

## Feedback References
- F-20260301-002

## Acceptance Criteria
- [ ] Users can select a model from a dropdown (at minimum: GPT-4o, GPT-4o-mini, Claude Sonnet, Claude Haiku).
- [ ] Each provider requires its own API key; missing keys show a prompt to configure in Settings.
- [ ] Selected model persists as a default (and optionally per-conversation).
- [ ] Each assistant message records which model generated it (visible in message meta).
- [ ] Backend supports an Anthropic adapter alongside the OpenAI adapter from T-0027.
- [ ] Invalid/missing API key errors are handled gracefully (inline error, not a crash).

## Dependencies / Sequencing
- Depends on: T-0027 (OpenAI adapter), T-0030 (API key configuration).
- Blocks: none.
- Sequencing notes: Ship after M3 (T-0027/T-0030) since it extends the model layer.

## Subtasks
- [ ] Define model registry (provider, model ID, display name, required API key)
- [ ] Implement Anthropic adapter (parallel to OpenAI adapter from T-0027)
- [ ] Add model selector UI (dropdown in composer or top bar)
- [ ] Extend API key configuration in Settings to support multiple providers
- [ ] Persist default model preference
- [ ] Add model_id to message meta on each response
- [ ] Add tests (adapter, selection, API key gating)

## Notes
Consider a thin adapter interface that T-0027's OpenAI adapter already partially defines. The Anthropic adapter should implement the same interface. This sets up for future providers (Google, local models, LiteLLM) without refactoring.

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
