# PM Checkpoint - 2026-02-28 (6)

## Feedback Themes
- E-0002 probe failure: Settings safety controls are not interpretable to a fresh observer.
- Trust break: runtime-offline messaging may be wrong (banner persists even when runtime is reportedly running).
- Concept overload: “proposal/experiment” terms are confusing without definitions and progressive disclosure.

## Interview Topics And Key Answers
- Micro-validation probes (fresh observer) for E-0002:
  - “Switch to Stable” meaning: “No idea”.
  - “Reset Experiments” meaning / data impact: “No idea”.
  - “What changed + why” comprehension: “super crowded… what’s a proposal/experiment… why several stable buttons… I’m lost”.

## User Testing Ask / Plan
- Tier 2 micro-validation was executed for E-0002 on 2026-02-28.
- Next: rerun the probes only after the follow-up UX fixes ship (T-0024), and after runtime detection is trustworthy (T-0023).
- Where results are recorded:
  - `tickets/status/done/T-0018-rerun-e0002-micro-validation-probes.md`

## Decisions And Rationale
- Marked T-0018 complete (probes run + recorded; follow-ups created).
- Ticketed two follow-ups because the probe results indicate:
  - likely functional defect (runtime offline false negative), and
  - clear UX comprehension failure for core safety controls and concepts.

## Feedback IDs Touched
- Created:
  - F-20260228-003

## Ticket Updates
- Completed:
  - T-0018
- Created (backlog):
  - T-0023 (bug): runtime-offline banner persists when runtime is running
  - T-0024 (ui): Settings controls + concepts not understandable to a fresh observer

## Epic Updates
- E-0002:
  - Added note documenting the probe rerun failure and linking follow-ups (T-0023, T-0024).

## PM Process Improvement Proposal
- For any milestone with tier-2 validation, treat a “clean probe rerun” as a gate: if probes fail, immediately create (a) one functional-defect ticket if any state messaging seems inconsistent, and (b) one UX comprehension ticket that explicitly targets the probe prompts.

Suggested commit message: `PM: record E-0002 probe failure and ticket follow-ups (runtime + settings comprehension)`

Next-step suggestion: Prioritize and groom T-0023 to `ready/` (it may be blocking core chat and corrupting UX testing signal).
