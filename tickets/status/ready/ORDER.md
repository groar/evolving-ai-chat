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
| 1 | T-0049-feedback-panel-focused-navigation | P1 | M6.1: feedback button must navigate directly to feedback section. Biggest comprehension blocker. |
| 2 | T-0050-simplify-proposal-form-ux | P1 | M6.1: proposal form purpose description + collapse advanced fields. Ship with T-0049 for re-probe. |
| 3 | T-0048-fix-duplicate-feedback-heading | P2 | M6.1: remove duplicate "Feedback" heading. Small fix; ship in same batch as T-0049 + T-0050. |

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next.
- If the table is empty, pause new implementation pickup and wait for PM queue updates.
- Note: T-0049, T-0050, and T-0048 are designed to ship together as the M6.1 batch so the tier-2 comprehension re-probe (E-0008 gate) runs on the complete set of fixes.

## Next Up (Backlog)
| Rank | Ticket | Priority | Epic | Notes |
| --- | --- | --- | --- | --- |
| — | _(empty)_ | | | M7 scope to be defined after E-0008 tier-2 comprehension gate passes. |
