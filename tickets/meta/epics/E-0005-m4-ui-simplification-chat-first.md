# E-0005: M4 — UI Simplification & Chat-First Redesign

## Metadata
- ID: E-0005
- Status: planned
- Owner: pm-agent
- Created: 2026-03-01
- Updated: 2026-03-01



## Goal
Strip the UI back to a chat-first experience. Adopt the stated design system (Tailwind + shadcn/ui). Decompose the frontend monolith. Make Settings, Feedback, and Advanced ambient rather than primary navigation destinations. The result: opening the app feels like opening a conversation, not a control panel.

## Rationale
Product & design review (F-20260301-002) found that 75% of the left-rail navigation serves meta-surfaces (Settings, Feedback, Advanced) rather than the primary use case (chat). The UI was designed from the system's perspective. A "chat-first" reset is needed before self-evolution features can be layered on meaningfully — users need to want to use the app daily for the observe-propose-validate loop to have real signal.

## Definition of Done
- Chat is the dominant visual experience on launch — no competing navigation tabs visible by default.
- Settings is accessible via icon/menu (modal or drawer), not a primary nav tab.
- Feedback capture is inline/contextual (near messages or via shortcut), not a navigation destination.
- "Advanced" is folded into Settings as a section.
- Tailwind + shadcn/ui are integrated and used for all new components.
- Zustand (or equivalent) replaces prop-drilling for shared state.
- App.tsx is decomposed: layout, state, HTTP, and panels are separate modules.
- Empty state and all user-facing copy use plain language (no "runtime", "channel", "flags").
- Existing test coverage is maintained or improved.

## Non-goals
- Redesigning the chat message rendering (that's E-0006).
- Adding new backend endpoints.
- Changing the self-evolution pipeline mechanics.

## Linked Feedback
- F-20260301-002

## Linked Tickets
- T-0031 Adopt Tailwind + shadcn/ui design system
- T-0032 Extract state management (Zustand + custom hooks)
- T-0033 Chat-first layout — hide meta-surfaces by default
- T-0034 Settings as modal/drawer, fold Advanced into Settings
- T-0035 User-facing copy and empty state rewrite
- T-0041 Clarify feedback scope (per-response vs app-level)

## Progress (Ticket Status)
- Done: T-0031 (2026-03-01), T-0032 (2026-03-01), T-0033 (2026-03-01), T-0034 (2026-03-01)
- Ready: T-0035 (rank 1), T-0041 (rank 2). E-0005 tier-2 validation: 2/3 probes passed (2026-03-01).

## Tier-2 Validation Results (2026-03-01)
- Probe 1 "What does this app do?": ✓ passed
- Probe 2 "Where would you change a setting?": ✓ passed
- Probe 3 "How would you give feedback about a response?": ✗ failed — feedback surface reads as app-level, not per-response. Follow-up: T-0041.

## Validation Plan
- Tier-2 micro-validation after T-0033 and T-0034 ship:
  - Probe 1: "What does this app do?" (open app cold, no hints)
  - Probe 2: "Where would you change a setting?" (no hints)
  - Probe 3: "How would you give feedback about a response?" (no hints)
- Pass criteria: 3/3 probes answered correctly within 10 seconds each.
- Results recorded in a dated PM checkpoint file in `tickets/meta/feedback/`.

## Notes
This epic depends on M3 (E-0004) being complete — there's no point simplifying the UI if chat still returns stubs. Sequence: finish M3, then start E-0005.
