# F-20260308-002: Fix with AI — no git commit when agent completes

## Metadata
- ID: F-20260308-002
- Status: ticketed
- Source: user-playtest
- Theme: reliability, fix-with-ai
- Severity: S2
- Linked Tickets: T-0095
- Received: 2026-03-08
- Updated: 2026-03-08

## Raw Feedback (Sanitized)
"Once the pi agent had finished shipping everything, nothing got git committed."

## Normalized Summary
When the Fix with AI flow completes successfully (pi agent produces the right result), the changes are not committed to git. The user expects a git commit after a successful agent run.

## PM Notes
- Context: User tested the Fix with AI flow end-to-end. The conversational refinement and Run agent flow worked well and produced the right result.
- Root cause (from PA-20260308-c4c0a418.json): The apply pipeline failed with `patch_timeout` (180s) during the `patch` step (npm run validate). The pipeline never reached `_apply_and_commit`, so no git commit occurred.
- The pi agent produced a valid diff and all lifecycle artifacts; the failure is in the apply pipeline, not the patch generation.

## Triage Decision
- Decision: ticketed → T-0095
- Rationale: Bug; apply pipeline fails with patch_timeout before git commit when pi agent succeeds. P1 fix to ensure successful runs result in committed changes.
- Revisit Trigger: After T-0095 ships.
