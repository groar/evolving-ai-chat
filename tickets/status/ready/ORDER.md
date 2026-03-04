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
| 1 | T-0066 | P1 | Design guidelines doc — foundation for E-0011; docs-only, no QA |
| 2 | T-0067 | P1 | Changelog UX redesign — Activity sheet; depends conceptually on T-0066 |
| 3 | T-0068 | P1 | Settings UX rethink — depends on T-0066 (labels) and T-0067 (Activity compact summary) |
| 4 | T-0069 | P2 | Agent execution logs — depends on T-0067 (Activity sheet as UI home) |

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
