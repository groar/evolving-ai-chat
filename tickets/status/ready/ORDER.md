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
| 1 | T-0019 | P1 | Establish conversations-first IA and progressive disclosure for advanced surfaces. |
| 2 | T-0020 | P1 | Consolidate runtime-offline UX into a single actionable state. |
| 3 | T-0021 | P2 | Improve empty state and remove implementation-leaking copy. |

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next.
- If the table is empty, pause new implementation pickup and wait for PM queue updates.
