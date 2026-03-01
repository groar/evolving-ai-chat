# PM Checkpoint — 2026-03-01 (M8 Pivot)

## Feedback Themes (De-duplicated)
- **Direction pivot (S1)**: The AI persona / improvement-class approach (M7) is too complex and hasn't worked in practice. The expected loop is feedback → the app generates source-code changes → user reviews and accepts or rejects. Config-string edits (system prompt, microcopy) are not what the user had in mind.

## Interview Topics + Key Answers
- Topic: Is the vision "feedback modifies config" or "feedback modifies source code"?
  - Answer: Source code. "We should allow for full code self-customization. Basically: we get a feedback, turn it into a proposal, then into a customization of the software (through changing the code), without the user having to do anything else (before accepting or not maybe the changes)."
  - Impact: M7 improvement-class work is superseded. M8 scoped as first milestone targeting actual source-file modification.

## User Testing Ask / Plan
Skipped for this checkpoint — this is a direction pivot, not a UX polish event. Tier-2 validation planned in E-0010 DoD after the first real code-change loop ships.

## Decisions + Rationale
- **E-0009 (M7) superseded**: The improvement-class/config approach did not match user intent. T-0052–T-0055 (done) established useful design thinking (proposal quality, trigger routing) but their scope (editing config strings) is wrong. Rationale: F-20260301-008, direct sponsor confirmation.
- **T-0056 cancelled**: The tier-2 probe was validating the M7 approach. Running it would validate something we are abandoning. Rationale: no value in gating on a superseded approach.
- **T-0057 cancelled**: The UI flow bug (undiscoverable proposal generation) is moot because the flow it fixes is being abandoned. Rationale: same pivot.
- **E-0010 (M8) scoped**: First milestone targeting real source-code modification. Constrained to UI layer (React components) in M8 to keep scope safe. Agentic harness (T-0009) and proposal artifact (T-0013) are the prior art to build from.
- **T-0058 created and ranked #1**: Design-spec-first rule applies — do not implement until the loop data flow, patch format, diff UI, apply/rollback mechanics, and scope guard are all explicitly defined.
- **Open questions parked in STATUS.md**: hot-reload vs full rebuild, diff UI placement, scope guard mechanism.

## Feedback IDs Touched
- F-20260301-008 (new → triaged; linked to T-0058)

## Ticket Updates
- Cancelled:
  - T-0056 (moved to `done/` with cancelled status + rationale)
  - T-0057 (moved to `done/` with cancelled status + rationale)
- Epics closed/superseded:
  - E-0009 status → superseded; closure note added
- Prepared for pickup:
  - T-0058 created in `tickets/status/ready/`
- Epics created:
  - E-0010 (`tickets/meta/epics/E-0010-m8-agentic-code-self-modification.md`)
- Ready queue updated:
  - T-0058 rank 1 (only item in queue)

## Epic Updates
- E-0009: status superseded. T-0052–T-0055 done; T-0056 cancelled. Closure note records pivot rationale.
- E-0010: created, active. Goal = agentic code self-modification loop. DoD has 6 items; tier-2 validation after first loop ships.

## Proposed PM Process Improvement (Next Cycle)
**Validate the mental model before building a new loop class, not after.** M6/M7 built three milestones of infrastructure before discovering the user's mental model of "self-evolution" was fundamentally different (code changes, not config changes). A 5-minute "show the user the proposed loop with a concrete example" step at epic-creation time would have caught this before any code was written. Add to the epic creation checklist: "Confirm loop mental model with primary user before first implementation ticket moves to in-progress."
