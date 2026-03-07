# F-20260307-001: Conversational feedback refinement before patch agent

## Metadata
- ID: F-20260307-001
- Status: ticketed
- Source: user-interview
- Theme: direction, reliability
- Severity: S1
- Linked Tickets: T-0088
- Received: 2026-03-07
- Updated: 2026-03-07

## Raw Feedback (Sanitized)
"Make the self-evolving loop start with a conversation (like a normal chat) meant to refine the requirements: let a model ask further clarifying questions to the user on what they want (with specific context about the current state of the software), and generate a better feedback to be passed to the agent. Basically a conversation that's meant to produce a good feedback, validated by the user, to be given to the agent."

## Normalized Summary
Before the patch agent runs, the self-evolve loop should include a conversational requirements-refinement phase. A model (not the coding agent) chats with the user to understand what they want, asks clarifying questions grounded in the current software state, and produces a structured, validated feedback/spec. The user confirms the refined spec, and only then does the patch agent receive it as input.

## PM Notes
- This is a major architectural input to M13 (self-evolve reliability hardening). It addresses the root cause of variable patch quality: the agent receives underspecified feedback.
- The current flow is: raw user feedback (one sentence) → `pi` agent → patch. No intermediate refinement.
- The proposed flow is: raw user feedback → **refinement conversation** → validated spec → `pi` agent → patch.
- This reuses the existing chat infrastructure (model adapters, streaming, conversation UI) for a different purpose: requirements elicitation.
- Key design questions for T-0088:
  - What context does the refinement model get? (file tree, recent changes, current UI state, relevant code?)
  - How does the user signal "this spec is good, run the agent"?
  - What format does the refined spec take? (structured markdown? free text? both?)
  - Should this be a separate conversation mode, or does it happen inline in the "Fix with AI" flow?

## Triage Decision
- Decision: ticketed → T-0088 (M13 design spec, as a key design input)
- Rationale: S1 direction signal from primary user. Directly addresses the core M13 problem (patch quality depends on input quality). Must be a first-class design consideration in the M13 spec, not an afterthought.
- Revisit Trigger: T-0088 design spec must address this feedback explicitly.
