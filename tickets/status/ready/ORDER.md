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
| 1 | T-0027 OpenAI adapter + real chat endpoint | P1 | Blocks T-0028 and T-0029; must ship first. |
| 2 | T-0030 API key configuration in Settings | P2 | Independent of T-0028/T-0029; ship next for usability. |
| 3 | T-0029 Conversation context — multi-turn history | P2 | Depends on T-0027; independent of T-0028. |
| 4 | T-0028 Streaming chat response | P2 | Depends on T-0027; independent of T-0029. |

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next.
- If the table is empty, pause new implementation pickup and wait for PM queue updates.
