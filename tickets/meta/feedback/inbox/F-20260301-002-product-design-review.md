# F-20260301-002: Product & design review — priority inversion

## Metadata
- ID: F-20260301-002
- Status: ticketed
- Source: pm-design-review
- Theme: direction
- Severity: S2
- Linked Tickets: T-0031, T-0032, T-0033, T-0034, T-0035, T-0036, T-0037, T-0038, T-0039, T-0040
- Received: 2026-03-01
- Updated: 2026-03-01

## Raw Feedback (Sanitized)
Comprehensive product and design review conducted from a Software Designer & Architect perspective. Assessed vision, UX/UI, architecture, epic/ticket roadmap, and process maturity.

## Normalized Summary
The project has a strong vision ("personal software that evolves") but has inverted priorities: self-evolution infrastructure (proposals, channels, rollback, validation gates) was built before the core product works (chat still returns stubs). The UI is designed from the system's perspective (Settings/proposals/flags dominate) rather than the user's perspective (chat should be 95% of the experience). The stated tech stack (Tailwind, shadcn/ui, Zustand) was never adopted, and the frontend is a 500-line monolith. Course correction needed: ship M3 fast, then simplify UI radically and build conversational UX table stakes before resuming self-evolution work.

## PM Notes
- Key findings:
  1. M3 ("Real AI Chat") should have been M0 — the product needs to chat before it can self-evolve.
  2. 75% of left-rail navigation (Settings, Feedback, Advanced) serves meta-surfaces, not the primary use case.
  3. Feedback should be ambient/contextual, not a navigation destination.
  4. "Advanced" tab has one item (Delete Local Data) — not a tab, a setting.
  5. Empty state and runtime messaging use developer language ("start the runtime").
  6. Tech stack mismatch: STATUS.md says Tailwind + shadcn/ui + Zustand; code uses plain CSS + useState.
  7. App.tsx is a 500-line monolith mixing layout, state, HTTP, and handlers.
  8. The proposal/changelog infrastructure has more endpoints than the core chat.
- Proposed direction: two new epics (E-0005 UI simplification, E-0006 chat UX table stakes) after M3.

## Triage Decision
- Decision: ticketed (E-0005, E-0006)
- Rationale: Findings are structural and affect product direction. Tickets created for actionable items; M3 remains top priority.
- Revisit Trigger: after M3 ships
