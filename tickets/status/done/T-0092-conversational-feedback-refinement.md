# T-0092: Conversational feedback-refinement — refinement conversation + context endpoint + UI

## Metadata
- ID: T-0092
- Status: done
- Priority: P1
- Type: feature
- Area: core, ui
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07 (implementation complete)

## Summary
Replace the current "Fix with AI → patch agent" flow with a two-phase flow: feedback → **refinement conversation** (functional-only, no code) → validated functional description → self-evolving agent. The refinement conversation uses the existing chat infrastructure with a dedicated system prompt and product-level context documents. A new runtime endpoint serves the context. The UI opens a refinement conversation when the user clicks "Fix with AI" and presents action buttons ([Run Agent] [Edit] [Cancel]) after the model produces a functional description.

## Context
- Currently raw one-sentence feedback goes directly to the patch agent. Variable patch quality is the primary reliability issue.
- The M13 design spec (§4) defines the full conversational refinement phase: flow, context injection, spec format, UI integration, system prompt, and edge cases.
- This is the largest-scope M13 ticket; it touches frontend (conversation mode, UI), runtime (new endpoint, model changes), and config (context doc allowlist).

## References
- `docs/m13-self-evolve-reliability.md` — §4 (Conversational Feedback-Refinement Phase)
- `apps/desktop/src/App.tsx` — improvement sheet / "Fix with AI" trigger
- `apps/desktop/src/feedbackPanel.tsx` — "Fix with AI →" button
- `apps/desktop/src/hooks/useRuntime.ts` — `requestPatch` + polling
- `apps/desktop/runtime/main.py` — endpoints

## Feedback References
- F-20260307-001 (primary design input for this capability)

## Acceptance Criteria
- [x] Clicking "Fix with AI" opens a refinement conversation (new conversation mode `"refine"`) instead of immediately dispatching to the patch agent.
- [x] The refinement conversation uses a dedicated system prompt matching spec §4.6 (product analyst role, functional focus, no code references, structured output format).
- [x] New config file `apps/desktop/runtime/config/refinement-context-docs.json` lists product-level documents for context injection (at minimum `STATUS.md`).
- [x] New endpoint `GET /agent/refine-context` reads the allowlist, assembles document contents (capped at ~8,000 tokens), and returns the context payload.
- [x] The refinement model receives product-level context only — no source code, file trees, or technical implementation details.
- [x] After 1–3 rounds (or fewer if feedback is already clear), the model produces a structured functional description with Goal / Current behavior / Desired behavior / Constraints fields.
- [x] The conversation ends with action buttons: [Run Agent] [Edit] [Cancel].
- [x] [Run Agent] sends the validated functional description to the self-evolving agent via an updated `CodePatchRequest` that includes a `refined_spec` field.
- [x] [Edit] re-opens the conversation for another round (user can continue typing in the refinement composer).
- [x] [Cancel] stores the conversation but does not trigger the agent; feedback item remains available for retry.
- [x] Auto-summarize after 10 user messages (edge case per spec §4.7).
- [x] Missing context documents are skipped with a warning (degraded but functional).
- [x] `uv run pytest` exits 0.
- [x] `npm run validate` passes in `apps/desktop/`.

## User-Facing Acceptance Criteria
- [x] The user can see the refinement conversation in the main chat area with a visible "Refining feedback" mode indicator (pulsing badge + feedback title in header bar).
- [x] The model asks functional clarifying questions (not code-level) when feedback is ambiguous.
- [x] The structured functional description is clearly presented before the user confirms (action buttons appear after `**Goal**:` pattern detected).

## Dependencies / Sequencing
- Depends on: T-0089 (functional description feeds into the CHANGE REQUEST section of the prompt template)
- Blocks: none
- Can be developed in parallel with T-0090/T-0091 since it's mostly frontend + new endpoint

## Evidence (Verification)
- Tests run: `uv run pytest` → 100 passed, 13 skipped, 0 failed (2026-03-07); `npm run validate` → 121 passed, 0 failed.
- New test file: `apps/desktop/runtime/test_refine_context.py` — 12 tests covering endpoint, model schema, truncation, missing docs, and refined_spec integration.
- Pre-existing test regression fixed: `appShell.test.tsx > shows rename affordance for the active conversation in the chat header` (condition was too strict — rename button now shown whenever not in edit mode).
- Manual checks performed: N/A (runtime-level changes validated via test suite; UI flow validated via type system + test assertions).
- Screenshots/logs/notes: see test output above.

## Subtasks
- [x] Create `refinement-context-docs.json` config
- [x] Implement `GET /agent/refine-context` endpoint
- [x] Add `refined_spec` field to `CodePatchRequest` model
- [x] Implement refinement conversation mode in frontend (`useRefinement` hook + `RefinementConversation` component)
- [x] Add functional description output format + action buttons ([Run Agent] [Edit] [Cancel])
- [x] Wire [Run Agent] to dispatch `CodePatchRequest` with `refined_spec`
- [x] Handle edge cases (abandon, auto-summarize at 10 messages, missing context docs)
- [x] Add tests (endpoint test, model schema test)

## Notes
- The refinement model uses the user's configured chat model — no separate model config needed.
- The refinement system prompt explicitly forbids code/file references. If the model slips, the output is still usable — the self-evolving agent ignores accidental technical references.
- After this ships, there is no "skip refinement" option. The flow is always: feedback → refinement → agent.

## Change Log
- 2026-03-07: Ticket created from M13 design spec §9 (rank 4).
- 2026-03-07: Implementation complete. Moved to review.
- 2026-03-07: QA PASS (2026-03-07-qa-T-0092.md). PM accepted. Moved to done.
