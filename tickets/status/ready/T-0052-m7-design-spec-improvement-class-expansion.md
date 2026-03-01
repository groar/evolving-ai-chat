# T-0052: M7 design spec — improvement class schema, trigger rules, and proposal quality rules

## Metadata
- ID: T-0052
- Status: ready
- Priority: P1
- Type: design
- Area: core
- Epic: E-0009
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Author the design spec that gates M7 implementation. Define the improvement class schema (how classes are registered and invoked), trigger rules for the system prompt/persona tuning class, and proposal quality rules (what makes a proposal concrete and actionable vs. an echo of the feedback). This spec must be complete before T-0053 and T-0055 begin implementation.

## Context
- E-0009 (M7) adds a second improvement class (system prompt tuning) and improves proposal generation quality.
- T-0051 evidence: "it seems just like a copy of the feedback itself" — proposals currently echo the raw feedback form input rather than proposing a specific, named change.
- The existing class `settings-trust-microcopy-v1` provides the reference implementation pattern; M7 must register new classes without breaking existing behavior.
- See `docs/m1-first-improvement-loop.md` for the artifact format and loop phases (proposal → validate → accept → changelog).

## Design Spec

### Goals
- Define how improvement classes are structured and registered in the system.
- Specify trigger conditions for the `system-prompt-persona-v1` improvement class.
- Define the proposal quality contract: what fields/content make a proposal concrete.

### Non-goals
- Implementing any class (that is T-0053 / T-0055).
- Changing the artifact schema or the accept/changelog flow.
- Adding implicit-signal triggers (only explicit feedback triggers for now).

### Improvement Class Schema
Each improvement class is a named entity with:
- `id`: unique string (e.g. `system-prompt-persona-v1`)
- `label`: human-readable name shown in the proposals panel (e.g. "AI Persona & Tone")
- `trigger_tags`: list of feedback category tags that route to this class (e.g. `["tone", "style", "verbosity", "persona"]`)
- `proposal_template`: a short instruction to the proposal generator (either rule-based or LLM-guided) describing what a proposal for this class should look like.
- `apply_target`: where the accepted change lands (e.g. `system_prompt`, `settings_label`, `ui_copy`).

### Trigger Rules — `system-prompt-persona-v1`
- **Trigger condition**: feedback item has at least one tag matching `["tone", "style", "verbosity", "persona", "length", "formality"]`, OR the free-text reason contains a phrase referring to how the AI communicates (not what it says).
- **Routing**: when the proposal generation step fires, it selects `system-prompt-persona-v1` if the feedback matches the above.
- **Fallback**: if no class matches, fall back to the existing `settings-trust-microcopy-v1` class or surface a "no applicable improvement class" state (do not generate a generic proposal).

### Proposal Quality Rules
A proposal is **concrete** if it satisfies all of the following:
1. **Names a specific target**: states what is being changed (e.g. "the active system prompt" or "the Settings › Trust label").
2. **Describes the change**: states what the new value or behaviour will be (e.g. "Add 'Keep responses concise and direct.' to the end of the system prompt").
3. **States the rationale**: one sentence linking the change to the feedback signal (e.g. "User reported responses feel too long and verbose").
4. **Is not a re-statement**: the `title` and `description` fields must not simply repeat the user's raw feedback text verbatim.

A proposal that fails rules 1–3 or violates rule 4 must be rejected by the proposal generator and either regenerated or flagged for review.

### User-Facing Feedback Plan
- Proposals panel: display `label` for the matched improvement class so users understand which system aspect is being changed.
- Proposal form: the `Title` field pre-populated with a concrete change description (e.g. "Shorten AI responses: add conciseness instruction to system prompt"), not the raw feedback text.
- Accepted system prompt changes: visible in Settings → AI Persona (or equivalent) so users can inspect what the loop applied.

### Scope Bounds
- Only the two explicit improvement classes in scope for M7: `settings-trust-microcopy-v1` (existing) and `system-prompt-persona-v1` (new).
- No implicit triggers; only explicit user feedback form submissions.
- No model routing, temperature, or top-p changes in this milestone.

### Edge Cases and Failure Modes
- Feedback matches no class: show "No applicable improvement for this feedback type" in proposals panel; do not generate an empty proposal.
- System prompt grows unbounded: cap system prompt additions at 3 persona sentences; if cap is reached, offer to replace the oldest one.
- User rejects a proposal: no retry in M7; record rejection in the artifact; user can re-submit feedback if they want a new proposal.

### Validation Plan
- Tier 1: unit test proposal quality guard (reject proposals that fail rules 1–4); verify trigger routing for at least 3 sample feedback items per class.
- Tier 2: included in E-0009 epic closure (T-0056).

## Acceptance Criteria
- [ ] Design spec section above reviewed and accepted by PM/sponsor (or explicitly noted as "implementer may proceed without review").
- [ ] Improvement class schema documented in `docs/m7-improvement-classes.md` (new file).
- [ ] Trigger rules and proposal quality rules captured in the same doc.
- [ ] No implementation code changed in this ticket.

## Dependencies / Sequencing
- Blocks: T-0053, T-0055 (both wait for this spec).
- Does not block: T-0054 (entry point copy is UI-only; can proceed in parallel after T-0052 is in progress).

## Change Log
- 2026-03-01: Created by PM checkpoint (M7 scoping). Moved to ready.
