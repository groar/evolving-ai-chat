## Metadata
- ID: T-0066
- Status: done
- Priority: P1
- Type: docs
- Area: docs
- Epic: E-0011
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
Create `docs/design-guidelines.md` — a living, canonical design system reference for the app. The document formalizes the intended visual language (calm minimalism, warm neutrals, editorial typography, soft rounded components) based on the user's brief and the existing token set in `styles.css`. Once published, all subsequent UI tickets must reference it, and AI agents proposing UI changes should treat it as a design guardrail.

## Design Spec

### Goals
- Produce a single, human- and machine-readable design reference at `docs/design-guidelines.md`.
- Codify what already works (the warm parchment palette, Avenir Next, orange accent) and extend it with explicit rules.
- Give implementers enough guidance to build new features that feel consistent without asking for clarification every time.

### Non-goals
- Do not change any code or CSS in this ticket (docs-only).
- Do not introduce new tokens or refactor `styles.css` — document what exists, flag what needs improvement as a note.
- Do not produce a full Storybook or design tool export.

### Document structure (required sections)
1. **Design Philosophy** — one-paragraph summary; the Claude/Notion AI comparables; "AI workspace, not dashboard"
2. **Color System** — mapping of every `--color-*` token from `styles.css` to its semantic role; explicit "do / don't" pairs (e.g., "Don't use `--color-accent` for destructive actions")
3. **Typography** — font family (Avenir Next → Segoe UI fallback), scale (display / heading / body / label / mono), line-height and weight rules
4. **Spacing & Layout** — grid philosophy (center-stage chat, peripheral nav); standard spacing scale (using Tailwind rem steps); sheet/panel widths; breakpoint notes
5. **Component Patterns** — documented patterns for: card/panel, input, button (primary / secondary / destructive), badge/pill, detail/summary block, sheet/drawer, diff view
6. **Interaction Principles** — progressive disclosure rules; animation guidelines (calm, not flashy — only `streaming-blink` and `spin` today); hover/focus states
7. **Dos and Don'ts** — 6–10 concrete rules (e.g., "Do: use `bg-panel` for card backgrounds. Don't: use pure white `#fff` against the parchment bg — it creates harsh contrast.")
8. **Self-Evolution Note** — instructions for AI agents: "When proposing UI changes, reference this document. If a proposed design deviates, justify the deviation explicitly."

### Scope bounds
- Only documents the current token set and existing component patterns; does not invent new ones.
- A follow-up ticket (after T-0067 and T-0068 land) may add new patterns to the doc.

### Validation plan
- Doc review: read through for internal consistency, check all token references against `styles.css`.
- No automated tests (docs-only).

## Context
- User brief (F-20260304-004) mirrors Claude / Notion AI / Linear (light) / Arc / Apple editorial aesthetics.
- Foundation ticket: T-0067, T-0068, T-0069 are all blocked on this conceptually; ranking this first removes ambiguity.
- The existing `styles.css` token set is already broadly aligned; this doc codifies and makes it authoritative.

## References
- `apps/desktop/src/styles.css` (all `--color-*`, `--radius-*`, `@theme` tokens)
- `apps/desktop/src/lib/ui-classes.ts` (shared button/input class strings)
- User brief: F-20260304-004 attached summary
- `STATUS.md` — "Initial Technology Choices (v1)" section
- E-0011

## Feedback References
- F-20260304-004

## Acceptance Criteria
- [x] `docs/design-guidelines.md` exists and covers all 8 required sections.
- [x] Every `--color-*` token in `styles.css` is listed with its semantic role.
- [x] Typography section specifies font stack, scale names, and weight rules.
- [x] At least 6 "Do / Don't" rules are included.
- [x] The self-evolution note is present and addresses AI agents.
- [x] Doc review passes: no tokens or patterns contradict what is actually implemented in the app.

## User-Facing Acceptance Criteria
- [ ] Not applicable (docs-only — no user-visible UI change in this ticket).

## Dependencies / Sequencing
- Depends on: none (first in epic)
- Blocks: T-0067 and T-0068 conceptually (they should reference this doc in their design decisions)
- Sequencing notes: rank 1 in E-0011 ready queue

## Evidence (Verification)
- Tests run: n/a
- Manual checks performed: doc review for completeness and internal consistency on 2026-03-04; verified all referenced color tokens exist in `styles.css` and that described usage matches current UI patterns.
- Doc review: completed; see `tickets/meta/qa/2026-03-04-doc-review-T-0066.md`.

## Subtasks
- [x] Read `styles.css` and `ui-classes.ts` to inventory all tokens and shared patterns
- [x] Write `docs/design-guidelines.md` covering all 8 sections
- [x] Doc review pass (completeness + token accuracy)

## Notes
No code changes. This is intentionally a minimal but complete first version of the guidelines. Update it in the same PR as T-0067 and T-0068 if new patterns are added during those implementations.

## Change Log
- 2026-03-04: Ticket created from F-20260304-004 / E-0011.
- 2026-03-04: Initial version of `docs/design-guidelines.md` written and reviewed; ticket moved to review (docs-only, QA waived).
- 2026-03-04: QA doc review recorded; ticket accepted and moved to done.

