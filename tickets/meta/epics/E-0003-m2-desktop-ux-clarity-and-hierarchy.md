# E-0003: M2 — Desktop UX clarity and hierarchy

## Metadata
- ID: E-0003
- Status: in-progress
- Owner: pm-agent
- Created: 2026-02-28
- Updated: 2026-02-28

## Goal
Make the desktop app read and behave like a chat product first (clear primary flow, clear next action, trustworthy states), while keeping advanced/dev features available via progressive disclosure.

## Definition of Done
- Primary flow is obvious on first launch:
  - user can create/pick a conversation and send a message without being distracted by advanced controls.
- "Runtime offline/unavailable" state is:
  - communicated once (not duplicated),
  - scoped to affected features,
  - actionable (user knows what to do next).
- Settings/Feedback/Advanced surfaces are discoverable but do not dominate the default UI.
- Copy avoids implementation details unless the user opted into an advanced/developer view.
- At least one deterministic UI regression guard exists for each major UX decision (nav labels, runtime banner copy/behavior, empty state copy).

## Validation Plan
- Default: tier 2 targeted micro-validation (internal, sponsor) after T-0019..T-0021 land.
- Probes (answer in 1-2 sentences each):
  - On first launch, what do you think this app is for, and what would you do first?
  - When you see the runtime banner, what do you think is broken (if anything) and what would you do next?
  - Can you find Settings and tell me what is "safe" to use while offline?
- Evidence: record results in a dated PM checkpoint entry in `tickets/meta/feedback/` and link it from the accepted tickets.

## Non-goals
- Full visual rebrand or a bespoke design system overhaul.
- Complex onboarding or guided tours.
- Removing advanced features (only moving and clarifying them).

## Linked Feedback
- F-20260228-002

## Linked Tickets
- T-0019 Desktop nav hierarchy + progressive disclosure
- T-0020 Runtime offline UX and actionable guidance
- T-0021 Empty state + copy cleanup (reduce implementation leakage)
- T-0022 Rerun E-0003 micro-validation probes and record results
- T-0023 Runtime-offline banner persists when runtime is running
- T-0024 Settings controls not understandable to a fresh observer (stable/experiments/proposals)

## Progress (Ticket Status)
- Done:
  - T-0019 Desktop nav hierarchy + progressive disclosure
  - T-0020 Runtime offline UX and actionable guidance
  - T-0021 Empty state + copy cleanup (reduce implementation leakage)
- Ready:
  - T-0023 Runtime-offline banner persists when runtime is running
  - T-0024 Settings controls not understandable to a fresh observer (stable/experiments/proposals)
- Blocked:
  - T-0022 Rerun E-0003 micro-validation probes and record results

## Notes
The current UI is a useful engineering workbench, but it cannot be the default surface if the product claim is "chat". This milestone is about hierarchy and comprehension, not "pretty".
Fresh-observer probes for E-0002 on 2026-02-28 indicate Settings terminology and runtime reachability states still undermine trust; T-0023 and T-0024 are prioritized as follow-ups before re-running E-0003 probes (T-0022).
