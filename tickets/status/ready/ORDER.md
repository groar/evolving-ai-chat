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

## Next Up (Backlog — Moves to Ready After M3 Ships)
After E-0004 (M3) is complete, the following tickets move to `ready/` in this order:

| Rank | Ticket | Priority | Epic | Notes |
| --- | --- | --- | --- | --- |
| 5 | T-0031 Adopt Tailwind + shadcn/ui design system | P1 | E-0005 | Foundation for all UI work; no deps. |
| 6 | T-0032 Extract state management (Zustand + hooks) | P1 | E-0005 | Parallel with T-0031; no deps. |
| 7 | T-0033 Chat-first layout — hide meta-surfaces | P1 | E-0005 | Depends on T-0031, T-0032. Highest UX impact. |
| 8 | T-0034 Settings as modal/drawer, fold Advanced | P2 | E-0005 | Depends on T-0031, T-0033. Ship alongside T-0033. |
| 9 | T-0035 User-facing copy and empty state rewrite | P2 | E-0005 | Depends on T-0033. Quick copy pass. |
| 10 | T-0036 Markdown rendering in assistant responses | P1 | E-0006 | Depends on T-0031 (Tailwind typography). |
| 11 | T-0037 Code block syntax highlighting + copy | P1 | E-0006 | Depends on T-0036. |
| 12 | T-0038 Conversation renaming | P2 | E-0006 | Independent; can ship any time after M3. |
| 13 | T-0039 Model selector (multi-provider) | P2 | E-0006 | Depends on T-0027, T-0030. |
| 14 | T-0040 Token/cost display per message | P3 | E-0006 | Depends on T-0027. Lowest priority. |
