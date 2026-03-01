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
| — | _(empty)_ | | T-0051 in-progress: awaiting project sponsor to run tier-2 probe. |

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next.
- If the table is empty, pause new implementation pickup and wait for PM queue updates.
- T-0051 is a validation ticket (no software changes). Run the tier-2 probe with the project sponsor, record evidence, and close E-0008.

## Next Up (Backlog)
| Rank | Ticket | Priority | Epic | Notes |
| --- | --- | --- | --- | --- |
| — | _(empty)_ | | | M7 scope to be defined after E-0008 tier-2 comprehension gate passes (T-0051). |
