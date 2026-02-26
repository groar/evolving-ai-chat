# T-0008: Changelog and rollback UX

## Metadata
- ID: T-0008
- Status: ready
- Priority: P3
- Type: feature
- Area: ui
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Add a user-facing changelog (“what changed and why”) and straightforward rollback controls (at least for experimental flags).

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Make ongoing iteration trust-preserving by showing “what changed + why” in a scannable format.
  - Provide a clear, user-controlled “get back to safety” action (rollback) for experimental mode/flags.
- Non-goals:
  - Full code rollback / git-level revert UX.
  - Per-message or per-conversation history of changes.
  - Syncing changelog across devices.
- Rules and state transitions:
  - Changelog entries are stored locally and list the most recent items first.
  - Minimum changelog entry fields:
    - `created_at` (timestamp)
    - `title` (short)
    - `summary` (1–2 lines)
    - `channel` (`stable` or `experimental`)
    - `ticket_id` (optional but recommended for traceability)
    - `flags_changed` (optional list)
  - Rollback:
    - “Switch to Stable” sets the release channel to `stable`.
    - “Reset Experiments” disables all experimental flags (and keeps channel as-is unless the user also switches to stable).
    - Disabling individual experimental flags is allowed when the channel is `experimental`.
  - Copy constraints:
    - Must not imply that rollback undoes data changes or fully reverts the codebase.
    - Must clearly describe rollback as “feature toggle rollback”.
- User-facing feedback plan:
  - Provide clear empty states (“No changes recorded yet”) and confirmations for rollback actions.
  - After rollback actions, show a short confirmation and reflect the new channel/flag state immediately.
- Scope bounds:
  - Single settings view for “Changelog + Experiments”.
  - Only local storage; no export/sync.
  - Changelog list can be capped (e.g., last 20 entries).
- Edge cases / failure modes:
  - No changelog entries exist yet (empty state).
  - Storage read fails (show non-blocking error + keep core app usable).
  - Unknown/missing `ticket_id` (display entry without link).
- Validation plan:
  - Deterministic: add at least one UI-level test that verifies:
    - changelog view renders empty + non-empty states,
    - “Switch to Stable” and “Reset Experiments” both update state and require confirmation.
  - Manual: verify copy does not over-promise rollback semantics.

## Context
- Frequent change without clear visibility and reversal is a trust-killer.

## References
- `STATUS.md`
- `tickets/status/done/T-0006-feature-flags-and-release-channels.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] The app shows a basic changelog view listing recent changes (can be local-only).
- [ ] The user can revert experimental features by:
  - switching back to `stable`, and
  - disabling individual experimental flags (if present).
- [ ] Copy clearly distinguishes “feature toggle rollback” from “code rollback”.
- [ ] Changelog and rollback controls are discoverable from a single settings surface (one-click from the main UI).

## UX Acceptance Criteria (Only If `Area: ui`)
- [ ] Changelog entries are scannable (title + 1–2 line summary).
- [ ] Rollback actions are clearly labeled and confirm intent for impactful changes.

## Subtasks
- [ ] Define changelog entry storage format.
- [ ] Implement basic changelog UI.
- [ ] Implement rollback controls for channel/flags.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Added design spec and moved to `ready/` behind T-0009.
