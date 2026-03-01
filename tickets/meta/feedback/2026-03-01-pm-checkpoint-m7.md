# PM Checkpoint — 2026-03-01 (M7 Scoping)

## Summary
E-0008 (M6.1) is fully closed. M7 (improvement class expansion) is scoped, epic E-0009 created, five tickets written, and the ready queue replenished.

## Feedback Themes
- **Proposal quality**: T-0051 evidence surfaced that proposals echo feedback verbatim rather than producing concrete, actionable improvements ("it seems just like a copy of the feedback itself"). This is the P1 blocker for M7 value.
- **Entry point mental model**: F-20260301-007 confirmed that the feedback button still primes an AI-rating frame on first contact ("quality of the answer / tone of the answer") before the user recovers to the software-evolution understanding. The T-0051 comprehension gate passed, but the initial frame is still misaligned.

## Interview Topics And Key Answers
No new interviews this run. T-0051 evidence provides the primary signal:
- Probe: "You see a feedback button next to an AI answer. What do you think clicking it does? And once you're in the suggestions area, what do you think happens next?"
- Response (verbatim, sponsor): "providing a feedback on the quality of the answer, it clearly says stuff like 'tone of the answer', etc.. I got 'feature request' so I suppose I could provide some more general feedback (like on the way the answer is presented, for instance). Now if I pick a specific feedback, I get a proposed improvement, but it seems just like a copy of the feedback itself. I imagine, without clicking on anything, that this would trigger the implementation of the said improvement. That's what I'm hoping for."
- Key signals extracted:
  1. First instinct: "quality of the answer" (AI-rating frame).
  2. Self-corrects to software-improvement frame when encountering "feature request" and "proposed improvement."
  3. Proposals feel like echoes, not improvements.
  4. Expectation: acceptance should trigger implementation — the loop should be more direct.

## User Testing Ask / Plan
- Tier 1 (deterministic): included in each M7 ticket (T-0053, T-0054, T-0055).
- Tier 2 (micro-validation): scheduled for T-0056 after M7 batch ships.
  - Rationale: M7 introduces a new improvement class and changes copy and proposal quality — these are user-facing enough to warrant a re-probe.
  - Probe plan documented in E-0009 Validation Plan and T-0056.
  - Where results will be recorded: T-0056 Evidence section and a subsequent PM checkpoint.

## Decisions And Rationale

### F-20260301-007: feedback button implies AI rating
- Decision: ticketed → T-0054 (P2, M7 batch).
- Rationale: T-0051 probe confirmed the partial AI-rating mental model at entry. The comprehension gate passed (software-evolution understanding was reached), but the initial frame is wrong and warrants a targeted copy fix. Not blocking M7 start; ordered rank 2 in the ready queue.

### Proposal generation quality
- Decision: ticketed → T-0053 (P1, rank 3 in ready queue).
- Rationale: proposals that echo feedback provide no value and will erode trust quickly. This is the single highest-leverage M7 improvement and must ship before the new system prompt class (T-0055) to avoid the same quality problem in the new class.

### System prompt / persona tuning improvement class
- Decision: ticketed → T-0055 (P1, rank 4).
- Rationale: "tone of the answer" is the sponsor's natural first feedback instinct. Making that feedback actually change something real (the system prompt) is the clearest path from "I'm rating the AI" to "I'm improving the software." Gated on T-0052 (design spec) and T-0053 (proposal quality).

### M7 design spec
- Decision: ticketed → T-0052 (P1, rank 1) — gates T-0053 and T-0055.
- Rationale: improvement class schema, trigger routing, and proposal quality rules need to be defined in one place before implementation. T-0052 is a design-only ticket (no code); it produces `docs/m7-improvement-classes.md`.

### M7 tier-2 validation
- Decision: ticketed → T-0056 (P1, rank 5, ordered last).
- Rationale: validation after the full M7 batch ships; gates E-0009 closure and M8 scoping.

## Feedback IDs Touched
- F-20260301-007: `triaged` → `ticketed` (T-0054 created; T-0051 result used as resolution evidence).

## Ticket / Epic Updates
- **Created**: E-0009 (M7 epic, active).
- **Created**: T-0052, T-0053, T-0054, T-0055, T-0056 (all moved to `ready/`).
- **Updated**: `tickets/status/ready/ORDER.md` — T-0052 rank 1 through T-0056 rank 5.
- **Updated**: `STATUS.md` — M7 scope described.
- **Updated**: `tickets/meta/feedback/inbox/F-20260301-007` — status ticketed; T-0054 linked; resolution note added.
- **Updated**: `tickets/meta/feedback/INDEX.md` — F-20260301-007 row corrected.
- **No tickets in review** — nothing to accept this run.

## PM Process Improvement Proposal
**Rule: capture "T-0051-style quotes" as first-class evidence in PM checkpoints.** When a tier-2 probe includes a verbatim or close-paraphrase sponsor response, extract actionable signals (framing reveals, quality complaints, expectation statements) as named items in the checkpoint rather than burying them in ticket evidence sections only. This makes PM scoping decisions traceable directly to specific sponsor quotes without requiring re-reads of validation tickets.

Suggested adoption: added to this checkpoint as a live example. No doc change required yet — adopt in next PM run if the pattern holds.

---

Suggested commit message: `PM: scope M7 (E-0009); tickets T-0052–T-0056 ready; F-20260301-007 ticketed → T-0054`

Next-step suggestion: **Pick up T-0052** (rank 1) — the M7 design spec. Author `docs/m7-improvement-classes.md` with the improvement class schema, trigger rules for `system-prompt-persona-v1`, and proposal quality rules. This unblocks T-0053 and T-0055 implementation.
