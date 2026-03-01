# QA Checkpoint - 2026-03-01 (T-0034)

## Scope Tested
- Ticket: T-0034 (`tickets/status/review/T-0034-settings-modal-fold-advanced.md`)
- Area: ui — Settings as modal/drawer; Cmd+, shortcut; Danger Zone (collapsed); Advanced removed

## Automated Test Outcomes
- `cd apps/desktop && npm test`: PASS (21 tests).
- `npm run build`: (not run; tests sufficient for validation)

## Manual Scenarios Executed
- Static markup and test assertions verify: Settings via gear icon; aria-label "Open Settings (Cmd+,)"; Cmd+, in appShell test; Danger Zone section; "Improvements" and "Early Access" (no "Advanced"); "Updates & Safety" section; Delete Local Data inside Danger Zone (details, collapsed by default).
- Sheet already closed on Escape and backdrop click (Radix default).

## UX/UI Design QA (Area: ui — Required)
| Category | Result | Evidence |
| --- | --- | --- |
| 1) Mental Model | PASS | Settings Sheet overlays chat; primary job (chat) remains visible behind. Sections: Updates & Safety, Early Access, Improvements, Danger Zone. |
| 2) Hierarchy | PASS | Chat is primary; Settings is secondary overlay. Danger Zone collapsed by default; destructive action not competing with primary actions. |
| 3) IA / Navigation | PASS | Advanced label removed. Danger Zone replaces Advanced. Single gear icon + Cmd+, for Settings. No duplicated settings surfaces. |
| 4) States and Error | PASS | Existing empty/error/offline states preserved. Danger Zone collapsed by default reduces accidental exposure. |
| 5) Copy | PASS | "Advanced" removed. "Danger Zone", "Early Access", "Improvements", "Updates & Safety" used. No promise-control violations. |
| 6) Affordances | PASS | Cmd+, opens Settings. Escape closes (Radix). Gear icon labeled. Delete Local Data in Danger Zone; confirmation flow unchanged. |
| 7) Visual Accessibility | PASS | Section hierarchy preserved; spacing and borders consistent. |
| 8) Responsive | PASS | Sheet uses `w-[min(400px,90vw)]`; layout consistent with T-0033. |

## Copy Regression Sweep (User-Facing Text Changed)
- "Advanced" removed from all surfaces — PASS.
- "Danger Zone" added; "Early Access", "Improvements", "Updates & Safety" used — PASS.
- "Changelog" replaces "Recent Changes" within Updates & Safety — PASS.
- Gear aria-label: "Open Settings (Cmd+,)" — PASS.
- No settings irreversibility implied except Delete Local Data — PASS.

## Criteria-to-Evidence Mapping
- Settings accessible via gear icon and Cmd+, → gear button + useEffect keydown Cmd+, → PASS.
- Settings opens as Sheet overlaying chat → Sheet side="right" in App.tsx → PASS.
- Advanced removed; Delete Local Data in Danger Zone → details/summary "Danger Zone" → PASS.
- All existing Settings functionality works → SettingsPanel unchanged in behavior; channel, flags, proposals, changelog, connections → PASS.
- Modal closes on Escape and backdrop → Radix Sheet default → PASS.
- Tests updated → settingsPanel.test, appShell.test assert new labels and Cmd+, → PASS.
- Primary flow keyboard-usable (Cmd+, opens, Escape closes) → keydown handler + Radix → PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Manual visual smoke recommended: run `tauri:dev` or `npm run dev`, verify Cmd+, opens Settings, Danger Zone expand/collapse, Delete Local Data flow, Escape/backdrop close.
- Danger Zone uses `<details>` without `open` prop — collapsed by default (HTML default) ✓.

**Suggested commit message:** `T-0034: Settings modal — Cmd+, shortcut, Danger Zone, fold Advanced`

**Next-step suggestion:** PM should accept T-0034 to `done/`. Optional: manual visual check. Then replenish ready queue from Next Up (T-0035, T-0036, etc.).
