# T-0073: Fix with AI — progress and error visibility in improvement sheet

## Metadata
- ID: T-0073
- Status: done
- Priority: P2
- Type: bugfix
- Area: ui
- Epic: none
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
When the user clicked "Fix with AI" in the improvement sheet, there was no visible progress or completion feedback, and API errors (e.g. 422) from the code-patch endpoint were not shown in the improvement sheet — they were only written to the settings store and shown in the Settings panel. This ticket addresses both: show in-flight and completion state in the improvement sheet, and surface patch errors in the same sheet where the user triggered the action.

## Context
- User feedback F-20260304-005: "When I click on 'Fix with AI', I don't see any progress... Also when I get an error like 422, it does not show up in the interface."
- Implementation completed in the same session as feedback triage (2026-03-04).

## Feedback References
- F-20260304-005 (Fix with AI — no progress or error shown in UI)

## Acceptance Criteria
- [x] User sees progress feedback when "Fix with AI" is in progress (e.g. "Starting code change…" / "Code change in progress…") and form/button disabled while busy.
- [x] Patch request in-flight state (e.g. `isRequestingPatch`, patch-in-progress) is reflected in the improvement sheet busy state.
- [x] API errors (e.g. 422) from the code-patch endpoint are shown in the improvement sheet where the user triggered the action, not only in Settings.

## Evidence
- Implemented 2026-03-04: progress copy and busy state in improvement sheet; `settingsError` and `settingsNotice` rendered in the improvement sheet so patch errors appear in context.
- Feedback item F-20260304-005 triaged and linked; no separate QA run (fix was part of session work, validated by sponsor).

## Change Log
- 2026-03-04: Ticket created post-implementation for traceability; moved to done. Linked F-20260304-005.
