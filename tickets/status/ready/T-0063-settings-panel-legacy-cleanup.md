# T-0063: Settings panel legacy cleanup — remove AI Persona and Proposals pipeline

## Metadata
- ID: T-0063
- Status: ready
- Priority: P2
- Type: cleanup
- Area: ui
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-03
- Updated: 2026-03-03

## Summary
Remove the legacy AI Persona section and the full Improvements proposals pipeline (draft → validate → decide → validation runs) from the Settings panel. These surfaces were built for the pre-M8 config-only improvement approach (M6/M7). The M8 pivot to real code self-modification makes them obsolete. Remove the backing TypeScript modules too (`improvementClasses`, `proposalGenerator`, `proposalQualityGuard`). The remaining Settings panel should contain only: Connections (API keys), Works offline info, Updates & Safety (channel + early access flags), and Changelog.

## Design Spec

### UI Spec Addendum (Area: ui)
- **Primary job-to-be-done**: declutter Settings so users only see controls that are live and meaningful post-M8.
- **Primary action and what must be visually primary**: Settings panel scrolls top-to-bottom through: Connections → Works offline → Updates & Safety → Changelog. No proposals UI, no AI Persona UI.
- **Navigation / progressive disclosure**: Early Access remains under a `<details>` collapse. Changelog remains at the bottom. Nothing else changes in hierarchy.
- **Key states to design and verify**:
  - Happy: Settings opens; AI Persona and Improvements sections are gone; Connections, channel, Changelog render as before.
  - Empty Changelog: still shows "No changes applied yet."
  - Error/notice banners: remain unchanged.
- **Copy constraints**: must not mention persona, proposals, improvement classes, or draft/validate/decide anywhere in the remaining Settings UI.

## Context
- The AI Persona section allowed text additions that modified the system prompt. Replaced by code patches via M8.
- The Improvements section hosted the full proposals pipeline: feedback → generated proposal draft → validation runs → accept/reject decision. Replaced by the direct `requestPatch` flow ("Fix with AI →" button on feedback items).
- The backing modules are unused now that the proposals pipeline is removed:
  - `apps/desktop/src/improvementClasses.ts` + `improvementClasses.test.ts`
  - `apps/desktop/src/proposalGenerator.ts` + `proposalGenerator.test.ts`
  - `apps/desktop/src/proposalQualityGuard.ts` + `proposalQualityGuard.test.ts`
- Props to remove from `SettingsPanel`:
  - `proposals`, `personaAdditions`, `pendingGenerateFeedbackId`, `onClearPendingGenerate`
  - `onCreateProposal`, `onAddValidationRun`, `onUpdateProposalDecision`, `onRemovePersonaAddition`
- Corresponding types to remove from `settingsPanel.tsx`: `ChangeProposal`, `CreateProposalInput`, `AddValidationRunInput`, `ValidationRunSummary`, `ProposalDecision`, `PersonaAddition` (and their re-exports).
- In `App.tsx`: remove props passed to `SettingsPanel`, remove `pendingGenerateFeedbackId` state, remove the scroll effect that targeted `#settings-improvements`, remove the `onGenerateFromFeedback` prop passed to `FeedbackPanel`.
- In `useRuntime.ts`: remove `createProposal`, `addProposalValidationRun`, `updateProposalDecision`, `removePersonaAddition`.
- In stores (`settingsStore.ts` / `runtimeStore.ts`): remove `proposals`, `personaAdditions`, `isProposalBusy` state and all actions that mutate them.
- Unused runtime API calls that fed the proposals pipeline (if any) can be removed from `useRuntime.ts`.

## References
- `apps/desktop/src/settingsPanel.tsx`
- `apps/desktop/src/settingsPanel.test.tsx`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/hooks/useRuntime.ts`
- `apps/desktop/src/improvementClasses.ts`
- `apps/desktop/src/proposalGenerator.ts`
- `apps/desktop/src/proposalQualityGuard.ts`
- E-0010 Non-goals: "Improvement class registry (the M7 classification system is deprioritised in favour of simpler feedback-to-agent routing)."

## Feedback References
- F-20260303-001

## Acceptance Criteria
- [ ] AI Persona section does not appear in Settings.
- [ ] Improvements/proposals section (draft → validate → decide) does not appear in Settings.
- [ ] `improvementClasses.ts`, `proposalGenerator.ts`, `proposalQualityGuard.ts` are deleted.
- [ ] Their test files are deleted (`*.test.ts` counterparts).
- [ ] `SettingsPanel` no longer accepts `proposals`, `personaAdditions`, `pendingGenerateFeedbackId`, `onCreateProposal`, `onAddValidationRun`, `onUpdateProposalDecision`, `onRemovePersonaAddition` props.
- [ ] `App.tsx` no longer passes those props; `pendingGenerateFeedbackId` state removed.
- [ ] `useRuntime.ts` no longer exposes `createProposal`, `addProposalValidationRun`, `updateProposalDecision`, `removePersonaAddition`.
- [ ] `isProposalBusy` removed from stores and from `App.tsx` usage.
- [ ] Settings panel still renders correctly: Connections, Works offline, Updates & Safety, Changelog.
- [ ] Existing tests pass (no compilation errors, no broken imports).
- [ ] `settingsPanel.test.tsx` updated to remove test cases that target removed sections.

## UX Acceptance Criteria
- [ ] Remaining Settings sections are clearly labeled; no orphaned copy referencing proposals or personas.
- [ ] Empty/error states in remaining sections work as before.

## Release Note
- Title: Settings simplified
- Summary: Removed the AI persona and improvement proposal sections from Settings — these were part of an earlier approach, replaced by the direct "Fix with AI" code loop.

## Subtasks
- [ ] Delete `improvementClasses.ts`, `improvementClasses.test.ts`, `proposalGenerator.ts`, `proposalGenerator.test.ts`, `proposalQualityGuard.ts`, `proposalQualityGuard.test.ts`
- [ ] Update `settingsPanel.tsx`: remove AI Persona section, remove Improvements section, remove associated state, remove removed prop types
- [ ] Update `settingsPanel.test.tsx`: remove test cases for removed sections
- [ ] Update `App.tsx`: remove removed props, state, effects
- [ ] Update `useRuntime.ts`: remove removed methods
- [ ] Update stores: remove `proposals`, `personaAdditions`, `isProposalBusy`
- [ ] Run `npm run build` + `npm test` to confirm no regressions

## Change Log
- 2026-03-03: Ticket created. Triaged from F-20260303-001.
