# F-20260308-008: Fix with AI — current card in Activity only after validation

## Metadata
- ID: F-20260308-008
- Status: ticketed
- Source: user-playtest
- Theme: ux, fix-with-ai, observability
- Severity: S2
- Linked Tickets: T-0105
- Received: 2026-03-08
- Updated: 2026-03-08

## Raw Feedback (Sanitized)
"When I fix with AI, and run the agent, I can't see the current card in the activity panel right away, it only shows up in 'in progress' once it's past validation."

## Normalized Summary
When the user clicks "Run agent" in the Fix with AI flow, no card appears in the Activity panel for the duration of the run. A card only appears under "In progress" after the agent has finished and the patch has passed scope validation (i.e. when the POST /agent/code-patch response returns). The user expects to see the current run represented in the Activity panel as soon as they trigger the agent.

## PM Notes
- Related: F-20260308-004 (T-0097) requested in-progress evolutions as Activity cards with a link to the refinement discussion. T-0097 shipped progress in the refinement view and Activity cards for in-flight patches.
- Root cause: The backend creates the patch artifact only after `generate_patch()` and scope validation complete. The frontend receives the patch_id only when the HTTP response returns, so it can add a card only then. There is no placeholder or "run in progress" card during the blocking request phase.
- Desired behavior: Show a card in Activity "In progress" as soon as the user clicks Run agent (e.g. optimistic placeholder tied to feedback_id/refinement, or backend returns a provisional run id at request start and runs the agent in background).

## Triage Decision
- Decision: ticketed → T-0105
- Rationale: UX gap; user expects to see the current run in Activity as soon as they click Run agent. T-0097 added in-progress cards but they only appear when the patch exists (after POST returns). New ticket to show a card immediately (optimistic placeholder or async run id).
- Revisit Trigger: After T-0105 ships.
