# T-0058: M8 design spec — agentic code modification loop

## Metadata
- ID: T-0058
- Status: done
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
- **Key user direction (2026-03-01)**: use an agent harness like pi.dev; rely on git for version management and rollback; user should NOT have to review code — they see the result and can undo.

## Design Spec

The canonical spec is in **`docs/m8-code-loop.md`** — that file is the source of truth for all M8 implementation tickets.

Summaries of each required section (full detail in `docs/m8-code-loop.md`):

### 1. Feedback → Agent Trigger
- Event: user submits in-app feedback via existing `feedbackStore.ts` path.
- Frontend attaches `base_ref` (current git SHA) to the payload.
- Eligibility check: `area` prefixed `ui.` or `settings.` routes to code agent; other areas stored only.
- Frontend calls `POST /agent/code-patch` → runtime forwards to external agent harness (pi.dev API or equivalent).
- Runtime prepends scope-guard system prompt to every harness call.

### 2. Patch Artifact Format
Structured JSON stored in `apps/desktop/runtime/storage/patches/`:
- Fields: `id`, `created_at`, `feedback_id`, `base_ref`, `status`, `title`, `description`, `files_changed`, `unified_diff`, `scope_violations`, `agent_model`, `agent_harness`.
- `scope_violations` must be empty before apply proceeds.
- `base_ref` must match git SHA at apply time.
- `unified_diff` stored for traceability / optional "see what changed" toggle; user is never required to read it.

### 3. Apply Path (no user review gate)
1. Scope re-validation (server-side allowlist check).
2. Sandboxed build gate (`npm run validate` — lint + tests) on a temp copy.
3. On pass: `git add <files> && git commit -m "agent(m8): <title> [PA-<id>]"`.
4. Rebuild / hot-reload.
5. In-app notification: "[description]. Undo?" — Undo action always present.

### 4. Rollback Path
- Triggered from notification or Changelog panel with one action.
- Runtime runs `git revert <git_commit_sha> --no-edit` → creates revert commit.
- Rebuild / hot-reload.
- On conflict (later patch touched same files): abort revert, status `rollback_conflict`, user notified.

### 5. Diff Toggle (Non-blocking)
- "See what changed ↓" toggle in notification and Changelog entry reveals formatted unified diff in read-only panel.
- Purely informational; does not gate any action.

### 6. Scope Guard (Two layers)
- **Layer 1 (agent-side)**: system prompt constrains agent to `apps/desktop/src/` only; explicitly forbids `.py`, config files, `runtime/`, `tickets/`, `docs/`.
- **Layer 2 (server-side)**: runtime re-checks every path in `files_changed` against allowlist regex `^apps/desktop/src/`. Any violation → reject patch entirely, status `scope_blocked`.

### Non-goals (M8)
- Autonomous acceptance without user review — **revised per user direction**: the user does NOT review code; rollback is the safety valve.
- Backend (Python runtime) self-modification.
- Multi-file refactors, dependency additions, schema migrations.
- Model routing or feature flag changes via the loop.
- The improvement class registry (M7 concept) — replaced by simpler direct routing in M8.

### Edge Cases Resolved
See `docs/m8-code-loop.md §7` for full table. Explicitly resolved:
1. **Malformed/empty patch** → `apply_failed`, no files touched.
2. **Build/tests fail after patch** → `apply_failed`, no commit created.
3. **base_ref mismatch** → apply aborted, user prompted to resubmit feedback.
4. **Rollback conflict** → abort revert, `rollback_conflict`, user notified.
5. **Agent targets out-of-scope file** → `scope_blocked`, no files modified.
6. **Harness unreachable** → `harness_unavailable`, user notified, feedback retained.
7. **Two patches in flight** → second trigger returns `patch_in_progress`, feedback queued.

### UI States Enumerated
`pending` · `applying` · `applied` · `apply_failed` · `scope_blocked` · `reverted` · `rollback_conflict` · `rollback_unavailable`
Copy constraints: must not say "approved", must not hide Undo after applied, must not say "permanent", spinner states must not say "Done" until confirmed.

### Implementation Tickets Drafted
- T-0059: Agent harness integration (`PatchAgent` interface, endpoint, harness client, scope-guard prompt, artifact schema)
- T-0060: Git-backed apply/rollback (build gate, git commit, git revert, rollback endpoint, status transitions)
- T-0061: Non-review UI (notification states, Changelog Undo, diff toggle, copy strings)

## Acceptance Criteria
- [x] All six loop data flow sections filled in `docs/m8-code-loop.md`.
- [x] M8 scope bounds documented (allowlist: `apps/desktop/src/` only; blocklist: runtime, configs, deps, new files).
- [x] Patch artifact format defined (schema in §3.2 of `docs/m8-code-loop.md`).
- [x] Diff review UI states enumerated with copy constraints (§5 of `docs/m8-code-loop.md`).
- [x] Apply and rollback paths defined mechanically (§3.3, §3.4 of `docs/m8-code-loop.md`).
- [x] Scope guard approach defined — both prompt constraint (Layer 1) and server-side allowlist (Layer 2).
- [x] At least three edge cases resolved (seven resolved; see §7 of `docs/m8-code-loop.md`).
- [x] Implementation tickets for M8 drafted (T-0059, T-0060, T-0061) and added to E-0010 linked tickets.
- [x] `docs/m8-code-loop.md` created and noted as source of truth.

## Feedback References
- F-20260301-008

## Dependencies / Sequencing
- Blocks: all M8 implementation tickets (T-0059, T-0060, T-0061).
- No dependencies (design-first ticket).

## Evidence (Verification)
- Doc review performed: all six data flow sections present and filled in `docs/m8-code-loop.md`.
- Spec review checklist (tier-1 validation plan): ✓ six sections filled · ✓ UI states enumerated · ✓ scope guard defined (dual-layer) · ✓ seven edge cases resolved · ✓ implementation tickets drafted · ✓ copy constraints documented.
- No software/behavior changes in this ticket — doc review only; QA automation run waived per AGENTS.md §6.

### E-0010 Tier-2 Micro-Validation (2026-03-03)
- Audience: project sponsor. Probes run per E-0010 Validation Plan § Tier 2.
- Probe 1 (diff look right?): Yes — matched what sponsor had in mind.
- Probe 2 (outcome expected? could undo?): Outcome not fully up to expectation (style change applied but "wasn't great"; sponsor used GPT-4o-mini). Rollback: "I rolled back the feature easily."
- Pass criteria: read diff ✓, accepted ✓, observed change ✓, knows rollback possible ✓. **Verdict: PASS.** Evidence: `tickets/meta/feedback/2026-03-03-pm-checkpoint-e0010-tier2-validation.md`.

## Change Log
- 2026-03-01: Created by PM checkpoint (M8 pivot, F-20260301-008). Rank 1 in ready queue.
- 2026-03-01: Moved to `in-progress/`. Design spec written in `docs/m8-code-loop.md`. Key direction from user: agent harness (pi.dev), git-backed rollback, no user code review. All AC checked. Implementation tickets T-0059/T-0060/T-0061 drafted.
- 2026-03-01: Moved to `review/`. Docs-only ticket — doc review performed; QA automation waived per AGENTS.md §7. Spec review checklist: all 6 data-flow sections ✓, 7 edge cases ✓, scope guard dual-layer ✓, UI states + copy constraints ✓, implementation tickets created ✓. PM acceptance: all AC satisfied. Moved to `done/`.
