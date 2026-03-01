# E-0006: M5 — Conversational UX Table Stakes

## Metadata
- ID: E-0006
- Status: in-progress
- Owner: pm-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Goal
Make the base chat experience excellent enough that the primary user wants to use it daily. This is the prerequisite for self-evolution to matter — the observe-propose-validate loop needs real, sustained usage to generate meaningful signal.

## Rationale
Product & design review (F-20260301-002) identified that after M3 (real chat) and M4 (UI simplification), the app needs conversational UX parity with modern AI chat products before the self-evolution differentiator can be layered on. Users won't stick around long enough for the app to learn from them if basic chat affordances are missing.

## Definition of Done
- Assistant responses render Markdown (headings, lists, bold, italic, links).
- Code blocks have syntax highlighting and a copy-to-clipboard button.
- Conversations can be renamed from the sidebar.
- Users can select which AI model to use (at minimum OpenAI + one other provider).
- Per-message or per-conversation cost/token usage is visible.
- The app is pleasant enough for daily use as a primary AI chat tool.

## Non-goals
- Self-evolution features (proposals, changelog, validation gates) — those come after this.
- Multi-user or sharing features.
- Voice input/output.

## Linked Feedback
- F-20260301-002

## Linked Tickets
- T-0036 Markdown rendering in assistant responses
- T-0037 Code block syntax highlighting + copy-to-clipboard
- T-0038 Conversation renaming
- T-0039 Model selector (multi-provider)
- T-0040 Token/cost display per message

## Progress (Ticket Status)
- Done: T-0036 (Markdown rendering), T-0038 (conversation renaming).
- Ready: T-0037 (code blocks).
- Backlog: T-0039 (model selector), T-0040 (token/cost).

## Validation Plan
- Tier-3 external validation after all tickets ship:
  - 5-minute guided session with 1-2 users unfamiliar with the app.
  - Task: "Use this to help you with a real task you'd normally use ChatGPT/Claude for."
  - Decision it informs: "Is the base chat experience good enough for daily use, or do we need another UX pass before starting self-evolution work?"
- Results recorded in a dated PM checkpoint file in `tickets/meta/feedback/`.

## Notes
This epic can overlap with E-0005 in execution — some tickets are independent. But the recommended sequence is T-0031/T-0032 (design system + state) first, since those unblock cleaner implementation of the rendering and UI features here.
