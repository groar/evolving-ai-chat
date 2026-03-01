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
| 1 | T-0036 Markdown rendering in assistant responses | P1 | E-0006; unblocked by T-0031. |
| 2 | T-0038 Conversation renaming | P2 | E-0006; independent. |

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next.
- If the table is empty, pause new implementation pickup and wait for PM queue updates.

## Next Up (Backlog — Will Move to Ready as Queue Drains)
| Rank | Ticket | Priority | Epic | Notes |
| --- | --- | --- | --- | --- |
| 3 | T-0037 Code block syntax highlighting + copy | P1 | E-0006 | Depends on T-0036. |
| 4 | T-0039 Model selector (multi-provider) | P2 | E-0006 | Depends on T-0027, T-0030. |
| 5 | T-0040 Token/cost display per message | P3 | E-0006 | Depends on T-0027. Lowest priority. |
