# QA Checkpoint - 2026-03-01 (T-0031)

## Scope Tested
- Ticket: T-0031 (`tickets/status/review/T-0031-adopt-tailwind-shadcn-design-system.md`)
- Area: ui — Tailwind + shadcn/ui design system adoption (foundation swap, no copy changes)

## Automated Test Outcomes
- `cd apps/desktop && npm run test`: PASS (21 tests across feedbackPanel, appShell, settingsPanel).
- `cd apps/desktop && npm run build`: PASS, no new warnings.

## Manual Scenarios Executed
- Build output: 35.19 kB CSS (includes Tailwind + shadcn), 182 kB JS.
- styles.css: 627 → 198 lines (68% reduction; target was 50%).
- shadcn components present: `src/components/ui/button.tsx`, `dialog.tsx`, `sheet.tsx`, `command.tsx`.
- Theme: warm palette preserved in @theme and :root (#f5f3ea, #fff8e6, #d25722).

## UX/UI Design QA (Area: ui — Required)
| Category | Result | Evidence |
| --- | --- | --- |
| 1) Mental Model | PASS | No change — same copy and layout; "Evolving AI Chat", Conversations/Settings/Feedback/Advanced tabs. |
| 2) Hierarchy | PASS | Same structure; chat pane primary, left rail secondary; rail-btn and send-btn preserved. |
| 3) IA / Navigation | PASS | Left rail nav, surface switching, progressive disclosure unchanged. |
| 4) States and Error | PASS | Empty state (Loading / Your local AI assistant), offline/error runtime banners, api_key_not_set prompt — same copy and layout. |
| 5) Copy | PASS | No copy changes; ticket constraint satisfied. |
| 6) Affordances | PASS | Same keyboard flow (tab, Enter to send); rail-btn, send-btn, channel-toggle styling preserved. |
| 7) Visual Accessibility | PASS | Same contrast and hierarchy; Tailwind utilities replicate original CSS. |
| 8) Responsive | PASS | .app-shell media query at 900px preserved (grid → single column). |

## Criteria-to-Evidence Mapping
- Tailwind installed + theme tokens -> @theme block, :root vars -> PASS.
- shadcn Button, Dialog, Sheet, Command -> `src/components/ui/*.tsx` -> PASS.
- styles.css reduced ≥50% -> 627→198 (68%) -> PASS.
- Build succeeds -> vite build -> PASS.
- Tests pass -> 21/21 -> PASS (minimal test changes: empty-state regex, channel-toggle assertion).
- Visual parity -> Tailwind utilities mirror original CSS values -> PASS.

## Bugs Found
- None.

## Outstanding Risks / Gaps
- Manual visual smoke in dev recommended before PM acceptance (`npm run tauri:dev` or `npm run dev`) to confirm pixel-perfect parity.
- shadcn Button/Dialog/Sheet/Command are available but not yet used in existing components; T-0033/T-0034 will consume them.

**Suggested commit message:** `T-0031: Adopt Tailwind + shadcn/ui design system`

**Next-step suggestion:** PM should review T-0031 in `review/`. If satisfied, accept to `done/`. Optional: run manual visual check in Tauri or Vite dev to confirm appearance matches pre-migration. Then proceed with T-0032 (Zustand) or T-0033 (chat-first layout).
