# T-0050: Simplify proposal form UX — reduce complexity, add purpose explanation

## Metadata
- ID: T-0050
- Status: ready
- Priority: P1
- Type: improvement
- Area: ui
- Epic: E-0008
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
The "Suggest an improvement" proposal form currently shows all fields simultaneously (title, rationale, feedback IDs, diff_summary, risk_notes, timestamp-based ID) with generic placeholder text. A first-time user has no explanation of what the form does or why it has so many fields. During the E-0007 tier-2 probe, the primary user was overwhelmed, could not determine the form's purpose, and clicked "Save Draft" without understanding what they were doing. The form needs a brief purpose statement and should hide or collapse advanced fields that are pre-filled and rarely need editing.

## Context
- Identified during E-0007 tier-2 probe session (F-20260301-006).
- Screenshot: `assets/Capture_d_e_cran_2026-03-01_a__19.56.55-fe7ab879-dabe-442c-81e1-47b18b87a707.png`.
- Part of M6.1 loop legibility work (E-0008).
- The form works correctly (T-0046 shipped the generate-from-feedback logic); UX clarity is the gap.

## References
- `F-20260301-006`
- `tickets/status/done/T-0046-m6-proposal-from-feedback-first-instance.md`
- `tickets/meta/epics/E-0008-m6.1-loop-legibility.md`
- `docs/m1-first-improvement-loop.md`

## Design Spec
- Goals: a user who has never seen the proposal form should immediately understand (1) what it does, (2) what to review/edit, and (3) what happens when they save.
- Non-goals: changing proposal artifact schema; removing any fields from persistence; changing the underlying generate-from-feedback logic.
- Rules and state transitions:
  - Add a 1–2 sentence purpose description at the top of the form: e.g. "Review this suggested improvement. Edit if needed, then save — you can review and accept or discard it later."
  - Fields that are pre-filled and rarely need user editing (feedback ID reference, diff_summary, risk_notes, the timestamp-based proposal ID) should be visually de-emphasized (e.g. collapsed in an "Advanced" section, or shown as smaller read-only text).
  - Fields the user should review/edit: Title and Rationale must remain prominent and editable.
  - "Save Draft" button should be renamed to something that communicates next-step more clearly: e.g. "Save for review" or keep "Save Draft" but add a short clarifying label ("You can review or accept this later").
- User-facing feedback plan: user sees a short explanation, reviews Title and Rationale, clicks save, understands they can come back to review/accept.
- Scope bounds: form submission and existing field population logic (from T-0046) must not change.
- Edge cases / failure modes: if proposal is empty (no generate-from-feedback), form opens blank — ensure purpose description still makes sense in that context.
- Validation plan: tier-2 re-probe after M6.1 batch ships. Deterministic: test that form renders purpose description text; test that advanced fields are collapsed by default (or de-emphasized per implementation choice).

### UI Spec Addendum
- Primary job-to-be-done: User reviews a pre-generated improvement suggestion and decides whether to save/proceed or discard.
- Primary action and what must be visually primary: "Save Draft" (or renamed equivalent) button; Title and Rationale fields.
- Navigation / progressive disclosure notes: feedback IDs, diff_summary, risk_notes, proposal ID → secondary / collapsible "Advanced" section. The form should not look like a raw API form.
- Key states:
  - Pre-filled (from generate-from-feedback): purpose description visible, Title + Rationale prominent, advanced section collapsed.
  - Empty (manual entry): same layout; Title and Rationale blank but clearly labeled.
- Copy constraints:
  - Purpose description must not promise "the app will automatically implement this".
  - Must not imply immediate shipping or data deletion.
  - "Advanced" or equivalent label must not imply danger.

## Acceptance Criteria
- [ ] A 1–2 sentence purpose description is visible at the top of the proposal form.
- [ ] Title and Rationale fields are the most visually prominent editable fields.
- [ ] Pre-filled fields that rarely need editing (feedback IDs, diff_summary, risk_notes, proposal ID) are de-emphasized (collapsed, secondary, or shown as read-only metadata) by default.
- [ ] Existing field population from generate-from-feedback is unchanged (auto-fill still works).
- [ ] Save action and its copy do not imply autonomous shipping; clarifying label or button copy added.
- [ ] `settingsPanel.test.tsx` passes; no regressions in existing proposal form tests.
- [ ] New test verifies purpose description text is rendered.

## User-Facing Acceptance Criteria
- [ ] A user seeing the proposal form for the first time can describe what it does within ~10 seconds (to be re-probed in E-0008 tier-2 gate).
- [ ] Copy does not imply the improvement will ship automatically.

## UX Acceptance Criteria
- [ ] Advanced/secondary fields are not visible by default (collapsed or de-emphasized).
- [ ] Form is usable without reading all fields.
- [ ] Empty and pre-filled states are both clear and actionable.

## Feedback References
- `F-20260301-006`

## Dependencies / Sequencing
- Blocks: E-0008 comprehension gate re-run.
- Can ship alongside T-0048 and T-0049 in same M6.1 batch.

## Evidence (Verification)
- Tests run: _(to be filled)_
- Manual checks performed: _(to be filled)_

## Change Log
- 2026-03-01: Ticket created from E-0007 tier-2 probe findings (F-20260301-006).
