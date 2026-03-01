# T-0032: Extract state management (Zustand + custom hooks)

## Metadata
- ID: T-0032
- Status: review
- Priority: P1
- Type: refactor
- Area: core
- Epic: E-0005
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Decompose the 500-line App.tsx monolith by extracting state into Zustand stores and HTTP communication into custom hooks. This eliminates prop-drilling, separates concerns, and makes the component tree composable for the layout changes in T-0033/T-0034.

## Context
- App.tsx currently holds ~20 useState hooks, all HTTP fetch calls, and all event handlers in a single component.
- SettingsPanel and FeedbackPanel receive 10+ props each, creating tight coupling.
- STATUS.md declares Zustand but it was never adopted.
- This refactor is prerequisite for breaking the UI into independent layout zones (T-0033).

## References
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/settingsPanel.tsx`
- `apps/desktop/src/feedbackPanel.tsx`
- `STATUS.md`
- F-20260301-002

## Feedback References
- F-20260301-002

## Acceptance Criteria
- [x] Zustand is installed and used for shared app state (runtime issue, conversations, messages, settings, proposals, changelog).
- [x] A `useRuntime()` hook (or similar) encapsulates all backend HTTP communication (refreshState, sendMessage, createConversation, etc.).
- [x] A `useConversations()` hook encapsulates conversation CRUD and active conversation tracking.
- [x] App.tsx is reduced to layout composition — no direct fetch calls or business logic.
- [x] SettingsPanel and FeedbackPanel consume state from stores/hooks, not prop-drilling from App.
- [x] All existing Vitest tests pass (with necessary test-only adjustments for the new state layer).
- [x] No user-visible behavior change.

## Dependencies / Sequencing
- Depends on: none (can start immediately after M3, parallel with T-0031).
- Blocks: T-0033 (layout changes need composable components).
- Sequencing notes: Can proceed in parallel with T-0031 (design system). If both are in flight, coordinate on component interfaces.

## Subtasks
- [x] Install Zustand
- [x] Create `runtimeStore` (connection state, issue tracking, boot state)
- [x] Create `conversationStore` (conversations, active ID, messages)
- [x] Create `settingsStore` (settings, changelog, proposals)
- [x] Extract `useRuntime()` hook for HTTP communication
- [x] Refactor App.tsx to layout-only composition
- [x] Refactor SettingsPanel and FeedbackPanel to use stores directly
- [x] Verify all tests pass

## Notes
Keep the store boundaries aligned with backend resources: runtime state, conversations, settings/proposals. Feedback stays in localStorage (via feedbackStore.ts) — no need to move it to Zustand unless it grows.

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
- 2026-03-01: Implementation complete. Added runtimeStore, conversationStore, settingsStore; useRuntime(), useConversations(), useFeedback() hooks; App.tsx refactored to layout-only. All 21 tests pass.

## Evidence
- `apps/desktop/src/stores/runtimeStore.ts`, `conversationStore.ts`, `settingsStore.ts`
- `apps/desktop/src/hooks/useRuntime.ts`, `useConversations.ts`, `useFeedback.ts`
- `npm test` — 21 tests pass
- `npm run build` — succeeds
- QA checkpoint: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0032.md`
