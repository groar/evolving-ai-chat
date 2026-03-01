# T-0056: E-0009 M7 tier-2 validation and epic closure

## Metadata
- ID: T-0056
- Status: ready
- Priority: P1
- Type: validation
- Area: core
- Epic: E-0009
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Run the E-0009 tier-2 value + trust probe with the project sponsor after the M7 batch (T-0052–T-0055) has shipped. The probe validates that the updated entry point framing, concrete proposals, and the new system prompt tuning class are legible, useful, and trustworthy. Pass closes E-0009 and unblocks M8 scoping.

## Context
- E-0009 (M7) adds proposal quality rules (T-0053), entry point copy reframe (T-0054), and the `system-prompt-persona-v1` improvement class (T-0055), gated by a design spec (T-0052).
- This validation ticket orders last in the M7 ready queue; do not pick up until T-0052–T-0055 are all done.
- Probe structure mirrors T-0047 (E-0007 closure) and T-0051 (E-0008 closure).

## Micro-Validation Probe (Tier 2 — per E-0009 Validation Plan)
- Audience: primary user / project sponsor.
- Timing: run after T-0052–T-0055 are all done and the app is running with M7 changes.
- Probes (3):
  1. **Framing**: "You see an 'Improve' button next to an AI answer. What do you think clicking it does?"
     - Pass: answer references software improvement / making the software better, not rating the AI model.
  2. **Value**: "Here's a proposal the system generated from your feedback [show a real generated proposal]. Is this useful? Would you accept it?"
     - Pass: sponsor rates the proposal as useful ("yes" or "probably yes").
  3. **Trust**: "If you accepted this, what do you think would change? And could you undo it?"
     - Pass: sponsor can describe the expected change and knows rollback is possible.
- All three probes must pass. A single fail triggers a targeted follow-up (see Decision below).

## Acceptance Criteria
- [ ] Tier-2 probe run with project sponsor; all three probe answers captured (verbatim or close-paraphrase).
- [ ] Pass/fail verdict recorded per probe in this ticket's Evidence section.
- [ ] E-0009 epic Status updated (`closed` on all-pass; `active` with new follow-up tickets on any fail).
- [ ] E-0009 DoD items 1–5 all marked as satisfied (pass) or explicitly resolved (fail + follow-up scope).
- [ ] PM checkpoint filed in `tickets/meta/feedback/` noting E-0009 closure decision and M8 gate status.

## Decision Matrix
- **All pass** → E-0009 closed; proceed to M8 (expand improvement classes further or add automation trigger).
- **Probe 1 fail** (framing) → entry point copy needs another iteration; create follow-up before closing E-0009.
- **Probe 2 fail** (value) → proposal quality or class selection is off; create follow-up for proposal relevance; do not close E-0009.
- **Probe 3 fail** (trust) → rollback path or changelog transparency needs work; create follow-up before closing E-0009.

## Dependencies / Sequencing
- Depends on: T-0052, T-0053, T-0054, T-0055 (all done).
- Blocks: E-0009 epic closure; M8 scoping.

## Evidence (Verification)
_(to be filled during implementation)_

## Change Log
- 2026-03-01: Created by PM checkpoint (M7 scoping). Ordered last in M7 ready queue. Moved to ready.
