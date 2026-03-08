# E-0017: M14 — Architecture Docs Baseline

## Metadata
- ID: E-0017
- Milestone: M14
- Status: active
- Priority: P2
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08

## Goal
Close the remaining architecture-documentation gap by producing a concise, durable reference set for the desktop UI/runtime boundary, data/storage model, and release-channel behavior. This gives future implementation and PM/QA runs a stable source of truth and reduces design ambiguity in self-evolve tickets.

## Problem Statement
`STATUS.md` still lists "Product/technical architecture docs (UI platform, agent runtime, storage, release channels)" as an open gap. Recent milestones shipped many behavior changes, but architecture intent is scattered across ticket history and milestone specs.

## Definition of Done
- [ ] T-0102 is completed with doc-review evidence and accepted.
- [ ] Architecture docs explicitly cover UI/runtime API contract, storage boundaries, and release-channel semantics.
- [ ] `STATUS.md` references M14 completion and removes the architecture-docs known gap.

## Implementation Tickets
| Rank | Ticket | Description | Priority | Status |
| --- | --- | --- | --- | --- |
| 1 | T-0102 | Document M14 architecture baseline (UI/runtime boundary, storage, release channels) | P1 | ready |

## Validation Plan
- Tier: 1 deterministic (doc review).
- Audience: internal.
- Checks:
  - Verify each required architecture area is documented with concrete invariants.
  - Verify references are discoverable from `STATUS.md` and/or `README.md`.
- Decision this informs: whether M15 should focus on net-new capability work vs. additional architecture cleanup.
- Evidence: ticket `Evidence` section + PM checkpoint acceptance note.

## Non-goals
- Shipping user-facing behavior changes.
- Refactoring runtime/frontend code.
- Adding new provider integrations in M14.

## Linked Feedback
- None direct; scope comes from `STATUS.md` known-gap tracking.

## Change Log
- 2026-03-08: Epic created during PM workflow run after M13 completion and empty board state.

