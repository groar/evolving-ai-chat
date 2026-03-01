# T-0041: Clarify feedback scope (per-response vs app-level)

## Metadata
- ID: T-0041
- Status: ready
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0005
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
The feedback surface (Settings → Feedback) reads as app-level feedback. E-0005 tier-2 Probe 3 failed: observers could not quickly determine how to give feedback about a specific response. Make the scope explicit — feedback can be about a specific message/response or about the app in general — so users understand both are possible.

### UI Spec Addendum
- Primary job-to-be-done: A user who wants to give feedback about a specific assistant response can discover and use a clearly scoped affordance.
- Primary action and what must be visually primary: Either a per-message feedback affordance (thumbs, "Feedback" link) or panel copy that explicitly states "about this response" vs "about the app."
- Navigation / progressive disclosure notes: Feedback panel lives in Settings; if we add per-message affordance, it can open the same panel with context pre-filled.
- Key states to design and verify:
  - Happy: User can answer "How would you give feedback about a response?" in under 10 seconds.
  - App-level feedback: User can still give general app feedback.
- Copy constraints:
  - Must not imply feedback is app-only.
  - Must clearly signal when feedback is scoped to a specific message/response.

## Context
- E-0005 tier-2 Probe 3 (2026-03-01): "How would you give feedback about a response?" — observer found "feedback" box but said "it's not clear it's for a response? I would say it's to give a feedback in general for the app itself." Took 30 sec; target was 10 sec.
- Feedback panel already supports `contextPointer` (conversation ID) but the UI does not expose per-response scoping. The panel lives in Settings, which reinforces "app-level" perception.
- Probe results: `tickets/meta/feedback/2026-03-01-pm-checkpoint-13-e0005-tier2-probes.md`

## References
- `apps/desktop/src/feedbackPanel.tsx`
- `apps/desktop/src/App.tsx` (message rendering, Feedback section)
- E-0005-m4-ui-simplification-chat-first.md
- 2026-03-01-pm-checkpoint-13-e0005-tier2-probes.md

## Feedback References
- E-0005 Validation Plan (Probe 3 failure)

## Acceptance Criteria
- [ ] A cold user can answer "How would you give feedback about a response?" within 10 seconds and correctly identify the affordance.
- [ ] The feedback surface (or a per-message affordance) explicitly communicates that feedback can be about a specific response.
- [ ] Feedback submitted with response context stores the context correctly (conversation ID + message ID if available).
- [ ] General (app-level) feedback remains possible and clearly distinguished from per-response feedback.
- [ ] At least one deterministic test or manual verification log records the "10 sec comprehension" check.

## User-Facing Acceptance Criteria
- [ ] A non-technical user can distinguish "feedback about this response" from "feedback about the app" from the UI alone.

## UX Acceptance Criteria
- [ ] Primary flow is keyboard-usable.
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.

## Dependencies / Sequencing
- Depends on: T-0034 (Settings modal — feedback lives there).
- Blocks: none.
- Sequencing notes: P2 behind T-0035 (copy pass). Completes E-0005 UX clarity before E-0006.

## Micro-Validation Probes (Optional)
- Re-run Probe 3 after implementation: "How would you give feedback about a response?"
- Pass: answered correctly within 10 seconds.
- Where results will be recorded: ticket Evidence section or PM checkpoint.

## Evidence (Verification)
- (To be filled after implementation)

## Subtasks
- [ ] Audit current feedback UI (panel copy, affordances, context display)
- [ ] Design fix: per-message affordance, panel copy rewrite, or both
- [ ] Implement changes
- [ ] Add/update tests
- [ ] Record verification (manual or re-probe) in Evidence

## Notes
Implementation options: (1) Add a per-message feedback button (e.g., thumbs down or "Feedback" link) on assistant messages that opens feedback with message context; (2) Rewrite Feedback panel copy to explicitly say "about this response" vs "about the app" and clarify scope; (3) Both. Option 1 is strongest for comprehension — the affordance lives where the response lives.

## Change Log
- 2026-03-01: Ticket created from E-0005 tier-2 Probe 3 failure (checkpoint 13). Added to ready queue rank 2.
