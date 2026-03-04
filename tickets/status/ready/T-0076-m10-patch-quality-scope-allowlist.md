# T-0076: M10 Patch Quality — Prompt Engineering, Scope Allowlist Config, and Diff UI Polish

## Metadata
- ID: T-0076
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0013
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
Three tightly coupled improvements that lift patch quality, make the scope guard auditable, and polish the diff view — all without adding new npm packages or API endpoints:
1. **Prompt engineering**: Enrich the `pi` system prompt with design philosophy, change-size constraint, and area-based file hints. Add an explicit description-output instruction.
2. **Config-driven allowlist**: Extract the hardcoded `^apps/desktop/src/` allowlist to `apps/desktop/runtime/config/patch-allowlist.json` so it's readable, auditable, and easy to update.
3. **Patch metrics**: Add a `patch_metrics` SQLite table to track final patch outcomes (acceptance rate proxy).
4. **Enhanced inline diff**: Replace the plain `<pre><code>` diff block in `PatchNotification` with a color-coded `DiffBlock` component — green for additions, red for removals, muted for hunk headers — using CSS only.

## Design Spec
See `docs/m10-agentic-loop-polish.md` §4, §5, §6 for full rationale.

### Goals
- Patches address feedback more precisely with fewer wasted review cycles.
- The allowlist is a readable config artifact, not buried in Python.
- Acceptance rate is measurable from day one (proxy: `patch_metrics` table).
- Diffs are easy to scan at a glance, reducing cognitive load for the "See what changed" toggle.

### Non-Goals
- Few-shot example datasets or automated eval harness.
- Model routing changes or prompt A/B testing infrastructure.
- New npm diff libraries (react-diff-viewer, etc.).
- Changes to the apply/rollback endpoint logic or API surface.

### Rules and State Transitions
No new states. The diff display is purely cosmetic. Metrics logging is best-effort (a DB write failure must not block the apply flow).

### User-Facing Feedback Plan
- The `DiffBlock` makes the diff immediately scannable: green additions, red removals, file header chip.
- No new copy. No changes to notification states.

### Scope Bounds
- `apps/desktop/runtime/agent/patch_agent.py`: update `SCOPE_GUARD_SYSTEM_PROMPT`, update `_call_pi` to inject area hints and load allowlist from config, add `patch_metrics` logging stub (DB write).
- `apps/desktop/runtime/config/patch-allowlist.json`: new config file.
- SQLite migration: add `patch_metrics` table (new `CREATE TABLE IF NOT EXISTS` in the existing migration module).
- `apps/desktop/src/PatchNotification.tsx`: replace `<pre><code>{unified_diff}</code></pre>` with `<DiffBlock unifiedDiff={unified_diff} />` (inline subcomponent).
- No new API endpoints. No new npm packages.

### Updated System Prompt

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

### Area-Based File Hints

| `feedback.area` prefix | Appended to user prompt |
|---|---|
| `ui.chat` | "The relevant files are likely src/App.tsx or src/components/chat/." |
| `ui.settings` | "The relevant files are likely src/settingsPanel.tsx." |
| `ui.` (other) | "The relevant files are likely in src/App.tsx." |
| (no match) | No hint. |

### Config File: `apps/desktop/runtime/config/patch-allowlist.json`

```json
{
  "version": "1",
  "allow_patterns": ["^apps/desktop/src/"],
  "notes": "UI layer only. Patches may only touch React source under apps/desktop/src/. Do not add to allow_patterns without updating the scope guard system prompt and the QA checkpoint."
}
```

`validate_scope()` loads `allow_patterns` from this file at startup. Falls back to hardcoded `^apps/desktop/src/` if the file is absent.

### Patch Metrics Schema

```sql
CREATE TABLE IF NOT EXISTS patch_metrics (
    patch_id TEXT PRIMARY KEY,
    feedback_id TEXT,
    final_status TEXT,
    agent_model TEXT,
    files_changed_count INTEGER,
    diff_lines_added INTEGER,
    diff_lines_removed INTEGER,
    created_at TEXT,
    resolved_at TEXT
);
```

A row is inserted/updated when a patch reaches a terminal status (`applied`, `apply_failed`, `scope_blocked`, or `malformed`). Logging failures are caught and logged as warnings — they never block the apply flow.

### DiffBlock Component (inline, no new file)

A pure-React subcomponent inside `PatchNotification.tsx`:

```tsx
function DiffBlock({ unifiedDiff }: { unifiedDiff: string }) {
  const lines = unifiedDiff.split("\n");
  return (
    <div className="text-xs font-mono leading-relaxed overflow-auto max-h-60 rounded-lg border border-border bg-[#f9f8f6] p-2">
      {lines.map((line, i) => {
        const isAdd = line.startsWith("+") && !line.startsWith("+++");
        const isDel = line.startsWith("-") && !line.startsWith("---");
        const isHunk = line.startsWith("@@");
        const isHeader = line.startsWith("---") || line.startsWith("+++");
        return (
          <div
            key={i}
            className={
              isAdd ? "bg-[#edfdf1] text-[#1a7a3c] px-1" :
              isDel ? "bg-[#fdf3f3] text-[#b83232] px-1" :
              isHunk ? "bg-[#eef3ff] text-[#5a6ea8] px-1" :
              isHeader ? "font-semibold text-[#555] px-1" :
              "px-1 text-[#444]"
            }
          >
            {line || " "}
          </div>
        );
      })}
    </div>
  );
}
```

