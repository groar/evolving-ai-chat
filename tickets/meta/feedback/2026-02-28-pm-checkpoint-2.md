# PM Checkpoint - 2026-02-28 (2)

## Feedback Themes (Grouped)
- **Desktop UI hierarchy is inverted (chat vs workbench controls).**
  - Default surface reads like a debug console: many peer-level modules in the left rail compete with the core "conversation + message" job.
- **State messaging undermines trust.**
  - Runtime-offline appears duplicated and ambiguous, making the whole app feel broken.
- **Copy leaks implementation details and duplicates instructions.**
  - Labels like `SQLite` and repeated "press Enter to send" guidance add noise and reduce clarity.

## Interview Topics / Key Answers
- None (no PM interview run in this checkpoint).

## User Testing Ask / Plan
- External user testing: **skipped** (explicit sponsor direction in today’s thread; 2026-02-28).
- Tier-2 micro-validation: **planned** at the epic level for E-0003 after T-0019..T-0021 land.
  - See `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md` (Validation Plan).

## Decisions and Rationale
- **Accept T-0017 fix to done; separate human-probe rerun into a follow-up validation ticket.**
  - Rationale: QA passed and the shipped fix is correctness-critical; the fresh-observer rerun requires scheduling and should be tracked explicitly rather than blocking artifact flow.
- **Convert external designer feedback into a scoped epic and 3 ready tickets.**
  - Rationale: The issues are systemic but can be decomposed into bounded, testable slices: IA/hierarchy, runtime-offline state UX, and empty-state/copy cleanup.

## Feedback IDs Touched (Status Changes)
- F-20260228-001: `ticketed` -> `closed` (linked ticket accepted; follow-up validation tracked in T-0018).
- F-20260228-002: `new` -> `ticketed` (split into T-0019..T-0021).

## Ticket / Epic Updates
- Epic created:
  - E-0003 Desktop UX clarity and hierarchy.
- Tickets created:
  - T-0018 (backlog): Rerun E-0002 tier-2 probes and record results.
  - T-0019 (ready): Desktop nav hierarchy and progressive disclosure.
  - T-0020 (ready): Runtime offline UX as a single actionable state.
  - T-0021 (ready): Empty state and copy cleanup.
- Ticket moved:
  - T-0017: `review/` -> `done/` (QA passed; follow-up validation tracked separately).
- Ready queue updated:
  - `tickets/status/ready/ORDER.md` populated with T-0019..T-0021.

## PM Process Improvement Proposal
- Add a lightweight "Hierarchy / Progressive Disclosure" checklist for `Area: ui` tickets (either as a short section in the ticket template or a dedicated UI review checklist doc) so we consistently:
  - identify the primary job-to-be-done,
  - demote advanced controls out of the default surface,
  - ensure empty/error states answer "what now?" with one primary action.

Suggested commit message: `pm: triage designer UX review into epic + ready tickets (E-0003, T-0019..T-0021)`

Next-step suggestion: implement `T-0019` next (it establishes the IA that the runtime/empty-state work should align to).

