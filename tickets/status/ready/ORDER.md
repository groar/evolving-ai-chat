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
| 1 | T-0064 | P2 | Central always-visible improvement button (depends on T-0063; E-0010 polish). |

## Agent Pickup Rule
- Unless the user explicitly reprioritizes, implementers should select rank 1 next (T-0064).
- If the table is empty, pause new implementation pickup and wait for PM queue updates.

## Notes
- T-0058 (M8 design spec) completed 2026-03-01; canonical spec in `docs/m8-code-loop.md`.
- T-0059 (M8 agent harness integration) completed 2026-03-01.
- T-0060 (M8 git-backed apply/rollback) completed 2026-03-02.
- T-0061 (M8 non-review UI) accepted 2026-03-02.
- T-0062 (notification dismiss + failure reason copy) completed 2026-03-03.
- T-0063 (settings legacy cleanup) completed 2026-03-03.
- T-0064: E-0010 polish from F-20260303-001 (central improvement button); added 2026-03-03.
