# F-20260301-006: E-0007 tier-2 probe — comprehension, value, trust all fail

## Metadata
- ID: F-20260301-006
- Status: ticketed
- Source: tier-2-micro-validation
- Theme: ux
- Severity: S1
- Linked Tickets: T-0047, T-0048, T-0049, T-0050
- Received: 2026-03-01
- Updated: 2026-03-01

## Raw Feedback (Sanitized)
**Comprehension probe ("What changed in the app, and why?"):**
> "I can see a 'feedback' next to the AI answer. If I click on it, I'm redirected to settings at the top of the menu (this is a bit unsettling), but if I scroll I see a 'Feedback session', and I can leave a feedback. Don't know what that has to do with the chatbot answer, since I can make it about anything else. Now that I look more closely I can see a 'context:' with a ref to the current discussion. Also the whole section is poorly presented to be honest. The 'feedback' title is copied twice for instance; and the settings menu is huge, you have to scroll a lot on a small width menu. Then there is an 'improvement' section, again very cumbersome, I click on a feedback, and there's lots of placeholder text. No idea what I have to do. I clicked on 'save draft' anyway. This is complex wow. I'm stopping here I don't understand what this."

**Value probe ("Was this change useful to you?"):**
> "Uh. no."

**Trust probe ("Do you trust this mechanism to propose future changes?"):**
> "It does propose changes? I just saw forms."

## Normalized Summary
The observe-propose-validate loop is not legible to the primary user. Three concrete blockers: (1) feedback button navigates to the top of settings rather than a focused feedback view; (2) "Feedback" panel heading is duplicated; (3) the proposal form is overwhelmingly complex with no explanation of purpose. The user completed feedback capture and accidentally saved a proposal draft but could not explain what they did or what value it produced.

## PM Notes
- Screenshots captured during the session show both issues clearly.
- E2E smoke was PARTIAL: user reached proposal form and clicked "Save Draft" but did not proceed to validate → accept → changelog.
- All three tier-2 probes failed (comprehension, value, trust) per E-0007 validation plan.
- Decision per E-0007: comprehension fail → UX work required before expanding improvement classes to M7.

## Triage Decision
- Decision: ticketed → T-0048 (duplicate heading), T-0049 (feedback navigation), T-0050 (proposal form UX). Epic E-0008 scoped for M6.1 legibility work.
- Rationale: All issues are UI/UX clarity problems traceable to specific components. Splitting into targeted tickets allows independent implementation.
- Revisit Trigger: after T-0048–T-0050 shipped; re-run tier-2 comprehension probe to verify gate passes.
