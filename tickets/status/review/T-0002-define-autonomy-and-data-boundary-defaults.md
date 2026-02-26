# T-0002: Define autonomy and data boundary defaults

## Metadata
- ID: T-0002
- Status: review
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
  - Autonomy defaults:
    - Option A: **suggest-only** — user approves to apply.
      - Clarification: approvals are **UI-level**, not code-level. The user sees a human-readable “change bundle” (what/why/impact/rollback), with an optional “view diff” for audit.
    - Option B: **auto-apply low-risk** — only pre-approved categories, behind experimental flags, with mandatory rollback + audit trail.
    - Option C (chosen): **policy-gated seamless review** — suggest-only by default, with optional auto-acceptance by policy.
      - Default behavior: show a lightweight approval UI (not a code diff) and apply on user “Accept”.
      - Auto-accept (optional setting): allow categories/risk tiers to auto-apply **only** in `experimental`, with:
        - validation gates required,
        - immediate “Undo” affordance,
        - daily digest of applied changes,
        - auto-disable on repeated regressions.
      - Always available: “View diff / evidence” for auditing when needed.
  - Data boundary defaults:
    - Option 1 (chosen): **local-only** — no syncing; logs stored locally; explicit opt-in for any export.
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
- [x] `STATUS.md` Decisions section records:
  - autonomy default (Option C: policy-gated seamless review),
  - data boundary default (Option 1: local-only),
  - the existence of stable vs experimental channels.
- [x] A short “User control contract” is added to T-0002 Notes capturing:
  - what the system may do without asking,
  - what always requires confirmation.
- [x] Any downstream ticket that depends on these choices links back to T-0002.

## User-Facing Acceptance Criteria (Only If End-User Behavior Changes)
- [x] The chosen defaults are described in plain language suitable for Settings UI copy.

## Subtasks
- [x] Draft recommended defaults and alternatives (include tradeoffs).
- [x] Confirm choices with the user and record them in `STATUS.md`.
- [x] Update linked tickets with any resulting scope changes.

## Notes
### User control contract (v1)
May do without asking (default):
- Collect minimal, local-only telemetry needed to function and to create “change bundles” (no external export/sync by default).
- Propose improvements as “change bundles” with rationale + rollback info.

Requires explicit confirmation (default):
- Any “high-impact” change (new permissions, new tools, data export/sync, major UI re-layout, migrations).
- Any change that increases data retention/detail beyond the documented local-only baseline.
- Any change that affects costs materially (new default model, higher spend mode).

Optional setting (off by default):
- Auto-accept low-risk changes by policy (Option C), limited to `experimental`, with validation gates + undo + digest.

## Evidence (Verification)
- Decisions recorded in `STATUS.md`.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/`.
- 2026-02-26: Decisions confirmed; moved to `review/`.
