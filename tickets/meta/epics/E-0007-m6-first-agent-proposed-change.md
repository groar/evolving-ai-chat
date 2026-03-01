# E-0007: M6 — First Agent-Proposed Change from Real Usage

## Metadata
- ID: E-0007
- Status: closed
- Owner: pm-agent
- Created: 2026-03-01
- Updated: 2026-03-01 (PM checkpoint-28; closed with findings)

## Goal
Ship the first agent-proposed change that originates from genuine usage of the product. The system observes a concrete signal (explicit user feedback captured in-app, or a defined implicit friction trigger), generates a proposal artifact, runs validation, and the user accepts — landing a real, visible improvement. This is the first live test of the product thesis: the observe-propose-validate loop can deliver value a user recognizes and appreciates.

## Rationale
- M5 (E-0006) tier-3 validation completed: base chat is adequate for daily use; proceed to self-evolution.
- M1 (E-0002) built the infrastructure: feedback capture, proposal artifact, settings panel, changelog. The loop exists but has never produced a change from real usage.
- M6 is the moment the "evolving" promise becomes tangible — the user expects "learns & improves from my feedback and usage" (tier-3 verbatim).
- Proving the loop end-to-end with one real instance de-risks the entire roadmap: if the first cycle feels comprehensible and valuable, broader improvement classes follow; if it doesn't, we learn what's missing before investing further.

## Definition of Done
1. **Real signal captured**: at least one feedback item or implicit-friction event that arose organically from using the product (not planted or contrived for testing purposes).
2. **Proposal generated**: the system (runtime or agent) produces a proposal artifact from that signal, following the M1 artifact spec (`docs/m1-first-improvement-loop.md`).
3. **Pipeline exercised**: the proposal flows through the existing pipeline — proposal artifact, validation gates, user accept/reject decision, and changelog entry (if accepted).
4. **Change is user-visible**: the accepted change lands and the user can observe the improvement (e.g. a UI copy change, a settings default, or one narrow improvement from the scoped class).
5. **Comprehension gate (tier-2)**: the user can explain what changed and why within ~10 seconds, confirming the loop output is legible (see Validation Plan).

## Validation Plan
- **Tier 1 (deterministic)**:
  - Smoke test the end-to-end pipeline: signal → proposal → validation gates → accept → changelog entry.
  - Verify proposal artifact conforms to the M1 spec (required fields, linkage, status transitions).
  - Evidence: QA checkpoint in `tickets/meta/qa/`.

- **Tier 2 (micro-validation, internal — project sponsor)**:
  - Audience: primary user / project sponsor.
  - Run after the first accepted change has landed.
  - Probes (1-2 sentence answers each):
    1. "What changed in the app, and why?" (comprehension — can they reconstruct cause and effect?)
    2. "Was this change useful to you?" (value — did it improve something they care about?)
    3. "Do you trust this mechanism to propose future changes?" (trust — does the loop feel safe and transparent?)
  - Evidence: record results in the implementing ticket's Evidence section and link from a dated PM checkpoint in `tickets/meta/feedback/`.

- **Decision this informs**: "Does the observe-propose-validate loop deliver a tangible, comprehensible, and trustworthy improvement?"
  - If yes → expand improvement classes in the next milestone.
  - If comprehension fails → the proposal/changelog UX needs work before expanding scope.
  - If value fails → the signal-to-proposal mapping needs refinement (wrong improvement class or trigger).
  - If trust fails → the approval/rollback mechanism needs strengthening before expanding autonomy.

## Risks
- **M1 pipeline was scaffolded, never battle-tested**: the artifact format, validation gates, and UI were built to spec but exercised only with synthetic data. Real signal may expose gaps (e.g. trigger routing, proposal relevance, gate coverage). Budget time for pipeline adaptation.
- **Signal quality**: early usage may not generate enough organic signal for a high-quality proposal. Mitigation: T-0045 defines a concrete trigger and first instance so we don't stall waiting for serendipity.
- **Scope creep temptation**: once the loop works, there's pressure to ship many changes immediately. The epic is scoped to one improvement class and one landed change.

## Non-goals
- Multiple simultaneous proposals.
- Fully autonomous shipping without user approval.
- Broad "AI plans roadmap" behavior.
- Deep product integrations beyond one narrow improvement class.
- Implicit-signal instrumentation beyond the single trigger defined by T-0045.

## Linked Feedback
- F-20260301-002 (product design review; M5/M6 sequence)
- E-0006 tier-3 results (proceed decision; user anticipates evolving promise)

## Linked Tickets
### M6 tickets (new work)
- T-0045 M6 scope: define improvement class, trigger, and first instance (done)
- T-0046 M6 wire proposal-from-feedback + first instance (done)
- T-0047 E2E smoke + tier-2 comprehension probe + epic closure (ready)

### Infrastructure dependencies (E-0002, done)
- T-0011 M1 spec, T-0012 feedback capture, T-0013 proposal artifact, T-0015 accept→changelog, T-0016 proposals panel

## Progress (Ticket Status)
- Done: T-0045 (scope complete), T-0046 (implementation complete; copy changes shipped), T-0047 (validation + epic closure)
- E2E smoke: PARTIAL — user completed feedback capture → proposal form; did not complete validate → accept → changelog path (UX confusion blocked completion).
- Tier-2 probes: ALL FAIL — comprehension, value, trust all failed. See T-0047 Evidence section for full results (F-20260301-006).

## DoD Resolution
1. Real signal captured — ✓ (organic usage produced feedback items).
2. Proposal generated — ✓ (generate-from-feedback affordance works; T-0046).
3. Pipeline exercised — ✓ (feedback → proposal form populated; partial; accept path not completed by user).
4. Change is user-visible — ✓ (copy changes observable in Settings; "Suggested improvements").
5. Comprehension gate (tier-2) — **FAILED**. User could not explain the loop within ~10 seconds. Explicitly resolved: follow-up tickets T-0048 (duplicate heading), T-0049 (feedback navigation), T-0050 (proposal form UX) created. E-0008 scoped for M6.1 UX clarity. M7 expansion of improvement classes BLOCKED until E-0008 comprehension gate passes.

## Outcome
Epic closed with findings. The loop infrastructure exists and ran end-to-end (partially), but the UX is not yet legible to the primary user. M6.1 (E-0008) addresses the legibility gap before M7 scope expansion.

## Notes
- Improvement class must be narrow: e.g. UI microcopy, one settings default, or one prompt/routing tweak. Avoid scope creep.
- E-0002 (M1) spec in `docs/m1-first-improvement-loop.md` defines artifact format and loop phases; M6 implements the first real instance.
- Expected ticket sequence: T-0045 (scope) → implementation ticket(s) to wire the trigger + proposal generation → smoke test + tier-2 validation → epic closure.
