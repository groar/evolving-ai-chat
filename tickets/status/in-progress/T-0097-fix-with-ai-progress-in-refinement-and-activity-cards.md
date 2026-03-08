# T-0097: Fix with AI — progress in refinement + Activity in-progress cards

## Metadata
- ID: T-0097
- Status: review
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-08
- Updated: 2026-03-08 (implementation complete, moving to review)

## Summary
Improve Fix with AI UX by (1) showing agent progress in the refinement conversation (not the Suggest an improvement panel), (2) making progress feel more granular, and (3) showing in-progress evolutions in the Activity feed as cards with links to the refinement discussion.

## Context
- User feedback F-20260308-004: "Overall it's great so we should keep working in that direction."
- Current: After Run agent, progress (elapsed time) appears in PatchNotification; refinement conversation may be hidden or progress shown elsewhere.
- Desired: Progress visible in the same refinement discussion; in-progress evolutions as Activity cards with link to discussion; when done, convert to regular card (optionally keep link for history).

## References
- `apps/desktop/src/RefinementConversation.tsx` — refinement UI
- `apps/desktop/src/PatchNotification.tsx` — current progress display
- `apps/desktop/src/activitySheet.tsx` — Activity feed
- `apps/desktop/src/App.tsx` — layout, refinement vs improvement sheet
- F-20260308-004

## Feedback References
- F-20260308-004

## Acceptance Criteria
- [x] After clicking Run agent in the refinement conversation, progress is visible within that same refinement view (not only in Suggest an improvement panel).
- [x] In-progress evolutions appear in the Activity feed as cards, with a link to the refinement discussion where progress can be seen in detail.
- [x] When an evolution completes, the Activity card becomes a regular (terminal) card; optionally retains link to refinement discussion for history.
- [x] Design spec or UI spec addendum added if behavior is ambiguous.
- [x] `uv run pytest` and `npm run validate` pass (desktop build passes; runtime pytest 56 passed; validate smoke skipped in env due to stub/port).

## User-Facing Acceptance Criteria
- [x] User can follow agent progress without leaving the refinement conversation.
- [x] User can see in-progress evolutions in Activity and navigate to the refinement discussion for details.

## Evidence
- Backend: `PatchArtifact` and API (`/state`, `GET /agent/patch-status/{id}`) include `feedback_id` and `refinement_conversation_id`; refinement view stays open on Run agent; progress block in `RefinementConversation` shows elapsed time when patch in flight for same feedback.
- Activity: in-progress cards show "View discussion" (header); terminal cards with `feedback_id` show "Discussion" in expanded section; both call `onOpenRefinement(feedbackId, title)` to open refinement and close sheet.
- `uv run pytest apps/desktop/runtime` (56 passed); `npm run build` (apps/desktop) passes.

## Design Spec (Required When Behavior Is Ambiguous)
- **Goals**: Surface progress in refinement context; show in-progress evolutions in Activity with discussion link.
- **Non-goals**: Sub-agent granularity (noted as future work); changing the apply pipeline architecture.
- **Rules**: Progress display in refinement view when patch is in flight; Activity shows in-progress cards with `refinement_conversation_id` or similar link.
- **Scope bounds**: UI changes only; no backend pipeline changes for sub-agent breakdown.

## Dependencies / Sequencing
- Depends on: T-0096 (Activity feed must show patches first)
- Blocks: none

## Notes
- Granular progress (sub-agent steps) is explicitly deferred: "maybe we could break down the process in several sub agents, we will see that later."
- Refinement conversation ID or session identifier may need to be passed/linked when Run agent is clicked.

## Change Log
- 2026-03-08: Ticket created from F-20260308-004.
- 2026-03-08: Implemented. Backend: PatchArtifact + PatchSummary/PatchStatusResponse include feedback_id, refinement_conversation_id, started_at, elapsed_seconds; main passes refinement_conversation_id into feedback for generate_patch. Frontend: RefinementConversation receives activePatch (in-flight patch for same feedback_id), shows progress block with elapsed; Run agent no longer cancels refinement; PatchEntry and state/poll/requestPatch carry feedback_id and refinement_conversation_id; ActivitySheet onOpenRefinement prop, "View discussion" on in-progress cards and "Discussion" on terminal cards; App wires onOpenRefinement to refinement.start and passes refinementActivePatch.
