# QA Checkpoint - 2026-02-27 (T-0016)

## Scope Tested
- Ticket: T-0016 (`tickets/status/review/T-0016-settings-proposals-panel.md`)
- Area: settings proposals panel flows (create, validate, accept/reject guardrails) + copy and empty/error states

## Automated Test Outcomes
- `cd apps/desktop && npm test`: PASS (`2 files, 6 tests`).
- `cd apps/desktop && uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime/test_proposals.py`: PASS (`Ran 4 tests`).
- `cd apps/desktop && npm run smoke:fastapi`: PASS (managed runtime health + contract smoke).
- `cd apps/desktop && npm run smoke:storage`: PASS (proposal create + validation persistence checks included).

## Manual Scenarios Executed
- Normal flow: created proposal, added passing validation summary, accepted proposal, and verified linked changelog entry exists by `proposal_id` (runtime storage integration check).
- Edge flow: created proposal and attempted accept with no passing latest validation; runtime guardrail blocked with expected error.

## UI Visual Smoke Check
- Desktop UI screenshots were not captured in this run.
- UI smoke evidence comes from deterministic settings panel rendering tests plus FastAPI runtime smoke logs.

## Copy Regression Sweep
- Reviewed new Settings panel copy strings for promise control:
  - no self-shipping implication,
  - no rollback-of-code/data implication,
  - clear disabled-accept reasons and empty states.
- Result: PASS (no ambiguous or misleading copy found).

## Criteria-to-Evidence Mapping
- Proposals section lists proposals newest-first and has empty state -> `src/settingsPanel.tsx` render path + `src/settingsPanel.test.tsx` empty-state assertion -> PASS.
- Create proposal in-app with linked IDs or rationale-only path -> `src/settingsPanel.tsx` create form validation + `src/App.tsx` `POST /proposals` wiring -> PASS.
- Attach validation run and reflect pass/fail -> `src/settingsPanel.tsx` validation controls + `src/App.tsx` `POST /proposals/{id}/validation-runs` -> PASS.
- Accept blocked unless latest validation passing -> `src/settingsPanel.tsx` `acceptBlockReason` + `src/settingsPanel.test.tsx` disabled-accept assertions + runtime unit tests -> PASS.
- Reject requires rationale and creates no changelog entry -> `src/settingsPanel.tsx` reject note length guard + `runtime/test_proposals.py::test_rejection_does_not_create_changelog_entry` -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- No live desktop screenshot artifact for this checkpoint.
- Proposal flow UI was validated via deterministic tests and runtime-level flow checks rather than interactive desktop capture.

Suggested commit message: `T-0016: add settings proposals panel with validation and decision guardrails`

Next-step suggestion: PM should review `T-0016` in `review/` and move it to `done/` if this QA evidence is acceptable.
