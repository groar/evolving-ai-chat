# PM Checkpoint — 2026-03-01 Run 5: Product & Design Review

## Summary
Comprehensive product and design review conducted from a Software Designer & Architect perspective. Assessed all 4 epics (E-0001–E-0004), 26 shipped tickets, 4 ready tickets, the full UI/UX, frontend architecture, and backend architecture. Key finding: self-evolution infrastructure was over-invested before the core chat product works. Two new epics created to course-correct after M3 ships.

## Feedback Themes
1. **Priority inversion**: self-evolution infrastructure (proposals, channels, rollback, validation gates) was built before the product can chat. M3 should have been M0.
2. **Inside-out UI design**: 75% of left-rail navigation serves meta-surfaces (Settings, Feedback, Advanced), not the primary use case (chat).
3. **Tech stack mismatch**: STATUS.md declares Tailwind + shadcn/ui + Zustand; actual code uses plain CSS + React useState. 500-line App.tsx monolith.
4. **Developer-facing copy**: user-visible text uses system language ("runtime", "channel", "flags", "diagnostics").
5. **Missing chat table stakes**: no Markdown rendering, no code highlighting, no copy-to-clipboard, no model selection, no conversation renaming, no cost display.

## Interview Topics and Key Answers
No interview conducted — this was a proactive design review, not a feedback response.

## User Testing Ask
Skipped — no meaningful product change shipped since last PM summary. Tier-2 validation planned for E-0005 (after T-0033 + T-0034 ship) and tier-3 validation planned for E-0006 (after all chat UX tickets ship). Both plans recorded in their respective epic files.

## Decisions and Rationale

| Decision | Rationale |
| --- | --- |
| Create E-0005 (M4 — UI Simplification & Chat-First Redesign) | UI needs to be chat-first before self-evolution features can generate meaningful signal from real usage. |
| Create E-0006 (M5 — Conversational UX Table Stakes) | Users won't use the app daily without Markdown, code highlighting, model selection — prerequisite for self-evolution. |
| Sequence: M3 → M4 → M5 → M6 (first agent-proposed change) | Core product must work and be pleasant before layering intelligent self-modification. |
| E-0005 tickets in backlog (not ready) | They depend on M3 completing first — no point simplifying a stub-chat UI. |
| New decision recorded in STATUS.md | "Chat-first, then self-evolve" — prevents future agents from re-investing in self-evolution infrastructure prematurely. |

## Feedback IDs Touched
| ID | Status Change | Notes |
| --- | --- | --- |
| F-20260301-002 | new → ticketed | Product & design review findings. Linked to T-0031–T-0040. |

## Ticket/Epic Updates

### New Epics
| Epic | Title | Status |
| --- | --- | --- |
| E-0005 | M4 — UI Simplification & Chat-First Redesign | planned |
| E-0006 | M5 — Conversational UX Table Stakes | planned |

### New Tickets (all in backlog/)
| Ticket | Title | Priority | Epic |
| --- | --- | --- | --- |
| T-0031 | Adopt Tailwind + shadcn/ui design system | P1 | E-0005 |
| T-0032 | Extract state management (Zustand + hooks) | P1 | E-0005 |
| T-0033 | Chat-first layout — hide meta-surfaces by default | P1 | E-0005 |
| T-0034 | Settings as modal/drawer, fold Advanced into Settings | P2 | E-0005 |
| T-0035 | User-facing copy and empty state rewrite | P2 | E-0005 |
| T-0036 | Markdown rendering in assistant responses | P1 | E-0006 |
| T-0037 | Code block syntax highlighting + copy-to-clipboard | P1 | E-0006 |
| T-0038 | Conversation renaming | P2 | E-0006 |
| T-0039 | Model selector (multi-provider) | P2 | E-0006 |
| T-0040 | Token/cost display per message | P3 | E-0006 |

### Other Updates
| File | Change |
| --- | --- |
| STATUS.md | Added M4/M5/M6 to Near-Term Plan; added known gaps for UI and tech stack; added "chat-first" decision; updated Open Questions. |
| ORDER.md | Added "Next Up" section with E-0005/E-0006 ticket ordering after M3 completes. |
| tickets/meta/feedback/INDEX.md | Added F-20260301-002 row. |

## PM Process Improvement Proposal
**Add a "product direction review" as a milestone-boundary checkpoint.** The existing PM checkpoint format focuses on ticket-level quality, feedback triage, and delivery acceptance — but none of the 20 prior checkpoints asked "should we be building this feature at all right now?" or "is the roadmap sequence optimal?" A lightweight product direction review (vision alignment, priority sequencing, UX audit, tech stack audit) at each milestone boundary would catch structural issues like the priority inversion earlier. Propose adding a "Direction Review" section to the PM checkpoint template, triggered at milestone boundaries only.
