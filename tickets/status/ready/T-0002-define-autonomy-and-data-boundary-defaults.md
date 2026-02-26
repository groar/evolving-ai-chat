# T-0002: Define autonomy and data boundary defaults

## Metadata
- ID: T-0002
- Status: ready
- Priority: P0
- Type: feature
- Area: core
- Epic: E-0001
- Owner: pm-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Define the default autonomy level and data boundary for the self-evolving desktop app so implementation doesn’t invent trust/safety rules ad hoc.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Make “unexpected directions” possible without surprising breakage or privacy drift.
  - Establish defaults that are safe for a single-user desktop app.
- Non-goals:
  - Perfect future-proof policy; we just need a v1 contract we can iterate.
- Rules and state transitions:
  - Release channels:
    - `stable`: predictable; no experimental features enabled.
    - `experimental`: opt-in; can include UI/behavior experiments behind flags.
  - Autonomy defaults (choose one):
    - Option A (recommended): **suggest-only** — agents propose diffs; user approves to apply.
    - Option B: **auto-apply low-risk** — only pre-approved categories (e.g., copy tweaks, UI spacing), always behind experimental flags, with mandatory rollback + audit trail.
  - Data boundary defaults (choose one):
    - Option 1 (recommended): **local-only** — no syncing; logs stored locally; explicit opt-in for any export.
    - Option 2: **encrypted sync** — allowed, but only after a dedicated security review ticket.
- User-facing feedback plan:
  - Add a Settings screen that clearly shows: channel, autonomy mode, data boundary, and what is logged.
- Scope bounds:
  - Document decisions in `STATUS.md` first; implementation follows in later tickets.
- Edge cases / failure modes:
  - Agent proposes a breaking change → must be blocked by validation gates and/or require explicit approval.
  - Logging becomes too detailed → must have a “minimize logs” mode and a delete option (later ticket if needed).
- Validation plan:
  - Deterministic: presence of documented decisions + UI surfacing of current mode.
  - Micro-validation: confirm the user understands the mode labels and feels in control.

## Context
- Self-evolving UX is high trust-risk without explicit control and rollback.
- Early clarity prevents agents from “helpfully” expanding logging or autonomy.

## References
- `STATUS.md`
- `tickets/meta/feedback/inbox/F-20260226-001-self-evolving-desktop-ai-chat.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] `STATUS.md` Decisions section records:
  - chosen autonomy default (Option A or B),
  - chosen data boundary default (Option 1 or 2),
  - the existence of stable vs experimental channels.
- [ ] A short “User control contract” is added to T-0002 Notes capturing:
  - what the system may do without asking,
  - what always requires confirmation.
- [ ] Any downstream ticket that depends on these choices links back to T-0002.

## User-Facing Acceptance Criteria (Only If End-User Behavior Changes)
- [ ] The chosen defaults are described in plain language (no internal jargon) suitable for Settings UI copy.

## Subtasks
- [ ] Draft recommended defaults and alternatives (include tradeoffs).
- [ ] Confirm choices with the user and record them in `STATUS.md`.
- [ ] Update linked tickets with any resulting scope changes.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/`.
