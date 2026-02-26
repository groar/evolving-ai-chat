# T-0007: Validation gates and sandboxed verification runner

## Metadata
- ID: T-0007
- Status: review
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
- [x] There is a single command (documented) (for example `npm run validate`) that runs the v1 required checks (at minimum desktop build + runtime-contract smoke).
- [x] The command can be executed in an isolated sandbox with least-privilege defaults (document what is and isn’t supported yet).
- [x] Validation output is captured as an artifact directory under `tickets/meta/qa/artifacts/validate/` containing at least:
  - a short human-readable summary (`README.md`),
  - raw logs per step,
  - a machine-readable status summary (`summary.json`).

## Subtasks
- [x] Define the standard validation command(s) and required steps (v1).
- [x] Add a minimal sandbox execution wrapper (documented; can start as “Codex sandbox + constraints”).
- [x] Write artifacts to `tickets/meta/qa/artifacts/validate/` and document conventions.

## Evidence (Verification)
- Validation runner implementation:
  - Added root command surface in `package.json`:
    - `npm run validate`
    - `npm run validate:sandbox`
  - Added orchestrator script: `scripts/validate.mjs`
    - Runs required checks:
      - desktop build (`npm run build` in `apps/desktop`)
      - runtime contract smoke (`npm run smoke` in `apps/desktop`) with auto-managed `node scripts/runtime-stub.mjs`
    - Writes immutable timestamped artifacts under `tickets/meta/qa/artifacts/validate/<run-id>/`:
      - `README.md`
      - `summary.json`
      - `logs/*.log`
    - Marks environment-constrained checks as `skipped` with explicit reasons (for example sandbox `EPERM` on local port binding) and exits non-zero when required checks fail/skip.
- Documentation updates:
  - `README.md` now documents `npm run validate` and artifact structure.
  - `apps/desktop/README.md` now documents validation checks, artifact paths, and sandbox behavior.
- Command evidence:
  - `npm run validate` in sandbox: artifact `tickets/meta/qa/artifacts/validate/2026-02-26T19-56-05-423Z` (expected non-zero due `runtime-contract-smoke` skip with `EPERM`).
  - `npm run validate` with escalated permissions: artifact `tickets/meta/qa/artifacts/validate/2026-02-26T19-57-17-328Z` (overall `passed`).

## QA Evidence Links (Required For `review/`/`done/`)
- QA checkpoint: `tickets/meta/qa/2026-02-26-qa-checkpoint-t0007.md`

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/` with v1 validate command + artifact format specified.
- 2026-02-26: Moved to `in-progress/` and implemented root `npm run validate` orchestrator with timestamped artifact output and explicit sandbox skip handling.
- 2026-02-26: Moved to `review/` after recording validation artifacts and documentation updates.
- 2026-02-26: Automatic QA phase completed with no blocking findings (`tickets/meta/qa/2026-02-26-qa-checkpoint-t0007.md`).
