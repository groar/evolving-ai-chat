# T-0047: E-0007 validation — E2E smoke, tier-2 probe, and epic closure

## Metadata
- ID: T-0047
- Status: ready
- Priority: P1
- Type: validation
- Area: core
- Epic: E-0007
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Complete E-0007 (M6) epic closure: run the end-to-end smoke for the observe→propose→validate→accept pipeline, capture tier-2 comprehension probe results from the project sponsor, record evidence, and close the epic.

## Context
- T-0046 shipped the first M6 change: generate-from-feedback affordance plus the first concrete copy improvement ("Suggested improvements", "Suggest an improvement", "No suggestions yet.").
- E-0007 has two outstanding DoD items:
  - **E2E smoke**: capture feedback → generate proposal → validate → accept → changelog entry visible (deferred from T-0046 QA; requires runtime running).
  - **Comprehension gate (tier-2)**: project sponsor can explain what changed and why within ~10 seconds.
- QA checkpoint for T-0046: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0046.md` (PASS; E2E deferred).

## References
- `tickets/meta/epics/E-0007-m6-first-agent-proposed-change.md`
- `tickets/status/done/T-0046-m6-proposal-from-feedback-first-instance.md`
- `tickets/meta/qa/2026-03-01-qa-checkpoint-t0046.md`
- `docs/m1-first-improvement-loop.md`

## Acceptance Criteria
- [ ] E2E smoke completed: feedback captured in-app → "Generate from feedback" → proposal form populated → validate (check run passes) → accept → changelog entry visible; copy change ("Suggested improvements") observable in Settings.
- [ ] Tier-2 probes run with project sponsor; three answers captured (comprehension, value, trust).
- [ ] Probe answers recorded in this ticket's Evidence section.
- [ ] E-0007 epic Status updated to `closed`; all DoD items marked satisfied (or explicitly resolved).
- [ ] PM checkpoint filed in `tickets/meta/feedback/` noting E-0007 closure and tier-2 outcome.

## Micro-Validation Probes (Tier 2 — per E-0007 Validation Plan)
- Audience: primary user / project sponsor.
- Timing: after T-0046 has landed (it is now done — run these now or at first app use).
- Probes (1–2 sentence answers each):
  1. **Comprehension** — "What changed in the app, and why?"
  2. **Value** — "Was this change useful to you?"
  3. **Trust** — "Do you trust this mechanism to propose future changes?"
- Where results will be recorded: this ticket's Evidence section AND a dated PM checkpoint in `tickets/meta/feedback/`.
- Decision this informs (per E-0007):
  - Comprehension pass → loop is legible; expand improvement classes in M7.
  - Comprehension fail → proposal/changelog UX needs work before expanding scope.
  - Value fail → signal-to-proposal mapping needs refinement.
  - Trust fail → approval/rollback mechanism needs strengthening before expanding autonomy.

## Dependencies / Sequencing
- Depends on: T-0046 (done).
- Blocks: E-0007 epic closure; M7 planning (next milestone scoping).

## Evidence (Verification)
- E2E smoke results: _(to be filled after run)_
- Tier-2 probe answers: _(to be filled after run)_
- E-0007 closure evidence: _(to be filed)_
- Doc review (for docs-only changes): N/A

## Change Log
- 2026-03-01: Ticket created by PM checkpoint-27. Linked to E-0007.
