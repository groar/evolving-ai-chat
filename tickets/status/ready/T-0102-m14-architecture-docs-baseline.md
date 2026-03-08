# T-0102: M14 architecture docs baseline

## Metadata
- ID: T-0102
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0017
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08

## Summary
Create a concise architecture-documentation baseline for the desktop app and self-evolve runtime so future tickets can reference one stable source of truth instead of reconstructing design intent from milestone history.

## Context
- `STATUS.md` still tracks architecture docs as an open known gap.
- Recent milestones (M8-M13) introduced substantial runtime and UI-loop behavior, but architecture intent is split across ticket and milestone docs.
- This ticket is docs-only and should be completed with a doc review (no software-behavior QA run required).

## Scope
- Add architecture docs that define:
  - System overview and component boundaries.
  - Frontend (`apps/desktop/src`) <-> runtime (`apps/desktop/runtime`) API contract.
  - Storage boundaries (SQLite, local files/artifacts) and lifecycle.
  - Release channels and how they affect user-visible behavior.
- Update references so these docs are discoverable from planning artifacts.

## References
- `STATUS.md`
- `docs/m8-code-loop.md`
- `docs/m10-agentic-loop-polish.md`
- `docs/m13-self-evolve-reliability.md`
- `tickets/meta/epics/E-0017-m14-architecture-docs-baseline.md`

## Acceptance Criteria
- [ ] A new architecture overview doc exists under `docs/` with clear system boundaries and responsibilities.
- [ ] A frontend/runtime contract doc exists under `docs/` covering key endpoints, request/response lifecycle, and polling/status flow for patch runs.
- [ ] A storage/release-boundary doc exists under `docs/` covering persisted artifacts, patch history, and stable/experimental behavior controls.
- [ ] `STATUS.md` is updated to reference the new docs and remove the architecture-docs item from known gaps.
- [ ] Doc review evidence is recorded in this ticket and linked PM checkpoint notes.

## Dependencies / Sequencing
- Depends on: None.
- Blocks: M14 closure and any follow-on architecture-dependent milestone scoping.

## Evidence (Verification)
- Doc review (for docs-only changes):
  - (to be filled during implementation)

## Subtasks
- [ ] Draft architecture overview doc
- [ ] Draft UI/runtime contract doc
- [ ] Draft storage/release boundary doc
- [ ] Update references in `STATUS.md`
- [ ] Record doc-review evidence

## Change Log
- 2026-03-08: Ticket created during PM workflow run and moved directly to `ready/` as M14 rank-1 pickup.

