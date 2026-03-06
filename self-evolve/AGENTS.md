# Self-Evolving Agent Guide

This guide defines the Self-evolving agent workflow — an end-to-end orchestration that turns raw user feedback into a shipped, validated change in a single invocation.

## Mission
- Accept user feedback as input and drive it through the full lifecycle: feedback → ticket → implementation → QA → acceptance.
- Reuse existing PM, Implementation, and QA role workflows without shortcuts; the self-evolving agent sequences them, it does not replace them.
- Produce the same artifacts (feedback items, tickets, QA checkpoints, PM checkpoints) as the manual Development Workflow.

## When To Run
- When the product's "Fix with AI" flow is triggered by a user.
- When the user explicitly asks the agent to take a piece of feedback and ship it end-to-end.
- Not for batch PM runs, standalone QA sweeps, or multi-ticket epics — those use the existing single-agent or development workflow modes.

## Input
A single piece of user feedback: bug report, feature request, friction observation, or improvement suggestion. The feedback can be raw text; the agent normalizes it.

## Self-Evolving Agent Workflow

### Phase 1 — PM: Feedback Intake and Ticket Creation (scoped)

Follow `tickets/AGENTS.md` for artifact formats and conventions, scoped to a single feedback-to-ticket pass.

1. **Log the feedback**:
   - Create a feedback item in `tickets/meta/feedback/inbox/` using `tickets/meta/templates/TEMPLATE.feedback-item.md`.
   - Assign a feedback ID (`F-YYYYMMDD-NNN`).
   - Add/update the row in `tickets/meta/feedback/INDEX.md`.
2. **Create exactly one ticket**:
   - Use `tickets/meta/templates/TEMPLATE.ticket.md`.
   - Scope tightly: one clear problem, one deliverable change.
   - If the feedback implies multiple changes, pick the single highest-impact change and note deferred items in the ticket's Notes section.
   - Link the feedback ID in the ticket's `Feedback References` section.
   - Include a `Design Spec` section if behavior is ambiguous (per PM workflow rules).
3. **Quality gate (DoR)**:
   - Acceptance criteria are observable and testable.
   - Scope is small enough to implement and validate in one pass.
   - If `Area: ui`, include the UI Spec Addendum.
4. **Move to ready**:
   - Place the ticket in `tickets/status/ready/`.
   - Add it to the top of `tickets/status/ready/ORDER.md`.

Skip full PM checkpoint extras (epic management, process improvement proposals, batch review, validation ladder assessment) — those belong to dedicated PM runs.

**Gate**: The ticket file must exist on disk in `tickets/status/ready/` and be listed in `ORDER.md` before proceeding to Phase 2. Do not start implementation until the ticket is written.

### Phase 2 — Implementation

Follow the root `AGENTS.md` Required Work Pattern.

1. Pick up the ticket just created (it is in `tickets/status/ready/` and at the top of `ORDER.md`).
2. Move the ticket file to `tickets/status/in-progress/`.
3. Implement the change: design/spec → code → tests → docs.
4. Update the ticket checklist and change log as work progresses.
5. Move to `tickets/status/review/` with evidence recorded on the ticket.

### Phase 3 — QA Validation

Follow `tests/AGENTS.md`. Only runs when the change affects software/behavior (not for docs-only changes).

1. Build a scoped test plan for the ticket.
2. Run automated tests and capture results.
3. Run at least one normal-flow and one edge-case manual scenario.
4. UX/UI Design QA if `Area: ui`.
5. Copy regression sweep if user-facing text changed.
6. Record findings; create bug tickets if needed.
7. Write a dated QA summary in `tickets/meta/qa/`.

If QA finds blocking issues: fix them in-place (this is a self-evolving run, not a manual QA-only run), re-validate, and record the fix in the ticket change log. If the fix is non-trivial, create a follow-up ticket instead and note the scope reduction.

### Phase 4 — PM Acceptance

Follow `tickets/AGENTS.md` "PM Acceptance (Post-QA)".

1. Verify acceptance criteria have observable evidence.
2. Verify QA outcome (when required).
3. Check closure hygiene (follow-ups ticketed, docs updated).
4. Accept: update ticket metadata, move from `review/` to `done/`.
5. Record a dated PM checkpoint in `tickets/meta/feedback/`.

## Output Requirements Per Self-Evolving Run
- One feedback item in `tickets/meta/feedback/inbox/`.
- `tickets/meta/feedback/INDEX.md` updated.
- One ticket created and moved through the full lifecycle to `done/` (or to `blocked/` with rationale if the run cannot complete).
- QA checkpoint in `tickets/meta/qa/` (when software/behavior changed).
- PM acceptance checkpoint in `tickets/meta/feedback/`.
- One suggested commit message summarizing the full change set.
- One explicit next-step suggestion (follow-up work, deferred items from the original feedback, or "no follow-up needed").

## Failure Modes and Escalation

- **Ambiguous feedback**: If the feedback is too vague to create a well-scoped ticket, stop after Phase 1 and ask the user for clarification. Do not invent critical behavior.
- **Implementation blocked**: If implementation hits an unresolvable blocker, move the ticket to `blocked/`, record the blocker, and end the run with the blocker as the next-step suggestion.
- **QA failure (non-trivial)**: If QA finds a defect that cannot be fixed within the current scope, create a bug ticket, note the scope reduction on the original ticket, and proceed to PM acceptance for the reduced scope (or move to `blocked/` if the core acceptance criteria are unmet).

## Guardrails
- One feedback, one ticket, one change. Do not scope-creep into multi-ticket batches.
- Do not skip QA for software/behavior changes, even if the change looks trivial.
- Do not silently invent behavior when the feedback is ambiguous — escalate.
- Produce the same traceability artifacts as the manual workflow: feedback ID → ticket → QA evidence → PM acceptance.
- Respect the same safety constraints as the normal workflow: feature flags, rollback-readiness, security, cost boundaries.

## Relationship to Other Modes
- The Self-evolving agent is an additional Operating Mode alongside Single-Agent and Development Workflow.
- It reuses the same role guides (`tickets/AGENTS.md`, `tests/AGENTS.md`, root `AGENTS.md`) — it just orchestrates them in a deterministic single-pass sequence.
- Dedicated PM runs (batch feedback triage, epic management, process improvements) remain separate and are not replaced by this mode.
- Dedicated QA runs (regression sweeps, epic-boundary validation) remain separate.
