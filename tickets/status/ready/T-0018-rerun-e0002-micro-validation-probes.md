# T-0018: Rerun E-0002 micro-validation probes (post T-0017) and record results

## Metadata
- ID: T-0018
- Status: ready
- Priority: P2
- Type: chore
- Area: ui
- Epic: E-0002
- Owner: pm-agent
- Created: 2026-02-28
- Updated: 2026-02-28

## Summary
Now that Settings is explicitly discoverable and runtime-offline copy is scoped (T-0017), rerun the E-0002 tier-2 micro-validation probes with a fresh human observer and record the results so the original usability loop is actually closed.

## Context
E-0002 was marked done as an engineering milestone, but its Validation Plan was blocked by the initial "cannot find Settings" failure. This ticket exists to close the open validation loop and capture any remaining UX mismatches as concrete follow-up work (if needed).

## References
- `tickets/meta/epics/E-0002-m1-first-self-improvement-cycle.md` (Validation Plan)
- `tickets/status/done/T-0017-settings-discoverability-and-runtime-messaging.md`
- Feedback: `tickets/meta/feedback/inbox/F-20260228-001-settings-navigation-confusing.md`

## Acceptance Criteria
- [ ] Run the 3 E-0002 probes with at least 1 fresh observer (no prior exposure to the UI).
- [ ] Record verbatim answers + short interpretation in the Evidence section below (or link to a dated PM checkpoint entry).
- [ ] If any probe indicates confusion or false beliefs about data safety/rollback, create a new feedback item and at least one scoped ticket linked to it.
- [ ] If probes are clean, mark this ticket as complete with a one-line rationale.

## Micro-Validation Probes (Optional; Tier 2/3)
- Probes (answer in 1-2 sentences each):
  - In Settings, what do you think "Switch to Stable" does? What do you think it does not do?
  - What do you think "Reset Experiments" does? Would you expect it to affect your conversations/data?
  - After using the changelog once, do you feel you can understand "what changed + why" in under 10 seconds?
- Timing:
  - After T-0017 is accepted (done).
- Where results will be recorded:
  - This ticket Evidence section, or a dated PM checkpoint entry in `tickets/meta/feedback/`.

### UI Spec Addendum (Required If `Area: ui`)
- Primary job-to-be-done:
  - Verify a first-time user can correctly interpret the Settings controls related to release channels and experiments.
- Primary action and what must be visually primary:
  - The probes are the primary action; the UI should not require hunting to reach `Settings`.
- Navigation / progressive disclosure notes (what is secondary, and where it lives):
  - Settings should be discoverable as a clear entry point from the default surface (no “hidden” controls implied by runtime errors).
- Key states to design and verify (happy, empty, error/offline):
  - Runtime offline: probe questions should still be answerable without implying conversations/data are at risk.
- Copy constraints (what must not be implied):
  - “Switch to Stable” must not imply data loss.
  - “Reset Experiments” must not imply conversations/history are deleted.

## Evidence (Verification)
- Notes:
- Observer(s):
- Probe answers:
  - Probe 1:
  - Probe 2:
  - Probe 3:
- Interpretation:
- Follow-ups created (if any):

## Change Log
- 2026-02-28: Ticket created as follow-up validation for E-0002.
- 2026-02-28: Groomed to `ready/` (added UI spec addendum and clarified evidence capture expectations).
