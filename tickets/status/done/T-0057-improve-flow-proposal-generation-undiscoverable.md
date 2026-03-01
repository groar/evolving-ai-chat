# T-0057: Improve flow — proposal generation undiscoverable; user cannot reach "Generate from feedback"

## Metadata
- ID: T-0057
- Status: cancelled
- Priority: P1
- Type: bug
- Epic: E-0009
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
The flow from "Improve" button → feedback capture → proposal generation is undiscoverable. The "Generate from feedback" dropdown lives in the collapsible Improvements section, which appears above the Improve/feedback form in Settings. Users who capture feedback never see a clear next step to create a suggestion. AI Persona empty state says "Use the Improve button on any AI response to start" but does not explain that they must then scroll up, expand Improvements, and use "Generate from feedback" — so users report they "cannot generate proposals" whatever they do.

## Impact
- Severity: S2
- User impact: Primary user (project sponsor) blocked from completing the observe-propose-validate loop; M7 tier-2 validation probe cannot run without a real generated proposal.
- Scope: Settings → Improve section, Improvements section, feedback capture → proposal generation flow.

## Environment
- Build: evolving-ai-chat main (2026-03-01)
- Runtime: Tauri desktop app; Python runtime for proposals API

## Reproduction Steps
1. Open app, have at least one AI response in a conversation.
2. Click "Improve" on an assistant message. Settings opens, scrolls to Improve section.
3. Enter feedback (e.g. "responses are too verbose"), select "Response tone & style", submit.
4. Look for a way to create a suggestion from that feedback. There is no visible "Generate suggestion" or "Create proposal" in the Improve section.
5. The Improvements section is a collapsible `<details>` above the Improve section. It is collapsed by default when empty; even when feedback exists, it stays collapsed unless manually expanded.
6. User never finds "Generate from feedback" and concludes they cannot generate proposals.

## Expected Behavior
After capturing feedback, the user should see a direct path to generate a suggestion: either a "Generate suggestion" action next to each captured item, or Improvements section auto-expanded with visible "Generate from feedback" when feedback exists.

## Actual Behavior
- Improvements section is collapsed; "Generate from feedback" is hidden.
- No in-context guidance from captured feedback to proposal creation.
- AI Persona empty state says "Use the Improve button... to start" but the resulting flow is incomplete.

## Evidence
- User report: "Right now I can't generate proposal. By the way, in the AI persona thing, it says [...] whatever I do" (2026-03-01).

## References
- E-0009 (M7), T-0054 (entry point copy), T-0055 (persona class), T-0056 (tier-2 validation).
- docs/m7-improvement-classes.md, apps/desktop/src/settingsPanel.tsx, feedbackPanel.tsx.

## Acceptance Criteria (Fix + Verify)
- [x] Improve section surfaces a "Generate suggestion from this" action per captured feedback item (implemented).
- [x] Improvements section auto-expands when feedback items exist (implemented).
- [x] Clicking "Generate suggestion from this" scrolls to Improvements and populates the proposal form.
- [ ] Regression test for new flow; manual QA pass.

## Subtasks
- [x] Implement fix (Generate suggestion link, auto-expand, pendingGenerateFeedbackId wiring)
- [ ] Add/adjust tests
- [ ] Validate fix via QA scenario
- [ ] Update T-0056 if tier-2 probe can proceed after fix

## Notes
Fix implemented in same session: FeedbackPanel "Generate suggestion from this" per item; SettingsPanel improvementsSectionRef/pendingGenerateFeedbackId; Improvements details open when feedback exists; App scroll-to-improvements when opening from Improve with feedback.

## Change Log
- 2026-03-01: Bug ticket created from user report during T-0056 tier-2 probe. Fix implemented in same session.
- 2026-03-01: Cancelled. E-0009 superseded by E-0010 pivot. The improvement-class / persona flow this ticket was fixing is being abandoned in favour of a full code self-modification loop (F-20260301-008).
