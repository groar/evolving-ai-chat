# T-0044: Cannot switch back from Beta to Stable

## Metadata
- ID: T-0044
- Status: backlog
- Priority: P2
- Type: bug
- Area: ui
- Epic: E-0001
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
After switching to Beta (early access) in Settings, the user cannot switch back to Stable (recommended). The channel selector blocks or fails the reverse transition, leaving users stuck on Beta.

## Context
- Release channels (Stable / Beta) were introduced in T-0006.
- Switching Stable → Beta works (direct `onSelectChannel("experimental")`).
- Switching Beta → Stable goes through `requestSwitchToStable` which uses `confirmAction` (`window.confirm`) before calling `onSelectChannel("stable")`.
- Possible causes: `window.confirm` behavior in Tauri WebView; overlay/z-index blocking the Stable button; stuck busy state.

## Feedback References
- F-20260301-005

## Acceptance Criteria
- [ ] User can switch from Beta (early access) back to Stable (recommended) in Settings.
- [ ] Channel switch is bidirectional: Stable ↔ Beta works in both directions.
- [ ] At least one deterministic test or manual scenario verifies the Beta → Stable transition.

## UX Acceptance Criteria (Area: ui)
- [ ] Stable button is clickable and responsive when channel is Beta.
- [ ] After switching to Stable, UI reflects channel change and notice is shown as intended.

## Dependencies / Sequencing
- Root cause: Settings channel toggle in `apps/desktop/src/settingsPanel.tsx`; `requestSwitchToStable` + `confirmAction`; `useRuntime.updateChannel`.

## Change Log
- 2026-03-01: Ticket created from F-20260301-005 (user report: cannot click back on Stable after selecting Beta).
