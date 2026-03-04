# T-0074: M10 Agentic Loop Polish — Design Spec

## Metadata
- ID: T-0074
- Status: done
- Priority: P1
- Type: spec
- Area: core
- Epic: E-0013
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
Produce a concrete design spec that resolves the three open questions left over from M8 before any M10 implementation begins: (1) how accepted patches go live without a manual restart (live-apply / hot-reload), (2) what changes to the prompt strategy or allowlist will improve patch quality, and (3) how the agent's patch scope is formally enforced. The output is a filled `Design Spec` section in this ticket (or a linked `docs/m10-agentic-loop-polish.md` doc) plus the creation of scoped implementation tickets (T-0075+) ready for pickup.

## Context
- M8 shipped the end-to-end self-modification loop. Three questions were left open in STATUS.md:
  1. Build step: hot-reload on patch accept, or full Tauri rebuild? What is the minimum viable "change is live" signal?
  2. Patch scope guard: UI-only allowlist, prompt constraint, or both?
  3. Diff UI: unified diff view inline, or a dedicated "Proposed Changes" panel? (lower priority; include only if it blocks the other two)
- M8 tier-2 validation noted: "patch quality variable (model/prompt tuning can be a follow-up)."
- Solving these before implementation prevents wasted cycles and keeps patch quality on a clear trajectory.

## References
- `STATUS.md` — "Open Questions" section
- `docs/m8-code-loop.md` — M8 canonical spec
- `apps/desktop/runtime/agent/patch_agent.py` — current patch agent
- `apps/desktop/runtime/adapters/router.py` — current adapter routing
- `tickets/meta/epics/E-0013-m10-agentic-loop-polish.md`

## Acceptance Criteria
- [x] Design spec resolves the live-apply question: chosen mechanism documented with rationale; alternative(s) noted with why they were ruled out.
- [x] Design spec resolves the scope-guard question: UI-only allowlist, prompt constraint, or both; exact allowlist or constraint documented.
- [x] Design spec resolves the patch-quality question: specific prompt changes, few-shot examples, or other mechanism identified; a measurable proxy for quality improvement defined (e.g., "acceptance rate" tracked in agent logs, or a heuristic eval).
- [x] At least one scoped implementation ticket (T-0075+) created per resolved open question and moved to `tickets/status/ready/` with full DoR (acceptance criteria, scope bounds, sequencing).
- [x] `tickets/status/ready/ORDER.md` updated with T-0075+ in correct pickup order.
- [x] `tickets/meta/epics/E-0013-m10-agentic-loop-polish.md` updated with linked implementation tickets.

## Design Spec

See also: `docs/m10-agentic-loop-polish.md` (canonical spec, linked below).

---

### Goals
- Resolve Q1: users see applied patches take effect immediately — no manual app restart.
- Resolve Q2: formalize the scope guard with a config-driven allowlist that is auditable and easy to tighten.
- Resolve Q3: improve patch quality through richer prompt context and a measurable acceptance-rate proxy.
- Resolve Q4 (diff UI): confirm that inline diff is the right approach and spec the visual enhancement.

### Non-Goals
- Multi-file refactors, dependency additions, backend self-modification (M8 non-goals remain).
- Real-time server-push infrastructure (SSE/WebSocket) — a targeted page reload achieves the same UX with less complexity.
- Automated eval harness or few-shot dataset curation (future milestone).
- New Tauri rebuild pipeline (full rebuild takes minutes; page reload is the viable signal for M10).

---

### Q1: Live Apply / Hot-Reload

**Decision: `window.location.reload()` triggered by the frontend after `applied` is detected.**

**Rationale:**
The frontend already polls `/agent/patch-status/{id}`. When `applied` is detected, the runtime has already written files and committed. In dev mode, Vite's file watcher fires HMR automatically — the visual change is live before the frontend even finishes the poll cycle. The reload confirms the change is visible and resets any stale React state.

**Why not Vite HMR alone:** HMR is non-deterministic (some module boundary changes force a full reload anyway). We can't reliably detect HMR completion from the frontend without adding a Vite plugin.

**Why not SSE/WebSocket push:** Adds new infrastructure (connection management, reconnect logic) for a one-liner benefit. Overkill for M10.

**Why not Tauri full rebuild:** Minutes-long process, unsuitable for "daily improvement" velocity goal.

**Mechanism:**
1. Frontend polling detects `status === "applied"`.
2. Frontend sets a new intermediate display state `"reloading"` in the PatchNotification (shows "Applying your update — reloading…").
3. After 400 ms (lets Vite HMR settle in dev), calls `window.location.reload()`.
4. On reboot, the frontend calls `/state`, which returns the patch with `status: applied`.
5. PatchNotification reappears showing the applied state: "Updated: [description]. Undo?" — the reload is the implicit "change is live" signal.

**"Change is live" signal:** The page reload itself. After the reload, the notification showing `applied` indicates the new code is running. No explicit `reloaded_at` timestamp needed in M10.

**State transitions added:**
```
applied → (frontend: 400ms) → reloading (display only) → [page reload] → applied (on reboot)
```

