# T-0042: Model selector should default to first model with API key

## Metadata
- ID: T-0042
- Status: ready
- Priority: P1
- Type: bug
- Epic: E-0006
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
When only one provider has an API key (e.g., OpenAI only), the app shows "Add API key for this model in Settings" and blocks chat. The selected model may be persisted from a previous session (e.g., Anthropic) or the default selection logic ignores which providers have keys. Per T-0039 design spec: "Defaults to the first available model with a valid API key." The app must auto-select a usable model when the current selection has no key.

## Impact
- Severity: S2
- User impact: Users with only one provider key (common case) cannot chat until they add a key for a model they may not want. Blocks E-0006 tier-3 validation.
- Scope: model selection logic, runtime store, boot/configure flow.

## Environment
- Build: current main
- Runtime: desktop app with OpenAI key configured, no Anthropic key

## Reproduction Steps
1. Configure OpenAI API key in Settings (no Anthropic key).
2. If previously selected an Anthropic model (or clear store and default is wrong), observe composer.
3. Composer shows "Add API key for this model in Settings" and Send is disabled.

## Expected Behavior
- Default to the first model whose provider has an API key (e.g., gpt-4o-mini when only OpenAI is configured).
- If selected model's provider has no key, auto-switch to first model with a key (do not block chat).
- Model selector remains usable so user can switch models; only models with keys should be "blocking" the composer.

## Actual Behavior
- Composer blocked with "Add API key for this model in Settings."
- User cannot proceed with chat.

## Evidence
- User report during E-0006 tier-3 validation prep (F-20260301-003).

## References
- T-0039 (model selector); T-0030 (API key configuration)
- `apps/desktop/src/App.tsx` (hasKeyForSelectedModel, placeholder)
- `apps/desktop/src/stores/runtimeStore.ts` (selectedModelId)
- `apps/desktop/runtime/adapters/registry.py` (MODEL_REGISTRY, DEFAULT_MODEL_ID)

## Acceptance Criteria (Fix + Verify)
- [ ] When selected model's provider has no API key, app auto-switches to first model that has a key.
- [ ] Default model on fresh config (or when loading from store) is first available model with a key, not first in registry.
- [ ] Reproduction steps no longer block chat when only OpenAI key is configured.
- [ ] Regression test for "only OpenAI key → chat works with OpenAI model".

## Subtasks
- [ ] Reproduce locally (OpenAI key only, selected model Anthropic or missing)
- [ ] Fix default/fallback logic in boot and on apiKeys change
- [ ] Add/adjust tests
- [ ] Validate fix via QA scenario
- [ ] Update docs/changelog if behavior changed

## Change Log
- 2026-03-01: Bug ticket created from tier-3 validation blocker (F-20260301-003).
