# Product Manager Agent Guide

This guide defines periodic Product Manager (PM) workflow runs in `tickets/`.

## Scope
- Feedback intake, organization, and sanitization.
- Ticket quality management (write, update, split, deduplicate, move).
- Epic creation and maintenance.
- Product management process improvements.
- Design and roadmap stewardship for whichever product this scaffold is used with.

## When To Run
- After shipping a batch of tickets (typically 2-5).
- When an epic reaches a major milestone.
- After substantial feedback drops.

## Source of Truth
- Ticket system docs:
  - `tickets/README.md`
  - `tickets/status/README.md`
  - `tickets/status/ready/ORDER.md`
  - `tickets/meta/README.md`
- Product docs in the host project (for example PRD, MVP, roadmap, or architecture docs).

## PM Workflow
1. Capture feedback:
   - Add each incoming item to `tickets/meta/feedback/inbox/` using `tickets/meta/templates/TEMPLATE.feedback-item.md`.
   - Add/update the row in `tickets/meta/feedback/INDEX.md`.
   - Use feedback IDs (`F-YYYYMMDD-NNN`) for traceability.
2. Review recent delivery:
   - Inspect `tickets/status/done/` and `tickets/status/review/`.
3. Sanitize and structure feedback:
   - Consolidate duplicates.
   - Remove personal/sensitive details unless explicitly required.
   - Tag by theme and severity.
4. Convert feedback into decisions:
   - Choose one action per item: update ticket, create ticket, update epic/roadmap, defer, or close.
   - Record rationale for defer/close decisions.
   - Link feedback IDs in both feedback files and ticket files when work is created.
5. Design spec pass (when needed):
   - Rule: do not start implementation when behavior is design-ambiguous or introduces a new system lever/state rule.
   - For any ticket that would otherwise force implementers to "invent" behavior, add a concrete `Design Spec` section before moving it to `ready/` (or before continuing if reopened).
   - Minimum design spec contents:
     - Goals and non-goals.
     - Rules and state transitions.
     - User-facing feedback plan (what the user should observe).
     - Scope bounds (how the change stays constrained).
     - Edge cases and failure modes.
     - Validation plan (deterministic checks and/or targeted user probe).
6. Ticket quality pass:
   - Ensure metadata and `Updated` fields are current.
   - Ensure acceptance criteria are observable and testable.
   - For user-facing changes, include at least one user-observable acceptance criterion (not just internal correctness).
   - If user-facing text changes, include a concrete copy change list and "must not imply" constraints.
   - Split oversized tickets and merge duplicates as needed.
   - Move each ticket to the correct status folder.
   - Update `tickets/status/ready/ORDER.md` with exact pickup order.
7. Epic management:
   - Create/update files in `tickets/meta/epics/`.
   - Keep linked tickets and epic goals aligned.
8. Process improvement:
   - Propose one concrete PM process improvement per checkpoint.
   - Update docs if adopted.

## Validation Ladder (External Validation Is Not Per-Ticket Default)
External user validation is powerful, but it should not be a default requirement for every ticket. Match validation effort to risk/scope:

1. **Deterministic validation (default)**
   - Use tests, deterministic guardrails, and focused internal checks.
   - Typical: bounded copy updates, regression guards, small UX changes, and known mismatch fixes.
   - Requirement: if a ticket originates from a specific mismatch report, add at least one deterministic guardrail acceptance criterion that prevents recurrence.

2. **Targeted micro-validation (single-aspect probe)**
   - Use when the goal is a narrow user-perception question that can be probed quickly.
   - Keep probes small (1-3 prompts), and record results in ticket evidence (or linked feedback item).

3. **Milestone or batch external validation**
   - Use when validating an epic-level outcome (for example adoption, comprehension, or retention gates).
   - Run after meaningful batches (typically 2-5 shipped tickets) or when epic DoD explicitly depends on user-report outcomes.
   - Keep epic-level user-report gates at the epic (or one closure ticket), not duplicated into every linked ticket.

### When External Validation Is Required (Trigger Checklist)
Escalate to tier 2 or 3 when at least one is true:
- The ticket introduces a new mechanism/system lever, new persisted state, or new eligibility/gating rule.
- The ticket targets a retention/adoption gate or a recurring user-confusion risk.
- The ticket is design-ambiguous and would otherwise force implementation-time invention.
- The change is large/high-risk user-facing UX (flow changes, new concepts, major onboarding updates).

## PM Interviews (Allowed)
- PM agents may ask concise, decision-oriented interview questions when feedback is ambiguous or high-impact.
- Keep rounds short (about 3-7 focused questions).
- Capture topic, rationale, and expected decision impact.
- Convert answers into explicit actions or documented deferrals.

## Output Requirements Per PM Run
- Ticket files updated and moved correctly across `tickets/status/`.
- Epic files created/updated where needed.
- Feedback intake files and `tickets/meta/feedback/INDEX.md` updated.
- `tickets/status/ready/ORDER.md` updated when ranking changes.
- When a ticket is design-ambiguous, the ticket includes a `Design Spec` section before implementation starts.
- One suggested commit message included at the end of the PM run summary/hand-off.
- One dated summary file in `tickets/meta/feedback/` containing:
  - Feedback themes
  - Interview topics and key answers (if run)
  - Decisions and rationale
  - Feedback IDs touched and resulting status changes
  - Ticket/epic updates
  - PM process improvement proposal

## Guardrails
- Keep updates small, auditable, and tied to files in this repository.
- Do not invent critical product behavior when intent is ambiguous; escalate with options.
- Preserve traceability from feedback to ticket and epic decisions.

## Development Workflow Hooks
- When a ticket enters `tickets/status/ready/`, PM ensures it meets DoR and is ordered in `tickets/status/ready/ORDER.md`.
- When a ticket is moved to `tickets/status/review/`, PM should ensure a QA validation pass happens before acceptance.
- When QA marks a ticket as passing, PM accepts and moves it to `tickets/status/done/`.
- When QA finds issues, PM triages by selecting one action with explicit rationale recorded:
1. Reprioritize the original ticket.
2. Create follow-up tickets.
3. Adjust scope or acceptance criteria.
