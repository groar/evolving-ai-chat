# F-20260308-008: collapsible side panel without overlay

## Metadata
- ID: F-20260308-008
- Status: ticketed
- Source: user-playtest
- Theme: ux, layout
- Severity: S2
- Linked Tickets: T-0105
- Received: 2026-03-08
- Updated: 2026-03-08

## Raw Feedback (Sanitized)
"I want the left side panel to be collapsible but not overlay the current discussion. Keep the discussion layout/functionality the same and let me use both at once."

## Normalized Summary
The conversation panel currently blocks the chat by opening as an overlay sheet; users want a collapsible side-by-side panel that preserves simultaneous access to the conversation list and current discussion.

## PM Notes
- Interpreted "left side panel" as the conversation list opened by the top-left panel button.
- Chosen default: desktop uses inline collapsible sidebar (non-overlay); keep existing behavior of right-side sheets unchanged.

## Triage Decision
- Decision: ticketed
- Rationale: Directly affects core chat navigation usability and can be addressed with a bounded app-shell layout change.
- Revisit Trigger: after shipping, verify no regression in discussion engagement flow or keyboard toggle behavior.