**New display-only status in PatchNotification:** `"reloading"` — spinner + "Applying your update — reloading…" — not persisted to backend.

---

### Q2: Patch Scope Guard

**Decision: Keep both layers. Extract the allowlist to a config file. No new Layer 3.**

**Current layers (from M8) — both stay:**
- Layer 1: System prompt constraint in `SCOPE_GUARD_SYSTEM_PROMPT` (agent-side).
- Layer 2: Server-side `validate_scope()` with `^apps/desktop/src/` regex (runtime-side).

**Why not a third layer (pre-commit hook):** The current double-layer already catches all violations before any file is written to the working copy. A third hook would add git hook complexity and could cause confusing failures during normal dev work. Not needed in M10.

**Changes for M10:**
1. **Extract allowlist to `apps/desktop/runtime/config/patch-allowlist.json`:**
   ```json
   {
     "version": "1",
     "allow_patterns": ["^apps/desktop/src/"],
     "deny_extensions": [".py", ".json", ".ts" ],
     "deny_patterns": [
       "^apps/desktop/runtime/",
       "package\\.json$",
       "package-lock\\.json$",
       "tsconfig\\.json$",
       "vite\\.config\\.ts$"
     ],
     "notes": "UI-only layer. Patches may only touch React source under apps/desktop/src/."
   }
   ```
   Note: `.ts` and `.tsx` files inside `apps/desktop/src/` are allowed; only config `.ts` files are denied via the deny_patterns list. The allow_patterns take precedence: a file must match an allow_pattern AND not match a deny_pattern or deny_extension outside the allowed prefix.
   
   Actual runtime logic: a file is allowed if it matches `^apps/desktop/src/` (Layer 2 regex). The config file is the auditable human-readable record; `validate_scope()` continues to use the regex but loads it from the config.

2. **Tighten Layer 1 system prompt**: Add explicit "prefer 1-2 files max, smallest change that addresses the feedback" constraint (see Q3 below — the prompt is improved there).

3. **`validate_scope()` becomes config-driven**: Reads `patch-allowlist.json` at startup; falls back to the hardcoded pattern if the file is missing.

---

### Q3: Patch Quality

**Decision: Richer system prompt + design-context injection + patch metrics logging.**

**Root causes of variable quality:**
1. Prompt gives no design philosophy context — agent makes arbitrary aesthetic choices.
2. No guidance on change size — agent may modify too many files or make sweeping changes.
3. Feedback area isn't used to hint at relevant files — agent has to scan all of `src/`.
4. No quality feedback loop — we don't know baseline acceptance rate.

**Changes for M10:**
1. **System prompt additions** (appended to `SCOPE_GUARD_SYSTEM_PROMPT`):
   ```
   Design philosophy: This is a warm, calm AI workspace. Use the existing Tailwind tokens
   (var(--color-accent), var(--color-panel), etc.). Make the smallest change that addresses
   the feedback — prefer touching 1-2 files maximum. Do not add new dependencies or create
   new files.
   ```
2. **Area-based file hint in the user prompt** (in `_call_pi`):
   - If `area` starts with `ui.chat` → hint: "Likely relevant: src/App.tsx, src/ChatBubble.tsx, src/MessageList.tsx"
   - If `area` starts with `ui.settings` → hint: "Likely relevant: src/settingsPanel.tsx"
   - If `area` starts with `ui.` (generic) → hint: "Likely relevant: src/App.tsx"
   - Otherwise: no file hint
3. **Explicit description request** in the prompt: "After making changes, output a single plain-English sentence starting with a past-tense verb describing exactly what you changed (e.g., 'Updated the welcome message to be warmer and more personal.')."
4. **Patch metrics table** (`patch_metrics`) in SQLite, with columns: `patch_id`, `feedback_id`, `status` (final), `agent_model`, `files_changed_count`, `diff_lines_added`, `diff_lines_removed`, `created_at`, `resolved_at`.
5. **Acceptance rate as quality proxy**: `applied / (applied + apply_failed + scope_blocked)` per 7-day rolling window, logged in the metrics table. Target: ≥60% acceptance rate within the first 10 real patch runs after T-0076 ships. Tracked manually via `SELECT` on `patch_metrics` in M10; automated dashboard is a future item.

**What won't change in M10:** Model selection, eval harness, few-shot examples, prompt A/B testing.

---

### Q4: Diff UI

**Decision: Keep inline. Enhance inline diff with color-coded additions/removals and file header.**

A dedicated "Proposed Changes" panel is not needed. The inline toggle in `PatchNotification` serves the use case: the user can quickly inspect what changed without leaving the context of the chat. A dedicated panel would add a navigation level and fragment the notification flow.

**Inline diff enhancement** (part of T-0076 scope, as a small bounded UI change):
- Green tinted background (`#edfdf1`) for `+` lines, red tinted (`#fdf3f3`) for `-` lines.
- File header showing the changed filename above each file section.
- Line numbers preserved from the unified diff (already present in unified diff format).
- No new libraries needed — CSS-only coloring via parsing the diff line prefix in the render function.
- Max-height stays at `max-h-60` (scrollable); layout otherwise unchanged.

