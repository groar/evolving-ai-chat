# T-0007: Validation gates and sandboxed verification runner

## Metadata
- ID: T-0007
- Status: ready
- Priority: P2
- Type: feature
- Area: core
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Add a validation gate that runs tests/smoke checks in an isolated environment before any agent-proposed change is accepted/applied.

## Context
- “Self-evolving” is only viable if regressions are caught early and consistently.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Provide a single “validate” entrypoint that is easy to run locally and in CI-like contexts.
  - Produce an artifact that can be attached/linked from tickets moved to `review/`.
  - Ensure the validation run can be executed with least-privilege defaults (sandbox-first).
- Non-goals:
  - Full hermetic builds across all OSes on day 1.
  - Perfect test coverage before shipping the first gate.
- Rules and state transitions:
  - Validation runs are immutable: each run writes to a new timestamped artifact directory.
  - The validate command must exit non-zero if any required check fails.
  - The “default required checks” for v1 are:
    - desktop build (or typecheck/build equivalent),
    - a smoke script that exercises the runtime contract used by the desktop app.
  - If a check is skipped due to environment limits, the artifact must record it explicitly as `skipped` with a reason (and the overall exit code rules should be clear).
- User-facing feedback plan:
  - Tickets moved to `review/` include a link to the validation artifact so QA/PM can quickly see what passed.
- Scope bounds:
  - Start with a Node-based orchestrator script (portable) and add language-specific steps incrementally.
  - Prefer repo-local artifacts under a deterministic folder in git.
- Edge cases / failure modes:
  - Flaky checks: record retries and mark the run as failed if still unstable.
  - Sandbox missing dependencies: record as skipped with explicit remediation instructions.
- Validation plan:
  - Deterministic: run validate on a known-good revision and confirm a PASS artifact is written.
  - Deterministic: simulate a failing check (intentional) and confirm non-zero exit + artifact records failure.

## References
- `STATUS.md`
- `tickets/meta/epics/E-0001-m0-end-to-end-safe-change-loop.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [ ] There is a single command (documented) (for example `npm run validate`) that runs the v1 required checks (at minimum desktop build + runtime-contract smoke).
- [ ] The command can be executed in an isolated sandbox with least-privilege defaults (document what is and isn’t supported yet).
- [ ] Validation output is captured as an artifact directory under `tickets/meta/qa/artifacts/validate/` containing at least:
  - a short human-readable summary (`README.md`),
  - raw logs per step,
  - a machine-readable status summary (`summary.json`).

## Subtasks
- [ ] Define the standard validation command(s) and required steps (v1).
- [ ] Add a minimal sandbox execution wrapper (documented; can start as “Codex sandbox + constraints”).
- [ ] Write artifacts to `tickets/meta/qa/artifacts/validate/` and document conventions.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/` with v1 validate command + artifact format specified.
