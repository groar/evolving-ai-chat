# T-0088: M13 design spec — self-evolve reliability hardening

## Metadata
- ID: T-0088
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07

## Summary
Analyze the current self-modification loop reliability gaps and produce a concrete hardening plan. The primary new input is a **conversational feedback-refinement phase** (F-20260307-001): before the patch agent runs, a model converses with the user to clarify requirements, grounded in the current software state, and produces a validated spec that the agent receives as input. This design spec will define that refinement conversation, plus eval expansion, retry strategy, and prompt improvements for M13. Implementation tickets will be derived from this spec.

## Design Spec

### Goals
- Design the **conversational feedback-refinement phase**: a chat interaction that takes raw user feedback, asks clarifying questions with context about the current software state, and produces a structured, user-validated spec to pass to the patch agent.
- Identify and document all reliability gaps in the current feedback → patch → eval → apply → reload pipeline.
- For each gap, propose a concrete hardening approach with scope bounds.
- Define which eval failures should be blocking vs. advisory.
- Define the retry strategy (how many retries, what context to feed back, when to give up).
- Define prompt improvements (Layer 1 scope guard, quality guidance, output format constraints).

### Non-goals
- Implementing any hardening changes (this ticket is spec-only).
- Multi-model agent support (use the current `pi` harness).
- Changing the fundamental architecture (keep the existing `PiDevPatchAgent` → `ApplyPipeline` flow).

### Scope bounds
- Output: one design spec document in `docs/` (e.g., `docs/m13-self-evolve-reliability.md`).
- Must produce a prioritized list of implementation tickets (IDs TBD) for PM to create.

### Known gaps to analyze (from pipeline audit + user feedback)
1. **No feedback refinement** (F-20260307-001) — Raw one-sentence feedback goes straight to the agent. No clarifying questions, no context injection, no user validation of what the agent will actually attempt. This is the highest-leverage gap.
   - Key design questions:
     - What context does the refinement model receive? (file tree, recent changes, current UI state, relevant code sections?)
     - How does the user signal "this spec is good, run the agent"?
     - What format does the refined spec take? (structured markdown? free text?)
     - Is this a separate conversation mode, or does it happen inline in the "Fix with AI" flow?
     - How many rounds of clarification are typical/allowed?
2. **No Layer 1 scope prompt** — M8 spec §6 vs. current `patch_agent.py` (generic prompt only).
3. **Spec vs. allowlist mismatch** — M8 §6 says `^apps/desktop/src/` but config allows runtime, tickets, docs, tests.
4. **Evals advisory only** — `_run_evals()` never blocks apply.
5. **Single eval check** — Only `patch_applies_cleanly`.
6. **No retry** — Failures require manual re-trigger with no failure context.
7. **Pi timeout 600s** — Long runs, no incremental progress.
8. **Prompt quality** — No few-shot examples, no output format guidance.
9. **`_trigger_reload()` no-op** — Hot-reload mechanism unclear.

## Context
- M8 (E-0010) established the loop; M10 (E-0013) polished prompt + scope allowlist + diff UI; M12 (E-0015) added eval harness.
- Patch quality was noted as variable during M8 tier-2 validation (model/prompt tuning flagged as follow-up).
- The eval harness currently has one check (`patch_applies_cleanly`) and runs advisory-only.

## References
- `docs/m8-code-loop.md` (M8 design spec)
- `apps/desktop/runtime/agent/patch_agent.py` (patch agent)
- `apps/desktop/runtime/agent/apply_pipeline.py` (apply pipeline)
- `apps/desktop/runtime/evals/` (eval harness)
- `apps/desktop/runtime/config/patch-allowlist.json` (scope allowlist)
- E-0016 (M13 epic)

## Feedback References
- F-20260307-001 (conversational feedback refinement before patch agent — primary design input)
- F-20260301-008 (direction pivot to code self-modification)

## Acceptance Criteria
- [x] Design spec document exists in `docs/` covering all 9 known gaps. → `docs/m13-self-evolve-reliability.md` §3 (Gap Analysis) covers all 9 gaps.
- [x] Conversational feedback-refinement phase is fully designed: context injection, conversation flow, spec format, user confirmation UX, and integration with the existing "Fix with AI" flow. → §4 (Conversational Feedback-Refinement Phase): §4.2 flow, §4.3 context injection, §4.4 spec format, §4.5 UI integration, §4.6 system prompt, §4.7 edge cases.
- [x] Each gap has a proposed hardening approach with clear scope bounds. → §3 proposes a fix for each gap with scope bounds. Gaps 3 and 9 are documented as resolved (intentional behavior).
- [x] Blocking vs. advisory eval policy is defined with rationale. → §5 (Eval Policy) with per-check blocking/advisory table and rationale.
- [x] Retry strategy is defined (trigger conditions, max retries, context injection, give-up behavior). → §6 (Retry Strategy): triggers, max 1 retry, context injection format, give-up behavior, state machine update.
- [x] Prompt improvement plan is concrete (specific prompt sections, not just "improve the prompt"). → §7 (Prompt Improvements): full template with 6 sections, dynamic allowlist, context assembly function.
- [x] Prioritized implementation ticket list produced (ticket IDs, titles, dependencies). → §9: 5 tickets ranked with dependencies, effort sizing, and rationale for order.
- [x] Spec does not introduce design ambiguity that would force implementation-time invention. → Each ticket's scope is bounded by the spec. Key decisions (max retries, context budget, blocking policy, conversation mode name, spec format) are made explicitly.

## Subtasks
- [x] Audit current pipeline code (patch_agent, apply_pipeline, evals)
- [x] Draft spec in `docs/` → `docs/m13-self-evolve-reliability.md`
- [x] Produce implementation ticket list → §9 (5 ranked tickets)
- [x] Documentation updates → spec document is the primary deliverable

## Notes
- Follow the same pattern as T-0058 (M8), T-0074 (M10), T-0077 (M11), T-0081 (M12): design spec first, then implementation tickets derived from spec.
- The allowlist broadening (gap #2) was intentional per test expectations — the spec should document this as a conscious decision, not a bug.

## Evidence
- Design spec: `docs/m13-self-evolve-reliability.md` (11 sections, ~350 lines).
- Pipeline audit: Reviewed `patch_agent.py`, `apply_pipeline.py`, `evals/run.py`, `evals/checks/`, `patch-allowlist.json`, `main.py` endpoint, and frontend flow (`App.tsx`, `useRuntime.ts`, `feedbackPanel.tsx`, `PatchNotification.tsx`).
- All 9 gaps analyzed with proposed fixes, scope bounds, and explicit design decisions.
- 5 implementation tickets ranked with dependencies and effort sizing.

## Change Log
- 2026-03-07: Ticket created during PM run. First pickup for E-0016 (M13).
- 2026-03-07: F-20260307-001 (conversational feedback refinement) added as gap #1 and primary design input. Acceptance criteria updated to require refinement phase design.
- 2026-03-07: Implementation complete. Design spec drafted in `docs/m13-self-evolve-reliability.md`. All 9 gaps covered. Implementation ticket list produced (§9). Moved to review.
- 2026-03-07: PM acceptance. All 8 acceptance criteria verified with evidence. Doc review passed (docs-only ticket, QA waived). Moved to done.
