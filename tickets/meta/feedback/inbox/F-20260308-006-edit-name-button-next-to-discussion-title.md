# F-20260308-006: Edit name button should sit beside discussion title

## Metadata
- ID: F-20260308-006
- Status: ticketed
- Source: fix-with-ai
- Theme: ux, visual-hierarchy
- Severity: S3
- Linked Tickets: T-0104
- Received: 2026-03-08
- Updated: 2026-03-08

## Raw Feedback (Sanitized)
"Move the edit name button so it is directly next to the discussion name instead of grouped on the far right with settings/suggestions. Keep the rest of the top-bar controls where they are."

## Normalized Summary
The rename affordance is discoverable but spatially disconnected from the discussion title; users expect the edit control to be adjacent to the label it edits.

## PM Notes
- Assumption (autonomous): “discussion name” maps to the top chat header title (`topBarTitle`) in `apps/desktop/src/App.tsx`.
- Constraint preserved: settings, activity, and suggestion buttons remain in their current right-side control cluster.

## Triage Decision
- Decision: ticketed
- Rationale: Small, high-signal UI hierarchy fix that improves discoverability without changing behavior.
- Revisit Trigger: after ticket implementation + QA validation
