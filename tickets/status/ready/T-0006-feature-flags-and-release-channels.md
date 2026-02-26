# T-0006: Feature flags and release channels (stable/experimental)

## Metadata
- ID: T-0006
- Status: ready
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Introduce feature flags and two release channels (stable vs experimental) so the product can evolve without breaking daily use.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Let experiments ship safely.
  - Provide a user-visible “what mode am I in?” control.
- Non-goals:
  - Complex remote config or multi-user flag targeting.
- Rules and state transitions:
  - Channel is a persisted setting: `stable` or `experimental`.
  - Default channel is `stable`.
  - Channel and flags are local-only settings (no remote config in v1).
  - In `stable`, experimental-only UI elements are hidden and experimental flags are not user-toggleable.
  - In `experimental`, a basic Settings surface allows opting into/out of experimental flags.
  - Experimental features must be gated by flags and default off in `stable`.
- Validation plan:
  - Deterministic: toggling channel changes the active feature set in a testable way.

## References
- `STATUS.md`
- `tickets/status/done/T-0002-define-autonomy-and-data-boundary-defaults.md`
- `tickets/status/done/T-0005-storage-conversations-and-event-log-sqlite.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] A persisted `channel` setting exists: `stable` (default) or `experimental` (opt-in).
- [ ] At least one trivial UI feature is gated behind an experimental-only flag (to prove the mechanism).
- [ ] The current channel is visible in the UI.

## UX Acceptance Criteria (Only If `Area: ui`)
- [ ] Channel toggle copy is clear and does not imply unsafe autonomy.
- [ ] Channel toggle copy must not imply data sharing/sync; keep expectations local-only.

## Subtasks
- [ ] Implement flag storage (SQLite) and access pattern.
- [ ] Add a basic Settings UI for channel.
- [ ] Gate one small feature behind a flag.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/` (sequenced after T-0007 to keep the pickup queue non-empty).
