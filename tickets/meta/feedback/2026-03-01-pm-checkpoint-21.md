# PM Checkpoint — 2026-03-01 Run 21

## Summary
PM run to replenish the ready queue after T-0037 acceptance (run 20). No tickets in review. Promoted T-0039 (model selector) and T-0040 (token/cost display) from backlog to ready per E-0006 M5 sequencing. Both tickets meet DoR (design spec, observable criteria, dependencies satisfied).

**Board snapshot:** review/: 0; ready/: 2 (T-0039, T-0040); backlog/: 0; done/: 39.

## Feedback Themes
No new feedback items. Inbox and INDEX unchanged.

## Interview Topics and Key Answers
None.

## User Testing Ask / Plan
Skipped. E-0006 tier-3 validation planned after all M5 tickets ship (see E-0006 Validation Plan section). No product-meaningful batch shipped this run.

## Decisions and Rationale

| Decision | Rationale |
| --- | --- |
| Promote T-0039 and T-0040 to ready | Queue empty; both meet DoR. T-0039 has Design Spec, observable AC, T-0027/T-0030 done. T-0040 has UI Spec Addendum, observable AC, T-0027 done. E-0006 sequencing: model selector before token/cost (T-0040 can work with OpenAI alone; Anthropic extends T-0039). |
| Reorder: T-0039 rank 1, T-0040 rank 2 | T-0039 higher priority (P2, model selection is table-stakes); T-0040 P3, depends on real model calls; both unblock tier-3 validation. |

## Feedback IDs Touched
None.

## Ticket/Epic Updates

| File | Change |
| --- | --- |
| T-0039 | Moved from `backlog/` → `ready/`. Status: ready. Change Log: promoted (PM run 21). |
| T-0040 | Moved from `backlog/` → `ready/`. Status: ready. Change Log: promoted (PM run 21). |
| ORDER.md | T-0039 rank 1, T-0040 rank 2. Backlog section empty. |
| E-0006 | Progress: Ready now T-0039, T-0040; Backlog empty. |

## PM Process Improvement Proposal
**Queue replenishment trigger:** When the ready queue becomes empty and backlog has DoR-eligible tickets, add an explicit step to the PM workflow: "If ready/ is empty and backlog has tickets whose dependencies are satisfied, promote the next-ranked ticket(s) and update ORDER.md." This prevents implementation agent from stalling when the queue drains between PM runs. Record in `tickets/AGENTS.md` under PM Workflow step 7 (Ticket quality pass): "When ready queue is empty, promote from backlog per ORDER.md Next Up section and update both sections."

---

**Suggested commit message:** `PM: Replenish ready queue — promote T-0039, T-0040 from backlog (E-0006 M5)`

**Next step:** Implementation agent picks T-0039 (model selector) from ready, implements, moves to review, chains into QA and PM acceptance.
