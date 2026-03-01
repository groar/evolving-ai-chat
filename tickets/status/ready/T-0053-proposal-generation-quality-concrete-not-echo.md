# T-0053: Proposal generation quality — proposals must be concrete, not feedback echoes

## Metadata
- ID: T-0053
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0009
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Improve the proposal generation step so it produces specific, actionable proposals rather than re-stating the user's raw feedback. The current generator populates the proposal title/description by copying the feedback form input; after this ticket, it must apply the proposal quality rules defined in T-0052 and output a proposal that names the target, describes the change, and provides rationale.

## Context
- T-0051 Evidence (sponsor): "it seems just like a copy of the feedback itself."
- The existing proposal generation path (wired in T-0046) populates proposal fields from the feedback form submission directly. This was sufficient for a first-pass loop test but is not useful for real evolution.
- T-0052 defines the quality rules; this ticket implements the enforcement.
- Reference: `docs/m1-first-improvement-loop.md` (artifact format), `docs/m7-improvement-classes.md` (to be created by T-0052).

## Design Spec
See T-0052 § "Proposal Quality Rules". This ticket implements those rules for the existing `settings-trust-microcopy-v1` class as well as any class registered going forward.

## Acceptance Criteria
- [ ] Proposal generator applies the four quality rules from T-0052 before writing to the proposal artifact.
- [ ] If a generated proposal fails any quality rule, it is either regenerated (up to 2 retries) or surfaces a "could not generate a concrete proposal" error state in the proposals panel — no silent echo proposals.
- [ ] The proposal `Title` field for a `settings-trust-microcopy-v1` trigger is a concrete description (e.g. "Rename 'Safe Offline' label to 'Works without internet'") not the raw feedback text.
- [ ] Existing proposals panel tests updated to reflect new title/description format.
- [ ] At least two new unit tests added: one that asserts a feedback echo is rejected, one that asserts a compliant proposal passes.
- [ ] QA checkpoint filed in `tickets/meta/qa/` after verification.

## UI Spec Addendum
- Proposals panel: if generation fails quality check and retries exhausted, show inline message: "We couldn't generate a specific improvement for this feedback. Try describing the issue in more detail."
- No new UI surfaces; existing proposal form fields (Title, Rationale) receive pre-populated concrete values.

## Dependencies / Sequencing
- Depends on: T-0052 (design spec and quality rules).
- Does not block: T-0054 (can run in parallel).
- T-0055 should begin after this ticket is in review (so the new class benefits from improved generation).

## Change Log
- 2026-03-01: Created by PM checkpoint (M7 scoping). Moved to ready.