**Why not a diff library (react-diff-viewer, etc.):** Adds a dependency for what is a read-only informational display. CSS-only coloring achieves the "scannable" goal with zero added weight.

---

### Rules and State Transitions (M10 additions to M8 spec §5)

| Old state | Trigger | New state | User sees |
|---|---|---|---|
| `applied` | frontend detects via polling | `reloading` (display only, 400ms) | "Applying your update — reloading…" + spinner |
| `reloading` | `window.location.reload()` fires | (page reloads → reboot) | page flash |
| boot (after reload) | `/state` returns patch with `applied` | `applied` (notification reappears) | "Updated: [description]. Undo?" |

All other states from M8 spec §5 are unchanged.

---

### User-Facing Feedback Plan

- **Reloading state copy**: "Applying your update — reloading…" (spinner, ~400ms, then reload)
- **Post-reload applied state copy**: Same as M8 — "[description]. Undo?" — unchanged.
- **No new error states** from Q1/Q2/Q3 changes. Existing failure states (apply_failed, scope_blocked) are unchanged.
- **Enhanced diff**: Color-coded lines make the diff immediately readable; no new copy needed.

---

### Scope Bounds

- **T-0075 scope**: `apps/desktop/src/hooks/useRuntime.ts` (add reload trigger after `applied`), `apps/desktop/src/PatchNotification.tsx` (add `reloading` display state). No backend changes.
- **T-0076 scope**: `apps/desktop/runtime/agent/patch_agent.py` (prompt improvements + config loading), new `apps/desktop/runtime/config/patch-allowlist.json`, new `patch_metrics` SQLite table + logging in the apply endpoint, `apps/desktop/src/PatchNotification.tsx` (diff line coloring). No new npm packages.
- Both tickets: no schema migrations, no new API endpoints, no new files beyond the config file.

---

### Edge Cases / Failure Modes

| Scenario | Handling |
|---|---|
| Page reload fails (browser blocks reload) | Patch stays `applied`; user can manually reload. No action needed. |
| After reload, `/state` returns patch as `applying` (rare race) | Polling resumes normally; notification shows spinner. |
| Config file `patch-allowlist.json` is missing | `validate_scope()` falls back to hardcoded `^apps/desktop/src/` regex (backward compatible). |
| Metrics table not initialized | `patch_agent.py` logs a warning and continues; metrics are best-effort. |
| Enhanced diff has malformed unified_diff text | Diff rendering gracefully degrades to plain pre/code display (no crash). |

---

### Validation Plan

**T-0075 (deterministic):**
- QA: trigger a stub patch (PATCH_AGENT_STUB=true) → verify status transitions to `applied` → verify page reloads within ~1s → verify notification reappears post-reload with `applied` state.
- Regression: all existing PatchNotification states render correctly; no test regressions.

**T-0076 (deterministic):**
- QA: verify `patch-allowlist.json` loads correctly and `validate_scope()` uses it.
- QA: run `patch_agent.py` with STUB=true; verify `patch_metrics` row is inserted with correct fields.
- QA: verify enhanced diff renders `+` lines green and `-` lines red-tinted.
- Acceptance rate proxy: run 5 real patches after shipping; record outcomes in `patch_metrics`; target ≥3/5 reaching `applied`.

---

## Subtasks
- [x] Review M8 code: `patch_agent.py`, `router.py`, and frontend patch acceptance flow
- [x] Research hot-reload options for Tauri + React (Vite HMR vs full rebuild vs runtime JS swap)
- [x] Decide and document scope guard mechanism
- [x] Identify 2-3 concrete prompt quality improvements
- [x] Write implementation tickets (T-0075+) with design spec inline
- [x] Update E-0013 linked-tickets table
- [x] Update ORDER.md

## QA Evidence Links
- QA checkpoint: `tickets/meta/qa/2026-03-04-qa-T-0074.md`
- Type: doc review (spec/docs-only ticket — no software changed)
- Result: PASS

## Evidence (Verification)
- Tests run: N/A (docs-only ticket; no software changed)
- Manual checks performed: full doc consistency pass — all acceptance criteria met, cross-references validated, DoR verified for T-0075 and T-0076
- Doc review: `tickets/meta/qa/2026-03-04-qa-T-0074.md`

## Notes
This is a spec/research ticket. Implementation should not begin before this ticket is done. If the implementer discovers that one question requires a separate spike, split it into a subtask ticket and keep T-0074 as the coordinating spec.

## Change Log
- 2026-03-04: Ticket created by PM; placed in ready/ as first M10 pickup.
- 2026-03-04: Moved to in-progress; Design Spec written (all 3 open questions resolved). T-0075 and T-0076 created and moved to ready/.
- 2026-03-04: Moved to review; doc review PASS (tickets/meta/qa/2026-03-04-qa-T-0074.md).
- 2026-03-04: PM accepted; moved to done. All AC met, doc review passed, T-0075/T-0076 in ready/.
