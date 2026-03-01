# F-20260301-001: Settings offline safety unclear; copy feels jargony/wordy

## Metadata
- ID: F-20260301-001
- Status: ticketed
- Source: user-playtest
- Theme: ux
- Severity: S2
- Linked Tickets: T-0025
- Received: 2026-03-01
- Updated: 2026-03-01

## Raw Feedback (Sanitized)
Fresh observer micro-validation notes:
- "No idea what is safe or not offline."
- Settings are findable but "a bit weird they are under 'conversations'".
- "This whole panel is a bit mysteriously worded and a bit obscure to me."
- "It's super wordy, using a lot of jargon, and also the text is all cramped in a small width column, making it hard to read and understand."

Probe-2 offline state interpretation:
- "When it is offline, I can't use the chat, which means the AI runs online... I would press retry to access the app, since the chat is the main thing to do."

## Normalized Summary
Even after T-0024, Settings copy and layout still reads as jargon-heavy/wordy and fails to clearly communicate what is safe/usable while offline; the offline banner state suggests "AI runs online" and "chat is unusable offline", which undermines the local-first mental model and the UX-clarity milestone for E-0003.

## PM Notes
Concrete mismatch example:
- user context: Settings open, and offline banner state visible
- expected behavior: user can answer "what is safe offline" and understand that offline limits specific runtime-backed features without reframing the product as online-first
- observed behavior: user cannot identify "safe offline"; infers AI is online; settings copy feels obscure/jargony and cramped
- why it read as inconsistent: "local AI chat" mental model from first impression conflicts with offline limitations and unclear safety framing

## Triage Decision
- Decision: ticketed
- Rationale: Blocks E-0003 DoD (user cannot answer offline safety and infers the product is online-first in offline state).
- Revisit Trigger: after T-0025 ships and the E-0003 probes are rerun.
