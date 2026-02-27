# QA Checkpoint - 2026-02-27 (T-0012)

## Scope Tested
- Ticket: T-0012 (`tickets/status/review/T-0012-in-app-feedback-capture.md`)
- Area: Desktop UI feedback capture (local-only persistence)

## Automated Test Outcomes
- `npm test` (apps/desktop): PASS.
  - `src/feedbackPanel.test.tsx`: verifies submit flow creates a `new` feedback item and persists it.
  - `src/settingsPanel.test.tsx`: PASS regression.
- `npm run build` (apps/desktop): PASS.

## Manual Scenarios Executed
- Normal flow scenario: reviewed the implemented flow in `apps/desktop/src/App.tsx` + `apps/desktop/src/feedbackPanel.tsx` and confirmed the main-UI entry point (`Capture Feedback`) opens the form, submit path writes locally, and list view renders captured items.
- Edge-case scenario: verified non-blocking error handling branch for storage failures (`Could not save feedback locally. Core chat is unaffected.`) in `submitFeedback` and load failure branch (`Could not load local feedback. You can still use chat.`) in initial local feedback hydration.

## UI Visual Smoke Check
- Not executed in a live desktop runtime in this sandbox. Validation is based on deterministic UI/component tests plus implementation-path review.

## Criteria-to-Evidence Mapping
- Capture from discoverable main UI entry point in <=2 interactions -> `Capture Feedback` control in left rail and inline form (`apps/desktop/src/feedbackPanel.tsx`) -> PASS.
- Local persistence + simple list view -> `appendFeedbackItem`/`readFeedbackItems` in `apps/desktop/src/feedbackStore.ts` and rendered list in `apps/desktop/src/feedbackPanel.tsx` -> PASS.
- Copy explicitly local-only / no external reporting implication -> "Feedback stays local on this device. Nothing is sent anywhere." (`apps/desktop/src/feedbackPanel.tsx`) -> PASS.
- Empty/error states and success confirmation -> empty list message + storage error notices + save success notice (`apps/desktop/src/feedbackPanel.tsx`, `apps/desktop/src/App.tsx`) -> PASS.
- Deterministic submit test -> `apps/desktop/src/feedbackPanel.test.tsx` -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- No live interactive desktop visual run was executed in this sandbox; minor styling/layout regressions are still possible until a manual runtime pass is done.

Suggested commit message: `QA: validate T-0012 local feedback capture flow and evidence`

Next-step suggestion: PM should review `T-0012` in `review/` and move it to `done/` if the QA evidence is sufficient.
