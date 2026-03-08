# F-20260308-003: Fix with AI — no trace in Activity feed

## Metadata
- ID: F-20260308-003
- Status: ticketed
- Source: user-playtest
- Theme: observability, fix-with-ai
- Severity: S2
- Linked Tickets: T-0096
- Received: 2026-03-08
- Updated: 2026-03-08

## Raw Feedback (Sanitized)
"I can't see any trace of it in the Activity feed so that's a bug."

## Normalized Summary
After running Fix with AI (including when the agent completes or fails), the evolution does not appear in the Activity feed. The user expects to see a record of the run there.

## PM Notes
- Context: User tested Fix with AI flow; patch PA-20260308-c4c0a418 exists in storage with status `apply_failed`.
- Hypothesis: Either (a) failed patches are filtered or not surfaced in Activity, (b) state refresh timing/scope issue when coming from refinement flow, or (c) patches from refinement-initiated runs are not persisted/returned correctly.
- Activity feed sources patches from GET /state → patch_storage.list_all().

## Triage Decision
- Decision: ticketed → T-0096
- Rationale: Bug; patches from Fix with AI flow do not appear in Activity feed. P1 fix for observability.
- Revisit Trigger: After T-0096 ships.
