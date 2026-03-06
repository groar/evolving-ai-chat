# F-20260306-001: Re-run an answer with a different model and keep versions

## Metadata
- ID: F-20260306-001
- Status: ticketed
- Source: user-feedback
- Theme: ux
- Severity: S2
- Linked Tickets: T-0085
- Received: 2026-03-06
- Updated: 2026-03-06

## Raw Feedback (Sanitized)
"In a conversation, I’d like to be able to re-run an answer with a different model, to see if this brings a better answer from the AI. Like a retry. I would like to still have access to all versions of the answer."

## Normalized Summary
Users want a per-answer rerun flow that can target another model and lets them review multiple generated answer versions instead of losing prior outputs.

## PM Notes
- Existing chat send path persists user + assistant turns; a rerun needs to avoid adding duplicate user prompts.
- Highest-impact first slice: rerun a selected assistant answer with chosen model and store all returned variants in the UI for version switching.

## Triage Decision
- Decision: create ticket
- Rationale: This is a direct conversation-quality request and improves trust by preserving comparison context.
- Revisit Trigger: after first shipped version (check if users also need persistent variants across app restarts)
