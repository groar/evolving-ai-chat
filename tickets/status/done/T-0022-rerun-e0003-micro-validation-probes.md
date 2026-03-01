# T-0022: Rerun E-0003 micro-validation probes and record results

## Metadata
- ID: T-0022
- Status: done
- Priority: P2
- Type: chore
- Area: ui
- Epic: E-0003
- Owner: pm-agent
- Created: 2026-02-28
- Updated: 2026-03-01

## Summary
After T-0019..T-0021, rerun the E-0003 tier-2 micro-validation probes with at least one fresh observer and record the results so the UX clarity/hierarchy milestone is actually closed with user-perception evidence.

## Context
The external designer review (F-20260228-002) identified trust and hierarchy issues (debug-console feel, unclear next action, duplicated runtime-offline messaging, and implementation-leaking copy). The underlying UI fixes shipped in T-0019..T-0021; this ticket captures the follow-up human validation that the updated UI now reads as a chat product first.

## Blocker (Resolved 2026-03-01)
Resolved: T-0023 done (banner fixed); T-0025 implemented offline safety + Settings fixes. Probes can run against current build.


## References
- `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md` (Validation Plan)
- Feedback: `tickets/meta/feedback/inbox/F-20260228-002-ui-ux-needs-redesign.md`

## Feedback References (Optional)
- F-20260228-002

## Acceptance Criteria
- [x] Run the 3 E-0003 probes with at least 1 fresh observer (no prior exposure to the UI).
- [x] Record verbatim answers + short interpretation in the Evidence section below (or link to a dated PM checkpoint entry).
- [x] If any probe indicates confusion about “what this app is” or what is safe/usable while offline, create a new feedback item and at least one scoped ticket linked to it.
- [x] If probes are clean, mark this ticket as complete with a one-line rationale and update E-0003 status.

## Micro-Validation Probes (Optional; Tier 2/3)
- Probes (answer in 1-2 sentences each):
  - On first launch, what do you think this app is for, and what would you do first?
  - When you see the runtime banner, what do you think is broken (if anything) and what would you do next?
  - Can you find Settings and tell me what is "safe" to use while offline?
- Timing:
  - After T-0019..T-0021 are accepted.
- Where results will be recorded:
  - This ticket Evidence section, or a dated PM checkpoint entry in `tickets/meta/feedback/`.

### UI Spec Addendum (Required If `Area: ui`)
- Primary job-to-be-done:
  - Verify first-run mental model, next action clarity, and “offline vs broken” interpretation.
- Primary action and what must be visually primary:
  - Conversations + composer should read as the primary flow; advanced controls should feel secondary.
- Navigation / progressive disclosure notes (what is secondary, and where it lives):
  - Settings/Feedback/Advanced should be findable without dominating the default Conversations view.
- Key states to design and verify (happy, empty, error/offline):
  - First-run empty state; runtime offline banner; navigation to Settings.
- Copy constraints (what must not be implied):
  - Runtime-offline messaging must not imply the whole app is broken.
  - Offline copy must not imply data loss or that local-only settings are unavailable.

## Evidence (Verification)
- Notes: Post-T-0025 build; fresh observer.
- Observer(s): sponsor
- Probe answers:
  - Probe 1 (first launch, what is this, what would you do?): "this is an AI chatbot, I would send messages to try it"
  - Probe 2 (runtime banner, what seems broken, what next?): "some kind of local service has to run, I should start it (if I can)"
  - Probe 3 (Settings, what is safe offline?): "safe to browse history, use feedback, toggle early access features, etc."
- Interpretation: All three probes pass. Mental model correct (AI chatbot); offline banner no longer implies "AI runs online"—observer infers local service; Settings "Safe while offline" section is comprehensible.
- Follow-ups created (if any): none (probes clean).

## Subtasks
- [x] Run probes with fresh observer
- [x] Document results + interpretation
- [x] Create follow-ups (if needed)
- [x] Update E-0003 status/notes

## Change Log
- 2026-02-28: Ticket created; moved to `blocked/` pending runtime/banner and Settings clarity fixes.
- 2026-03-01: Blocker resolved (T-0023 done, T-0025 implemented fixes); moved to `ready/`.
- 2026-03-01: Probes run; all pass; moved to `done/`.
