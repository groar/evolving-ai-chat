# T-0033: Chat-first layout — hide meta-surfaces by default

## Metadata
- ID: T-0033
- Status: done
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0005
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Evidence
- Implementation: `apps/desktop/src/App.tsx` — chat-first layout with collapsible Sheet sidebar (left), Settings sheet (right), top bar with conversation title/app name.
- Tests: `apps/desktop/src/appShell.test.tsx` — updated for chat-first layout assertions.
- Automated: `npm test` passes (21 tests).
- QA: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0033.md` — UX checklist PASS, copy sweep PASS, no bugs found.

## Summary
Redesign the app layout so chat is 95% of the experience on launch. The left rail becomes a collapsible conversation sidebar (not a 4-tab navigation hub). Settings, Feedback, and Advanced surfaces move out of primary navigation into ambient access points (handled by T-0034 and contextual inline affordances).

### UI Spec Addendum
- Primary job-to-be-done: A user opening the app should immediately see their conversation and a composer — nothing else competes for attention.
- Primary action and what must be visually primary: The chat pane and composer. The conversation list is secondary (collapsible sidebar or command-palette via Cmd+K).
- Navigation / progressive disclosure notes:
  - Primary: chat pane (always visible).
  - Secondary: conversation list (collapsible sidebar, toggle via icon or Cmd+B).
  - Tertiary: Settings (gear icon → modal/drawer, see T-0034), Feedback (inline near messages or Cmd+. shortcut).
  - Removed from nav: "Advanced" tab (folded into Settings, see T-0034).
- Key states to design and verify:
  - Happy: sidebar collapsed, active conversation visible, composer focused.
  - Happy + sidebar: sidebar open, conversation list visible, chat pane still usable.
  - Empty: no conversations — warm prompt to start one (centered in chat pane).
  - Offline: banner in chat pane (existing), no sidebar changes needed.
- Copy constraints:
  - Must not say "Local Desktop Chat" or "Stable channel" in the top bar — use the app name or conversation title.
  - Must not reference "runtime" anywhere user-visible.

## Context
- Design review (F-20260301-002) found the 4-tab left rail makes the app feel like a control panel rather than a chat product.
- Inspiration: Arc browser (sidebar collapses), Linear (command palette for navigation), Claude/ChatGPT (chat dominates, settings are ambient).
- This is the highest-impact UX change in E-0005.

## References
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- E-0005-m4-ui-simplification-chat-first.md
- F-20260301-002

## Feedback References
- F-20260301-002

## Acceptance Criteria
- [x] On launch, the chat pane fills the window — no left-rail tabs visible by default.
- [x] A conversation sidebar is toggleable (icon button and/or keyboard shortcut Cmd+B).
- [x] The top bar shows the conversation title (or app name if no conversation), not "Local Desktop Chat."
- [x] "Settings", "Feedback", and "Advanced" are no longer left-rail nav tabs (moved to Settings sheet).
- [x] The 4-tab nav bar is removed from the layout.
- [x] Existing functionality (create conversation, switch conversation, offline state) still works.
- [x] The app is usable without ever opening the sidebar (send messages, see responses).

## User-Facing Acceptance Criteria
- [x] A new user can send their first message within 5 seconds of opening the app (assuming runtime is available).
- [x] Copy does not reference "runtime", "channel", or "flags" in any default-visible surface.

## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable (no mouse required for core actions).
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common breakpoints (mobile + desktop).

## Micro-Validation Probes
- Probes:
  - "What does this app do?" (open cold, no hints)
  - "How would you start a new conversation?" (no hints)
  - "Where would you find your past conversations?" (no hints)
- Timing: after T-0033 + T-0034 ship.
- Where results will be recorded: dated PM checkpoint in `tickets/meta/feedback/`.

## Dependencies / Sequencing
- Depends on: T-0031 (shadcn/ui Sheet/Command for sidebar), T-0032 (composable state).
- Blocks: none directly, but T-0034 should ship alongside or immediately after.

## Subtasks
- [x] Design collapsible sidebar layout (Sheet or custom panel)
- [x] Remove 4-tab left-rail navigation
- [x] Make chat pane fill the window by default
- [x] Add sidebar toggle (icon + keyboard shortcut)
- [x] Update top bar to show conversation title
- [x] Rewire conversation list into collapsible sidebar
- [x] Update empty state copy
- [x] Update tests

## Notes
Consider a command palette (Cmd+K) for power-user navigation — search conversations, open settings, etc. This could replace all explicit navigation. shadcn/ui has a Command component that fits well.

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
- 2026-03-01: Promoted to ready. T-0031 and T-0032 complete; dependencies satisfied.
- 2026-03-01: Implemented. Chat-first layout: collapsible Sheet sidebar (left), Settings sheet (right), top bar with conversation title. Replaced user-visible "runtime" with "assistant service". Moved to review.
- 2026-03-01: PM acceptance. QA checkpoint passed (21 tests, build, UX checklist, copy sweep); no bugs. Moved to done.
