# QA Checkpoint - 2026-03-01 (T-0039)

## Scope Tested
- Ticket: T-0039 (`tickets/status/review/T-0039-model-selector-multi-provider.md`)
- Area: core — model selector, multi-provider adapters, API key gating

## Automated Test Outcomes
- `cd apps/desktop && npm test`: PASS (34 tests).
- `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime.test_chat runtime.test_proposals`: PASS (23 tests).

## Test Plan Executed
1. **Model registry**: `list_models()` returns GPT-4o, GPT-4o-mini, Claude Sonnet, Claude Haiku.
2. **Chat routing**: `model_id` in request routes to correct adapter; `/state` includes `models` and `api_keys`.
3. **Configure**: `openai_api_key` and `anthropic_api_key` supported independently; omitted keys left unchanged.
4. **API key gating**: `canSend` requires `hasKeyForSelectedModel`; placeholder prompts when selected model's key missing.
5. **Message meta**: assistant messages already include `model_id` in meta (e.g. `gpt-4o-mini | ... | $0.00`).

## Criteria-to-Evidence Mapping
- Users can select model from dropdown -> Model selector `<select>` in composer footer with all 4 models -> PASS.
- Each provider requires own API key -> Settings Connections: OpenAI + Anthropic separate inputs; per-provider Set/Remove -> PASS.
- Missing key shows prompt -> Placeholder "Add API key for this model in Settings"; composer disabled -> PASS.
- Selected model persists as default -> `setDefaultModelInStore` + `getDefaultModelFromStore` in apiKeyStore -> PASS.
- Message meta shows model -> `assistant_meta = f"{model_id} | {created_at} | ${cost:.2f}"` in main.py -> PASS.
- Anthropic adapter -> `anthropic_adapter.py` with chat() and chat_stream(); ChatRouter routes by model_id -> PASS.
- Invalid/missing key handled -> 503 api_key_not_set; stream yields {"error":"api_key_not_set"} -> PASS.

## UX/UI Design QA (Area: core — partial pass on new UI)
| Category | Result | Evidence |
| --- | --- | --- |
| 4) States and Error | PASS | "Add API key for this model in Settings" when selected model has no key; options show "(no key)" suffix. |
| 5) Copy | PASS | "OpenAI", "Anthropic", model display names; no implied unsupported behaviors. |
| 6) Affordances | PASS | Model selector is native `<select>`; tab order preserved. |

## Bugs Found
- None.

## Outstanding Risks
- Smoke test `smoke:fastapi` may fail when no API key configured (expected: 503 on /chat).
- Manual E2E recommended: add Anthropic key, select Claude, send message; verify model_id in response meta.

**Suggested commit message:** `T-0039: Model selector (multi-provider) — OpenAI + Anthropic, registry, ChatRouter`

**Next-step suggestion:** PM should accept T-0039 to `done/`. Optional: run manual E2E with Anthropic API key before acceptance.
