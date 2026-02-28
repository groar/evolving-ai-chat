# F-20260228-001: Settings navigation confusing

## Metadata
- ID: F-20260228-001
- Status: closed
- Source: user-playtest
- Theme: ux
- Severity: S2
- Linked Tickets: T-0017
- Received: 2026-02-28
- Updated: 2026-02-28

## Raw Feedback (Sanitized)
User could not find "Settings" and became extremely confused on first launch. They interpreted the UI as broken, especially after seeing runtime-related error messaging ("Could not load changelog, proposals, and settings." / "Runtime unavailable").

## Normalized Summary
Settings are not discoverable to first-time users, and runtime-unavailable messaging is broad/confusing enough to block the intended validation flow.

## PM Notes
- Context: This surfaced immediately while attempting the 3 micro-validation probes in `tickets/meta/epics/E-0002-m1-first-self-improvement-cycle.md` (Validation Plan).
- Concrete mismatch example:
  - user context: first app launch, asked to navigate to "Settings"
  - expected behavior: user can locate Settings quickly and understand it contains "Changelog + Experiments" controls
  - observed behavior: user cannot find "Settings" at all; runtime-unavailable copy reads like the app cannot load settings
  - why it read as inconsistent: the left rail includes settings-like controls, but they are not labeled as such and errors imply broader failure

## Triage Decision
- Decision: closed
- Rationale: Fix shipped via T-0017; follow-up human probe rerun tracked in T-0018.
- Revisit Trigger: if the follow-up probes still report confusion, reopen with concrete mismatch notes.
