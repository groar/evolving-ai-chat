# E-0009: M7 — Improvement Class Expansion

## Metadata
- ID: E-0009
- Status: superseded
- Owner: pm-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Goal
Expand the observe-propose-validate loop beyond the single `settings-trust-microcopy-v1` improvement class to include system prompt / response persona tuning, while raising proposal generation quality so proposals are concrete and actionable rather than echoing the user's raw feedback. Entry point copy should clearly signal "improve the software" rather than "rate the AI."

## Rationale
- E-0008 (M6.1) closed with a PASS on the comprehension gate (T-0051), unblocking M7.
- Two concrete signals from T-0051 evidence drive M7 scope:
  1. **Proposal quality**: "it seems just like a copy of the feedback itself." Proposals that echo feedback do not demonstrate the loop's value and will erode user trust over time.
  2. **Entry point framing**: sponsor's first instinct on seeing the feedback button was "quality of the answer / tone of the answer" (AI-rating mental model, F-20260301-007). The gate passed, but the initial frame is still AI-centric.
- Adding a second, meaningfully distinct improvement class (system prompt / persona tuning) validates the loop's generality and directly addresses the sponsor's "tone of the answer" signal — feedback about response tone should now produce a real, actionable system prompt proposal.
- Together, these three improvements (proposal quality, entry point copy, system prompt class) make the loop feel genuinely useful and clearly scoped to software evolution, not AI model feedback.

## Definition of Done
1. **M7 design spec complete**: improvement class schema, trigger rules, and proposal quality rules defined in T-0052 before implementation starts.
2. **Proposal generation is concrete**: proposals describe a specific, actionable change (e.g. "Add 'Keep responses concise' to the system prompt") rather than restating the feedback (T-0053).
3. **Feedback entry point copy reframed**: button label, form heading, and inline hints signal "improve this software / how it responds" not "rate this AI answer" (T-0054).
4. **System prompt tuning class wired**: feedback about response tone/style/persona triggers a proposal that, when accepted, modifies the active system prompt (T-0055).
5. **Tier-2 validation passed**: after M7 ships, the primary user can describe both improvement classes and rates at least one proposal as "actually useful" (T-0056).

## Validation Plan

### Tier 1 (deterministic)
- Automated tests pass for modified components (proposal generation, system prompt apply logic, entry point copy).
- Manual check: feedback about response tone → concrete system prompt proposal generated; entry point button/copy does not mention "AI quality" or "this response"; accepting a proposal applies it to the active system prompt.
- Evidence: QA checkpoint in `tickets/meta/qa/`.

### Tier 2 (micro-validation — value + trust)
- Audience: primary user / project sponsor.
- Run after M7 batch ships (T-0056).
- Probes:
  1. "What do you think the feedback button does?" (framing — should answer with software/software evolution, not AI rating)
  2. "Here's a proposal the system generated from your feedback. Is this useful? Would you accept it?" (value — at least one proposal judged useful)
  3. "Does this feel trustworthy to accept?" (trust — rollback path still feels safe)
- Pass criteria:
  - Probe 1: answer references software improvement, not AI model quality.
  - Probe 2: at least one proposal rated "useful" by sponsor.
  - Probe 3: sponsor feels comfortable accepting.
- Where results recorded: T-0056 Evidence section + PM checkpoint.
- Decision: pass all → proceed to M8 (expand improvement classes further or add automation). Fail probe 1 → entry point framing needs another iteration. Fail probe 2 → proposal relevance/quality still off. Fail probe 3 → rollback / transparency needs work.

## Risks
- **Over-engineering proposal generation**: do not build a full LLM proposal pipeline if rule-based mapping is sufficient. Keep it simple (e.g. "tone feedback → add/adjust persona sentence in system prompt").
- **System prompt apply scope creep**: only modify the locally stored system prompt; do not touch model routing, temperature, or any external API parameters in M7.
- **Entry point copy changes breaking existing tests**: update test fixtures for any affected copy.

## Non-goals
- Model routing improvement class (M8+).
- Feature flag / release channel improvement class (M8+).
- Implicit trigger instrumentation beyond tone/style feedback.
- Fully autonomous proposal acceptance without user approval.

## Linked Feedback
- F-20260301-007 (entry point mental model; ticketed → T-0054)
- T-0051 Evidence ("it seems just like a copy of the feedback itself" → T-0053)

## Linked Tickets
- T-0052: M7 design spec — improvement class schema, trigger rules, proposal quality rules (ready)
- T-0053: Proposal generation quality — concrete proposals, not feedback echoes (ready)
- T-0054: Feedback entry point copy — signal software evolution, not AI rating (ready)
- T-0055: System prompt / persona tuning improvement class — wire feedback → concrete proposal → apply to system prompt (ready)
- T-0056: E-0009 M7 tier-2 validation + epic closure (ready; order last)

## Progress
- T-0052 (design spec): done
- T-0053 (proposal quality): done
- T-0054 (entry point copy): done
- T-0055 (system-prompt-persona class): done
- T-0056 (tier-2 validation): cancelled — see below

## Closure Note (2026-03-01)
E-0009 is superseded by E-0010 (M8). The primary user confirmed the improvement-class approach (config string edits) does not match the intended vision. The expected self-evolution loop is: feedback → the app modifies its own source code → user reviews a diff and accepts or rejects. M7 work built real infrastructure (improvement class registry, proposal generation quality, concrete proposal shapes, system prompt apply/rollback) and those concepts may inform M8 design, but the tier-2 probe (T-0056) is cancelled and the loop direction pivots to source-code modification. See F-20260301-008.
