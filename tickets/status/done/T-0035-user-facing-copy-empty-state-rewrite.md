# T-0035: User-facing copy and empty state rewrite

## Metadata
- ID: T-0035
- Status: done
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
- [x] No user-visible surface contains the words "runtime", "local runtime", or "flags".
- [x] The empty state (no conversations) says something warm and actionable (e.g., "What's on your mind?" or "Start a conversation").
- [x] The offline state uses plain language (e.g., "Can't reach the assistant" instead of "The local runtime is not running").
- [x] The top bar shows the app name or conversation title — not "Local Desktop Chat" or channel labels.
- [x] Settings labels use plain language ("Updates", "Early Access", not "Release Channel", "Experimental Flags").
- [x] A copy audit checklist is recorded in Evidence showing every changed string and its before/after.

## User-Facing Acceptance Criteria
- [x] A non-technical user reading any screen can understand what to do next without external context.
- [x] Copy does not imply unsupported behavior or unavailable follow-up actions.

## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable.
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common breakpoints.

## Dependencies / Sequencing
- Depends on: T-0033 (layout changes may alter which copy surfaces exist).
- Blocks: none.
- Sequencing notes: Ship after T-0033 so copy changes align with the new layout.

## Subtasks
- [x] Audit all user-facing strings (App.tsx, settingsPanel.tsx, feedbackPanel.tsx)
- [x] Draft replacement copy for each flagged string
- [x] Implement copy changes
- [x] Update tests (snapshot/assertion changes for new copy)
- [x] Record copy audit in Evidence section

## Notes
This ticket should be quick — it's a copy pass, not a structural change. But it has outsized impact on first impressions. Consider this the "personality" ticket: after this, the app should sound like a friendly assistant, not a developer dashboard.

## Evidence
- Copy audit (before → after):
  - App.tsx offline banner: "The assistant service is not running." → "Can't reach the assistant." / "The assistant returned an error."
  - App.tsx offline subtext: "Start it, then press Retry." → "Check if it's running, then press Retry." (offline); error detail shown directly for errors
  - App.tsx loading: "Loading local state..." → "Loading..."
  - App.tsx empty state header: "Your local AI assistant." → "What's on your mind?"
  - App.tsx empty state body: "Start the assistant service, then send your first message." → "Can't reach the assistant — check if it's running, then send your first message."
  - App.tsx empty state (ready): "Type your first message below." → "Start a conversation — type your message below."
  - App.tsx empty state (no API key): "Add your OpenAI API key in Settings to start chatting." → "Add your API key in Settings to start chatting."
  - App.tsx composer placeholder (offline): "Start the assistant service to chat." → "Can't reach the assistant — check your connection."
  - App.tsx diagnostics panel: "Diagnostics enabled" → "Behind-the-scenes info"; aria-label "Diagnostics" → "Behind-the-scenes info"
  - App.tsx API key banner: "Add your OpenAI API key" → "Add your API key"
  - settingsPanel.tsx: "Release Channel" → "Updates"
  - settingsPanel.tsx: "Controls which features are active" → "Choose which updates you receive"
  - settingsPanel.tsx: "Switch to Stable?" → "Switch to stable updates?"
  - settingsPanel.tsx: "Change settings and feature toggles" → "Change settings and early-access options"
  - settingsPanel.tsx: "Show local service diagnostics (early-access feature)" → "Show behind-the-scenes info (early-access)"
  - settingsPanel.tsx changelog: raw `entry.channel` → "Stable" / "Beta"; flags_changed raw → "early-access changes"
  - useRuntime.ts errors: "Could not load changelog and proposals (runtime error)." → "Could not load updates and drafts."
  - useRuntime.ts errors: "Could not load changelog and proposals (runtime offline)." → "Could not load updates and drafts. Check if the assistant is running."
  - useRuntime.ts: "Could not update release channel." → "Could not save your preference."
  - useRuntime.ts: "Updated diagnostics early-access feature" → "Behind-the-scenes info"
  - useRuntime.ts: "Switched to Stable" → "Switched to stable updates"
  - feedbackPanel.tsx placeholder: "The experiment controls were hard to find." → "The settings were hard to find."
- Tests updated: appShell.test.tsx, settingsPanel.test.tsx. All 21 tests pass.

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
- 2026-03-01: Promoted to ready. T-0033 complete; dependency satisfied. PM replenished queue after T-0034 acceptance.
- 2026-03-01: Implemented copy rewrite. Moved to review.
- 2026-03-01: QA passed (2026-03-01-qa-checkpoint-t0035.md). PM accepted. Moved to done.
