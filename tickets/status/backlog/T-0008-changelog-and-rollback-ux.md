# T-0008: Changelog and rollback UX

## Metadata
- ID: T-0008
- Status: backlog
- Priority: P3
- Type: feature
- Area: ui
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Add a user-facing changelog (“what changed and why”) and straightforward rollback controls (at least for experimental flags).

## Context
- Frequent change without clear visibility and reversal is a trust-killer.

## References
- `STATUS.md`
- `tickets/status/backlog/T-0006-feature-flags-and-release-channels.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] The app shows a basic changelog view listing recent changes (can be local-only).
- [ ] The user can revert experimental features by:
  - switching back to `stable`, and
  - disabling individual experimental flags (if present).
- [ ] Copy clearly distinguishes “feature toggle rollback” from “code rollback”.

## UX Acceptance Criteria (Only If `Area: ui`)
- [ ] Changelog entries are scannable (title + 1–2 line summary).
- [ ] Rollback actions are clearly labeled and confirm intent for impactful changes.

## Subtasks
- [ ] Define changelog entry storage format.
- [ ] Implement basic changelog UI.
- [ ] Implement rollback controls for channel/flags.

## Change Log
- 2026-02-26: Ticket created.

