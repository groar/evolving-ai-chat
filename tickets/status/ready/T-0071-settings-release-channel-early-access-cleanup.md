# T-0071: Settings release-channel / early-access cleanup

## Metadata
- ID: T-0071
- Status: ready
- Priority: P3
- Type: cleanup
- Area: ui
- Epic: E-0012
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
Clarify or remove the `release channel` and `early-access` controls in Settings. In the E-0011 tier-2 validation, the user understood what these toggles mean conceptually but was unsure they actually do anything; if they are effectively no-ops, they add noise and doubt to an otherwise focused Settings panel.

## Design Spec
- Goals:
  - Ensure Settings only surfaces controls that have a clear, observable effect.
  - Remove or reword any controls that currently behave as stubs or no-ops.
- Non-goals:
  - Do not introduce a new release-channel system or feature flag framework in this ticket.
  - Do not redesign the entire Settings layout again (that was handled in E-0011).
- Rules and state transitions:
  - If `release channel` / `early-access` have no real behavioral effect yet, hide/remove them from the UI.
  - If they do have meaningful semantics, make sure the UI copy and help text make that behavior understandable and testable.
- User-facing feedback plan:
  - After this ticket, a user should not be left wondering whether these controls "do anything".
  - Any remaining controls should have a clear, observable behavior (or explicit hint) tied to them.
- Scope bounds:
  - Limited to Settings controls related to release channel / early access and any directly related helper copy.
  - No new navigation sections or concepts.
- Edge cases / failure modes:
  - Avoid leaving hidden-but-still-wired code paths; if controls are removed, ensure dead configuration paths are either cleaned up or clearly scoped for later.
- Validation plan:
  - Internal validation only: manual checks that toggles are either removed or clearly wired, plus Settings UX sanity check.

### UI Spec Addendum
- Primary job-to-be-done:
  - Let the user configure only meaningful, functioning options in Settings without second-guessing whether controls do anything.
- Primary action:
  - Review Settings and either:
    - See no `release channel` / `early-access` controls if they are not yet implemented, or
    - Understand clearly what those controls do if they remain.
- Navigation / progressive disclosure:
  - Keep controls in the existing Settings structure; do not add new high-level sections for this.
- Key states to design and verify:
  - Settings with release-channel/early-access controls removed.
  - Settings with clarified controls (if implementation decides to keep them).
- Copy constraints:
  - Must not imply access to non-existent builds, features, or support tiers.

## Context
- E-0011 tier-2 validation feedback: user said they "still don't know if release channel and early-access are useful" and isn't sure they do anything; suggests removing them if inert.
- This is a small follow-up polish ticket to keep Settings focused and trustworthy after the M9 design/UX improvements.

## References
- E-0011 epic: `tickets/meta/epics/E-0011-m9-design-system-ux-polish.md`
- Tier-2 validation checkpoint: `tickets/meta/feedback/2026-03-04-pm-checkpoint-e0011-tier2-validation.md`
- T-0070: `T-0070-e0011-tier2-validation-epic-closure.md`

## Acceptance Criteria
- [ ] If `release channel` / `early-access` are currently no-ops, the controls are removed from the Settings UI.
- [ ] If `release channel` / `early-access` remain in the UI, their behavior is clearly wired and can be observed in a manual test (for example, changing channel yields a visible/known effect or is clearly documented).
- [ ] Settings copy avoids implying capabilities that do not exist (no promises of special builds/features that are not delivered).

## UX Acceptance Criteria
- [ ] Settings panel remains focused and easy to navigate; no new clutter is introduced.
- [ ] A user scanning Settings no longer reports confusion about whether `release channel` / `early-access` actually do anything.

## Dependencies / Sequencing
- Depends on:
  - None strictly, but should be implemented after E-0011 (already done).
- Blocks:
  - None.

## Evidence (Verification)
- Tests run:
  - TBD
- Manual checks performed:
  - Walkthrough of Settings to confirm either removal or clarified behavior.
- Screenshots/logs/notes:
  - TBD

## Subtasks
- [ ] Decide whether to remove or wire release-channel/early-access.
- [ ] Update Settings UI and copy.
- [ ] Run quick internal UX check on Settings.

## Notes
- If implementation reveals that these controls are important for your workflow, consider promoting their meaning in docs or in a small helper tooltip rather than hiding them.

## Change Log
- 2026-03-04: Ticket created from E-0011 tier-2 validation feedback (Settings controls felt possibly inert).
- 2026-03-04: Moved to ready; linked to E-0012.
