# QA Checkpoint Reports

Store one markdown summary per QA checkpoint run.

## Filename Convention
- `YYYY-MM-DD-qa-checkpoint.md`
- Example: `2026-02-14-qa-checkpoint.md`

## Minimum Content
- Scope tested (tickets/features/epics covered).
- Automated test outcomes (pass/fail with notable details).
- Manual scenarios executed (normal + edge cases).
- UI visual smoke check performed (if the host project has a UI), with screenshots and/or notes.
- If the project has a UI, include criterion-to-evidence mapping:
  - Criteria covered (acceptance criteria and/or design checkpoints).
  - Criterion -> screenshot/note -> pass/fail.
- Bugs found with linked ticket IDs.
- Outstanding risks, unknowns, or untested areas.
