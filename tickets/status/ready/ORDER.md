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
| 1 | T-0055-system-prompt-persona-tuning-improvement-class.md | P1 | T-0053 done; unblocked. |
| 2 | T-0056-e0009-m7-tier2-validation-epic-closure.md | P1 | Validation; pick up only after T-0053–T-0055 are all done. |

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next.
- If the table is empty, pause new implementation pickup and wait for PM queue updates.

## Next Up (Backlog)
| Rank | Ticket | Priority | Epic | Notes |
| --- | --- | --- | --- | --- |
| — | _(empty)_ | | | M8 scope to be defined after E-0009 tier-2 gate passes (T-0056). |
