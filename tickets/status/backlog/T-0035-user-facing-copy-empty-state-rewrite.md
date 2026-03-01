# T-0035: User-facing copy and empty state rewrite

## Metadata
- ID: T-0035
- Status: backlog
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0005
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Rewrite all user-facing copy to use plain, human language. Remove developer/system terminology ("runtime", "channel", "flags", "experimental"). Rewrite the empty state to be warm and action-oriented. The app should read as a friendly AI assistant, not an internal developer tool.

### UI Spec Addendum
- Primary job-to-be-done: Every piece of text the user reads should make them feel oriented and confident, not confused by system jargon.
- Primary action and what must be visually primary: N/A (copy pass, not a new interaction).
- Navigation / progressive disclosure notes: Copy changes span all surfaces (chat, sidebar, settings, feedback, empty states, error states).
- Key states to design and verify:
  - Empty state (no conversations): warm, inviting, one clear action.
  - Offline state: plain language ("Connecting..." or "Can't reach the assistant — check if it's running"), no "runtime" reference.
  - Error state: actionable, not technical.
- Copy constraints:
  - Must not say: "runtime", "local runtime", "stable channel", "experimental channel", "feature flags", "diagnostics".
  - Acceptable alternatives: "assistant", "updates", "early access features", "beta", "behind-the-scenes info".
  - Must not imply the app requires technical knowledge to use.

## Context
- Design review (F-20260301-002) found multiple instances of developer language in user-facing surfaces:
  - "Start the runtime, then send your first message."
  - "Local Desktop Chat"
  - "Local AI chat · Stable channel"
  - "show_runtime_diagnostics"
- Previous tickets (T-0021, T-0025) improved copy incrementally, but the review found systemic jargon remains.

## References
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/settingsPanel.tsx`
- E-0005-m4-ui-simplification-chat-first.md
- F-20260301-002

## Feedback References
- F-20260301-002

## Acceptance Criteria
- [ ] No user-visible surface contains the words "runtime", "local runtime", or "flags".
- [ ] The empty state (no conversations) says something warm and actionable (e.g., "What's on your mind?" or "Start a conversation").
- [ ] The offline state uses plain language (e.g., "Can't reach the assistant" instead of "The local runtime is not running").
- [ ] The top bar shows the app name or conversation title — not "Local Desktop Chat" or channel labels.
- [ ] Settings labels use plain language ("Updates", "Early Access", not "Release Channel", "Experimental Flags").
- [ ] A copy audit checklist is recorded in Evidence showing every changed string and its before/after.

## User-Facing Acceptance Criteria
- [ ] A non-technical user reading any screen can understand what to do next without external context.
- [ ] Copy does not imply unsupported behavior or unavailable follow-up actions.

## UX Acceptance Criteria
- [ ] Primary flow is keyboard-usable.
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.
- [ ] Layout works at common breakpoints.

## Dependencies / Sequencing
- Depends on: T-0033 (layout changes may alter which copy surfaces exist).
- Blocks: none.
- Sequencing notes: Ship after T-0033 so copy changes align with the new layout.

## Subtasks
- [ ] Audit all user-facing strings (App.tsx, settingsPanel.tsx, feedbackPanel.tsx)
- [ ] Draft replacement copy for each flagged string
- [ ] Implement copy changes
- [ ] Update tests (snapshot/assertion changes for new copy)
- [ ] Record copy audit in Evidence section

## Notes
This ticket should be quick — it's a copy pass, not a structural change. But it has outsized impact on first impressions. Consider this the "personality" ticket: after this, the app should sound like a friendly assistant, not a developer dashboard.

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
