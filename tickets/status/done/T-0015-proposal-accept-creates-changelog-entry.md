# T-0015: Proposal accept creates changelog entry

## Metadata
- ID: T-0015
- Status: done
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
- [x] Accepting a proposal creates a changelog entry linked to `proposal_id`.
- [x] Rejecting a proposal creates no changelog entry.
- [x] Accepting an already accepted proposal does not create duplicates.
- [x] The new changelog entry is visible via the existing `GET /state` payload and renders in `Changelog + Experiments`.
- [x] Deterministic coverage exists for the three rule cases above (unit test and/or storage smoke).

## Release Note (Optional; Recommended For User-Facing Changes)
- Title: Proposal acceptance shows up in changelog
- Summary (1–2 lines, user-facing; avoid over-promising): Accepted change proposals now create a local changelog entry so you can quickly see what was approved and why.

## User-Facing Acceptance Criteria (Only If End-User Behavior Changes)
- [x] A user can observe the changelog entry after accepting a proposal (no developer tools required).
- [x] Copy does not imply code rollback or autonomous shipping.

## Dependencies / Sequencing (Optional)
- Depends on:
  - T-0014 (Python runtime deps and test bootstrap)

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-02-27-qa-checkpoint-t0015.md`
- Screenshots/artifacts: n/a (runtime/state evidence + unit tests)

## Evidence (Verification)
- Tests run:
  - `cd apps/desktop && UV_CACHE_DIR=/tmp/uv-cache uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime/test_proposals.py` (PASS, 4 tests)
  - `cd apps/desktop && npm test -- src/settingsPanel.test.tsx` (PASS, 3 tests)
- Manual checks performed:
  - Created proposal -> passing validation -> accepted; confirmed exactly one changelog entry linked by `proposal_id` and `ticket_id=T-0015`.
  - Created proposal -> rejected; confirmed no changelog entry linked by `proposal_id`.
- Screenshots/logs/notes:
  - Runtime manual check output: `accept_entries 1 T-0015` and `reject_entries 0`.

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates

## Change Log
- 2026-02-27: Ticket created.
- 2026-02-27: Moved to `ready/` and queued as next pickup.
- 2026-02-27: Moved to `in-progress/` and started implementation.
- 2026-02-27: Implemented proposal-linked changelog creation on accept with idempotent re-accept behavior.
- 2026-02-27: Added deterministic coverage for accept/reject/idempotency/fallback plus settings render coverage for `proposal_id`.
- 2026-02-27: Completed QA checkpoint `tickets/meta/qa/2026-02-27-qa-checkpoint-t0015.md` (pass).
- 2026-02-27: Moved to `review/` for PM acceptance.
- 2026-02-27: Accepted by PM and moved to `done/`.
