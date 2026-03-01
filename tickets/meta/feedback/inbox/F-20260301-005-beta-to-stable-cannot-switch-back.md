# F-20260301-005: Cannot switch back from Beta to Stable

## Metadata
- ID: F-20260301-005
- Status: ticketed
- Source: user-playtest
- Theme: ux
- Severity: S2
- Linked Tickets: T-0044
- Received: 2026-03-01
- Updated: 2026-03-01

## Raw Feedback (Sanitized)
"When I click on Beta (early access), I can't click back on stable."

## Normalized Summary
After switching to Beta (early access), the user cannot switch back to Stable (recommended). The channel selector in Settings appears to block or fail the reverse transition.

## PM Notes
- User context: Settings panel, Updates & Safety section, channel toggle (Stable / Beta).
- Expected behavior: Bidirectional channel switch — user can switch Stable ↔ Beta in either direction.
- Observed behavior: Switching from Stable → Beta works; switching from Beta → Stable does not work (user cannot click back).
- Possible causes for implementation to investigate:
  - `window.confirm` in Tauri WebView may block or misbehave when switching to Stable (Stable uses confirmation, Beta does not).
  - Click handler, overlay, or z-index may block the Stable button when channel is Beta.
  - Race or stuck `isBusy` state preventing the switch.

## Triage Decision
- Decision: ticketed
- Rationale: S2 — blocks users from reverting to recommended channel; regression of intended behavior.
- Revisit Trigger: T-0044 acceptance.
