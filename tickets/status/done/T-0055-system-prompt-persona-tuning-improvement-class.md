# T-0055: System prompt / persona tuning improvement class

## Metadata
- ID: T-0055
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0009
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Wire a second improvement class (`system-prompt-persona-v1`) end-to-end: feedback about response tone, style, verbosity, or persona triggers a concrete system prompt proposal; when the user accepts it, the active system prompt is updated and the change is recorded in the changelog. This is the second live improvement class after `settings-trust-microcopy-v1`.

## Context
- E-0009 (M7) goal: expand the loop from one improvement class to at least two.
- T-0051 Evidence: sponsor's first feedback category was "tone of the answer" — a natural fit for system prompt tuning.
- T-0052 defines the class schema and trigger rules; T-0053 ensures proposal generation produces concrete output.
- Reference: `docs/m1-first-improvement-loop.md` (artifact format), `docs/m7-improvement-classes.md` (created by T-0052).

## Design Spec

See T-0052 for the full class schema. Summary for this class:
- `id`: `system-prompt-persona-v1`
- `label`: "AI Persona & Tone"
- `trigger_tags`: `["tone", "style", "verbosity", "persona", "length", "formality"]`
- `apply_target`: the locally stored active system prompt (SQLite `settings` table or equivalent).

### Proposal Shape
When feedback matches this class, the proposal title and description must follow the T-0052 quality rules, for example:
- **Title**: "Add conciseness instruction to AI persona"
- **Description**: "Append 'Keep responses concise and direct — avoid padding or repetition.' to the active system prompt."
- **Rationale**: "User reported AI responses feel too long and verbose."

### Applying an Accepted Proposal
1. Read the current active system prompt from local storage.
2. Apply the proposed change (append, replace, or insert as described in the proposal `description`).
3. Cap: if the persona section of the system prompt already contains 3 or more added sentences, offer to replace the oldest one (surface a confirmation in the proposals panel before applying).
4. Write the updated system prompt back to local storage.
5. Record a changelog entry: `system-prompt-persona-v1 | [proposal title] | [date]`.
6. The change takes effect on the next message sent (no restart required).

### User-Facing Feedback Plan
- Proposals panel label: "AI Persona & Tone" (from `label` field).
- After accepting: toast notification "AI persona updated. Your next message will use the new style." + link to Settings → AI Persona to review.
- Settings → AI Persona (or equivalent section): show the current effective system prompt additions, each with a "Remove" action for rollback.

### Scope Bounds
- Only tone/style/verbosity/persona tags trigger this class.
- Only the locally stored active system prompt is modified; no model parameter changes (temperature, top-p).
- Rollback: "Remove" action in Settings → AI Persona removes the specific addition and logs a rollback changelog entry.
- Cap: max 3 persona additions at any time.

### Edge Cases
- Empty current system prompt: additions are simply appended; no structural change.
- Proposal description is ambiguous (e.g. "be nicer"): proposal quality guard (T-0053) must flag this as non-concrete before it reaches the user.
- User rejects: no retry; artifact records rejection; no system prompt change.
- System prompt overflow: if a single addition exceeds 200 characters, proposal quality guard flags as too long.

## Acceptance Criteria
- [x] `system-prompt-persona-v1` class registered in the improvement class registry per T-0052 schema.
- [x] Feedback with tone/style tag routes to this class and generates a concrete proposal (title, description, rationale all non-empty and non-echo).
- [x] Accepting the proposal updates the active system prompt in local storage.
- [x] The next AI message in the chat uses the updated system prompt (verified by checking the message that goes to the provider API).
- [x] Changelog entry recorded for the accepted change (same format as existing changelog entries).
- [x] Settings → AI Persona (or current settings equivalent) shows the active persona additions with a "Remove" rollback action.
- [x] Removing a persona addition reverts the system prompt and logs a rollback changelog entry.
- [x] Cap enforcement: after 3 additions, system prompts to replace oldest before adding new one.
- [x] At least 3 unit tests: trigger routing (tone feedback → `system-prompt-persona-v1`), proposal quality (echo rejected), apply + rollback cycle.
- [x] QA checkpoint filed in `tickets/meta/qa/` after verification.

## Evidence (Verification)
- **Improvement class registry**: `apps/desktop/src/improvementClasses.ts` — IMPROVEMENT_CLASSES includes system-prompt-persona-v1; routeFeedbackToClass routes by tags and text heuristics.
- **Proposal generation**: `apps/desktop/src/proposalGenerator.ts` — generatePersonaProposal produces concrete title, rationale, diff_summary with Append "sentence" format.
- **Storage**: `apps/desktop/runtime/storage.py` — persona_additions in settings; _apply_persona_addition_locked on accept; remove_persona_addition; improvement_class column.
- **Chat integration**: ChatRequest.system_prompt; OpenAI/Anthropic adapters prepend system message; useRuntime sends persona_additions as system_prompt.
- **UI**: Settings → AI Persona section with list + Remove; proposal label "AI Persona & Tone"; persona toast on accept.
- **Unit tests**: improvementClasses.test.ts (routing), proposalGenerator.test.ts (persona proposal), test_proposals.py (PersonaProposalFlowTests).

## UI Spec Addendum
- New UI surface: Settings → AI Persona section (or inline in existing Settings → Connections / General).
  - Shows list of active persona additions (each with label, date added, "Remove" button).
  - Empty state: "No persona customizations yet. Use the Improve button on any AI response to start."
- Proposals panel: `label` field "AI Persona & Tone" shown alongside the proposal title.
- Toast on accept: "AI persona updated. Next message will use the new style." (auto-dismiss 4s).
- Toast on rollback: "Persona change removed." (auto-dismiss 4s).

## Dependencies / Sequencing
- Depends on: T-0052 (class schema + trigger rules), T-0053 (proposal quality enforcement).
- Must be in ready/in-progress only after T-0053 is at least in review.

## Change Log
- 2026-03-01: Created by PM checkpoint (M7 scoping). Moved to ready.
- 2026-03-01: Implementation complete. improvementClasses.ts, proposalGenerator (persona), storage (persona_additions, apply on accept), chat (system_prompt), Settings → AI Persona UI, unit tests. Moved to review.
- 2026-03-01: QA checkpoint 2026-03-01-qa-checkpoint-t0055 PASS. PM accepted. Moved to done.
