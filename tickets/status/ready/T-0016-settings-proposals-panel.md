# T-0016: Settings proposals panel (draft + validate + decide)

## Metadata
- ID: T-0016
- Status: ready
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0002
- Owner: ai-agent
- Created: 2026-02-27
- Updated: 2026-02-27

## Summary
Add a minimal proposals panel to the existing Settings surface so the user can view proposal status, run validation, and accept/reject with clear guardrails and copy constraints.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Make proposals user-visible and actionable from within the product (no manual API calls).
  - Keep scope constrained to M1’s improvement class (`settings-trust-microcopy-v1`).
- Non-goals:
  - Multiple concurrent proposals.
  - General-purpose proposal editing UI for arbitrary code changes.
- Rules and state transitions:
  - Show proposal status derived from:
    - latest validation run status (pass/fail/missing),
    - decision status (pending/accepted/rejected).
  - Accept button is disabled unless latest validation is passing; if disabled, show the reason.
  - Reject requires a short note (1–2 sentences) to reduce silent rejection.
  - If a proposal is accepted, the user should see the result in the changelog surface (via T-0015).
- User-facing feedback plan:
  - Provide clear empty state ("No proposals yet") and a "Create proposal" affordance.
  - Copy constraints:
    - Must not imply the app will self-ship code changes.
    - Must not imply acceptance rolls back code/data.
- Scope bounds:
  - Settings-only UI surface; no new navigation routes required.
  - Keep inputs minimal: title, rationale, source feedback IDs (select from local list or paste IDs).
- Edge cases / failure modes:
  - Runtime unavailable: show non-blocking error and keep core chat usable.
  - Proposal list fetch fails: show retry.
- Validation plan:
  - Deterministic: UI test covers empty state + disabled accept when validation missing/failing.
  - Manual: create proposal -> add validation run -> accept/reject path smoke (can use existing smoke scripts as evidence).

## Context
The loop is not user-operable until the user can see and decide on proposals from within the app. This ticket provides the minimal UI required to "release" with explicit user approval.

## References
- `docs/m1-first-improvement-loop.md`
- `tickets/status/done/T-0008-changelog-and-rollback-ux.md`
- `tickets/status/done/T-0012-in-app-feedback-capture.md`
- `tickets/status/done/T-0013-change-proposal-artifact.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] Settings includes a "Proposals" section that lists existing proposals (most recent first).
- [ ] User can create a proposal from within the app and link 1+ feedback IDs (or explicitly create without linkage with required title + rationale).
- [ ] User can attach a validation run summary and see pass/fail status reflected immediately.
- [ ] User can accept a proposal only when latest validation is passing; accept writes an "accepted" decision with timestamp and optional notes.
- [ ] User can reject a proposal with a required rationale note; reject writes a "rejected" decision and creates no changelog entry.

## Micro-Validation Probes (Optional; Tier 2/3)
- Probes (1–3 prompts):
  - "What do you think accepting this proposal will do?"
  - "What do you think rejecting this proposal will do?"
  - "Is anything in the proposal status unclear or risky?"
- Timing:
  - After the first end-to-end proposal has been created, validated, and accepted/rejected via the Settings panel.
- Where results will be recorded:
  - Ticket Evidence section OR a dated PM checkpoint file in `tickets/meta/feedback/`.

## Release Note (Optional; Recommended For User-Facing Changes)
- Title: Review and decide on proposals in Settings
- Summary (1–2 lines, user-facing; avoid over-promising): Settings now shows change proposals and lets you validate and accept/reject them with clear guardrails.

## UX Acceptance Criteria (Only If `Area: ui`)
- [ ] Primary flow is keyboard-usable (no mouse required for core actions).
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.

## Dependencies / Sequencing (Optional)
- Depends on:
  - T-0015 (Proposal accept creates changelog entry)
  - T-0014 (Python runtime deps and test bootstrap)
- Blocks:
  - E-0002 milestone DoD (user can accept/reject and observe outcomes)

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint:
- Screenshots/artifacts:

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Design updates
- [ ] Implementation
- [ ] Tests
- [ ] Documentation updates

## Change Log
- 2026-02-27: Ticket created.
- 2026-02-27: Moved to `ready/` (depends on T-0015 for changelog linkage).
