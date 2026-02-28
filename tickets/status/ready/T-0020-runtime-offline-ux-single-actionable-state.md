# T-0020: Runtime offline UX as a single, actionable state

## Metadata
- ID: T-0020
- Status: ready
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
- [ ] Runtime-offline messaging is consolidated into a single global indicator with plain-language explanation and clear next action.
- [ ] Composer behavior is consistent with runtime availability (explicitly enabled/disabled with copy that explains why).
- [ ] Runtime-backed sub-features (if visible) use scoped inline errors and do not duplicate global messaging.
- [ ] Regression coverage exists for the runtime-offline state (copy + enable/disable rules).

## UX Acceptance Criteria (Only If `Area: ui`)
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.
- [ ] The runtime-offline state does not read like data loss or catastrophic failure.

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
- [ ] Documentation updates (if any)

## Change Log
- 2026-02-28: Ticket created from external designer review (F-20260228-002) and moved to `ready/`.

