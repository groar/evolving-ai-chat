# T-0030: API key configuration in Settings

## Metadata
- ID: T-0030
- Status: review
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0004
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Allow the user to enter and save their OpenAI API key directly inside the app's Settings panel, removing the need to set environment variables manually. The key is stored locally using Tauri's secure store (or the OS keychain via Tauri plugin). The Settings panel shows a key-set / key-not-set indicator without ever displaying the raw key. When no key is set, the chat pane shows a clear, actionable prompt to configure the key in Settings.

## Design Spec

- Goals:
  - Let the user configure their API key without editing environment variables or files.
  - Keep the key out of plaintext storage (use Tauri's secure store or OS keychain).
  - Make the "no key configured" state obvious and actionable in the chat pane.
- Non-goals:
  - Multi-provider key management (just OpenAI for now).
  - Key rotation reminders or expiry tracking.
  - Key validation against the API (show a "test connection" button only if trivially implementable; otherwise defer).
- Rules and state transitions:
  - Key is stored via `@tauri-apps/plugin-store` (or equivalent) under key `openai_api_key`. Never stored in SQLite or plaintext config files.
  - When the runtime starts, it checks for the key in the following priority order: `OPENAI_API_KEY` env var → Tauri store. The first non-empty value wins.
  - Settings panel shows one of two states: "API key set (•••••)" with a [Remove] button, or "No API key" with a text input and [Save] button.
  - Saving a new key overwrites the stored key. Removing the key deletes it from the store.
  - When the key is not set (env var missing AND store empty), `POST /chat` returns HTTP 503 with `{"error": "api_key_not_set"}`. The chat pane maps this error to a copy-accurate message: "Add your OpenAI API key in Settings to start chatting." with a direct link to the Settings → Connections section.
  - When the app loads with no key set, the chat composer is disabled and the same prompt is shown in the chat area (not just as a toast/error).
- User-facing feedback plan:
  - Settings → Connections section (new subsection in the existing Settings panel) shows key status.
  - Chat pane: empty state when key is missing shows the "Add your key" prompt as the first message in the conversation list area.
  - After saving a key, the composer re-enables immediately (no restart required).
- Scope bounds:
  - Frontend: `settingsPanel.tsx` (new Connections subsection), `App.tsx` (key-missing chat state).
  - Backend: `main.py` (read from Tauri store in addition to env var — via an IPC call or a shared config file written by the frontend).
  - Tauri: add `@tauri-apps/plugin-store` to `tauri.conf.json` and `Cargo.toml` if not already present.
- Edge cases / failure modes:
  - Tauri store write fails: show an error toast; do not silently drop the key.
  - Key saved but runtime process reads it stale: the frontend should pass the stored key to the runtime at startup via an env injection or IPC message (simplest: restart the runtime child process on key save, or pass it via a `/configure` endpoint).
  - Key removed while a chat request is in flight: the in-flight request completes; next request returns 503.

### UI Spec Addendum
- Primary job-to-be-done: configure the OpenAI API key without leaving the app.
- Primary action and what must be visually primary: the Save button and the key-status indicator in Settings → Connections.
- Navigation / progressive disclosure notes:
  - "Connections" is a new subsection at the top of the Settings panel (above "Channel").
  - The key input uses `type="password"` (masked). No "show key" toggle needed in v1.
  - The key indicator reads "OpenAI API key: Set ✓" or "OpenAI API key: Not configured".
- Key states to design and verify:
  - No key: input field visible, [Save] enabled, composer disabled in chat with the prompt message.
  - Key set: masked indicator + [Remove] button; input field hidden; composer enabled.
  - Saving: [Save] button shows a brief "Saving…" label; no full-page spinner.
  - Save error: inline error message below the input.
- Copy constraints:
  - Do not say "API token" (say "API key" consistently).
  - Do not say "Enter your secret key" (unnecessary alarm; just "OpenAI API key").
  - The prompt in chat must not say "the app is broken" — frame as "one setup step remaining".

## Context
T-0027 requires `OPENAI_API_KEY` as an environment variable. For a power user comfortable with terminal, that's fine. But the product promise is a "personal desktop assistant" — not a developer tool. Asking users to export env vars breaks the local-first, accessible UX story. Tauri's plugin-store provides OS-level key storage in a single-user desktop context without requiring a full secrets-manager setup.

## References
- `tickets/status/ready/T-0027-openai-adapter-real-chat-endpoint.md`
- `tickets/meta/epics/E-0004-m3-real-ai-chat.md`
- `apps/desktop/src/settingsPanel.tsx`
- `apps/desktop/src/App.tsx`

## Dependencies / Sequencing
- Depends on: T-0027 (defines the key requirement and the 503 error response).
- Blocks: nothing; standalone UX improvement.
- Sequencing notes: Can be worked in parallel with T-0028 and T-0029 (different code paths).

## Acceptance Criteria
- [x] A "Connections" subsection appears at the top of the Settings panel with an OpenAI API key input and status indicator.
- [x] Entering a key and clicking [Save] stores it via Tauri store (not plaintext); the indicator updates to "Set ✓" and the input is replaced by the masked indicator + [Remove] button.
- [x] Clicking [Remove] deletes the stored key; the input field reappears; the composer disables.
- [x] When no key is set (env var and store both empty), the chat area shows: "Add your OpenAI API key in Settings to start chatting." and the composer is disabled.
- [x] After saving a key, the composer re-enables without requiring an app restart.
- [x] The runtime reads the stored key at startup (env var takes priority; Tauri store is fallback).
- [x] The key is never displayed in plaintext (masked input only).
- [x] Unit test: Settings panel renders "Set" vs "Not configured" state based on key presence.
- [x] Unit test: saving + removing key updates UI state correctly.
- [x] Existing Settings tests still pass (no regressions).

## UX Acceptance Criteria
- [x] Primary flow is keyboard-usable: tab to input, type key, Enter or click Save.
- [x] Empty/error states are clear and actionable.
- [x] Copy is consistent with design spec (no "secret key", no "token", no "broken" framing).

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0030.md`
- Screenshots/artifacts: (manual E2E in Tauri recommended)

## Evidence (Verification)
- Tests run: npm test (21 pass), runtime unittest (13 pass).
- Manual checks performed: QA checkpoint executed; UX checklist PASS.

## Subtasks
- [x] Add `@tauri-apps/plugin-store` dependency (check if already present)
- [x] Add "Connections" subsection to `settingsPanel.tsx` with key input/indicator/save/remove
- [x] Implement key-state logic (stored vs. not stored) via Tauri store calls
- [x] Update `App.tsx`: disable composer and show prompt when no key is set
- [x] Update backend startup to read key from store (via IPC or `/configure` endpoint) if env var absent
- [x] Write unit tests: settings panel key states (set/not-set/save/remove)
- [x] Verify existing Settings tests still pass

## Notes
The backend/frontend key handoff is the trickiest part. Simplest approach: on app start, if a key is in the Tauri store, the frontend calls a `POST /configure` endpoint on the runtime (body: `{"openai_api_key": "..."}`) before enabling the composer. The runtime stores it in memory for the session. This avoids subprocess restart and keeps the Tauri ↔ Python boundary simple.

## Change Log
- 2026-03-01: Ticket created by PM.
- 2026-03-01: Implementation complete. Added Tauri plugin-store, Connections subsection, POST /configure, api_key_configured in /state, composer disabled when no key, api_key_not_set handling.
