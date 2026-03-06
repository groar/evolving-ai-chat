# T-0085: Re-run assistant answers with different models and keep answer versions

## Metadata
- ID: T-0085
- Status: done
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0015
- Owner: ai-agent
- Created: 2026-03-06
- Updated: 2026-03-06

## Summary
Add a per-assistant-answer rerun flow so users can regenerate that answer with a selected model and keep all generated versions accessible in the conversation view.

## Design Spec
### Goals
- Allow rerunning a specific assistant answer without duplicating user turns in transcript storage.
- Let users keep and navigate all generated versions for that answer in the UI.
- Keep model choice explicit by reusing selected model state.

### Non-goals
- Persisting rerun variants across app restarts.
- Bulk rerun for all messages.

### Rules and state transitions
- Rerun targets an assistant message ID in the active conversation.
- Backend reconstructs the original user prompt context for that answer and requests a fresh answer with selected model.
- Rerun response does not append new user/assistant messages to persistent conversation history.
- Frontend stores rerun variants per assistant message and lets user switch version.

### User-facing feedback plan
- Assistant messages show a "Re-run with selected model" control.
- After rerun, message shows version count and previous/next controls.

### Scope bounds
- Runtime endpoint + frontend wiring + tests.

### Edge cases / failure modes
- Invalid target message ID returns clear runtime error.
- Rerun blocked when runtime busy/offline.

### Validation plan
- Automated: desktop validate + runtime chat tests.
- Manual: rerun a message with another selected model; switch between versions.

### UI Spec Addendum
- Primary job-to-be-done: compare answer quality across models for the same user prompt.
- Primary action and what must be visually primary: rerun button on assistant message.
- Navigation / progressive disclosure notes: version navigation appears only when >1 version exists.
- Key states to design and verify (happy, empty, error/offline): happy rerun, disabled while rerunning, runtime error handling.
- Copy constraints (what must not be implied): do not imply persistent storage of variants across sessions.

## Context
User-requested quality comparison flow.

## References
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/hooks/useRuntime.ts`
- `apps/desktop/runtime/main.py`
- `apps/desktop/runtime/models.py`
- `apps/desktop/runtime/test_chat.py`

## Feedback References
- `F-20260306-001`

## Acceptance Criteria
- [x] Users can trigger rerun on an assistant message using the currently selected model.
- [x] Rerun does not add duplicate user/assistant rows to persisted conversation message history.
- [x] Users can access all generated versions for a rerun-targeted answer within the current conversation view.
- [x] Runtime returns a clear 4xx error when rerun target is not a valid assistant message.
- [x] Automated tests cover rerun endpoint success and invalid-target path.

## User-Facing Acceptance Criteria
- [x] Rerun action is available from normal assistant message flow.
- [x] UI copy does not imply unavailable persistence guarantees.

## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable (no mouse required for core actions).
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common breakpoints (mobile + desktop) relevant to the host project.

## QA Evidence Links
- QA checkpoint: `tickets/meta/qa/2026-03-06-qa-T-0085.md`
- Screenshots/artifacts: automated test logs

## Evidence (Verification)
- Tests run:
  - `cd apps/desktop && npm run validate`
  - `uv run pytest apps/desktop/runtime/test_chat.py -q`
- Manual checks performed:
  - Verified rerun controls are rendered per assistant message and version navigation only appears after an additional variant exists.
  - Verified runtime rerun path does not append persistent messages (test-backed manual assertion via `/state` count comparison).
- Screenshots/logs/notes:
  - Local command output captured in run logs.

## Subtasks
- [x] Design updates
- [x] Implementation
- [x] Tests
- [x] Documentation updates

## Notes
Deferred: persistent storage of rerun variants beyond in-memory session state.

## Change Log
- 2026-03-06: Ticket created from F-20260306-001 and moved to ready.
- 2026-03-06: Moved to in-progress; implemented `/chat/rerun` endpoint and frontend rerun/version UI.
- 2026-03-06: Added runtime rerun endpoint tests and validated desktop + runtime suites.
- 2026-03-06: Moved to review.
- 2026-03-06: QA passed (`tickets/meta/qa/2026-03-06-qa-T-0085.md`).
- 2026-03-06: PM accepted and moved to done (`tickets/meta/feedback/2026-03-06-pm-checkpoint-T-0085-self-evolve.md`).
