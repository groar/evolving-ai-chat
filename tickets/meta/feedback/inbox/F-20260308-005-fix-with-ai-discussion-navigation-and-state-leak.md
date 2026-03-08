# F-20260308-005: Fix with AI — discussion navigation and state leakage

## Metadata
- ID: F-20260308-005
- Status: ticketed
- Source: user-playtest
- Theme: ux, reliability, fix-with-ai
- Severity: S2
- Linked Tickets: T-0103
- Received: 2026-03-08
- Updated: 2026-03-08

## Raw Feedback (Sanitized)
- "If I click on another discussion (through the left panel), it does not change to the other discussion."
- "If I go through activity log, click on the discussion of another card, it starts a brand new discussion, calls a model to generate a message."
- "The in progress is shown in that new discussion although it's not related to that particular fix."

## Normalized Summary
Fix with AI discussion routing is inconsistent after launching an agent run: explicit navigation can be ignored, Activity discussion links can open a new discussion and trigger an unrelated model call, and in-progress status can leak into unrelated discussions.

## PM Notes
- Related recent fixes: T-0099 (progress visibility), T-0100 (correct conversation after Run Agent), T-0101 (terminal status).
- New report indicates unresolved or regressed navigation-state coupling across discussion selection, activity deep-link routing, and in-progress status scoping.
- This is a bug cluster in a critical flow, not a UX polish request.

## Triage Decision
- Decision: ticketed -> T-0103
- Rationale: High-impact Fix with AI navigation regression; user loses control of active discussion and sees unrelated run state. Prioritized as P1 for next pickup.
- Revisit Trigger: After T-0103 ships and QA validates discussion-link and status-isolation flows.
