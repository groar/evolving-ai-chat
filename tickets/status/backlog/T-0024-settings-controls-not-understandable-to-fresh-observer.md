# T-0024: Settings controls not understandable to a fresh observer (stable/experiments/proposals)

## Metadata
- ID: T-0024
- Status: backlog
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0003
- Owner: ai-agent
- Created: 2026-02-28
- Updated: 2026-02-28

## Summary
Fresh-observer micro-validation indicates that the Settings surface (including “Switch to Stable”, “Reset Experiments”, and the changelog/proposals concepts) is not self-explanatory (“No idea”, “super crowded”, “what is a proposal/experiment?”). This blocks trust in the safety/rollback promise and prevents the intended validation loop from completing.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - A fresh observer can correctly explain what “Switch to Stable” does and does not do (no data-loss implication).
  - A fresh observer can correctly explain what “Reset Experiments” does and does not do (no conversation/history deletion implication).
  - The Settings/Changelog/Proposals surfaces feel scannable rather than “super crowded”.
  - The user can answer “what is a proposal?” from the UI itself (short definition or contextual help).
- Non-goals:
  - Full visual redesign or a new design system.
  - Removing proposals/experiments as concepts (instead: clarify and progressively disclose).
- Rules and state transitions:
  - Canonicalization: there must be exactly one place to change release channel (no duplicated “stable” controls).
  - Concepts must be defined in-place (one line) the first time they appear, or behind a lightweight “What’s this?” affordance.
  - Advanced concepts (proposals/experiments) should not be visually peer-level with the primary chat flow.
- User-facing feedback plan:
  - Rerun the E-0002 probes after shipping this ticket; record verbatim answers and interpretation.
- Scope bounds:
  - Copy + small layout adjustments + progressive disclosure; no backend changes required.
- Edge cases / failure modes:
  - Runtime offline: the UI must still correctly communicate what is safe/available and not overload the user with jargon.
- Validation plan:
  - Deterministic: add/adjust UI tests to assert:
    - only one release channel control exists,
    - “Switch to Stable” and “Reset Experiments” helper copy includes “does not delete conversations/history” constraint.
  - Micro-validation: rerun the 3 E-0002 probes and record results.

### UI Spec Addendum (Required If `Area: ui`)
- Primary job-to-be-done:
  - Help a first-time user understand safety/rollback controls and the self-improvement loop without prior context.
- Primary action and what must be visually primary:
  - Conversations + chat composer are primary; Settings is discoverable but does not feel like a “control panel first”.
- Navigation / progressive disclosure notes (what is secondary, and where it lives):
  - Proposals/experiments and any diagnostics should be behind clear progressive disclosure (Advanced or “Learn more”).
- Key states to design and verify (happy, empty, error/offline):
  - Runtime offline state, Settings open with runtime-backed surfaces unavailable, first-time viewing of Proposals/Changelog.
- Copy constraints (what must not be implied):
  - No implication that switching channels or resetting experiments deletes data or rolls back code.
  - Avoid jargon without definition (“proposal”, “experiment”, “runtime”) in default view.

## Context
E-0002’s tier-2 probes (fresh observer) produced “No idea” answers for both controls and a strong confusion signal for “proposal/experiment” concepts, indicating the UX still reads as a crowded, technical console rather than a safe, comprehensible chat product.

## References
- Probe results: `tickets/status/done/T-0018-rerun-e0002-micro-validation-probes.md`
- Feedback: `tickets/meta/feedback/inbox/F-20260228-003-e0002-probe-failed-runtime-offline-and-settings-confusion.md`
- Epic: `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md`

## Feedback References (Optional)
- F-20260228-003

## Acceptance Criteria
- [ ] “Switch to Stable” has adjacent helper copy that makes its effect and non-effect clear (explicitly: no conversation/history deletion).
- [ ] “Reset Experiments” has adjacent helper copy that makes its effect and non-effect clear (explicitly: no conversation/history deletion).
- [ ] The UI defines “proposal” and “experiment” in user terms at point of need (1 line each or equivalent “What’s this?”).
- [ ] There is exactly one release channel control surface (no duplicated “stable” controls in different locations).
- [ ] Regression coverage exists for the above rules.

## Micro-Validation Probes (Optional; Tier 2/3)
- Probes (answer in 1-2 sentences each):
  - In Settings, what do you think "Switch to Stable" does? What do you think it does not do?
  - What do you think "Reset Experiments" does? Would you expect it to affect your conversations/data?
  - After using the changelog once, do you feel you can understand "what changed + why" in under 10 seconds?
- Timing:
  - After the copy + progressive disclosure changes are shipped.
- Where results will be recorded:
  - Ticket Evidence section OR a dated PM checkpoint file in `tickets/meta/feedback/`.

## Subtasks
- [ ] Design/copy pass for Settings/Changelog/Proposals concepts
- [ ] Implement small UI adjustments (progressive disclosure)
- [ ] Add/adjust tests
- [ ] Rerun E-0002 probes and record results

## Change Log
- 2026-02-28: Ticket created from E-0002 micro-validation probe results (T-0018).
