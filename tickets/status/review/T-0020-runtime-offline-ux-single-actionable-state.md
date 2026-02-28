# T-0020: Runtime offline UX as a single, actionable state

## Metadata
- ID: T-0020
- Status: review
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0003
- Owner: ai-agent
- Created: 2026-02-28
- Updated: 2026-02-28

## Summary
Replace the current "runtime unavailable" experience (duplicated, alarming, and non-explanatory) with a single, consistent, actionable runtime-offline state that clarifies what still works and what to do next.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Reduce perceived brokenness by scoping runtime offline messaging to affected features.
  - Make the next action obvious (start runtime, or continue offline where supported).
- Non-goals:
  - Changing the runtime architecture or adding remote hosting.
  - Adding complex troubleshooting UIs.
- Rules and state transitions:
  - There is exactly one runtime-offline indicator in the main UI (banner, status area, or equivalent).
  - The indicator includes:
    - a short plain-language explanation of what "runtime" is (one line),
    - whether chat sending is available or disabled,
    - a single primary action (for example `Retry` or `Start runtime` guidance) that is consistent with the actual next step.
  - Any runtime-backed sub-feature (for example proposals/changelog fetch) may show an inline scoped error, but must not duplicate global messaging or claim unrelated surfaces are broken.
  - Error copy must not imply local-only features (Settings UI, offline browsing, local data) are unavailable.
- User-facing feedback plan:
  - A first-run user encountering runtime-offline should be able to explain what is happening and what to do next in under 10 seconds.
- Scope bounds:
  - Copy + layout + enable/disable rules; no new backend endpoints required.
- Edge cases / failure modes:
  - Runtime flaps (offline -> online): UI updates without requiring a full app restart.
  - Runtime is online but returns an error: show a different message than "offline".
- Validation plan:
  - Deterministic: add/adjust tests for runtime-offline UI:
    - single global indicator present,
    - no duplicated alarming copy across surfaces,
    - chat enable/disable matches reality.
  - Manual: run the app with runtime stopped and confirm the UX reads as "offline mode" rather than "app broken".

## Context
The designer review (F-20260228-002) and prior micro-validation attempt (F-20260228-001/T-0017) both indicate that runtime-offline messaging undermines user trust and blocks basic navigation.

## References
- `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md`
- `tickets/status/done/T-0017-settings-discoverability-and-runtime-messaging.md`

## Feedback References (Optional)
- F-20260228-002

## Acceptance Criteria
- [x] Runtime-offline messaging is consolidated into a single global indicator with plain-language explanation and clear next action.
- [x] Composer behavior is consistent with runtime availability (explicitly enabled/disabled with copy that explains why).
- [x] Runtime-backed sub-features (if visible) use scoped inline errors and do not duplicate global messaging.
- [x] Regression coverage exists for the runtime-offline state (copy + enable/disable rules).

## UX Acceptance Criteria (Only If `Area: ui`)
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] The runtime-offline state does not read like data loss or catastrophic failure.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint:
  - `tickets/meta/qa/2026-02-28-qa-checkpoint-t0020.md`
- Screenshots/artifacts:
  - `tickets/meta/qa/artifacts/runtime-smoke/2026-02-28T19-14-16-173Z/smoke-fastapi.log`

## Evidence (Verification)
- Tests run:
  - `npm test -- appShell` (apps/desktop) -> pass (`1 file, 5 tests`).
  - `npm test` (apps/desktop) -> pass (`3 files, 14 tests`).
  - `npm run build` (apps/desktop) -> pass.
  - `npm run smoke:fastapi` (apps/desktop) -> pass.
- Manual checks performed:
  - Verified runtime-offline copy and composer disable behavior via deterministic render assertions in `apps/desktop/src/appShell.test.tsx`.
  - Reviewed settings-surface runtime-offline scoped error expectations in `apps/desktop/src/settingsPanel.test.tsx` to confirm no global-message duplication in secondary surfaces.
- Screenshots/logs/notes:
  - Runtime smoke artifact log captured at the path above.

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates (if any)

## Change Log
- 2026-02-28: Ticket created from external designer review (F-20260228-002) and moved to `ready/`.
- 2026-02-28: Picked up by implementation agent and moved to `in-progress/`.
- 2026-02-28: Consolidated runtime availability into a single global status banner with plain-language runtime explanation and one Retry action.
- 2026-02-28: Composer is now explicitly disabled when runtime is offline, with offline-specific placeholder copy.
- 2026-02-28: Distinguished runtime-offline vs runtime-request-error messaging to avoid treating all failures as offline.
- 2026-02-28: Added regression coverage for single runtime-offline indicator copy, retry action visibility, and composer disable behavior.
- 2026-02-28: Moved to `review/` and completed automatic QA phase (no bugs found).
