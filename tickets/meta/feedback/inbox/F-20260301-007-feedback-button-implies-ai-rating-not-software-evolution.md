# F-20260301-007: "Feedback" button implies rating the AI, not evolving the software

## Metadata
- ID: F-20260301-007
- Status: triaged
- Source: sponsor-review
- Theme: direction
- Severity: S2
- Linked Tickets: T-0051
- Received: 2026-03-01
- Updated: 2026-03-01

## Raw Feedback (Sanitized)
> "I feel like there must be some kind of misunderstanding. We are adding a feature to do a feedback on a given AI answer. But we won't be able to fix the AI model since they are OpenAI's and Anthropic's. Really here the idea is to have a self-evolving chat software, where we can provide feedback not on the AI itself, but on the chat software around it! Is the last epic maybe missing the point?"

## Normalized Summary
The "Feedback" button placed on each AI assistant message carries the wrong mental model: it looks and reads like "rate this AI response" (the pattern users know from ChatGPT thumbs-up/down), not "help this software evolve." The sponsor is concerned the entire feedback-driven evolution loop may be solving the wrong problem — or at minimum communicating the wrong intent.

## PM Notes
- The concern has two separable dimensions:

  1. **Entry point identity.** The button lives on assistant messages and the form copy says "About this response" / "What felt confusing about this response?" That framing implies AI output quality feedback, not software improvement intent. A user's natural read is: "I'm rating the AI model" — which is meaningless since we can't retrain OpenAI or Anthropic.

  2. **Improvement class scope.** The only live improvement class is `settings-trust-microcopy-v1` — renaming labels in the Settings panel. Even if a user understands the loop is about the software, the connection between "feedback on this AI response" and "the system will propose a settings label rename" is not obvious and not compelling.

- This is distinct from F-20260301-006's three UX blockers (heading duplication, navigation, form complexity). E-0008 addressed those mechanics but did not address the mental model framing.

- The T-0051 tier-2 probe — "You see a feedback button next to an AI answer. What do you think clicking it does?" — is well-positioned to surface exactly this concern. If the sponsor's answer reflects "rate the AI" rather than "improve the software," that confirms the entry point identity is the blocking issue.

- This does NOT block T-0051. Running T-0051 is the correct next step; the results will either confirm this concern (and drive M7 scope) or show that E-0008's fixes were sufficient.

## Triage Decision
- Decision: triaged → context for T-0051 probe; feeds M7 scoping if T-0051 fails on mental-model dimension.
- Rationale: T-0051's probe is designed to surface this exact question. If it passes, the concern is resolved by the current fixes. If it fails (user describes AI-rating intent), this feedback item becomes an M7 P1 input: the entry point needs a software-improvement identity distinct from per-message AI quality feedback. No new ticket is warranted until T-0051 results are known.
- Revisit Trigger: After T-0051 is run. If probe answer reflects "AI rating" mental model → create a dedicated M7 entry-point-redesign ticket linking this feedback item.
