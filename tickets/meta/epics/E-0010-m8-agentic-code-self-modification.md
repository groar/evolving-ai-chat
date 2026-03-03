# E-0010: M8 — Agentic Code Self-Modification Loop

## Metadata
- ID: E-0010
- Status: active (tier-2 complete; polish in progress)
- Owner: pm-agent
- Created: 2026-03-01
- Updated: 2026-03-03 (T-0062 done; T-0063/T-0064 queued from F-20260303-001)

## Goal
Wire the real self-evolution loop end-to-end: the app receives user feedback, an agent drafts actual source-code changes, the user reviews a diff and accepts or rejects, and on acceptance the code is applied and the app rebuilds. This is the vision described in STATUS.md ("agentic coding in the background") made concrete for the first time.

The previous approach (M6/M7) only modified runtime config (system prompt strings, settings microcopy). That approach was not what the primary user expected and is superseded. M8 targets source files: the app proposes, the user decides, the codebase changes.

## Why Now
- F-20260301-008: primary user confirmed the improvement-class/config approach is not the intended vision. The loop they expect is feedback → code patch → diff review → accept/reject.
- E-0009 (M7) superseded; T-0056 probe cancelled.
- The agentic harness baseline (T-0009, E-0001) and the existing proposal artifact format (T-0013) are the closest prior work to build on.

## Definition of Done
1. **Design spec complete** (T-0058): the agentic code modification loop is specced — how feedback triggers a code-generation agent, what constraints scope the patch, how the diff is surfaced in the UI, and what acceptance/rejection does.
2. **Agent drafts a real patch**: given feedback, a code-generation call produces a concrete file diff (even if narrow-scoped: e.g. UI copy, a small component, a config constant).
3. **Diff review surface**: the user can see what would change (before/after or unified diff), accept with one action, or reject.
4. **Code applied on accept**: the patch is written to source files; the app rebuilds (or hot-reloads if feasible) and the change is live.
5. **Rollback available**: the change is reversible from the changelog/history surface with one action (git revert or equivalent patch undo).
6. **Tier-1 validation**: at least one end-to-end test covers the full loop (feedback → patch generated → applied → visible in app).

## Constraints / Guardrails
- Scope patches narrowly in M8: UI layer only (React components, copy, styles). No runtime Python changes, no schema migrations, no dependency additions in M8.
- User must always see the diff before it is applied — no silent code changes.
- Rollback is non-optional: every accepted change must be reversible.
- Sandboxed build step before applying to working copy (run tests; reject if they fail).

## Validation Plan
### Tier 1 (deterministic)
- End-to-end test: submit feedback → agent generates patch → patch passes lint/build → apply → UI reflects change.
- Rollback test: apply a patch → roll back → UI returns to previous state.
- Evidence: QA checkpoint in `tickets/meta/qa/`.

### Tier 2 (micro-validation — after first real loop)
- Audience: primary user / project sponsor.
- Timing: after the first real feedback-to-code-change loop ships.
- Probes:
  1. "You submitted feedback. Here's what the system proposes to change [show diff]. Does this look right?"
  2. "You accepted it and the app changed. Was that what you expected? Could you undo it?"
- Pass criteria: user can read the diff, accepted it, observed the change, and knows rollback is possible.
- Evidence: PM checkpoint + T-0058 evidence section.

## Non-goals
- Autonomous acceptance with no user review (M8).
- Backend / Python runtime self-modification (M8).
- Multi-file refactors or dependency management (M8).
- Improvement class registry (the M7 classification system is deprioritised in favour of simpler feedback-to-agent routing).

## Linked Feedback
- F-20260301-008 (pivot signal)

## Linked Tickets
- T-0058: M8 design spec — agentic code modification loop (**done**)
- T-0059: Agent harness integration — `PatchAgent` interface, `POST /agent/code-patch`, harness client, scope-guard, patch artifact schema (**done**)
- T-0060: Git-backed apply/rollback — sandboxed build gate, `git commit` on apply, `git revert` on rollback, `POST /agent/rollback` (**done**)
- T-0061: Non-review UI — in-app notification states, Changelog Undo action, diff toggle, all copy strings (**done**)
- T-0062: Notification dismiss + human-readable failure reasons (**done** 2026-03-03)
- T-0063: Settings panel legacy cleanup — remove AI Persona + Proposals pipeline + backing code (ready, P2, from F-20260303-001)
- T-0064: Central always-visible improvement request button (ready, P2, depends on T-0063, from F-20260303-001)

## Progress
- Done (2026-03-01/02):
  - T-0058: M8 design spec — `docs/m8-code-loop.md` canonical spec
  - T-0059: Agent harness integration — `PatchAgent` ABC, `POST /agent/code-patch`, `PiDevPatchAgent`, scope guard Layer 1+2, artifact storage
  - T-0060: Git-backed apply/rollback — sandboxed build gate, `git commit` apply, `git revert` rollback, `POST /agent/rollback`
  - T-0061: Non-review UI — `PatchNotification` (8 states), Changelog Undo, diff toggle, "Fix with AI →" feedback trigger, polling
- 2026-03-03: Tier-2 micro-validation PASS (sponsor). Probes 1–2 answered; all pass criteria met; sponsor rolled back one style change easily. Patch quality noted as variable (model: GPT-4o-mini). Evidence: `tickets/meta/feedback/2026-03-03-pm-checkpoint-e0010-tier2-validation.md`, T-0058 Evidence.
- Done (2026-03-03):
  - T-0062: notification dismiss affordance + human-readable failure reason copy
- Pending:
  - T-0063 (ready, P2): Settings panel legacy cleanup — AI Persona + Proposals pipeline removed, backing code deleted
  - T-0064 (ready, P2): Central always-visible improvement button — FeedbackPanel promoted to dedicated Sheet, top-bar Improve button

## Notes
- T-0009 (agentic harness baseline) established the pi.dev-like loop concept. The key gap is that the harness was never wired against real source files with a user-facing diff review UI. M8 closes that gap.
- Existing proposal artifact format (`apps/desktop/src/proposalGenerator.ts`, runtime storage) may be reused or adapted.
- Git diff output is a natural "diff review" format; the UI surface for this is scoped in T-0058.
