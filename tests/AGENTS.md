# QA Agent Guide

This guide defines the agentic QA workflow for project teams using this scaffold.

## Mission
- Test implementation paths to uncover defects and regressions.
- Document bugs clearly and reproducibly.
- Create high-quality bug tickets.
- Do not fix bugs during QA runs unless explicitly requested.

## When To Run
- At epic boundaries.
- After shipping potentially impactful tickets.
- Manually on user request.
  - Docs-only `.md` changes (no software/behavior impact) do not require a QA run; record a doc review instead.

## Source of Truth
- Product behavior docs in the host project.
- Ticketing process docs:
  - `tickets/README.md`
  - `tickets/status/README.md`
  - `tickets/meta/README.md`
  - `tickets/meta/templates/TEMPLATE.bug-ticket.md`

## QA Scope
- Automated checks:
  - Unit, integration, regression, and smoke tests available in the host project.
- Manual validation:
  - Exercise key user flows and critical edge cases.
  - Confirm output clarity and error behavior where relevant.
- Visual UI smoke check applies if the host project has a UI (even for non-UI tickets), when possible, with screenshots and/or notes recorded.
- Extended UX checks apply only if `Area: ui` on the ticket (keyboard usability, clear empty/error states, responsive sanity check).
- For any ticket that changes user-facing text, include a copy regression sweep (typos, ambiguity, misleading implications, and term consistency).

## QA Workflow
If QA is invoked as the automatic QA phase immediately after implementation moves a ticket to `tickets/status/review/`, treat it as a normal QA run scoped to that ticket. Do not continue implementation during this phase unless the user explicitly requests it.

1. Build a scoped test plan:
   - Identify impacted mechanics, workflows, and edge cases.
2. Execute automated tests:
   - Run relevant suites and capture failures **only when software/behavior changed**.
   - If the change is docs-only `.md` (no software/behavior impact), skip automated tests and do a focused doc consistency pass instead (links, terminology, copy regressions).
3. Execute manual scenarios:
   - Run at least one normal-flow and one edge-case scenario (software/behavior changes only).
4. Copy regression sweep (only if user-facing text changed):
   - Check term/format consistency against product docs.
   - Check "promise control": text does not imply unavailable behaviors/events.
   - Record exact lines reviewed in ticket evidence or QA report.
5. If the host project has a UI, perform a visual UI smoke check:
   - Open the UI and sanity-check the main flow(s) relevant to recent changes.
   - Capture screenshots and/or notes as evidence.
   - Map criterion -> evidence file/note -> pass/fail for user-facing acceptance criteria.
6. Record findings:
   - Capture expected vs actual behavior and deterministic reproduction steps.
7. Create bug tickets:
   - Use `tickets/meta/templates/TEMPLATE.bug-ticket.md`.
   - Place new bug tickets in `tickets/status/backlog/` unless urgent triage requires `ready/`.
8. Write QA run summary:
   - Add one dated report in `tickets/meta/qa/`.

## Output Requirements Per QA Run
- Bug tickets created/updated as needed and linked from QA findings.
- Ticket evidence updated for each validated item in `review/`.
- One dated QA summary file in `tickets/meta/qa/`.
- One suggested commit message included at the end of the QA run summary/hand-off.
- End with one explicit next-step suggestion (exactly one recommended action, with optional alternates if the user is blocked).

## Development Workflow Integration
1. Default trigger: validate tickets currently in `tickets/status/review/` (or the specific ticket the user/PM points to).
2. Implementation hook: in Development Workflow mode, the Implementation agent should switch to this QA workflow immediately after moving its ticket to `review/` **when the ticket changes software/behavior** (unless explicitly waived), so a single implementation run produces both implementation evidence and QA evidence.
   - For docs-only tickets, do not run QA; ensure a doc review is recorded on the ticket before PM acceptance.
3. For each validated ticket, record evidence in the ticket (tests run, manual scenarios, notable risks).
4. If issues are found, create bug ticket(s) and move the original ticket back to `in-progress/` (or `blocked/`) with a short summary and links.
5. If validation passes, leave the ticket in `review/` for PM acceptance.

## Bug Ticket Quality Bar
- One bug per ticket.
- Reproduction steps deterministic where possible (include seed/config/input values).
- Clear severity and impact statement.
- Evidence references (logs, failing tests, screenshots when available).
- Explicit acceptance criteria for fix and verification.

## Guardrails
- Do not patch implementation while in QA mode unless explicitly asked.
- Do not close existing tickets during QA mode; create/update findings only.
- Keep findings tied to observable behavior and evidence.
