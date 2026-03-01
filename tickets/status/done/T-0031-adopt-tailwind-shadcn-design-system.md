# T-0031: Adopt Tailwind + shadcn/ui design system

## Metadata
- ID: T-0031
- Status: done
- Priority: P1
- Type: refactor
- Area: ui
- Epic: E-0005
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Replace the plain CSS approach with Tailwind CSS and shadcn/ui components. STATUS.md already declares this stack but it was never adopted. This ticket closes that gap, establishes a real design system, and unblocks the UI simplification work in E-0005.

### UI Spec Addendum
- Primary job-to-be-done: Establish a consistent, composable component library so all subsequent UI work uses shared primitives.
- Primary action and what must be visually primary: No user-facing change in this ticket — it's a foundation swap. Existing visual design (warm neutrals, orange accent) should be preserved via Tailwind config.
- Navigation / progressive disclosure notes: N/A (infrastructure ticket).
- Key states to design and verify: All existing states (happy, empty, offline, error) must look identical or better after migration.
- Copy constraints: No copy changes in this ticket.

## Context
- The project declared Tailwind + shadcn/ui + Zustand in STATUS.md but ships plain CSS and ~500 lines of custom styles.
- shadcn/ui provides accessible, composable primitives (Dialog, Command, Sheet, DropdownMenu) that directly enable T-0033 and T-0034.
- Tailwind's utility-first approach accelerates iteration and eliminates the growing custom CSS file.

## References
- `STATUS.md` (Initial Technology Choices)
- `apps/desktop/src/styles.css`
- F-20260301-002

## Feedback References
- F-20260301-002

## Acceptance Criteria
- [x] Tailwind CSS is installed and configured with the existing color palette mapped to Tailwind theme tokens.
- [x] shadcn/ui is initialized; at least Button, Dialog, and Sheet components are available.
- [x] All existing UI renders identically (visual regression: no visible differences in happy/empty/offline/error states).
- [x] `styles.css` custom rules are reduced by at least 50% (migrated to Tailwind utilities).
- [x] `npm run build` succeeds with no new warnings.
- [x] Existing Vitest tests pass without modification (or with minimal test-only changes).

## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable (no mouse required for core actions).
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common breakpoints (mobile + desktop).

## Dependencies / Sequencing
- Depends on: none (can start immediately after M3).
- Blocks: T-0033, T-0034 (they need shadcn/ui primitives).
- Sequencing notes: Ship before or in parallel with T-0032 (state management).

## Subtasks
- [x] Install and configure Tailwind CSS with project theme
- [x] Initialize shadcn/ui, add Button, Dialog, Sheet, Command components
- [x] Migrate styles.css to Tailwind utilities (preserving visual design)
- [x] Verify all existing tests pass
- [x] Update STATUS.md to note adoption

## Notes
Preserve the existing warm neutral palette (#f5f3ea, #fff8e6, #d25722 accent) via `tailwind.config`. The goal is infrastructure swap, not visual redesign.

## QA Evidence Links
- QA checkpoint: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0031.md`

## Evidence (Verification)
- **Tests run**: `npm run test` — 21/21 passed (appShell, feedbackPanel, settingsPanel).
- **Build**: `npm run build` — succeeds, no new warnings.
- **styles.css reduction**: 627 lines → 198 lines (68% reduction, exceeds 50% target).
- **Manual checks**: Tailwind v4 + @tailwindcss/vite; shadcn/ui with Button, Dialog, Sheet, Command; theme tokens mapped in @theme and :root; path alias @/* configured; responsive .app-shell media query preserved.
- **Minimal test changes**: appShell (regex for empty-state), settingsPanel (channel-toggle assertion).

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
- 2026-03-01: Implementation complete — Tailwind v4, shadcn/ui, migration to utilities, STATUS.md updated.
- 2026-03-01: PM acceptance — QA checkpoint passed (no bugs); moved to done.
