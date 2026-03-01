# T-0025: Clarify offline safety and simplify Settings copy/layout

## Metadata
- ID: T-0025
- Status: ready
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0003
- Owner: pm-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Fresh-observer micro-validation after T-0024 shows Settings remains hard to understand: "No idea what is safe or not offline", "mysteriously worded", "super wordy ... jargon", and cramped/narrow layout. In the offline state, the observer inferred "the AI runs online" because chat was unusable and the banner emphasized retrying.

This ticket simplifies and re-frames offline safety and Settings copy/layout so a fresh observer can quickly understand:
- what still works offline,
- what requires the runtime,
- and what channel/reset controls do and do not do.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - A fresh observer can answer "what is safe to use while offline?" in 10 seconds from the UI.
  - Offline state does not reframe the product as online-first; it communicates "some features require the local runtime" (without jargon).
  - Settings copy becomes scannable (less wordy; fewer paragraphs; clearer headings).
  - Layout is readable at common laptop widths (avoid overly narrow text columns).
- Non-goals:
  - Re-architecting runtime behavior to make chat work offline.
  - Large navigation/IA overhaul (separate ticket if needed).
- Rules and state transitions:
  - Offline messaging must distinguish:
    - "App works" vs "Chat/AI features require runtime".
  - Safety copy must preserve constraints from T-0024:
    - switching channel does not delete conversations/history,
    - resetting early-access features does not delete conversations/history,
    - switching channel does not roll back code.
- User-facing feedback plan:
  - Rerun the E-0003 probes with a fresh observer and compare against the 2026-03-01 results in T-0024.
- Scope bounds:
  - Copy + small layout adjustments; no backend changes required.
- Edge cases / failure modes:
  - Runtime unavailable: user should still be able to navigate and use non-runtime settings without feeling the app is "broken".
  - Narrow window: Settings content should wrap reasonably and remain scannable.
- Validation plan:
  - Deterministic:
    - UI tests assert the presence of an explicit "Safe while offline" (or equivalent) section with concrete bullets.
    - UI tests assert offline banner copy does not claim "online" and avoids implying data loss.
  - Micro-validation:
    - rerun E-0003 probes; record verbatim answers in Evidence.

### UI Spec Addendum (Required If `Area: ui`)
- Primary job-to-be-done:
  - Help first-time users understand safety and availability when the runtime is unavailable.
- Primary action and what must be visually primary:
  - Chat is primary; if chat is disabled, the UI must still clearly communicate why and what can be done next.
- Navigation / progressive disclosure notes (what is secondary, and where it lives):
  - Keep advanced concepts (early-access features, improvements/change drafts) behind disclosure; default view should be short.
- Key states to design and verify (happy, empty, error/offline):
  - Runtime available, runtime unavailable, narrow window.
- Copy constraints (what must not be implied):
  - Do not imply data loss.
  - Do not imply switching channels "rolls back code".
  - Avoid ambiguous "runtime" jargon without definition; prefer "local service" or "local AI service" if needed.

## Context
From 2026-03-01 probes (fresh observer):
- Probe 3: "No idea what is safe or not offline" + Settings copy perceived as obscure/jargony/wordy and cramped.
- Probe 2 (offline state): observer inferred "AI runs online" because chat could not be used while offline; they would click Retry.

This blocks E-0003's UX clarity milestone.

## References
- Evidence: `tickets/status/review/T-0024-settings-controls-not-understandable-to-fresh-observer.md`
- Feedback: `tickets/meta/feedback/inbox/F-20260301-001-settings-offline-safety-unclear-and-copy-too-jargony.md`
- Epic: `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md`

## Feedback References (Optional)
- F-20260301-001

## Acceptance Criteria
- [ ] In Settings, an explicit "Safe while offline" (or equivalent) section exists and lists at least 2 concrete things the user can do while offline.
- [ ] Offline/runtime-unavailable banner copy communicates:
  - [ ] chat is unavailable because a local service is not reachable,
  - [ ] what the user should do next (retry/start service),
  - [ ] and does not claim or imply "the AI runs online".
- [ ] Settings copy is measurably less wordy:
  - [ ] no multi-paragraph blocks in the default view (use short headings + bullets).
- [ ] Settings layout is scannable at laptop widths (avoid overly narrow copy column).
- [ ] Regression coverage exists for the above rules.
- [ ] Tier-2 micro-validation rerun: fresh observer can answer "what is safe offline?" without facilitator explanation.

## Micro-Validation Probes (Optional; Tier 2/3)
- Probes (answer in 1-2 sentences each):
  - When the app is offline/unavailable, what do you think is broken (if anything) and what would you do next?
  - Can you find Settings and tell me what is safe to use while offline?
- Timing:
  - After copy/layout adjustments ship.
- Where results will be recorded:
  - Ticket Evidence section.

## Subtasks
- [ ] Design/copy pass (offline banner + Settings safety section)
- [ ] Implement UI copy/layout changes
- [ ] Add/adjust tests
- [ ] Run probes + record results

## Change Log
- 2026-03-01: Ticket created from fresh-observer probes after T-0024.
