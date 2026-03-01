# T-0054: Feedback entry point copy — signal software evolution, not AI model quality

## Metadata
- ID: T-0054
- Status: done
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0009
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Revise the feedback button label, feedback form heading, and inline hints so that users understand they are helping the software evolve — not rating the AI model's output quality. The current copy ("Feedback", "About this response", "What felt confusing about this response?") primes an AI-rating mental model; updated copy should prime a software-improvement mental model.

## Context
- F-20260301-007: sponsor raised concern that feedback button implies "rate the AI."
- T-0051 Evidence: sponsor's first instinct on seeing the button was "quality of the answer / tone of the answer" (AI-rating frame) before correcting to software evolution.
- E-0008 fixed the UX mechanics (navigation, heading, form complexity) but did not change the copy framing.
- This ticket addresses the copy and framing layer only; no structural UI changes.

## Design Spec

### Goals
- Change copy so the primary mental model on first contact is "I'm helping the software improve" not "I'm rating this AI answer."
- Preserve clarity: the user still understands they are reacting to a specific AI response, but the frame is "software improvement" not "model quality."

### Non-goals
- Restructuring the feedback panel layout (E-0008 scope).
- Changing the feedback form fields or their validation.
- Moving the feedback button to a different location.

### Copy Change List

| Location | Current copy | New copy | Must not imply |
|---|---|---|---|
| Feedback button (per message) | "Feedback" | "Improve" or "Help improve" | "Rate" or "Thumbs up/down" |
| Feedback form heading | "Feedback" or "About this response" | "Help improve this software" | "Rate this answer" or "How was this response?" |
| Feedback form subheading/hint | "What felt confusing about this response?" | "What should this software do differently?" | "Was this response accurate?" or "Did the AI do a good job?" |
| Feedback category label for tone | (existing label) | "Response tone & style" | "AI quality" |
| Feedback form submit button | "Submit Feedback" | "Submit Improvement" | "Rate" |

Note: exact wording should be confirmed with sponsor if time permits; implementer may proceed with the above as defaults.

### User-Facing Feedback Plan
- After the change, the full feedback flow reads: [Improve] → "Help improve this software" → "What should this software do differently?" → categories → submit.
- A user unfamiliar with the product should naturally read this as "I'm telling the software how to work better" not "I'm giving the AI a score."

### Scope Bounds
- Copy changes only: button label, form heading, form hint/subheading, category labels, submit label.
- No structural component changes.
- Update Playwright / Vitest selectors that rely on the old copy strings.

### Edge Cases
- Tooltip or aria-label on the feedback button should also be updated to match (accessibility parity).
- If any test fixture contains the old copy strings, update them to avoid false failures.

## Acceptance Criteria
- [x] Feedback button label changed to "Improve" (or "Help improve") — old label "Feedback" removed from the per-message action.
- [x] Feedback form heading changed to "Help improve this software."
- [x] Form subheading/hint changed to "What should this software do differently?"
- [x] Tone/style category label does not contain "AI quality" or "response quality." (Added "Response tone & style" tag.)
- [x] Submit button reads "Submit Improvement."
- [x] All previous copy strings replaced in tests and Playwright selectors; no broken test references to old copy.
- [x] Manual check: a fresh observer reading the flow should describe it as "software feedback/improvement" not "AI rating." (QA heuristic pass.)
- [x] QA checkpoint filed in `tickets/meta/qa/` after verification.

## UI Spec Addendum
- No new UI surfaces or layout changes.
- Tooltip / aria-label parity: button `aria-label` must match visible label.
- No animation or style changes required.

## Dependencies / Sequencing
- Independent of T-0052 and T-0053; can run in parallel.
- Should be ordered before T-0055 in the ready queue (lower risk, faster to ship, sets the right framing before the new class lands).

## Evidence
- App.tsx: per-message button label "Feedback" → "Improve"; aria-label "Help improve this software".
- feedbackPanel.tsx: section heading "Help improve this software"; form hint "What should this software do differently?"; submit "Submit Improvement"; "New feedback" → "New improvement"; "Captured Items" section kept; empty state "No improvements captured yet."
- feedbackStore.ts: added FeedbackTag "tone" with label "Response tone & style."
- Settings section h3: "Feedback" → "Improve."
- feedbackPanel.test.tsx: assertions updated for new copy; all 4 tests pass.
- Vitest: all tests pass.

## Change Log
- 2026-03-01: Created by PM checkpoint (M7 scoping). Linked F-20260301-007. Moved to ready.
- 2026-03-01: Implementation complete. Copy changes applied per design spec. Moved to review.
- 2026-03-01: QA checkpoint passed. PM accepted. Moved to done.
