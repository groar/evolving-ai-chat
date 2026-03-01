# Agent Scaffold Guide

This repository is a project-agnostic scaffold for agentic coding workflows.

## Scope
- Keep this repo focused on process assets (ticketing, PM workflow, QA workflow).
- Do not add product-specific implementation code unless explicitly requested.

## Source of Truth
- Core process docs:
  - `STATUS.md`
  - `tickets/README.md`
  - `tickets/status/README.md`
  - `tickets/meta/README.md`
- Role guides:
  - `tickets/AGENTS.md` (PM workflow)
  - `tests/AGENTS.md` (QA workflow)

When guidance conflicts, prefer the most specific guide for the current role/task.

## Role Routing
- PM workflow tasks (feedback triage, ticket grooming, epic management, process improvements): follow `tickets/AGENTS.md`.
- QA workflow tasks (regression checks, validation, bug discovery, bug ticket drafting): follow `tests/AGENTS.md`.
- Implementation tasks: follow this root guide plus ticket system docs.

## Operating Modes
This scaffold supports two explicit modes. If the user does not specify a mode, default to Development Workflow.

### Single-Agent Mode
In this mode the user invokes exactly one role agent (PM or QA) and it determines the next appropriate actions within its scope.

- PM agent: triage feedback, maintain ticket quality, maintain `tickets/status/ready/ORDER.md`, and keep epics aligned.
- QA agent: validate tickets in `tickets/status/review/` (or user-specified scope), create bug tickets, and write QA checkpoint summaries.

### Development Workflow Mode (Default)
In this mode work progresses through a deterministic agent sequence with clear handoffs:

1. PM prepares work (DoR) and orders the queue (`ready/ORDER.md`).
2. Implementation agent builds the next ready ticket, moves it to `review/` with evidence, then immediately runs QA on that ticket **only when changes affect software/behavior** (unless explicitly waived) by switching to the QA workflow in `tests/AGENTS.md`.
3. QA agent validates the ticket in `review/` (either as a dedicated QA run, or as the automatic QA phase that follows implementation) **only when changes affect software/behavior**.
4. PM agent accepts and moves the ticket to `done/`, or re-triages if QA found issues.

If the user explicitly waives a step (for example “skip QA for this ticket”), record the waiver and rationale in the ticket.
When the user asks to "run the implementation agent" in this mode, the implementation run should **chain** into QA and then PM acceptance automatically (unless explicitly waived).

## Required Work Pattern
1. Pick a ticket from `tickets/status/ready/` unless the user reprioritizes.
2. Move the ticket to `tickets/status/in-progress/` before implementation.
3. Implement in small slices; keep code mostly self-explanatory and document only non-obvious behavior/decisions: design/spec -> implementation -> tests -> docs.
4. Update ticket checklist and change log as work progresses.
5. Move to `tickets/status/review/` when implementation/tests/docs are complete.
6. Automatic QA phase (default): after moving to `review/`, switch roles to QA and validate the ticket using `tests/AGENTS.md` **only when changes affect software/behavior**. Do not continue implementation during this phase; record findings and create bug tickets as needed.
7. For docs-only `.md` changes (no software/behavior impact), do not run QA; record a doc review instead.
8. Automatic PM acceptance phase (default): after QA passes (or after a doc review for docs-only tickets), switch roles to PM, accept the ticket, and move it to `tickets/status/done/`.

If blocked, move the ticket to `tickets/status/blocked/` and capture the blocker and next action.

## Ticket Conventions
- One ticket = one markdown file.
- Filename format: `T-XXXX-short-kebab-title.md`.
- Use `tickets/meta/templates/TEMPLATE.ticket.md` for new tickets.
- Keep metadata current (`Status`, `Updated`, owner, priority).

## Spec Ambiguity
- Do not silently invent critical behavior when specifications are unclear.
- Ask for guidance first.
- If progress would stall, propose 1-3 options with tradeoffs and a recommended default.
- After alignment, update docs/tickets before implementation.

## Testing and Documentation
- Add or update validation for each behavior change.
- Do not mark work complete without corresponding verification evidence.
- Update docs in the same change set when behavior or process changes.

## Validation Documentation (Don’t Bury It In Checkpoints)
When a PM run proposes tier-2 micro-validation or tier-3 external user testing:
- Record the plan in the owning epic (add/update a `Validation Plan` section).
- Ensure at least one linked ticket has acceptance criteria that require capturing the validation results and where they’ll be recorded (ticket `Evidence` section and/or a dated checkpoint).

## Workflow Outputs
- PM checkpoint outputs belong in `tickets/meta/feedback/`.
- QA checkpoint outputs belong in `tickets/meta/qa/`.
- Implementation runs should end with one suggested commit message summarizing the change set.
- PM runs should end with one suggested commit message summarizing PM artifacts/board updates.
- QA runs should end with one suggested commit message summarizing QA artifacts/findings updates.
- After any agent run (PM/Implementation/QA), end with one explicit next-step suggestion (exactly one recommended action, with optional alternates if the user is blocked).

## Non-Goals
- External ticketing tools as source of truth.
- Process changes without updating scaffold docs/templates.
