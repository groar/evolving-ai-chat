# T-0009: Agentic harness baseline (pi.dev-like loop)

## Metadata
- ID: T-0009
- Status: done
- Priority: P3
- Type: spike
- Area: core
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Summary
Choose and document the initial agentic coding harness workflow (pi.dev-like “agents open PRs/tickets”) so self-evolution uses traceable, reviewable changes.

## Scope Update (Optional)
If we discover constraints (offline-only, no network, or platform limits), re-scope to a local-only harness that still produces auditable diffs and validation artifacts.

## Context
- We want agentic coding, but it must fit the repo’s ticket-driven workflow and validation gates.

## References
- `STATUS.md`
- `tickets/meta/feedback/inbox/F-20260226-001-self-evolving-desktop-ai-chat.md`

## Feedback References (Optional)
- F-20260226-001

## Acceptance Criteria
- [x] The harness workflow is documented in this ticket Notes, including:
  - how a change proposal is generated,
  - where diffs/patches live,
  - how validation gates are run,
  - how approvals happen,
  - rollback path.
- [x] The chosen approach produces artifacts linkable from tickets (`Evidence` section).
- [x] Any required secrets/credentials handling is explicitly called out as a constraint.

## Subtasks
- [x] Evaluate “pi.dev-like PR loop” vs local-only patch workflow.
- [x] Recommend one with tradeoffs and a v1 adoption plan.

## Evidence (Verification)
- Tests run:
  - None (docs-only spike; no software or runtime behavior changes).
- Manual checks performed:
  - Confirmed referenced validation and smoke artifact locations already exist and are ticket-linkable:
    - `tickets/meta/qa/artifacts/validate/`
    - `tickets/meta/qa/artifacts/runtime-smoke/`
  - Confirmed workflow stays aligned with current ticket lifecycle in `tickets/README.md`.
- Screenshots/logs/notes:
  - This ticket note serves as the baseline harness decision record for M0.
- Doc review (for docs-only changes):
  - Verified the proposed flow is explicit on approvals, rollback scope, and secret handling constraints.

## Notes
### Recommendation
Adopt a local-first patch workflow as v1 baseline, with optional PR mirroring when a remote is available.

### Option comparison
- Pi.dev-like PR loop:
  - Strengths: native review UX, branch protection, built-in discussion/approval context.
  - Weaknesses (current repo constraints): depends on network + remote credentials and can fail closed in restricted/offline environments.
- Local-only patch workflow:
  - Strengths: works in offline/sandboxed runs, keeps artifacts in-repo, deterministic with current ticket board.
  - Weaknesses: review ergonomics are more manual than hosted PR systems.

### Chosen v1 harness workflow (proposal -> validate -> approval -> release)
1. Proposal generation:
   - Agent picks top `ready/ORDER.md` ticket and moves it to `in-progress/`.
   - Agent creates a small, bounded patch tied to that ticket and updates ticket checklists/changelog as it works.
2. Diff/patch location:
   - Canonical diff is the local git working tree relative to `main`.
   - Ticket remains the source-of-truth index for what changed and why.
3. Validation gates:
   - Run deterministic checks via `npm run validate` (or targeted checks when scoped).
   - Persist run artifacts under `tickets/meta/qa/artifacts/validate/<run-id>/` and link them from ticket Evidence.
4. Approval path:
   - Implementation agent moves ticket to `review/` with evidence.
   - QA runs only when software/behavior changed; docs-only changes record doc review.
   - PM/user accepts by moving to `done/` after evidence is satisfactory.
5. Rollback path:
   - Immediate rollback for unaccepted work: do not move out of `review/`; apply follow-up patch or reopen.
   - Post-acceptance rollback: create a new ticket for corrective change and include explicit release-channel/feature-flag fallback where applicable.
   - Scope note: rollback here is ticketed change rollback, not guaranteed data/state rewind.

### Secrets and credentials constraints
- Do not require repository-hosting credentials for baseline operation.
- Keep provider/API secrets out of ticket markdown, logs, and artifacts.
- If external model providers are used in validation later, consume secrets from local environment and redact from outputs.

## Change Log
- 2026-02-26: Ticket created.
- 2026-02-26: Moved to `ready/` for pickup after T-0010.
- 2026-02-26: Moved to `in-progress/` and evaluated pi.dev-like PR loop vs local-first patch workflow.
- 2026-02-26: Selected local-first patch workflow baseline (with optional PR mirror), recorded v1 adoption plan, and moved to `review/`.
- 2026-02-26: Accepted as docs-only spike; moved to `done/`.
