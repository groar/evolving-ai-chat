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
| 1 | T-0058 | P1 | M8 design spec — agentic code modification loop. Complete before any M8 implementation starts. |

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next.
- If the table is empty, pause new implementation pickup and wait for PM queue updates.

## Next Up (Backlog)
| Rank | Ticket | Priority | Epic | Notes |
| --- | --- | --- | --- | --- |
| — | _(pending T-0058)_ | | E-0010 | M8 implementation tickets (agent integration, diff UI, apply/rollback) to be created from T-0058 design spec. |
