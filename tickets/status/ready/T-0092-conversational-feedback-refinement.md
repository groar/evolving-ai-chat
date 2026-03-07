# T-0092: Conversational feedback-refinement — refinement conversation + context endpoint + UI

## Metadata
- ID: T-0092
- Status: ready
- Priority: P1
- Type: feature
- Area: core, ui
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07

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
- [ ] Clicking "Fix with AI" opens a refinement conversation (new conversation mode `"refine"`) instead of immediately dispatching to the patch agent.
- [ ] The refinement conversation uses a dedicated system prompt matching spec §4.6 (product analyst role, functional focus, no code references, structured output format).
- [ ] New config file `apps/desktop/runtime/config/refinement-context-docs.json` lists product-level documents for context injection (at minimum `STATUS.md`).
- [ ] New endpoint `GET /agent/refine-context` reads the allowlist, assembles document contents (capped at ~8,000 tokens), and returns the context payload.
- [ ] The refinement model receives product-level context only — no source code, file trees, or technical implementation details.
- [ ] After 1–3 rounds (or fewer if feedback is already clear), the model produces a structured functional description with Goal / Current behavior / Desired behavior / Constraints fields.
- [ ] The conversation ends with action buttons: [Run Agent] [Edit] [Cancel].
- [ ] [Run Agent] sends the validated functional description to the self-evolving agent via an updated `CodePatchRequest` that includes a `refined_spec` field.
- [ ] [Edit] re-opens the conversation for another round.
- [ ] [Cancel] stores the conversation but does not trigger the agent; feedback item remains available for retry.
- [ ] Auto-summarize after 10 user messages (edge case per spec §4.7).
- [ ] Missing context documents are skipped with a warning (degraded but functional).
- [ ] `uv run pytest` exits 0.
- [ ] `npm run validate` passes in `apps/desktop/`.

## User-Facing Acceptance Criteria
- [ ] The user can see the refinement conversation in the main chat area with a visible "Refining feedback" mode indicator.
- [ ] The model asks functional clarifying questions (not code-level) when feedback is ambiguous.
- [ ] The structured functional description is clearly presented before the user confirms.

## Dependencies / Sequencing
- Depends on: T-0089 (functional description feeds into the CHANGE REQUEST section of the prompt template)
- Blocks: none
- Can be developed in parallel with T-0090/T-0091 since it's mostly frontend + new endpoint

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Create `refinement-context-docs.json` config
- [ ] Implement `GET /agent/refine-context` endpoint
- [ ] Add `refined_spec` field to `CodePatchRequest` model
- [ ] Implement refinement conversation mode in frontend (new conversation type, system prompt injection, mode indicator)
- [ ] Add functional description output format + action buttons ([Run Agent] [Edit] [Cancel])
- [ ] Wire [Run Agent] to dispatch `CodePatchRequest` with `refined_spec`
- [ ] Handle edge cases (abandon, auto-summarize at 10 messages, missing context docs)
- [ ] Add tests (endpoint test, model schema test)

## Notes
- The refinement model uses the user's configured chat model — no separate model config needed.
- The refinement system prompt explicitly forbids code/file references. If the model slips, the output is still usable — the self-evolving agent ignores accidental technical references.
- After this ships, there is no "skip refinement" option. The flow is always: feedback → refinement → agent.

## Change Log
- 2026-03-07: Ticket created from M13 design spec §9 (rank 4).
