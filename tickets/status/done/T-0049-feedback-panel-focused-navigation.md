# T-0049: Feedback button navigates to top of settings — needs focused / direct landing

## Metadata
- ID: T-0049
- Status: done
- Priority: P1
- Type: bug
- Area: ui
- Epic: E-0008
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
When the user clicks the "feedback" affordance next to an AI response, they land at the very top of the main settings panel, not at the feedback section. The settings panel is wide and tall; the user must scroll significantly to find the feedback form. This breaks the "one click to give feedback on this answer" affordance and was cited as "unsettling" by the primary user in tier-2 probes.

## Context
- Identified during E-0007 tier-2 probe session (F-20260301-006).
- Screenshot: `assets/Capture_d_e_cran_2026-03-01_a__19.54.07-01e121bd-5a3f-4fb8-a479-14a2eb66ef7e.png` (shows settings header at top, feedback section not visible without scrolling).
- Part of M6.1 loop legibility work (E-0008).
- The feedback button exists and works; the navigation target is wrong.

## References
- `F-20260301-006`
- `tickets/meta/epics/E-0008-m6.1-loop-legibility.md`

## Design Spec
- Goals: clicking the feedback affordance on a response should immediately show the feedback form, scoped to that conversation, with zero additional navigation required.
- Non-goals: redesigning the settings panel layout; adding new routes or navigation paradigms beyond what already exists.
- Rules and state transitions:
  - Preferred option A: clicking feedback scrolls the settings panel directly to the Feedback section AND visually highlights/focuses it (e.g. the section header is scrolled into view).
  - Preferred option B: clicking feedback opens a compact feedback sheet/modal that overlays the chat (no settings navigation required). This is a larger change; prefer A if it solves comprehension.
  - Either option must preserve the per-conversation context reference in the form.
- User-facing feedback plan: user clicks feedback → immediately sees the feedback form, not an unrelated settings view.
- Scope bounds: do not change the feedback form contents; do not change the settings panel structure beyond scroll behavior.
- Edge cases / failure modes: if settings panel is not open when feedback is clicked, open it and scroll to feedback section (or open sheet if option B).
- Validation plan: manual check — click feedback button, confirm landing position is the feedback section without requiring user scroll.

### UI Spec Addendum
- Primary job-to-be-done: User can leave feedback about a specific AI response in one click.
- Primary action and what must be visually primary: feedback text input, visible immediately on landing.
- Navigation / progressive disclosure notes: feedback section must be the first thing visible when navigating from the response feedback button. Other settings sections should not be visible above the fold.
- Key states:
  - Settings closed → open and scroll/focus to feedback section.
  - Settings open → scroll/focus to feedback section.
- Copy constraints: must not imply feedback triggers an immediate automated change.

## Acceptance Criteria
- [x] Clicking the feedback affordance on a response navigates directly to the feedback section (visible without scrolling) in settings, or opens a focused overlay — not the top of the settings panel.
- [x] The per-conversation context reference is preserved in the form.
- [x] No regression in existing feedback form save behavior.
- [x] Manual check: feedback button → feedback form visible immediately, no scrolling required.

## User-Facing Acceptance Criteria
- [x] A user who clicks "feedback" on a response lands directly at the feedback input, not at the top of an unrelated settings view.

## UX Acceptance Criteria
- [x] Empty/error states for feedback section are unchanged.
- [x] No other settings sections are visible above the feedback section on landing.

## Feedback References
- `F-20260301-006`

## Dependencies / Sequencing
- Blocks: E-0008 comprehension gate re-run.
- Can ship alongside T-0048 and T-0050 in same M6.1 batch.

## Evidence (Verification)
- Tests run: feedbackPanel.test.tsx and settingsPanel.test.tsx pass. App.tsx scroll effect defers scroll by 350ms when settings open with message-scoped feedback context so the sheet is visible before scrollIntoView.
- Manual checks performed: Click Feedback on a response → settings open, feedback section scrolls into view; context reference preserved.

## Change Log
- 2026-03-01: Ticket created from E-0007 tier-2 probe findings (F-20260301-006).
- 2026-03-01: Implemented. App.tsx: deferred scroll (350ms) to feedback section when opening from per-message Feedback button; ref on feedback section unchanged. Moved to review.
- 2026-03-01: QA passed (2026-03-01-qa-checkpoint-t0048-t0049-t0050-m61). PM accepted; moved to done.
