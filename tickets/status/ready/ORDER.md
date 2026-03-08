# Ready Queue Order

This file is the source of truth for ready-ticket pickup order.

## Ownership
- Owner: Product Manager workflow (`tickets/AGENTS.md`)
- Update cadence: every PM checkpoint, or immediately when reprioritization is requested.

## Ordering Rules
- Execution order is top-to-bottom in the table below.
- Tickets listed here must exist in `tickets/status/ready/`.
- `Priority` metadata informs ranking, but this file is the final tie-break and canonical order.
- If a listed ticket becomes blocked or moves out of `ready/`, update this file in the same change.

## Current Order
| Rank | Ticket | Priority | Notes |
| --- | --- | --- | --- |
| 1 | T-0102 | P1 | M14 kickoff: architecture docs baseline to close known-gap documentation debt |

(T-0103 moved to `review/` 2026-03-08; next P1 pickup is T-0102 above.)

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next.
- If the table is empty, pause new implementation pickup and wait for PM queue updates.

## Notes
- 2026-03-08: Self-evolving run completed T-0105 (left conversation panel inline + collapsible, no chat overlay), moved it to `done/`, and restored T-0102 as rank 1.
- 2026-03-08: Self-evolving run completed T-0104 (rename button adjacent to discussion title), moved it to `done/`, and removed it from ready ranking.
- 2026-03-08: PM triage logged F-20260308-005 and added T-0103 (P1) to `ready/` as rank 1 due to Fix with AI discussion-routing regression reports.
- 2026-03-08: PM run scoped M14 (E-0017) and created T-0102 in `ready/` as rank 1 (architecture docs baseline).
- 2026-03-08: T-0097 moved to review (progress in refinement + Activity in-progress cards). Ready queue empty; PM to replenish.
- T-0058 (M8 design spec) completed 2026-03-01; canonical spec in `docs/m8-code-loop.md`.
- T-0059 (M8 agent harness integration) completed 2026-03-01.
- T-0060 (M8 git-backed apply/rollback) completed 2026-03-02.
- T-0061 (M8 non-review UI) accepted 2026-03-02.
- T-0062 (notification dismiss + failure reason copy) completed 2026-03-03.
- T-0063 (settings legacy cleanup) completed 2026-03-03.
- T-0064 (central improvement button + sheet) accepted 2026-03-03. E-0010 (M8) complete.
- T-0065 (settings crowding + changelog/updates copy) completed 2026-03-03. E-0010 (M8) fully closed.
- T-0066–T-0069 added 2026-03-04: E-0011 (M9 Design System & UX Polish) from user feedback F-20260304-001 to 004.
- T-0067 (Activity sheet) accepted 2026-03-04; removed from ready queue.
- T-0068, T-0069 accepted 2026-03-04. E-0011 implementation complete; T-0070 (tier-2 validation) added 2026-03-04 as sole ready item.
- T-0070 completed 2026-03-04; E-0011 closed. E-0012 (E-0011 follow-up) created; T-0071, T-0072 moved from backlog to ready 2026-03-04. T-0073 (Fix with AI progress/error) created and marked done for F-20260304-005 traceability. T-0071 completed 2026-03-04 (Settings Updates/Early Access cleanup); removed from ready queue.
- T-0072 (Activity/history stub clutter cleanup) completed 2026-03-04. E-0012 closed.
- T-0074 (M10 design spec) added 2026-03-04 as first E-0013 (M10 Agentic Loop Polish) pickup. Queue replenished.
- T-0074 completed 2026-03-04; T-0075 (live apply/hot-reload) and T-0076 (patch quality + scope allowlist + diff UI) added as E-0013 implementation tickets.
- T-0075 completed 2026-03-04; moved to done. T-0076 now rank 1.
- T-0076 completed 2026-03-04; moved to done. E-0013 (M10) implementation complete. E-0013 status updated to done 2026-03-04.
- T-0077 (M11 triage/design spec) added 2026-03-04 as rank 1. E-0014 (M11 Test Suite Green Baseline) created.
- T-0077 completed 2026-03-04; moved to done. Root-cause table and T-0078–T-0080 implementation ticket list produced. Ready queue empty; PM to create T-0078–T-0080 and replenish.
- T-0079 (rank 1), T-0078 (rank 2), T-0080 (rank 3) added 2026-03-04. M11 implementation queue replenished. Ordered small-to-large effort per T-0077 triage recommendations.
- 2026-03-05: T-0078, T-0079, and T-0080 all accepted and moved to `done/`. M11 implementation batch complete; ready queue intentionally left empty pending next PM replenishment from backlog.
- 2026-03-05: PM run closed M11 (E-0014). Scoped M12 (E-0015: Eval Harness). T-0081 (M12 design spec) added as rank 1.
- 2026-03-05: T-0081 accepted and moved to `done/`. Ready queue intentionally empty pending PM creation of T-0082–T-0084 (M12 implementation tickets from T-0081 spec).
- 2026-03-05: PM run created T-0082, T-0083, T-0084 and replenished ready queue. T-0082 first (standalone harness), then T-0083 (integration), then T-0084 (tests + STATUS cleanup).
- 2026-03-06: Self-evolving run created and completed T-0085 (rerun assistant answer with model variants); removed from ready queue after acceptance.
- 2026-03-06: PM run added T-0086 (P1 apply-pipeline timeout bug) at rank 1. T-0001 (unstructured duplicate of model picker) removed; T-1001 (model picker UI polish) canonicalized and added at rank 5. Feedback F-20260306-002 and F-20260306-003 logged.
- 2026-03-06: T-0086 accepted and moved to done (apply-pipeline 180s timeout + patch_timeout error reporting). Rank 1 is now T-0082.
- 2026-03-06: Self-evolving run created and completed T-0087 (rename active conversation from chat header); ready queue order unchanged.
- 2026-03-06: T-0083 accepted and moved to done (apply pipeline advisory eval hook). Rank 1 is now T-0084.
- 2026-03-06: T-0084 accepted and moved to done (eval harness test_evals.py + STATUS.md cleanup). Ready queue empty; PM to replenish.
- 2026-03-07: PM run scoped M13 (E-0016: Self-Evolve Reliability Hardening). T-0088 (design spec) created as rank 1.
- 2026-03-07: T-1001 removed (leftover from aborted self-evolution run). F-20260306-002 closed.
- 2026-03-07: T-0088 accepted and moved to done (M13 design spec). Ready queue empty; PM to create implementation tickets T-0089–T-0093 from spec §9.
- 2026-03-07: PM run created T-0089–T-0093 (M13 implementation tickets) and replenished ready queue. Order: T-0089 (prompt), T-0090 (evals), T-0091 (retry), T-0092 (refinement conversation), T-0093 (progress reporting). T-0089 and T-0090 are independent; T-0091 depends on both; T-0092 depends on T-0089; T-0093 is independent.
- 2026-03-07: T-0089 accepted and moved to done (structured prompt template + dynamic allowlist + context assembly). Rank 1 is now T-0090.
- 2026-03-07: T-0090 accepted and moved to done (eval harness blocking policy + files_in_allowlist + npm_validate_passes). Rank 1 is now T-0091.
- 2026-03-07: T-0091 accepted and moved to done (retry with failure context: one auto-retry, retrying status, PREVIOUS ATTEMPT context). Rank 1 is now T-0092.
- 2026-03-07: T-0092 accepted and moved to done (conversational feedback-refinement: /agent/refine-context endpoint, useRefinement hook, RefinementConversation component, refined_spec on CodePatchRequest, 12 new tests). Rank 1 is now T-0093.
- 2026-03-07: T-0093 accepted and moved to done (elapsed-time reporting: started_at on PatchArtifact, elapsed_seconds on poll response, useElapsedCounter hook in PatchNotification, started_at reset on retrying transition). M13 (E-0016) implementation batch complete; ready queue empty.
- 2026-03-08: PM run triaged Fix with AI feedback (F-20260308-002 to 004). Created T-0095 (git commit when agent succeeds), T-0096 (patches missing from Activity), T-0097 (progress in refinement + Activity in-progress cards). T-0096 and T-0095 moved to ready; T-0097 remains in backlog (depends on T-0096).
- 2026-03-08: T-0096 accepted and moved to done (refresh state when Activity sheet opens so Fix with AI patches appear). Rank 1 is now T-0095.
- 2026-03-08: T-0095 accepted and moved to done (apply-pipeline 300s defaults + APPLY_*_TIMEOUT_SEC env; validation_timeout handling). Ready queue empty; PM to replenish.
- 2026-03-08: PM run replenished ready queue. T-0097 (progress in refinement + Activity in-progress cards) moved from backlog to ready as rank 1; dependency T-0096 done.
- 2026-03-08: PM run: T-0097 already accepted (in done). Removed duplicate T-0097 from in-progress. Ready queue empty; backlog empty. E-0016 (M13) marked done. Next: scope next milestone or replenish from backlog when new work is identified.
- 2026-03-08: PM run replenished ready from backlog. T-0101 (Activity card terminal status), T-0099 (progress after Run Agent), T-0100 (correct conversation after Run Agent) moved to ready; order 1–3. Backlog now empty.
- 2026-03-08: T-0101 moved to `review` after implementation; queue re-ranked with T-0099 now rank 1 and T-0100 rank 2.
- 2026-03-08: T-0101 accepted and moved to `done/` after QA PASS. Ready queue remains T-0099 (rank 1), T-0100 (rank 2).
- 2026-03-08: T-0099 moved to `in-progress` for implementation. Ready queue now has T-0100 as rank 1.
- 2026-03-08: T-0099 moved to `review` after implementation. Ready queue remains T-0100 as rank 1.
- 2026-03-08: T-0099 accepted and moved to `done/` after QA PASS. Ready queue remains T-0100 as rank 1.
- 2026-03-08: T-0100 moved to `review` after implementation. Ready queue is now empty.
- 2026-03-08: T-0100 accepted and moved to `done/` after QA PASS. Ready queue remains empty.
- 2026-03-08: PM run — T-0103 in progress (discussion routing fix). Ready folder contains only T-0102; ORDER table shows T-0102 as rank 1. Removed T-0104 stub from ready/.
- 2026-03-08: T-0103 implementation completed (activateConversation during isSending + regression test). Moved to review.
