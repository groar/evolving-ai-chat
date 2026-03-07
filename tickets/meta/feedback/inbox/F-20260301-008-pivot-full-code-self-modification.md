# F-20260301-008: AI persona approach too complex; pivot to full code self-modification

## Metadata
- ID: F-20260301-008
- Status: ticketed
- Source: user-interview
- Theme: direction
- Severity: S1
- Linked Tickets: T-0058
- Received: 2026-03-01
- Updated: 2026-03-07

## Raw Feedback (Sanitized)
"The whole AI persona thing does not work, I've not managed to make it work, and it's super complicated. We should allow for full code self-customization. Basically: we get a feedback, turn it into a proposal, then into a customization of the software (through changing the code), without the user having to do anything else (before accepting or not maybe the changes). Is it what we are doing?"

## Normalized Summary
The improvement class / AI persona approach (M7) is too complicated and hasn't worked in practice. The user's mental model is: feedback → proposal → the app modifies its own source code → user reviews and accepts or rejects the change. The current implementation only modifies runtime config (system prompt strings), not code — which is a different and narrower thing than what was expected.

## PM Notes
- The user confirmed the full-code-self-modification vision after it was explained clearly.
- This is a direction pivot, not a UX polish request. The M7 improvement class work is superseded.
- T-0056 (tier-2 probe) cannot proceed meaningfully because the approach it was validating is being abandoned.
- T-0057 (UI flow bug) is also moot since the flow it fixes belongs to the superseded approach.
- The root vision in STATUS.md ("agentic coding in the background") already points here — execution diverged from intent during M6/M7 by targeting only config changes.

## Triage Decision
- Decision: ticketed → T-0058 (M8 design spec for agentic code modification loop)
- Rationale: This is a confirmed S1 direction signal from the primary user/sponsor. It supersedes E-0009 (M7) and scopes M8 as the first milestone targeting actual source-code modification.
- Revisit Trigger: After T-0058 (design spec) is done and M8 epic is scoped.
