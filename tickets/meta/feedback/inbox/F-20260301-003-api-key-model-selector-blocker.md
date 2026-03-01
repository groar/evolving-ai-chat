# F-20260301-003: API key / model selector blocks chat when only OpenAI configured

## Metadata
- ID: F-20260301-003
- Status: ticketed
- Source: user-playtest
- Theme: ux
- Severity: S2
- Linked Tickets: T-0042
- Received: 2026-03-01
- Updated: 2026-03-01

## Raw Feedback (Sanitized)
"With just an OpenAI API key, and no Anthropic API key, it still says 'Add API key for this model in settings' (but I can't pick the model, and anyway it should at least choose the openAI one in that case)."

## Normalized Summary
When only OpenAI API key is configured, the composer shows "Add API key for this model in Settings" and blocks chat. The app should default to an OpenAI model (or the first model with a valid key) and allow the user to chat. User could not pick/switch the model.

## PM Notes
- Blocker for E-0006 tier-3 external validation.
- Likely cause: selected model is persisted as an Anthropic model from prior session, or default selection ignores which providers have keys. Design spec (T-0039) says: "Defaults to the first available model with a valid API key."
- Fix: when selected model's provider has no key, auto-switch to first model that has a key; ensure default on fresh config uses first available model.

## Triage Decision
- Decision: ticketed
- Rationale: Blocks core chat usage; S2 severity.
- Revisit Trigger: T-0042 acceptance.
