# PM checkpoint — 2026-03-08 (feedback triage)

## Feedback received
- **F-20260308-008**: When I fix with AI and run the agent, I can't see the current card in the activity panel right away; it only shows up in "in progress" once it's past validation.

## Triage
- **Decision**: New ticket T-0105 (Activity card visible as soon as Run agent is clicked).
- **Rationale**: UX gap. Activity "In progress" cards (T-0097) only appear when the patch exists—i.e. when POST /agent/code-patch returns after the agent and scope validation. User expects to see a card as soon as they click Run agent. T-0105 scoped to show a card immediately (e.g. optimistic placeholder when requestPatch is called).

## Artifacts updated
- `tickets/meta/feedback/inbox/F-20260308-008-fix-with-ai-activity-card-only-after-validation.md` (created, status ticketed, linked T-0105).
- `tickets/meta/feedback/INDEX.md` (row for F-20260308-008).
- `tickets/status/backlog/T-0105-activity-card-visible-as-soon-as-run-agent.md` (created).
- `tickets/NEXT_ID` (105 → 106).

## Next step
- To implement: move T-0105 to `ready/`, add to `ready/ORDER.md` at desired rank (e.g. after T-0102), then run implementation agent. Recommended approach in ticket: frontend-only optimistic placeholder when `requestPatch` is called.
