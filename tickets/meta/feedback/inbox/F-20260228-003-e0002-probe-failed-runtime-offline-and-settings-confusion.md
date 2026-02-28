# F-20260228-003: E-0002 probe failed (runtime offline + settings confusion)

## Metadata
- ID: F-20260228-003
- Status: ticketed
- Source: user-playtest
- Theme: ux
- Severity: S2
- Linked Tickets: T-0023, T-0024
- Received: 2026-02-28
- Updated: 2026-02-28

## Raw Feedback (Sanitized)
Fresh observer ran the E-0002 micro-validation probes and reported:
- The app displayed a runtime-offline banner (“start the runtime, then retry”) even though they believed the runtime was running.
- When asked about Settings controls (“Switch to Stable”, “Reset Experiments”), they answered “No idea”.
- They described the surface as “super crowded” and asked what “proposal/experiment” means and why there are multiple “stable” buttons.

## Normalized Summary
The E-0002 usability probes indicate (1) runtime availability is not reliably communicated/detected, and (2) the Settings/Changelog/Proposals concepts are not understandable to a fresh user, undermining the “safe self-improvement loop” trust model.

## PM Notes
Concrete mismatch example:
- user context: first-time observer attempting to use Settings and interpret release channel + experiments controls
- expected behavior: user can locate Settings quickly and correctly infer “Switch to Stable” and “Reset Experiments” safety implications; runtime status reflects reality
- observed behavior: user is unable to interpret both controls (“No idea”); UI feels crowded/overloaded; runtime-offline banner persists despite runtime reportedly running
- why it read as inconsistent: banner and duplicated controls (“stable”) make the system feel broken/contradictory, blocking confidence in the changelog/rollback promise

## Triage Decision
- Decision: ticketed
- Rationale: This blocks the E-0002 validation plan and directly undermines user trust in safety/rollback controls.
- Revisit Trigger: after T-0023 and T-0024 are accepted and probes are rerun.
