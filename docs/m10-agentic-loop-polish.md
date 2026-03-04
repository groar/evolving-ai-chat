# M10 Agentic Loop Polish — Design Spec

*Source of truth for T-0075 and T-0076. Authored in T-0074.*

---

## 1. Problem Summary

M8 shipped a working end-to-end self-modification loop. Three gaps remain:

1. **No live apply**: after a patch is committed, the running app still shows the old code — the user must manually restart.
2. **Variable patch quality**: the agent's prompt lacks design context, scope hints, and a feedback loop. No baseline acceptance rate is tracked.
3. **Implicit scope guard**: the allowlist is hardcoded in Python, not auditable as a config artifact.

A fourth question (diff UI: inline vs dedicated panel) was resolved as: **keep inline, enhance visually**.

---

## 2. Resolution Summary

| Question | Decision | Ticket |
|---|---|---|
| Live apply / hot-reload | `window.location.reload()` after `applied` detected (400ms delay) | T-0075 |
| Scope guard formalization | Config-driven `patch-allowlist.json`; both layers retained | T-0076 |
| Patch quality | Richer prompt (design philosophy + area hints + size constraint) + metrics table | T-0076 |
| Diff UI | Keep inline; color-code `+`/`-` lines; no new library | T-0076 |

---

## 3. Q1 — Live Apply / Hot-Reload

### Mechanism

After `status === "applied"` is detected in the patch polling loop:
1. The frontend sets a transient display state `"reloading"` in `PatchNotification` — shows "Applying your update — reloading…" + spinner.
2. After **400 ms**, calls `window.location.reload()`.
3. On reboot, the frontend fetches `/state`, which returns the patch with `status: applied`.
4. `PatchNotification` reappears with "[description]. Undo?" — this is the implicit "change is live" confirmation.

### Why page reload (not Vite HMR or SSE)

- **Vite HMR** fires automatically in dev mode once files are written — the visual is already live. But HMR doesn't always work for all React module changes, and there's no reliable completion signal without a Vite plugin. Combining HMR + reload = best of both.
- **SSE/WebSocket push** adds connection-management infrastructure for a one-liner benefit. Overkill for M10.
- **Tauri rebuild** takes minutes. Incompatible with the daily-improvement velocity goal.

### State transitions (M10 additions)

```
applied → (frontend: 400ms) → reloading (display only) → [window.location.reload()] → boot → applied (reappears)
```

`"reloading"` is a frontend-only display state. It is never written to the backend.

### Notification persistence after reload

The notification persists because `PatchNotification` is driven by the patches array loaded from `/state` on every boot. After a reload, the existing `applied` patch appears automatically with no extra work.

---

## 4. Q2 — Scope Guard Formalization

### Decision

Both M8 layers remain. The allowlist is extracted to a config file for auditability.

**Layer 1 (system prompt):** unchanged mechanism, tightened wording (see §5 below for the combined prompt).

**Layer 2 (server-side regex):** `validate_scope()` loads the `allow_patterns` list from `apps/desktop/runtime/config/patch-allowlist.json` at startup. Falls back to `^apps/desktop/src/` if the file is absent (backward compatible).

### Config file: `apps/desktop/runtime/config/patch-allowlist.json`

```json
{
  "version": "1",
  "allow_patterns": ["^apps/desktop/src/"],
  "notes": "UI layer only. Patches may only touch React source under apps/desktop/src/. Do not add to allow_patterns without updating the scope guard system prompt and the QA checkpoint."
}
```

The `deny_extensions` and `deny_patterns` fields are not needed for M10 — the single positive `allow_patterns` entry (`^apps/desktop/src/`) already rejects everything else. Adding explicit deny lists would require keeping them in sync with the system prompt and introduces false-security from enumeration. The positive-only allowlist is simpler and more robust.

---

## 5. Q3 — Patch Quality

### Updated system prompt (replaces `SCOPE_GUARD_SYSTEM_PROMPT` in `patch_agent.py`)