### Edge Cases / Failure Modes

| Scenario | Handling |
|---|---|
| `patch-allowlist.json` missing | Falls back to hardcoded `^apps/desktop/src/`; logs warning. |
| Metrics DB write fails | Warning logged; apply flow continues normally. |
| `unified_diff` is empty | `DiffBlock` renders an empty container (no crash). |
| Malformed diff (no newlines) | `split("\n")` returns `[""]`; renders one blank line; no crash. |

## Context
- `SCOPE_GUARD_SYSTEM_PROMPT` in `patch_agent.py` is the Layer 1 scope guard (spec §6).
- `validate_scope()` in `patch_agent.py` is the Layer 2 server-side check.
- Patch quality was noted as "variable" in the M8 tier-2 micro-validation (STATUS.md).
- `PatchNotification.tsx` currently renders unified diff as a plain `<pre><code>` block.
- No `patch_metrics` table exists yet; the SQLite DB is created by the existing migration module.

## References
- `docs/m10-agentic-loop-polish.md` §4, §5, §6
- `apps/desktop/runtime/agent/patch_agent.py` — `SCOPE_GUARD_SYSTEM_PROMPT`, `validate_scope()`, `_call_pi()`
- `apps/desktop/src/PatchNotification.tsx` — diff toggle block
- `tickets/meta/epics/E-0013-m10-agentic-loop-polish.md`

## Acceptance Criteria
- [ ] `patch-allowlist.json` exists at `apps/desktop/runtime/config/patch-allowlist.json` with `allow_patterns: ["^apps/desktop/src/"]`.
- [ ] `validate_scope()` loads patterns from the config file; falls back to hardcoded regex if file is absent.
- [ ] `validate_scope(["apps/desktop/src/App.tsx"])` returns `[]` (no violations).
- [ ] `validate_scope(["apps/desktop/runtime/main.py"])` returns `["apps/desktop/runtime/main.py"]`.
- [ ] Running a stub patch (PATCH_AGENT_STUB=true) inserts a row into `patch_metrics` with correct `patch_id`, `final_status`, and `files_changed_count`.
- [ ] The updated `SCOPE_GUARD_SYSTEM_PROMPT` contains: change-size constraint ("1–2 files"), design philosophy tokens (`var(--color-accent)`), and output format instruction.
- [ ] When `feedback.area` is `ui.chat`, the pi prompt includes the chat file hint.
- [ ] `PatchNotification` diff toggle renders `+` lines with green background (`#edfdf1`), `-` lines with red background (`#fdf3f3`), `@@` lines with muted blue-gray tint.
- [ ] `DiffBlock` renders gracefully when `unified_diff` is empty (no crash or error boundary trigger).
- [ ] All existing `PatchNotification` tests pass. No TypeScript errors.

## User-Facing Acceptance Criteria
- [ ] A user viewing "See what changed" can immediately distinguish added (green) from removed (red) lines without reading each character.

## UX Acceptance Criteria
- [ ] Diff is scrollable with `max-h-60`; does not overflow the notification card.
- [ ] File header lines are visually distinct (bold/muted) from diff content lines.
- [ ] Color choices work against the notification's warm-tinted background (green/red tints do not clash).

## Dependencies / Sequencing
- Depends on: T-0074 (design spec) — done.
- Depends on: T-0075 optionally (can be picked in parallel; no shared files except PatchNotification.tsx — coordinate if picked simultaneously).
- Sequencing: T-0075 then T-0076 is the cleanest order (T-0075 modifies `useRuntime.ts` and adds `"reloading"` state; T-0076 modifies `PatchNotification.tsx` separately).

## QA Evidence Links
- QA checkpoint: (to be filled after implementation)

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Create `apps/desktop/runtime/config/patch-allowlist.json`
- [ ] Update `validate_scope()` to load from config (with fallback)
- [ ] Replace `SCOPE_GUARD_SYSTEM_PROMPT` with updated version
- [ ] Add area-based file hints to `_call_pi` prompt construction
- [ ] Add `patch_metrics` table to SQLite migration
- [ ] Add metrics logging in apply/terminal-status path
- [ ] Add `DiffBlock` subcomponent to `PatchNotification.tsx`
- [ ] Replace `<pre><code>` diff block with `<DiffBlock>`
- [ ] Update/add tests for config loading, metrics, and DiffBlock rendering

## Notes
- `DiffBlock` intentionally avoids a new file to keep the diff-view code co-located with the notification component that owns it. If it grows significantly, extract to a standalone file.
- The `patch_metrics` logging should use a try/except so a DB failure never blocks a patch apply.
- The area hints are a simple heuristic — they don't guarantee the agent picks the right files, but they reduce search space.

## Change Log
- 2026-03-04: Ticket created by implementation agent from T-0074 design spec.
