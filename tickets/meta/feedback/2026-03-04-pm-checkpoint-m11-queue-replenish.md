# PM Checkpoint — 2026-03-04: M11 Queue Replenishment

## Context
PM run triggered after T-0077 acceptance. The ready queue was empty; this run creates the M11 implementation tickets and replenishes the queue.

## Feedback Intake
No new feedback items. All items in `tickets/meta/feedback/inbox/` are previously triaged and in status `ticketed` or `closed`. No new triage decisions required.

- User testing ask: **Skipped** — no user-facing behavior changes in this milestone; M11 is infrastructure/test health only. Tier-1 deterministic validation (pytest exits 0) is the appropriate gate.

## Recent Delivery Review
- `tickets/status/review/`: empty — no tickets pending PM acceptance.
- `tickets/status/done/` (most recent batch): T-0077 already accepted in prior checkpoint.

## Decisions

### T-0078 — Fix test_chat.py: chat mock at request time
- **Decision**: create and add to ready queue (rank 2).
- **Rationale**: Medium-effort fix identified by T-0077 triage; root cause confirmed (mock not applied at request time). FastAPI `dependency_overrides` is the recommended approach.

### T-0079 — Fix test_proposals.py: sqlite3.Row.get()
- **Decision**: create and add to ready queue (rank 1, first pickup).
- **Rationale**: Smallest-effort fix (S); exact line identified in `storage.py`; no design ambiguity. Best starting point to get a quick CI win.

### T-0080 — Fix test_apply_rollback.py: git/sandbox isolation
- **Decision**: create and add to ready queue (rank 3, last pickup).
- **Rationale**: Medium effort with multiple viable approaches (`--template=`, mock strategy, integration marker). Ranked last so implementation can evaluate the simplest option first without blocking T-0078/T-0079.

## Queue Ordering Rationale
Ranked T-0079 → T-0078 → T-0080 (ascending effort/complexity):
1. T-0079 (S) delivers a fast CI win and builds momentum.
2. T-0078 (M) is the highest-visibility failure (502 on chat endpoint) and benefits from T-0079 already clearing noise.
3. T-0080 (M) has the most design surface to explore; doing it last means other tests are already passing, making it easier to verify no regressions.

## Ticket/Epic Updates
- **T-0078** created in `tickets/status/ready/`.
- **T-0079** created in `tickets/status/ready/`.
- **T-0080** created in `tickets/status/ready/`.
- **E-0014** status updated: `scoping` → `in-progress`; implementation ticket rows updated from `(to be created)` to `ready`.
- **ORDER.md** updated: table replenished with T-0079 (rank 1), T-0078 (rank 2), T-0080 (rank 3).

## Feedback IDs Touched
None (no new feedback items this run).

## PM Process Improvement Proposal
**Proposal**: Add a "next M11 ticket on deck" note to the E-0014 epic's Definition of Done whenever a ticket moves to `done/`, so PM handoffs require less re-reading of the ticket notes. Concretely: when T-0079 is accepted, the implementation/QA agent should update E-0014's DoD checklist row for T-0079 and annotate which ticket is next. This reduces the PM's re-triage work at each checkpoint.

This is a lightweight process improvement (no new workflow; just a convention for updating epic DoD inline during handoffs). No doc update required unless adopted by the team.
