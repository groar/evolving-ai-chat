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
| – | – | – | Ready queue empty as of 2026-03-05; replenish from backlog before next implementation pickup. |

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next.
- If the table is empty, pause new implementation pickup and wait for PM queue updates.

## Notes
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
