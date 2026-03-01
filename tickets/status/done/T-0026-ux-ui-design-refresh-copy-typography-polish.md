# T-0026: UX/UI design refresh — copy, typography, and visual polish

## Metadata
- ID: T-0026
- Status: done
- Priority: P2
- Type: feature
- Area: ui
- Epic: none (standalone follow-up to E-0003)
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
A focused UX/UI and copywriting overhaul of the desktop chat app, addressing five workstreams: copy clarity, typography scale, color/contrast polish, visual hierarchy/layout, and composer/interaction design. Builds on E-0003 (UX clarity and hierarchy) with a design-quality pass before the next development phase.

## Design Spec

- Goals:
  - Tighten all UI copy (remove jargon, reduce wordiness, align with PM probe findings).
  - Establish a readable type scale (0.875rem body, 0.9375rem chat, 0.8rem meta).
  - Simplify beige-on-beige background layering to clear white cards on warm panels.
  - Add hover states, transitions, and interaction feedback across all interactive elements.
  - Restyle sidebar navigation from a 2x2 button grid to a horizontal tab bar.
  - Redesign the chat composer from an oversized textarea to a compact auto-expand chat bar.
- Non-goals:
  - Component library or CSS-in-JS migration.
  - Dark mode.
  - New features or backend changes.
- Scope bounds:
  - Four source files: `styles.css`, `App.tsx`, `settingsPanel.tsx`, `feedbackPanel.tsx`.
  - Three test files updated: `appShell.test.tsx`, `settingsPanel.test.tsx`, `feedbackPanel.test.tsx`.

### UI Spec Addendum
- Primary job-to-be-done:
  - Make the app look and feel like a polished chat product, not an engineering workbench.
- Primary action and what must be visually primary:
  - Chat remains the primary surface; composer should feel lightweight and modern.
- Navigation / progressive disclosure notes:
  - Tab bar replaces 2x2 grid; "Back to Conversations" buttons removed (redundant with tabs).
  - Inner panel borders removed; content inherits the rail boundary and uses spacing/dividers.
- Key states to design and verify (happy, empty, error/offline):
  - All previously verified states remain functional; hover and transition states added.
- Copy constraints:
  - No jargon ("workbench baseline" removed).
  - No defensive over-explaining (channel/reset copy shortened).
  - Privacy/safety assertions kept but tightened.

## Context
Post E-0003, the app passed UX clarity probes but lacked visual refinement: tiny font sizes, no hover states, beige-on-beige layering, cramped spacing, jargon in the top bar, and an oversized composer. This was the PM/UX designer's priority before entering the next development phase.

## References
- E-0003 (completed): `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md`
- T-0024, T-0025 (predecessors): copy and Settings clarity work this builds on.
- `STATUS.md`

## Acceptance Criteria
- [x] All UI copy rewritten per the rewrite map (15+ strings across 3 TSX files).
- [x] Type scale applied: 0.9375rem chat text, 0.875rem body, 0.8rem meta/timestamps, 0.75rem labels.
- [x] Panel gaps increased from 6-8px to 10-12px; panels feel spacious, not cramped.
- [x] Section titles use `font-weight: 600` standard-case instead of tiny uppercase muted text.
- [x] Card backgrounds simplified to `#fff` (pure white) on warm panel backgrounds.
- [x] Hover states added to all interactive elements (nav, conversations, buttons, channel toggle, send, retry).
- [x] CSS transitions (150ms ease) on background, border-color, color, and box-shadow for all interactive elements.
- [x] Active states use `var(--accent)` consistently (no more danger-red for "selected").
- [x] Left-rail navigation restyled as horizontal tab bar (flex row, bottom-border indicators).
- [x] "Back to Conversations" buttons removed from settings/feedback/advanced surfaces.
- [x] Nested inner-panel borders removed; content uses spacing and dividers.
- [x] Left rail widened to `minmax(300px, 360px)`.
- [x] Composer redesigned: single-line auto-expand (`field-sizing: content`, `max-height: 120px`), inline send button.
- [x] Sending state shows a CSS spinner animation instead of text "Sending...".
- [x] Message role labels changed from `<h2>` uppercase to `<p className="message-role">` with proper styling.
- [x] Scrollbars styled to match the warm palette (thin, rounded thumb).
- [x] Subtle box-shadow added to left-rail and chat-pane containers.
- [x] All 19 existing tests pass (assertions updated to match new copy).
- [x] No linter errors.

## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable (Enter to send, tab between elements).
- [x] Empty/error/offline states render correctly with updated copy.
- [x] Copy is consistent and unambiguous across all surfaces.
- [x] Layout works at the responsive breakpoint (900px) and standard laptop widths.

## Release Note
- Title: UX/UI design refresh
- Summary: Cleaner copy, better typography, hover states, a modern chat bar, and a tabbed sidebar. The app feels more polished and less like an engineering prototype.

## Evidence
- Tests run: `npm --prefix apps/desktop test` — 19/19 PASS (3 test files, 0 failures).
- Linter: No errors on all 6 edited files.
- Manual checks:
  - Verified all copy rewrites match the planned rewrite map.
  - Verified hover states, transitions, and active states behave correctly.
  - Verified composer auto-expands and send button sits inline.
  - Verified tab navigation works and no "Back to Conversations" buttons remain.
  - Verified scrollbar styling applied.
- QA waiver: User explicitly requested implementation outside the standard PM→ready→in-progress→review→QA→done pipeline. Work recorded retroactively as "done".

## Subtasks
- [x] Copy rewrite (15+ strings across App.tsx, settingsPanel.tsx, feedbackPanel.tsx)
- [x] Typography and spacing (type scale, gap increases, muted-vs-ink color)
- [x] Color, contrast, and visual polish (white cards, hover states, transitions, shadows, scrollbars)
- [x] Visual hierarchy and layout (tab bar, removed nesting, widened rail, removed Back buttons)
- [x] Interaction design and composer (chat bar, spinner, message role labels)
- [x] Test updates (3 test files updated to match new copy)

## Notes
This ticket was executed outside the standard ticket pipeline (user requested immediate implementation). The five workstreams were executed in dependency order: copy → typography → color → layout → interactions. Each workstream was self-contained and could have been a separate ticket in a standard pipeline.

Files changed:
- `apps/desktop/src/styles.css` — type scale, gaps, backgrounds, hover states, transitions, tab bar, composer, scrollbars, spinner animation.
- `apps/desktop/src/App.tsx` — copy rewrites, dynamic header, removed Back buttons, composer redesign, message role markup.
- `apps/desktop/src/settingsPanel.tsx` — copy rewrites, removed duplicate title.
- `apps/desktop/src/feedbackPanel.tsx` — copy rewrites.
- `apps/desktop/src/appShell.test.tsx` — updated assertions for new copy.
- `apps/desktop/src/settingsPanel.test.tsx` — updated assertions for new copy.

## Change Log
- 2026-03-01: Ticket created retroactively after implementation. All 5 workstreams implemented and verified. Placed directly in done/ per user request.
