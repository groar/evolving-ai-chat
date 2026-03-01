# QA Checkpoint - 2026-03-01 (T-0042)

## Scope Tested
- Ticket: T-0042 (`tickets/status/review/T-0042-model-selector-default-to-first-available-key.md`)
- Area: core — model selection, boot/configure flow, API key gating

## Automated Test Outcomes
- `cd apps/desktop && npm test`: PASS (39 tests, includes useRuntime.modelSelection.test.ts).
- `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime.test_chat runtime.test_proposals`: PASS (25 tests).

## Test Plan Executed
1. **getFirstModelWithKey unit tests**: Only OpenAI key → returns gpt-4o-mini; only Anthropic → claude-3-5-sonnet; both keys → first in registry (gpt-4o-mini); no keys → null; empty models → null.
2. **Auto-switch logic**: useEffect in useRuntime corrects selectedModelId when current model's provider has no API key; persists correction to store via setDefaultModelInStore.
3. **Regression**: Reproduction steps (OpenAI key only, persisted Anthropic model) — effect should auto-switch to gpt-4o-mini, unblocking composer.

## Criteria-to-Evidence Mapping
- When selected model's provider has no API key, app auto-switches to first model that has a key → getFirstModelWithKey + useEffect in useRuntime.ts → PASS.
- Default model on fresh config (or when loading from store) is first available model with a key → Effect runs when models/apiKeys/selectedModelId change; corrects invalid selection → PASS.
- Reproduction steps no longer block chat when only OpenAI key is configured → Logic ensures selectedModelId always points to model with key when any key exists → PASS.
- Regression test for "only OpenAI key → chat works with OpenAI model" → useRuntime.modelSelection.test.ts "returns first OpenAI model when only OpenAI has key" → PASS.

## UX/UI Design QA (Area: core — N/A)
- T-0042 is a core/bug ticket; no UX checklist required.

## Bugs Found
- None.

## Outstanding Risks
- Manual E2E recommended: configure OpenAI key only, clear persisted model or set Anthropic model in store, launch app — verify composer is enabled and gpt-4o-mini is selected.

**Suggested commit message:** `T-0042: Model selector defaults to first model with API key — auto-switch when selected provider has no key`

**Next-step suggestion:** PM should accept T-0042 to `done/`. Optional: run manual E2E before acceptance.
