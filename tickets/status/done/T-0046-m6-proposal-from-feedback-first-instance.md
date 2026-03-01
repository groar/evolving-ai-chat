# T-0046: M6 — Wire proposal-from-feedback generation + first instance

## Metadata
- ID: T-0046
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0007
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Implement the M6 first agent-proposed change from real usage: add UX to generate a proposal from in-app feedback, wire the observe→propose→validate→release pipeline end-to-end, and ship the first concrete copy improvement (Improvements section labels) as specified in `docs/m1-first-improvement-loop.md` M6 addendum.

## Context
- T-0045 (M6 scope) defined improvement class, trigger, and first example.
- M1 infrastructure exists: feedback capture (localStorage), proposals (runtime), Settings panel, changelog.
- Feedback lives in frontend; proposal generation for M6 is frontend-driven (no new runtime endpoint).
- The first instance: feedback "Improvements section is confusing" → proposal → validate → accept → changelog + apply copy change.

## References
- `docs/m1-first-improvement-loop.md` (M6 addendum)
- `tickets/meta/epics/E-0007-m6-first-agent-proposed-change.md`
- `apps/desktop/src/settingsPanel.tsx`
- `apps/desktop/src/feedbackStore.ts`

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Add "Generate from feedback" affordance in Improvements section.
  - Populate proposal form from selected feedback (title, rationale, feedback_ids, default risk_notes/diff_summary).
  - Apply the first concrete copy change when the pipeline is exercised (rename "Change Drafts" → "Suggested improvements", "Draft an Improvement" → "Suggest an improvement", "No change drafts yet" → "No suggestions yet.").
- Non-goals:
  - Runtime-based proposal generation; feedback stays in localStorage.
  - Implicit triggers or auto-generation.
  - Multiple improvement classes.
- Rules:
  - Generate populates title as "Clarify: " + feedback.title (or feedback.title), rationale = feedback.summary, source_feedback_ids = [feedback.id], risk_notes = copy-only default.
  - User can edit before submitting.
  - First instance copy change is applied as part of this ticket (in settingsPanel.tsx).
- User-facing feedback plan:
  - User sees the Improvements section with clearer labels after the first instance lands.
  - Changelog entry documents the accepted proposal.

## Acceptance Criteria
- [x] "Generate from feedback" affordance exists in Improvements section (button/dropdown to select one feedback ID).
- [x] Selecting feedback and generating populates proposal form with title, rationale, feedback IDs, and default risk_notes.
- [x] User can submit the generated proposal via existing flow (Save Draft → Add check run → Accept).
- [x] First instance copy changes applied: "Change Drafts" → "Suggested improvements", "Draft an Improvement" → "Suggest an improvement", "No change drafts yet" → "No suggestions yet." (or equivalent per spec).
- [ ] End-to-end smoke: capture feedback → generate proposal → validate → accept → changelog entry visible; copy change observable in Settings. (Deferred to manual run per QA checkpoint.)
- [x] Deterministic tests for generate-from-feedback UX and copy strings.

## Dependencies / Sequencing
- Depends on: T-0045 (M6 scope) — must be complete first.
- Blocks: E-0007 epic completion (first landed change).

## Evidence (Verification)
- Tests run: `npm test -- src/settingsPanel.test.tsx` (apps/desktop) — 16 passed. Desktop build passes.
- Manual checks performed: Generate-from-feedback dropdown appears when feedback exists; selecting populates form with title, rationale, feedback IDs, diff_summary, risk_notes. Copy strings updated per spec.
- QA checkpoint: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0046.md` — PASS; E2E smoke deferred to manual run.
- Doc review (for docs-only changes): N/A

## Change Log
- 2026-03-01: Ticket created by T-0045 implementation. Linked to E-0007.
- 2026-03-01: Implementation complete. Generate-from-feedback dropdown, form population with diff_summary/risk_notes, copy changes applied. Tests added. E2E smoke pending manual run.
- 2026-03-01: QA checkpoint PASS. PM acceptance. Moved to done.