```
You are a UI code assistant for an Electron/React desktop application.
Your working directory is the desktop package root. The React source tree is at src/.

SCOPE — You may ONLY modify files in:
  - src/ (React components, stores, hooks, styles)

You MUST NOT modify:
  - Any file outside src/
  - Any Python file (.py)
  - package.json, package-lock.json, tsconfig.json, vite.config.ts, or any build/config file
  - Any file in runtime/
  - Any file in tickets/, docs/, or tests/

CHANGE SIZE — Make the smallest change that fully addresses the feedback.
Prefer touching 1–2 files at most. Do not add new npm dependencies. Do not create new files. Do not delete files.

DESIGN PHILOSOPHY — This is a warm, calm AI workspace (closer to Notion AI than a dashboard).
Use the existing Tailwind CSS tokens: var(--color-accent) for primary actions (warm orange),
var(--color-panel) for card surfaces, var(--color-ink) for body text, var(--color-muted) for
secondary labels. Do not introduce new colors or override the design system.

OUTPUT — After making your changes, output exactly one plain-English sentence starting with a
past-tense verb that describes what you changed. Example: "Updated the welcome message to feel
warmer and more personal." This sentence will be shown to the user.
```

### Area-based file hints (added to the user prompt in `_call_pi`)

| `feedback.area` prefix | Hint appended to prompt |
|---|---|
| `ui.chat` | "The relevant files are likely src/App.tsx or src/components/chat/." |
| `ui.settings` | "The relevant files are likely src/settingsPanel.tsx." |
| `ui.` (other) | "The relevant files are likely in src/App.tsx." |
| (no match) | No hint added. |

### Patch metrics table

New SQLite table `patch_metrics` (created in the existing DB migration):

```sql
CREATE TABLE IF NOT EXISTS patch_metrics (
    patch_id TEXT PRIMARY KEY,
    feedback_id TEXT,
    final_status TEXT,       -- applied | apply_failed | scope_blocked | malformed
    agent_model TEXT,
    files_changed_count INTEGER,
    diff_lines_added INTEGER,
    diff_lines_removed INTEGER,
    created_at TEXT,
    resolved_at TEXT
);
```

The apply/rollback endpoint writes a row when a patch reaches a terminal status.

### Quality proxy

**Acceptance rate** = `applied / (applied + apply_failed + scope_blocked + malformed)` over a rolling 7-day window.

M10 target: ≥ 60% within the first 10 real patches after T-0076 ships.

Query: `SELECT final_status, COUNT(*) FROM patch_metrics GROUP BY final_status;`

---

## 6. Q4 — Diff UI

### Decision: Keep inline, enhance with color coding

A dedicated "Proposed Changes" panel adds navigation complexity without benefit for a mostly read-only informational display. The inline toggle in `PatchNotification` is sufficient.

### Enhancement spec (bounded UI change, part of T-0076)

The `<pre><code>` diff block is replaced with a rendered diff where:
- Lines starting with `+` get a green-tinted row background (`#edfdf1`) and green text (`#1a7a3c`).
- Lines starting with `-` get a red-tinted row background (`#fdf3f3`) and red text (`#b83232`).
- Lines starting with `@@` (hunk headers) get a muted blue-gray tint (`#eef3ff`) and muted text.
- File header lines (`--- a/...` / `+++ b/...`) are rendered as a bold filename chip above the diff block.
- Max height stays `max-h-60` (scrollable); `font-mono text-xs` preserved.

**Implementation**: A small pure-React `DiffBlock` component inside `PatchNotification.tsx` that splits the unified diff string by newline and applies a `className` per line prefix. No new npm packages.

---

## 7. Scope Bounds Summary

| Area | T-0075 | T-0076 |
|---|---|---|
| `useRuntime.ts` | Add reload trigger after `applied` | — |
| `PatchNotification.tsx` | Add `reloading` display state | Add color-coded `DiffBlock` component |
| `patch_agent.py` | — | Updated system prompt + area hints + metrics logging |
| `runtime/config/patch-allowlist.json` | — | New file |
| SQLite schema | — | New `patch_metrics` table |
| New npm packages | None | None |
| New API endpoints | None | None |

---

## 8. Validation Plan

### T-0075

1. Stub patch (PATCH_AGENT_STUB=true): trigger → poll → confirm `applied` → verify page reloads within ~1s → verify notification reappears post-reload with `applied` state.
2. Regression: all 8 `PatchNotification` states render correctly; `useRuntime` tests pass.

### T-0076

1. `patch-allowlist.json` present: `validate_scope()` loads patterns correctly; `validate_scope(["apps/desktop/src/App.tsx"])` returns `[]`; `validate_scope(["apps/desktop/runtime/main.py"])` returns the violation.
2. Stub patch run: verify `patch_metrics` row inserted with correct `patch_id`, `final_status`, `files_changed_count`.
3. Diff coloring: `<DiffBlock unified_diff={...} />` renders `+` lines with green background, `-` lines with red background, `@@` lines with muted tint.
4. Regression: `patch_agent.py` stub mode unchanged; existing apply/rollback endpoint tests pass.
