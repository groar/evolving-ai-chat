# QA Checkpoint - 2026-03-01 (T-0044)

## Scope Tested
- Ticket: T-0044 (`tickets/status/review/T-0044-beta-to-stable-cannot-switch-back.md`)
- Area: ui — Beta → Stable channel switch fix; in-app confirmation dialog

## Automated Test Outcomes
- `cd apps/desktop && npm run test -- --run`: PASS (40 tests, including new Beta→Stable interaction test).
- Desktop build: passed (per validate script `desktop-build` step).

## Manual Scenarios Executed
- Deterministic interaction test: "Beta → Stable transition: clicking Stable when on Beta opens confirm dialog, confirming calls onSelectChannel" — verifies full flow via @testing-library/react + user-event.
- Recommended manual smoke: run `npm run tauri:dev`, open Settings, switch to Beta, then click Stable — confirm dialog should appear; click "Switch to Stable" — channel should update and notice shown.

## UX/UI Design QA (Area: ui — Required)
| Category | Result | Evidence |
| --- | --- | --- |
| 1) Mental Model | PASS | Channel toggle unchanged; "Stable (recommended)" and "Beta (early access)" remain clear. Confirm dialog adds intent check for downgrade. |
| 2) Hierarchy | PASS | Dialog overlays Settings; primary action "Switch to Stable" is explicit. Cancel is secondary. |
| 3) IA / Navigation | PASS | Single channel toggle; no duplicated controls. |
| 4) States and Error | PASS | Dialog open/close state managed; no new error paths. |
| 5) Copy | PASS | "Switch to Stable?" — title. "Your conversations and history are unaffected." — reassurance. "Cancel" and "Switch to Stable" — clear actions. No promise-control violations. |
| 6) Affordances | PASS | Stable button clickable when on Beta (was root cause: window.confirm blocked; now in-app Dialog). Confirm intent captured before switch. |
| 7) Visual Accessibility | PASS | Dialog uses standard Radix/shadcn styling; sufficient contrast. |
| 8) Responsive | PASS | Dialog `sm:max-w-md`; inherits Sheet overlay behavior. |

## Copy Regression Sweep (User-Facing Text Changed)
- New dialog copy: "Switch to Stable?", "Your conversations and history are unaffected.", "Switch to Stable", "Cancel" — consistent with existing rollback wording ("conversations and history are never affected", "No data is deleted").
- No other user-facing text changed.

## Criteria-to-Evidence Mapping
- User can switch from Beta back to Stable → in-app Dialog replaces broken window.confirm; onSelectChannel("stable") called on confirm → PASS.
- Channel switch bidirectional → Stable→Beta (unchanged); Beta→Stable (Dialog) → PASS.
- Deterministic test verifies Beta→Stable → `settingsPanel.test.tsx` interaction test → PASS.
- Stable button clickable when channel is Beta → test clicks Stable, opens dialog, confirms → PASS.
- UI reflects channel change after switch → runtime.updateChannel + existing notice flow → PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Manual visual smoke in Tauri recommended before PM acceptance: verify dialog renders correctly, Cancel dismisses, Switch to Stable updates channel.

**Suggested commit message:** `T-0044: Fix Beta→Stable channel switch — replace window.confirm with in-app Dialog`

**Next-step suggestion:** PM should accept T-0044 to `done/`. Optional: manual smoke in `tauri:dev`. Then proceed with T-0045 (rank 1 in ready queue).
