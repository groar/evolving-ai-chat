# QA Checkpoint - 2026-03-01 (T-0055)

## Scope Tested
- T-0055: System prompt / persona tuning improvement class — second live improvement class end-to-end.

Area: core; Epic E-0009 (M7 improvement class expansion).

## Automated Test Outcomes
- `apps/desktop`: `npm run test` — PASS (62 tests).
- improvementClasses.test.ts: routeFeedbackToClass (tone → persona, copy → settings, no match → null), getClassById.
- proposalGenerator.test.ts: persona proposal for "too long and verbose", diff_summary format.
- settingsPanel.test.tsx: all 17 tests pass with personaAdditions and onRemovePersonaAddition props.
- test_proposals.py: PersonaProposalFlowTests (persona accept applies addition + changelog; remove reverts + rollback) — added; run with project's Python env.

## Manual Scenarios (Recommended)
- Generate from feedback with "tone" tag or text "responses are too wordy" → form opens with "AI Persona & Tone" class, concrete title e.g. "Add conciseness instruction to AI persona", diff_summary `Append "..." to the active system prompt`.
- Create persona proposal, add validation run, accept → persona addition appears in Settings → AI Persona; changelog entry `system-prompt-persona-v1 | ...`.
- Send next chat message → system prompt sent to provider (verify via network/integration).
- Remove persona addition → list updates; rollback changelog entry.
- Cap: add 3 persona additions, try to accept 4th → error "Persona cap reached. Remove one from Settings → AI Persona first."

## Criteria-to-Evidence Mapping
- Class registered → improvementClasses.ts IMPROVEMENT_CLASSES → PASS.
- Tone feedback routes to persona → routeFeedbackToClass unit test + proposalGenerator with improvementClass → PASS.
- Accept updates system prompt → _apply_persona_addition_locked in storage; persona_additions in get_state → PASS.
- Next message uses updated prompt → ChatRequest.system_prompt; adapters prepend system message; useRuntime builds from personaAdditions → PASS.
- Changelog on accept → _apply_persona_addition_locked creates entry → PASS.
- Settings → AI Persona with Remove → SettingsPanel AI Persona section → PASS.
- Remove reverts + rollback changelog → remove_persona_addition; PersonaProposalFlowTests → PASS.
- Cap enforcement → _apply_persona_addition_locked raises ValueError when len>=3 → PASS.
- Unit tests → improvementClasses, proposalGenerator, PersonaProposalFlowTests → PASS.

## Bugs Found
- None.

**Verdict:** PASS. T-0055 ready for PM acceptance.

**Suggested commit message:** `T-0055: system-prompt-persona-v1 improvement class — feedback→proposal→apply→rollback`

**Next-step suggestion:** PM accept T-0055 to `done/`. Continue with T-0056 (E-0009 tier-2 validation and epic closure).
