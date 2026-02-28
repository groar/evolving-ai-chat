# T-0019: Desktop nav hierarchy and progressive disclosure

## Metadata
- ID: T-0019
- Status: review
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0003
- Owner: ai-agent
- Created: 2026-02-28
- Updated: 2026-02-28

## Summary
Restructure the desktop UI information architecture so "chat" is the primary experience and advanced/dev features are available via progressive disclosure (not presented as peer-level defaults).

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Make the first-run mental model clear: conversations + composer are the default, and "advanced" controls are optional.
  - Reduce left-rail competition by moving secondary modules out of the default stack of cards.
- Non-goals:
  - A full visual redesign or new theming system.
  - Removing Settings/Feedback/Advanced capabilities.
- Rules and state transitions:
  - The left rail defaults to a Conversations-first view:
    - a clear `Conversations` label/title (no storage implementation details).
    - list + `New conversation` affordance.
  - Secondary surfaces are accessible but separated:
    - `Settings`
    - `Feedback`
    - `Advanced` (or `Developer`)
  - When a secondary surface is selected, it replaces the left-rail content (instead of stacking as additional always-visible cards).
  - Only one Stable/Experimental control surface exists (remove redundancy between a top-right pill and settings toggle; choose one canonical control + optional informational indicator).
- User-facing feedback plan:
  - A first-run user should be able to answer "where do I start?" without reading paragraphs.
  - Settings remains discoverable in <= 1 click from the default surface.
- Scope bounds:
  - This is IA and hierarchy, not a new design system:
    - keep existing components where possible, but re-home/reframe them.
  - No new persistence requirements.
- Edge cases / failure modes:
  - Very small window: left rail must remain usable (scroll, collapse, or tabs).
  - Keyboard users: all surfaces must be reachable without a mouse.
- Validation plan:
  - Deterministic: add/adjust UI tests to assert the default left-rail shows `Conversations` and that Settings/Feedback/Advanced entry points are visible.
  - Manual: quick smoke: first launch, can find Settings and return to Conversations easily.

## Context
Designer review (F-20260228-002) indicates the app reads like a debug console and does not establish hierarchy. This makes the product harder to trust and harder to use, even when underlying functionality works.

## References
- `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md`

## Feedback References (Optional)
- F-20260228-002

## Acceptance Criteria
- [x] Default left-rail surface is clearly labeled `Conversations` and does not mention implementation details (for example `SQLite`).
- [x] Settings, Feedback, and Advanced/Developer are reachable via clear entry points without being stacked as peer-level default "cards".
- [x] Selecting a secondary surface swaps the left-rail content (or otherwise clearly indicates you are in that surface) and provides an obvious way back to Conversations.
- [x] Only one canonical Stable/Experimental control surface exists; the other becomes purely informational (or is removed).
- [x] UI regression coverage exists for:
  - default Conversations label and entry points, and
  - Stable/Experimental control presence (no duplicate toggles).

## UX Acceptance Criteria (Only If `Area: ui`)
- [x] Primary flow is keyboard-usable (no mouse required for core actions).
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common desktop window sizes (narrow and wide).

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint:
  - `tickets/meta/qa/2026-02-28-qa-checkpoint-t0019.md`
- Screenshots/artifacts:
  - `tickets/meta/qa/artifacts/runtime-smoke/2026-02-28T17-45-11-899Z/smoke-fastapi.log`

## Evidence (Verification)
- Tests run:
  - `npm test` (apps/desktop) -> pass (`3 files, 12 tests`).
  - `npm run build` (apps/desktop) -> pass.
  - `npm run smoke:fastapi` (apps/desktop) -> pass.
- Manual checks performed:
  - Confirmed default left rail copy and structure now center `Conversations` with clear progressive-disclosure entry points (`Settings`, `Feedback`, `Advanced`).
  - Confirmed secondary surfaces render with an explicit `Back to Conversations` control and no stacked peer cards in the default rail.
  - Confirmed stable/experimental controls are kept in `Settings` while header/advanced surfaces are informational only.
- Screenshots/logs/notes:
  - Runtime smoke artifact log captured at the path above.
  - UI evidence captured via deterministic render assertions in `apps/desktop/src/appShell.test.tsx` and `apps/desktop/src/settingsPanel.test.tsx`.

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates (if any)

## Change Log
- 2026-02-28: Ticket created from external designer review (F-20260228-002) and moved to `ready/`.
- 2026-02-28: Picked up for implementation and moved to `in-progress/`.
- 2026-02-28: Reworked left-rail IA into Conversations-first surfaces with progressive disclosure and canonical channel controls.
- 2026-02-28: Added UI regression coverage for conversations-first IA and stable/experimental control surface presence.
- 2026-02-28: Moved to `review/` and completed automatic QA phase (no bugs found).
