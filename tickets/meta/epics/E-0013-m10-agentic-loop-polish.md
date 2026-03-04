# E-0013: M10 — Agentic Loop Polish

## Metadata
- ID: E-0013
- Milestone: M10
- Status: scoping
- Priority: P1
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Goal
Address the three open questions left over from M8 to make the self-modification loop fast, high-quality, and low-friction:

1. **Live apply / hot-reload** — After a user accepts a patch, the change should go live without a manual app restart. Right now there is no explicit signal confirming the "change is live" UX.
2. **Patch quality** — The agent's generated patches are described as "variable." Improve the prompt strategy, scope guardrails, and/or allowlisting so more proposed patches are usable on first attempt.
3. **Patch scope guardrails** — Decide and enforce whether patches are UI-only (Tailwind/React allowlist), prompt-constrained, or both. A clear constraint prevents unexpected file changes during agent runs.

A design spec (T-0074) is required before implementation tickets are written.

## Problem Statement
M8 shipped a working end-to-end self-modification loop: trigger → agent generates patch → user reviews diff → user accepts → git apply. However:
- There is no hot-reload: users must manually restart the app to observe accepted changes.
- Patch quality is variable: a poor patch wastes a review cycle and erodes trust in the loop.
- The scope boundary is not formally enforced: what files/directories the agent may touch is implicit.

These three gaps limit the "daily improvements" velocity and trust goals in SUCCESS.md.

## Definition of Done
- [ ] T-0074 done: M10 design spec resolves all three open questions with concrete specs.
- [ ] Hot-reload / live-apply ticket done: accepted patches go live without a manual restart.
- [ ] Patch quality ticket done: patch quality improves (measurable via acceptance rate or reviewer notes).
- [ ] Scope guardrail ticket done: agent patch scope is formally enforced with a documented allowlist or prompt constraint.
- [ ] Tier-1 deterministic validation: tests cover live-apply signal and scope enforcement.

## Candidate Tickets (to be created after T-0074 design spec)
| Ticket | Title | Status |
|--------|--------|--------|
| T-0074 | M10 design spec (live apply, patch quality, scope guards) | pending |
| T-0075 (TBD) | Live apply / hot-reload after patch acceptance | candidate |
| T-0076 (TBD) | Patch quality: prompt engineering + scope allowlist | candidate |

> Note: T-0075 and T-0076 are candidates; they should be written (and may be split or merged) after T-0074 is accepted. Do not start implementation until the design spec is done.

## Open Questions (from STATUS.md)
- M8 build step: hot-reload on patch accept, or full Tauri rebuild? What is the minimum viable "change is live" signal?
- M8 patch scope guard: UI-only allowlist, prompt constraint, or both?
- M8 diff UI: unified diff view inline in the app, or a dedicated "Proposed Changes" panel? (lower priority; address only if T-0074 surfaces it as blocking)

## Feedback References
- STATUS.md "Open Questions" section (2026-03-04)
- M8 tier-2 micro-validation note: "patch quality noted as variable (model/prompt tuning can be a follow-up)"

## Change Log
- 2026-03-04: Epic created; T-0074 (design spec) added as first ready ticket.
