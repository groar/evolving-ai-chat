# QA Checkpoint - 2026-03-01 (T-0046)

## Scope Tested
- Ticket: T-0046 (`tickets/status/review/T-0046-m6-proposal-from-feedback-first-instance.md`)
- Area: core — Generate from feedback, proposal form population, Improvements section copy changes

## Automated Test Outcomes
- `cd apps/desktop && npm test -- src/settingsPanel.test.tsx`: PASS (16 tests).
- Desktop build: PASS.
- Validation `npm run validate`: runtime-contract-smoke skipped (port binding in sandbox); desktop-build passed.

## Test Plan Executed
1. **Generate from feedback affordance**: Dropdown appears when feedback items exist; selecting an item populates form.
2. **Form population**: Title ("Clarify: " + feedback.text), rationale (feedback.text), feedback IDs, diff_summary (first-instance mapping), risk_notes (copy-only default).
3. **Copy changes**: "Change Drafts" → "Suggested improvements"; "Draft an Improvement" → "Suggest an improvement"; "No change drafts yet" → "No suggestions yet."
4. **CreateProposalInput**: Extended with diff_summary and risk_notes; useRuntime passes them to API.

## Criteria-to-Evidence Mapping
- Generate-from-feedback affordance -> Dropdown with "Generate from feedback:" label when feedback exists -> PASS.
- Form population -> Test asserts title, rationale, feedback IDs, diff_summary, risk_notes after select -> PASS.
- Submit via existing flow -> CreateProposalInput unchanged for core flow; diff_summary/risk_notes optional -> PASS.
- Copy changes -> Tests assert "Suggested improvements", "Suggest an improvement", "No suggestions yet." -> PASS.
- E2E smoke -> Pending manual: capture feedback → generate → validate → accept → changelog visible; runtime required -> DEFERRED (manual run recommended).
- Deterministic tests -> 16 settingsPanel tests pass including generate-from-feedback and copy strings -> PASS.

## Copy Regression Sweep (User-Facing Text Changed)
- Reviewed: Improvements section header, button labels, empty state, form label, intro text.
- Term consistency: "suggestion" / "Suggested improvements" aligned with M6 spec.
- Promise control: "Nothing ships automatically" preserved; no implied autonomous shipping.

## Bugs Found
- None.

## Outstanding Risks
- E2E smoke (feedback → generate → validate → accept → changelog) not run in QA environment; runtime stub failed in sandbox. Recommend manual run before/after PM acceptance.

**Suggested commit message:** `T-0046: M6 Generate-from-feedback + first instance copy changes (Suggested improvements)`

**Next-step suggestion:** PM should accept T-0046 to `done/`. Optional: run manual E2E (feedback capture → generate → validate → accept) to complete epic E-0007 smoke gate.
