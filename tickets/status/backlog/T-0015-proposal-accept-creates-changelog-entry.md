# T-0015: Proposal accept creates changelog entry

## Metadata
- ID: T-0015
- Status: backlog
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0002
- Owner: ai-agent
- Created: 2026-02-27
- Updated: 2026-02-27

## Summary
When a change proposal is accepted, persist exactly one changelog entry linked to that proposal so the "release" outcome is visible in the existing `Changelog + Experiments` settings surface.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Complete the M1 "release" linkage: `accepted proposal` -> `changelog entry`.
  - Preserve trust-surface copy constraints (no implied code rollback, no implied autonomous shipping).
- Non-goals:
  - Implementing proposal UI in this ticket (handled separately).
  - Auto-running validation gates (handled separately).
- Rules and state transitions:
  - Accept is allowed only when the latest validation run is passing (existing guard).
  - On transition to `accepted`, append one changelog entry that includes:
    - `proposal_id` (as link field),
    - `title` and a 1–2 line `summary`,
    - `release_channel` at time of acceptance.
  - Reject must not create a changelog entry.
  - Re-accepting an already accepted proposal must not create duplicate changelog entries.
- User-facing feedback plan:
  - The changelog entry should be scannable and should not over-promise what changed (if the proposal is metadata-only, say so).
- Scope bounds:
  - Runtime/storage behavior + tests + any required API/serialization changes.
- Edge cases / failure modes:
  - If a proposal lacks a usable title/summary, fall back to a safe default title ("Proposal accepted") and a conservative summary.
- Validation plan:
  - Deterministic: unit test verifies accept creates one changelog entry, reject creates none, and repeated accept does not duplicate.

## Context
`docs/m1-first-improvement-loop.md` specifies that accepting a proposal must create a changelog entry. The current proposal artifact supports decisions but does not yet wire that decision to the user-visible changelog.

## References
- `docs/m1-first-improvement-loop.md`
- `tickets/status/done/T-0008-changelog-and-rollback-ux.md`
- `tickets/status/done/T-0013-change-proposal-artifact.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] Accepting a proposal creates a changelog entry linked to `proposal_id`.
- [ ] Rejecting a proposal creates no changelog entry.
- [ ] Accepting an already accepted proposal does not create duplicates.
- [ ] The new changelog entry is visible via the existing `GET /state` payload and renders in `Changelog + Experiments`.
- [ ] Deterministic coverage exists for the three rule cases above (unit test and/or storage smoke).

## Release Note (Optional; Recommended For User-Facing Changes)
- Title: Proposal acceptance shows up in changelog
- Summary (1–2 lines, user-facing; avoid over-promising): Accepted change proposals now create a local changelog entry so you can quickly see what was approved and why.

## User-Facing Acceptance Criteria (Only If End-User Behavior Changes)
- [ ] A user can observe the changelog entry after accepting a proposal (no developer tools required).
- [ ] Copy does not imply code rollback or autonomous shipping.

## Dependencies / Sequencing (Optional)
- Depends on:
  - T-0014 (Python runtime deps and test bootstrap)

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint:
- Screenshots/artifacts:

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Design updates
- [ ] Implementation
- [ ] Tests
- [ ] Documentation updates

## Change Log
- 2026-02-27: Ticket created.
