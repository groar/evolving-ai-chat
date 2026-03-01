# T-0040: Token/cost display per message

## Metadata
- ID: T-0040
- Status: done
- Priority: P3
- Type: feature
- Area: ui
- Epic: E-0006
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Acceptance Criteria
- [x] Each assistant message displays token count (prompt + completion tokens) and estimated cost in the message meta area.
- [x] Cost is shown as approximate ("~$0.003") with a note that it's an estimate.
- [x] If usage data is unavailable, the cost area hides gracefully (no "null" or broken UI).
- [x] Backend populates token count and cost from the model API response (OpenAI usage field, Anthropic usage field).
- [x] Conversation-level cost summary is available (optional: top bar or disclosure).

## Summary
Display token usage and estimated cost per assistant message (and optionally per conversation). This fulfills the STATUS.md requirement for cost tracking and helps the user understand their usage patterns — essential for a self-evolving system that may autonomously spend tokens.

### UI Spec Addendum
- Primary job-to-be-done: Users understand what each interaction costs without needing to check external dashboards.
- Primary action and what must be visually primary: The message content is primary; cost/token info is secondary metadata.
- Navigation / progressive disclosure notes: Token/cost info appears in the existing message meta area (muted, small text). A conversation-level summary could appear in the top bar or a disclosure.
- Key states to design and verify:
  - Happy: token count and estimated cost shown per assistant message.
  - No cost data: if the API doesn't return usage info, show "usage unavailable" or hide gracefully.
  - Aggregate: optional conversation-level total in top bar or disclosure.
- Copy constraints: Show cost as "~$0.003" (approximate), never as an exact billing amount. Must not imply we're billing the user.

## Context
- The ChatResponse model already has a `cost` field (currently null in stubs).
- OpenAI and Anthropic APIs return token counts in their responses.
- STATUS.md lists "cost tracking" as an in-scope observability feature.
- This becomes especially important when self-evolution agents start consuming tokens autonomously.

## References
- `apps/desktop/runtime/models.py` (ChatResponse.cost field)
- `apps/desktop/src/App.tsx` (message.meta rendering)
- `STATUS.md` (cost tracking, observability)
- E-0006-m5-conversational-ux-table-stakes.md

## Feedback References
- F-20260301-002


## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable.
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common breakpoints.

## Dependencies / Sequencing
- Depends on: T-0027 (real model calls that return usage data).
- Blocks: none.
- Sequencing notes: Can ship any time after M3. Lower priority than rendering and model selection.

## Subtasks
- [x] Extend ChatResponse to include prompt_tokens, completion_tokens, total_tokens
- [x] Populate token/cost from OpenAI API response
- [x] Populate token/cost from Anthropic API response (if T-0039 is done)
- [x] Display token count and cost in message meta area
- [x] Add conversation-level cost summary (optional)
- [x] Add tests

## Notes
Cost estimation requires a price-per-token table per model. Keep this as a simple config dict in the backend; don't over-engineer it. Prices change frequently — a static table with a "last updated" date is fine.

## QA Evidence Links
- QA checkpoint: tickets/meta/qa/2026-03-01-qa-checkpoint-t0040.md
- Tests: runtime/test_chat.py (token fields, usage unavailable, conversation_cost_total)

## Evidence (Verification)
- Tests run: `uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime.test_chat runtime.test_proposals` — 25 tests PASS
- Tests run: `npm test` (apps/desktop) — 34 tests PASS
- Manual checks: Per-message meta shows "X prompt + Y completion · ~$Z (est.)"; conversation total in header when > 0
- Usage unavailable: meta shows "model_id | created_at" only (no cost)

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
- 2026-03-01: Promoted to ready (PM run 21; queue replenishment).
- 2026-03-01: Implementation complete. Extended ChatResponse and adapters with token counts; _format_assistant_meta for ~$cost; conversation_cost_total in /state and header display. Moved to review.
- 2026-03-01: QA checkpoint passed. PM acceptance; moved to done.
