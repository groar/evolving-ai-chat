# E-0016: M13 — Self-Evolve Reliability Hardening

## Metadata
- ID: E-0016
- Milestone: M13
- Status: in-progress
- Priority: P1
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07
- Design Spec: `docs/m13-self-evolve-reliability.md`

## Goal
Harden the self-modification loop (feedback → patch → eval → apply → reload) so it reliably produces useful, safe patches without manual intervention. The primary new capability is a **conversational feedback-refinement phase** that turns vague user feedback into a validated, context-rich spec before the patch agent runs. Additionally: expand evals from advisory to blocking, add retry with feedback, and improve prompt quality.

## Problem Statement
The M8/M10/M12 milestones established the self-modification loop infrastructure: `pi`-based patch agent, git-backed apply/rollback, scope allowlist, sandboxed build gate, and a lightweight eval harness. However:

1. **No feedback refinement** (F-20260307-001) — Raw one-sentence user feedback goes directly to the patch agent with no clarifying questions, no context about the current software state, and no user validation of what the agent will attempt. This is the highest-leverage gap: garbage in → garbage out.
2. **Prompt is generic** — The patch agent sends a single sentence to `pi` with no scope constraints, output format guidance, or few-shot examples. Patch quality depends entirely on `pi`'s own behavior.
2. **No Layer 1 scope prompt** — M8 spec §6 defines a scope-guard system prompt, but it was never implemented. The allowlist (Layer 2) catches violations after the fact, but the agent wastes time generating out-of-scope changes.
3. **Evals are advisory** — `_run_evals()` logs results but never blocks apply. A patch that fails evals still gets committed.
4. **Single eval check** — Only `patch_applies_cleanly`. No lint check, test-pass check, or scope-compliance check in the eval harness.
5. **No retry** — When a patch fails (build gate, eval, or apply), the user must manually re-trigger with no context about the failure fed back to the agent.
6. **Progress opacity** — Pi agent runs for up to 600s with no incremental progress signal to the user.

## Definition of Done
- [x] T-0088 done: design spec confirms hardening approach, conversational refinement design, blocking vs. advisory eval policy, retry strategy, and prompt improvements.
- [ ] Conversational feedback-refinement phase shipped: user can converse with a model to refine feedback before the patch agent runs; model has context about the current software state; user explicitly confirms the refined spec.
- [ ] Prompt improvements shipped: scope-guard system prompt (Layer 1) + quality/output guidance.
- [ ] Eval harness expanded: at least one additional blocking check beyond `patch_applies_cleanly`.
- [ ] Retry with context: at least one automated retry attempt when a patch fails evals or build gate, feeding failure context back to the agent.
- [ ] `uv run pytest` continues to exit 0.
- [ ] End-to-end self-evolve flow demonstrably more reliable (measured by patch success rate or reduced manual re-triggers).

## Implementation Tickets (Confirmed By Design Spec §9)
| Rank | Ticket | Description | Priority | Status |
|------|--------|-------------|----------|--------|
| — | T-0088 | M13 design spec: reliability gaps analysis + hardening plan | P1 | done |
| 1 | T-0089 | Prompt improvements: structured template + dynamic allowlist + context assembly | P1 | ready |
| 2 | T-0090 | Eval harness expansion: `files_in_allowlist` + `npm_validate_passes` + blocking policy | P1 | ready |
| 3 | T-0091 | Retry with failure context: one auto-retry on retriable failures | P1 | ready |
| 4 | T-0092 | Conversational feedback-refinement: refinement conversation mode + context endpoint + UI | P1 | ready |
| 5 | T-0093 | Progress reporting: elapsed-time in poll response + frontend counter | P2 | ready |

## Feedback References
- F-20260307-001 (conversational feedback refinement — primary design input for M13).
- F-20260301-008 (direction pivot to full code self-modification — original impetus).
- PM checkpoint 2026-03-06 (M10 tier-2 deferred: patch quality noted as variable).

## Validation Plan
Tier-2 micro-validation after TBD-1 through TBD-4 ship (per spec §11):
1. Prompt quality probe: 3 sample feedback items, compare patch quality before/after.
2. Refinement conversation probe: vague feedback → verify model asks relevant questions → structured spec produced.
3. Retry probe: deliberate retriable failure → verify retry fires with context → different patch produced.
Results to be recorded in this epic file or a dedicated QA checkpoint.

## Change Log
- 2026-03-07: Epic created during PM run. T-0088 (design spec) created as first ready ticket.
- 2026-03-07: F-20260307-001 (conversational feedback refinement) added as primary design input. Epic goal, problem statement, DoD, and candidate tickets updated.
- 2026-03-07: T-0088 accepted. Design spec shipped in `docs/m13-self-evolve-reliability.md`. 5 implementation tickets confirmed. Status → in-progress. PM to create T-0089–T-0093 and replenish ready queue.
- 2026-03-07: PM run created T-0089–T-0093 (all 5 implementation tickets). Ready queue replenished. Ticket table updated with confirmed IDs.
- 2026-03-08: PM run added T-0095 (git commit when agent succeeds), T-0096 (patches missing from Activity), T-0097 (progress in refinement + Activity cards) from Fix with AI playtest feedback F-20260308-002 to 004.
