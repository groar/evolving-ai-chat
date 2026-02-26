# Local Ticketing System

This project uses a filesystem-based ticket board under `tickets/`.

## Goals
- Keep planning and implementation visible in git.
- Let AI agents create, update, and move work items without external tools.
- Keep ticket history simple and auditable.
- Support periodic Product Manager checkpoints for feedback-to-roadmap alignment.
- Support periodic QA checkpoints that convert verified bugs into tracked tickets.

## Folder Structure
- `tickets/status/` - status board folders (where ticket files live).
- `tickets/status/backlog/` - approved work not started.
- `tickets/status/ready/` - scoped and next-up work; includes `ORDER.md` for canonical pickup order.
- `tickets/status/in-progress/` - currently being implemented.
- `tickets/status/blocked/` - cannot proceed due to dependencies/questions.
- `tickets/status/review/` - implemented, waiting for validation/review.
- `tickets/status/done/` - accepted and complete.
- `tickets/status/cancelled/` - intentionally dropped tickets.
- `tickets/meta/` - supporting metadata (no active ticket status here).
- `tickets/meta/epics/` - optional epic files that group related tickets.
- `tickets/meta/feedback/` - feedback intake queue/catalog plus dated PM checkpoint summaries.
- `tickets/meta/qa/` - dated QA run reports and bug discovery summaries.
- `tickets/meta/templates/` - canonical templates for new tickets.

## Product Manager Runs
- PM workflow instructions live in `tickets/AGENTS.md`.
- Run PM workflow after shipping a few tickets or after an epic milestone.
- PM runs should:
  - capture incoming feedback in `tickets/meta/feedback/inbox/`,
  - maintain `tickets/meta/feedback/INDEX.md` statuses/linkage,
  - update tickets/epics,
  - emit a dated summary in `tickets/meta/feedback/`.

## QA Runs
- QA workflow instructions live in `tests/AGENTS.md`.
- Run QA after impactful tickets, at epic boundaries, or manually.
- QA runs should create/update bug tickets and emit a dated summary in `tickets/meta/qa/`.

## Ticket Naming
- Format: `T-XXXX-short-kebab-title.md`
- Example: `T-0007-improve-settings-validation.md`
- Ticket IDs are unique and never reused.

## Priority
Use `Priority` to express scheduling urgency. The canonical pickup order is still `tickets/status/ready/ORDER.md`.

- `P0` emergency: immediate work, interrupts current plan.
- `P1` high: next up after any `P0`, typically this week.
- `P2` normal: planned work, default priority.
- `P3` low: nice-to-have, opportunistic, or cleanup.

## Severity
Use `Severity` to express user impact (not scheduling). Severity is required for bug tickets.

- `S1` blocker: prevents core usage, data loss, security issue, or sustained outage.
- `S2` major: breaks a key flow or causes frequent severe degradation.
- `S3` minor: partial breakage or confusing behavior with workarounds.
- `S4` trivial: cosmetic or very low-impact issues.

## Ticket Lifecycle
Ticket lifecycle is defined by status folder moves.

Default agent sequencing (Single-Agent Mode vs Development Workflow Mode, and Dev -> QA -> PM handoffs) is defined in `AGENTS.md`.

1. Create in `tickets/status/backlog/` from template.
2. Move to `tickets/status/ready/` when it meets Definition of Ready (DoR).
3. Move to `tickets/status/in-progress/` when implementation starts.
4. Move to `tickets/status/review/` when implementation is complete and evidence is recorded.
5. Move to `tickets/status/done/` only after validation and acceptance are recorded.
- If blocked, move to `tickets/status/blocked/` and record blocker.
- If no longer relevant, move to `tickets/status/cancelled/` with rationale.

## Ready Queue Ordering
- Canonical source for "what to build next" is `tickets/status/ready/ORDER.md`.
- PM owns this file and keeps ticket order top-to-bottom.
- Implementation agents should pick the first listed ticket unless the user explicitly reprioritizes.
- Ticket `Priority` fields remain required metadata, but `ORDER.md` is the final tie-break and execution order.

## Required Ticket Content
Each ticket must include:
- Summary and context.
- Acceptance criteria (testable statements).
- Subtasks with markdown checkboxes.
- Links to relevant product/technical docs in the host project.
- A change log section with dated updates.
- A `Design Spec` section when behavior is ambiguous or introduces new state/rule transitions.
- QA evidence links before moving tickets from `review/` to `done/`.

For bug tickets, use `tickets/meta/templates/TEMPLATE.bug-ticket.md`.

## UI/UX Changes
If a ticket changes UI or user-facing behavior, mark it with `Area: ui` in its metadata and include UX-specific acceptance criteria and QA checks.

## Agent Operating Rules
- Update ticket content as work progresses; do not leave stale status notes.
- Move the file between status folders instead of duplicating it.
- Keep one source of truth per ticket (single markdown file).
- Before closing a ticket, confirm acceptance criteria and tests.
- Keep methodology minimal: no separate project layer, only optional epic grouping.
