# F-20260304-005: Fix with AI — no progress or error shown in UI

## Metadata
- ID: F-20260304-005
- Status: ticketed
- Source: user-playtest
- Theme: ux, observability
- Severity: S2
- Linked Tickets: (implementation done this session)
- Received: 2026-03-04
- Updated: 2026-03-04

## Raw Feedback (Sanitized)
"When I click on 'Fix with AI', I don't see any progress, anything that tells me it's being done, or when it's done. Also when I get an error like 422, it does not show up in the interface."

## Normalized Summary
Two issues: (1) No visible progress or completion feedback when the user triggers "Fix with AI" (request in flight, patch in progress, or done). (2) API errors (e.g. 422) from the code-patch endpoint are not surfaced in the improvement sheet; they were only written to the settings store and shown in the Settings panel.

## PM Notes
- Fix with AI lives in the improvement sheet (Suggest an improvement). Progress and errors were not shown there: isBusy only reflected chat send/reset, and settingsError/settingsNotice were only rendered in the Settings sheet.
- Addressed in this session: (1) Progress: added isRequestingPatch and patch-in-progress to busy state; show "Starting code change…" / "Code change in progress…" in the panel notice and disable form/Fix with AI while busy. (2) Errors: render settingsError and settingsNotice in the improvement sheet so 422 and other patch errors appear where the user triggered the action.

## Triage Decision
- Decision: ticketed (implemented)
- Rationale: Implementation completed; feedback item and INDEX updated for traceability.
- Revisit Trigger: none
