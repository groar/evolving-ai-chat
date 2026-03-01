# T-0048: Fix duplicate "Feedback" heading in feedback panel

## Metadata
- ID: T-0048
- Status: ready
- Priority: P2
- Type: bug
- Area: ui
- Epic: E-0008
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
The feedback panel renders "Feedback" as both the top-level page/panel title and as the section header inside the panel, causing the word to appear twice in immediate succession. This looks like an error and contributes to user confusion about the panel's purpose.

## Context
- Identified during E-0007 tier-2 probe session (F-20260301-006); sponsor called it out explicitly.
- Screenshot: `assets/Capture_d_e_cran_2026-03-01_a__19.54.07-01e121bd-5a3f-4fb8-a479-14a2eb66ef7e.png`.
- Part of M6.1 loop legibility work (E-0008).

## References
- `F-20260301-006`
- `tickets/meta/epics/E-0008-m6.1-loop-legibility.md`

## Design Spec

### UI Spec Addendum
- Primary job-to-be-done: User opens the panel and immediately understands they can leave feedback about this conversation.
- Primary action and what must be visually primary: the feedback text input and the "Feedback about this conversation" label.
- Navigation / progressive disclosure notes: the panel title (header bar) should be the only place the word "Feedback" appears as a heading. The section body should start with the descriptive subheading or the form directly.
- Key states to design and verify:
  - Default: panel open, empty feedback text area, context reference visible.
  - Filled: text entered, categories checked, Save Feedback enabled.
- Copy constraints:
  - Panel header: "Feedback" (once).
  - Section subheading: use a descriptive phrase (e.g. "About this conversation") rather than repeating "Feedback".
  - Must not imply feedback is submitted automatically or that the agent acts on it immediately.

## Acceptance Criteria
- [ ] The word "Feedback" appears at most once as a heading/title within the feedback panel view.
- [ ] The panel body uses a descriptive subheading or label (not a repeat of "Feedback") to orient the user to the form.
- [ ] Existing feedback form functionality (text input, category checkboxes, context reference, Save Feedback button) is unchanged.
- [ ] `settingsPanel.test.tsx` passes; no regressions.

## User-Facing Acceptance Criteria
- [ ] A user opening the feedback panel sees no duplicated "Feedback" heading.

## UX Acceptance Criteria
- [ ] Copy is unambiguous and does not repeat the same word consecutively as a heading.

## Feedback References
- `F-20260301-006`

## Dependencies / Sequencing
- Part of E-0008 M6.1 batch; can ship independently.

## Evidence (Verification)
- Tests run: _(to be filled)_
- Manual checks performed: _(to be filled)_

## Change Log
- 2026-03-01: Ticket created from E-0007 tier-2 probe findings (F-20260301-006).
