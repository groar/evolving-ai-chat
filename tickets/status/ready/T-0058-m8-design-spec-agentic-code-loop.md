# T-0058: M8 design spec — agentic code modification loop

## Metadata
- ID: T-0058
- Status: ready
- Priority: P1
- Type: spec
- Area: core
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Produce the design spec that governs M8 before any implementation starts. The spec defines how the full code self-modification loop works end-to-end: how user feedback triggers a code-generation agent, what constrains the patch scope in M8, how the diff is surfaced for user review, what acceptance and rejection do, and what rollback looks like. All M8 implementation tickets depend on this spec.

## Context
- F-20260301-008: primary user confirmed the intended loop is feedback → code patch → diff review → accept/reject, not feedback → config string edits (which is what M6/M7 built).
- E-0009 (M7) superseded; E-0010 (M8) scoped.
- Prior art to build on: T-0009 (agentic harness baseline), T-0013 (change proposal artifact), existing `proposalGenerator.ts` and runtime storage.
- T-0052 (`docs/m7-improvement-classes.md`) defined trigger rules and proposal quality contracts; some of that thinking applies here at a higher level.

## Design Spec

This ticket IS the spec artifact. Complete all sections before marking done.

### Goals
- Define the end-to-end data flow: feedback event → agent invocation → patch artifact → diff UI → apply/reject handler → rollback path.
- Establish M8 scope bounds so implementers don't need to invent critical decisions.
- Identify the minimum viable UI surface for diff review.
- Define what "apply" means mechanically (file write + rebuild step).
- Define what "rollback" means mechanically (patch undo or git revert).

### Non-goals (M8)
- Autonomous acceptance without user review.
- Backend (Python runtime) self-modification.
- Multi-file refactors, dependency additions, schema migrations.
- Model routing or feature flag changes via the loop.
- The improvement class registry (M7 concept) — replaced by simpler direct routing in M8.

### Loop Data Flow (to be designed)
Sections to fill during this ticket's implementation:
1. **Feedback → agent trigger**: what event, what payload, which agent/model call, what system prompt/instructions constrain the patch to M8 scope.
2. **Patch artifact format**: what the agent returns (unified diff? file contents? structured JSON with before/after?); how it is stored; what metadata travels with it.
3. **Diff review UI**: where in the app the diff appears; what the user sees (unified diff, side-by-side, plain description + diff toggle?); what the primary action is (Accept / Reject); what happens to the artifact after each decision.
4. **Apply path**: how an accepted patch is written to source files; whether a build/test step runs first; what happens if the build fails (auto-rollback or notify user?).
5. **Rollback path**: how a previously accepted patch is reversed; where the rollback action lives; what happens to the build on rollback.
6. **Scope guard**: how the system prevents the agent from generating patches outside the M8 scope (UI layer only).

### UI Spec Addendum
- Primary job: show the user what would change in the codebase and let them accept or reject with one action.
- Primary action: "Accept change" (applies patch) / "Reject" (discards artifact); both must be visually unambiguous.
- Diff surface: at minimum, a readable before/after or unified diff view within the app (not requiring the user to open a terminal or external tool).
- States to design: pending review, applying (loading), applied (success + rollback link), rejected, apply-failed (with reason).
- Copy constraints: must not imply the change is already applied before the user accepts; must not hide the rollback option after acceptance.

### Edge Cases / Failure Modes (to enumerate during spec)
- Agent returns a malformed or empty patch.
- Patch applies cleanly but build/tests fail.
- User rejects — artifact lifecycle.
- Rollback after a subsequent change has already been accepted (ordering/conflict concern).
- Agent tries to modify files outside the allowed scope.

### Validation Plan
- Tier 1 (deterministic): spec review checklist — all six data flow sections filled; UI states enumerated; scope guard defined; at least two edge cases resolved.
- No tier-2 probe for the spec ticket itself; tier-2 is in the E-0010 DoD after the loop ships.

## Acceptance Criteria
- [ ] All six loop data flow sections filled in this ticket (or in a linked `docs/m8-code-loop.md`).
- [ ] M8 scope bounds documented (what files/areas may be patched; what is out of bounds).
- [ ] Patch artifact format defined (schema or example).
- [ ] Diff review UI states enumerated with copy constraints.
- [ ] Apply and rollback paths defined mechanically.
- [ ] Scope guard approach defined (prompt constraint, allowlist, or both).
- [ ] At least three edge cases resolved with explicit handling decisions.
- [ ] Implementation tickets for M8 drafted from this spec (at least: agent integration, diff UI, apply/rollback handler) and added to E-0010 linked tickets.
- [ ] `docs/m8-code-loop.md` created (or this ticket's Design Spec section serves as the source of truth, clearly noted).

## Feedback References
- F-20260301-008

## Dependencies / Sequencing
- Blocks: all M8 implementation tickets.
- No dependencies (design-first ticket).

## Evidence (Verification)
_(to be filled during implementation)_

## Change Log
- 2026-03-01: Created by PM checkpoint (M8 pivot, F-20260301-008). Rank 1 in ready queue.
