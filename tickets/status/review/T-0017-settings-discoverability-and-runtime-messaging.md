# T-0017: Settings discoverability and runtime messaging confusion

## Metadata
- ID: T-0017
- Status: review
- Priority: P1
- Type: bug
- Area: ui
- Epic: E-0002
- Owner: ai-agent
- Created: 2026-02-28
- Updated: 2026-02-28

## Summary
First-time users cannot find "Settings" (there is no clearly labeled Settings surface), and runtime-unavailable messaging reads like a broad app failure ("Could not load changelog, proposals, and settings."). This blocked the tier-2 micro-validation probes for E-0002 immediately.

## Impact
- Severity: S2
- User impact: First-time users; high likelihood on any machine where the runtime is not already running.
- Scope: Left-rail navigation/labels; runtime-unavailable copy; settings/changelog/proposals surfaces.

## Environment
- Build/commit: unknown (local workspace)
- Runtime: Desktop app UI with runtime not running on `127.0.0.1:8787`
- Seed/config: none

## Reproduction Steps
1. Launch the app without starting the local runtime on `127.0.0.1:8787`.
2. Ask a first-time user: "Go to Settings."
3. Observe whether they can find Settings without hints.
4. Observe runtime-unavailable messages, including any claims that settings cannot be loaded.

## Expected Behavior
- "Settings" is discoverable within a few seconds (clear label/affordance).
- Runtime-unavailable messaging is scoped and actionable (for example, indicates which features require the runtime, without implying local settings are broken).

## Actual Behavior
- User cannot find "Settings" and becomes confused immediately.
- Runtime-unavailable messaging implies broad failure ("could not load ... settings"), increasing perceived brokenness.

## Evidence
- Screenshot: captured during the 2026-02-28 internal micro-validation attempt (available in chat transcript).
- Notes: `tickets/meta/feedback/2026-02-28-pm-checkpoint.md`
- Implementation (2026-02-28):
  - Added explicit `Settings` section heading in the left rail settings panel, with `Changelog + Experiments` and `Proposals` grouped beneath it.
  - Scoped runtime-offline error copy to runtime-backed surfaces: `Could not load changelog and proposals (runtime offline).`
  - Added regression coverage for discoverability and runtime-offline copy in `apps/desktop/src/settingsPanel.test.tsx`.
  - Validation commands:
    - `npm --prefix apps/desktop test -- src/settingsPanel.test.tsx` (pass)
    - `npm --prefix apps/desktop test` (pass)
    - `npm --prefix apps/desktop run build` (pass)
- QA checkpoint: `tickets/meta/qa/2026-02-28-qa-checkpoint-t0017.md` (PASS, no bugs found).

## References
- `tickets/meta/epics/E-0002-m1-first-self-improvement-cycle.md` (Validation Plan)
- `tickets/status/done/T-0016-settings-proposals-panel.md`
- `apps/desktop/README.md` (Runtime-unavailable behavior notes)
- Feedback: `tickets/meta/feedback/inbox/F-20260228-001-settings-navigation-confusing.md`

## Acceptance Criteria (Fix + Verify)
- [x] Settings surface is clearly labeled/discoverable (no-training, first-run).
- [x] Runtime-unavailable messaging no longer claims settings cannot be loaded.
- [ ] Reproduction steps no longer fail with a first-time user.
- [x] Regression test added/updated for the runtime-unavailable UI state and copy.

## Design Spec (PM DoR)
### Goal
Make it obvious where "Settings" lives, and ensure runtime-offline messaging is scoped so it does not imply local settings are broken.

### Non-goals
- Redesign the full information architecture of the app.
- Add onboarding/tutorial flows.

### Proposed UX Rules
- Left rail contains a clearly labeled `Settings` section/header.
- `Changelog + Experiments` and `Proposals` live under that `Settings` label (even if the components remain the same).
- When the runtime is offline:
  - Chat responses are disabled and the runtime status banner can indicate this.
  - Settings that do not require the runtime remain visible and do not display errors implying "settings cannot be loaded".
  - Any error copy is explicit about what failed (for example "Could not load changelog and proposals (runtime offline).").

### Copy Constraints
- Must not imply rollback controls revert code or delete conversation data.
- Must not imply local settings are unavailable when the runtime is offline.

### Validation Plan (Deterministic + Micro)
- Deterministic: add/adjust a UI test that asserts the `Settings` label is visible and that runtime-offline copy does not mention settings being unavailable.
- Micro: rerun the 3 probes in E-0002 after fix (see Evidence plan in PM checkpoint).

## Subtasks
- [x] Reproduce locally
- [x] Implement fix
- [x] Add/adjust tests
- [ ] Validate fix via rerunning the 3 E-0002 micro-validation probes
- [x] Update docs/changelog if behavior changed

## Notes
This is a first-run UX issue: treat discoverability and copy as part of correctness.

## Change Log
- 2026-02-28: Bug ticket created from PM micro-validation checkpoint.
- 2026-02-28: Implementation started; moved ticket from `ready/` to `in-progress/`.
- 2026-02-28: Added Settings discoverability label, scoped runtime-offline settings copy, added regression coverage, and moved ticket to `review/` for QA.
- 2026-02-28: QA validation completed (pass, no bugs). E-0002 micro-validation probe rerun remains the final open verification item.
