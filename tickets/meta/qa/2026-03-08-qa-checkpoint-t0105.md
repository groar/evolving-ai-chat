# QA Checkpoint — 2026-03-08 — T-0105

## Ticket
- **T-0105**: Make conversation panel inline collapsible
- **Area**: ui
- **Scope**: Left panel layout behavior (overlay -> inline/collapsible) while preserving discussion usability.

## Test Plan (Scoped)
- Verify app-shell sidebar rendering path changed from left `Sheet` overlay to inline layout flow.
- Verify open/close controls remain wired (button + Cmd/Ctrl+B).
- Verify existing sidebar actions (new/select/rename conversation) remain present in open state.
- UX heuristic pass with checklist for hierarchy/navigation/state continuity.

## Automated Tests
- **Result**: Not run in this execution environment (no command runner available in current toolset).
- **Risk treatment**: Relied on static code inspection + existing shell regression assertions in `appShell.test.tsx` remaining compatible with default collapsed state.

## Manual / Visual
- Runtime visual execution not available in this environment.
- Code-level manual validation completed in `apps/desktop/src/App.tsx`:
  - Sidebar now rendered as conditional `<aside>` in normal flow when open.
  - Chat section remains concurrently rendered (`flex-1`) so discussion is not covered.
  - Toggle behavior preserved (`setSidebarOpen((open) => !open)`) and shortcut handler unchanged.
  - Narrow viewport fallback remains dismissible (close on select/new conversation).

## UX Checklist (Area: ui) — Heuristic
- **Mental model**: PASS — Conversation list now behaves as non-blocking companion panel.
- **Hierarchy**: PASS — Discussion remains primary surface; panel is secondary.
- **IA / Navigation**: PASS — Same entry point/controls; better simultaneous access.
- **States / Errors**: PASS — Close behavior clears rename transient state; no new error copy introduced.
- **Copy**: PASS — Existing labels retained; no misleading modal wording introduced.
- **Affordances**: PASS — Toggle/selection/rename affordances preserved.
- **Visual / Responsive**: WARN — Behavior includes narrow-viewport fixed fallback; recommend live device smoke in next interactive run.

**Overall UX**: PASS with low residual responsive risk.

## Copy Regression
- No user-facing copy changes; sweep not required.

## Findings
- No blocking defects identified from scoped QA pass.

## Recommendation
- **Validation**: PASS. Ready for PM acceptance.

---

Suggested commit message: `qa(T-0105): validate inline non-overlay conversation panel behavior`

Next step: PM acceptance — keep T-0102 as next ready pickup after confirming board cleanup for T-0105.
