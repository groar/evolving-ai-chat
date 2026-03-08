# F-20260308-004: Fix with AI — progress visibility and Activity feed UX

## Metadata
- ID: F-20260308-004
- Status: ticketed
- Source: user-playtest
- Theme: ux, fix-with-ai, observability
- Severity: S3
- Linked Tickets: T-0097
- Received: 2026-03-08
- Updated: 2026-03-08

## Raw Feedback (Sanitized)
- "I think we should be able to follow the progress of the agent, within the same 'refining' discussion. After we click run the agent on the feedback, we should be able to see progress here. And not in the 'Suggest an improvement' panel."
- "Ideally the progress would be a little bit more granular, or show things happening (maybe we could break down the process in several sub agents, we will see that later), so that there is a feeling of progress (and not just waiting)."
- "We should see the 'in progress' evolutions in the activity log, as a card. With a link back to the refining discussion where the progress can be seen in more details. Once it's done it's turned into a regular activity card (maybe with a link to the discussion being kept, for history purposes)."

## Normalized Summary
1. **Progress in refinement context**: After clicking Run agent, progress should be visible in the refinement conversation (main chat area), not in the Suggest an improvement panel.
2. **Granular progress**: Show incremental progress (e.g. sub-agent steps) so the user feels things are happening, not just waiting.
3. **In-progress in Activity**: Show in-progress evolutions as Activity cards with a link to the refinement discussion. When done, convert to regular activity card, optionally keeping the discussion link for history.

## PM Notes
- User emphasized "overall it's great so we should keep working in that direction."
- These are improvements, not bugs. Design spec will be needed for UI/flow changes.
- Sub-agent breakdown is noted as a future possibility ("we will see that later").

## Triage Decision
- Decision: ticketed → T-0097
- Rationale: UX improvement; progress in refinement context + in-progress Activity cards. P2, depends on T-0096.
- Revisit Trigger: After T-0097 ships.
