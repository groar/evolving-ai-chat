# T-0011: M1 first improvement loop spec

## Metadata
- ID: T-0011
- Status: ready
- Priority: P1
- Type: docs
- Area: core
- Epic: E-0002
- Owner: pm-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Write a concrete, implementation-ready spec for the first "observe -> propose -> validate -> release" improvement loop, including artifacts, state transitions, and acceptance evidence.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Define a minimal end-to-end loop that can ship quickly and be repeated.
  - Prevent implementation-time invention by specifying artifacts, fields, and state transitions.
- Non-goals:
  - A general-purpose autonomous roadmap system.
  - Supporting multiple simultaneous proposals or multi-user collaboration.
- Rules and state transitions:
  - Define the loop phases and required artifacts:
    - `feedback_item` (captured in-app or imported) -> `proposal` (bounded change artifact) -> `validation_run` (gates + outcomes) -> `release_decision` (accept/reject) -> `changelog_entry`.
  - Each artifact must include:
    - a stable ID,
    - timestamp,
    - links to the originating ticket/feedback where applicable,
    - a human-readable summary.
  - "Accept" must create a changelog entry; "Reject" must not.
  - Copy constraints:
    - Must not imply the system self-ships without user approval.
- User-facing feedback plan:
  - Identify the single UI surface(s) where the user triggers capture and sees proposal status.
  - Specify empty/error states for each phase.
- Scope bounds:
  - One narrow improvement class to start (explicitly pick one).
  - One proposal at a time is acceptable for v1.
  - Local-only storage.
- Edge cases / failure modes:
  - Validation fails (tests red): proposal cannot be accepted; show actionable error.
  - User rejects proposal: record rationale; no changelog entry.
  - Missing linkage: allow proposal without ticket ID but require a title/summary.
- Validation plan:
  - Deterministic: at least one smoke flow validates artifact creation + state transitions.
  - Evidence: specify what must be recorded in a ticket when implementing loop features (screenshots/logs/tests run).

## Context
- E-0001 delivered the baseline trust surfaces (channels, changelog, rollback). M1 should prove the first actual improvement loop on top of them.

## References
- `STATUS.md`
- `tickets/meta/epics/E-0002-m1-first-self-improvement-cycle.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] A new doc exists at `docs/m1-first-improvement-loop.md` describing:
  - the minimal loop phases and state transitions,
  - required artifacts with required fields,
  - which UI surfaces are involved,
  - the first chosen "improvement class" in-scope and explicit non-goals,
  - validation evidence requirements.
- [ ] The spec includes at least 3 concrete "example artifacts" (JSON-ish blocks are fine) for:
  - a feedback item,
  - a proposal,
  - a validation result summary.
- [ ] The spec includes a short "how to QA this milestone" checklist that maps to the loop phases.
- [ ] The spec includes a tier-2 micro-validation plan (internal/project sponsor) and specifies where results must be recorded (ticket Evidence or dated PM checkpoint).

## Evidence (Verification)
- Doc review (for docs-only changes):

## Subtasks
- [ ] Draft the loop spec doc.
- [ ] Add example artifacts and state transitions.
- [ ] Add QA checklist + evidence expectations.

## Change Log
- 2026-02-26: Ticket created and moved to `ready/`.
