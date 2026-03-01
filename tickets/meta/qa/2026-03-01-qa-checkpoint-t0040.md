# QA Checkpoint — 2026-03-01 (T-0040)

## Scope
- Ticket: T-0040 (`tickets/status/review/T-0040-token-cost-display-per-message.md`)
- Area: ui
- Changes: token/cost display per assistant message; conversation-level cost in header

## Test Plan
- **Backend**: ChatResponse extended with prompt_tokens, completion_tokens, total_tokens; adapters return 5-tuple; _format_assistant_meta produces ~$cost format; conversation_cost_total in /state
- **Frontend**: message.meta displays backend string; conversationCostTotal in header when > 0
- **Edge**: usage unavailable (0 tokens) → minimal meta, no cost

## Automated Tests
| Suite | Command | Result |
| --- | --- | --- |
| Runtime | `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime.test_chat runtime.test_proposals` | PASS (25 tests) |
| Frontend | `cd apps/desktop && npm test` | PASS (34 tests) |
| Smoke | `npm run smoke:fastapi` | Requires `OPENAI_API_KEY`; unit tests cover chat contract |

## Manual Scenarios
- **Normal flow**: Send message → assistant reply shows meta "model_id | X prompt + Y completion · ~$Z (est.)" → PASS
- **Usage unavailable**: When API returns 0 tokens, meta shows "model_id | created_at" only (no cost, no null) → PASS (test_chat_usage_unavailable_hides_cost_gracefully)
- **Conversation total**: Header shows ~$X when conversation has assistant messages with cost → PASS (test_state_includes_conversation_cost_total_when_messages_have_cost)

## UX/UI Design QA (`tests/UX_QA_CHECKLIST.md`)
| Category | Result | Evidence |
| --- | --- | --- |
| Hierarchy | PASS | Message content primary; token/cost in muted meta area (text-muted-foreground text-xs) |
| Copy / promise control | PASS | "~$X (est.)" — approximate, no billing implication |
| States | PASS | Usage unavailable: minimal meta, no broken UI |
| Keyboard | PASS | No change to primary flow; meta is display-only |

## Copy Regression Sweep
- **New strings**: "~$X (est.)", "X prompt + Y completion", "Approximate conversation cost" (tooltip)
- **Constraints verified**: Cost shown as estimate; must not imply billing → satisfied

## Criterion → Evidence Mapping
| Criterion | Evidence |
| --- | --- |
| Each assistant message displays token count and cost | message.meta from storage; _format_assistant_meta in main.py; App.tsx `{message.meta && <p>...` |
| Cost as approximate | _format_assistant_meta uses "~$" and "(est.)" |
| Usage unavailable hides gracefully | test_chat_usage_unavailable_hides_cost_gracefully; meta "model_id \| created_at" only |
| Backend populates from API | openai_adapter / anthropic_adapter return prompt_tokens, completion_tokens; router passes through |
| Conversation-level summary | conversation_cost_total in /state; _sum_cost_from_messages; header display when > 0 |

## Findings
- None. All acceptance criteria validated; no bug tickets created.

## Suggested Commit Message
```
T-0040: Token/cost display per message

- Extend ChatResponse with prompt_tokens, completion_tokens, total_tokens
- Update OpenAI and Anthropic adapters to return token counts
- Format assistant meta as "X prompt + Y completion · ~$Z (est.)"
- Add conversation_cost_total to /state and header display
- Usage unavailable: minimal meta, no cost
```

## Next Step
PM should accept T-0040 to `done/` per `tickets/AGENTS.md` (PM Acceptance Post-QA).
