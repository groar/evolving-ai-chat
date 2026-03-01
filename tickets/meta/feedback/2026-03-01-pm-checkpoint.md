# PM Checkpoint - 2026-03-01

## Feedback Themes
- Offline/unavailable state still reframes the product as online-first ("AI runs online") when chat is disabled.
- Settings remains hard to scan: wordy/jargon-heavy copy + cramped layout blocks "safe offline" comprehension.

## Interview Topics And Key Answers
- Targeted micro-validation (fresh observer) for E-0003/T-0024:
  - Mental model: "This app is a local AI chat".
  - Offline state: "I can't use the chat... which means the AI runs online... I'd press retry".
  - Settings: findable but placement under "Conversations" feels odd; "No idea what is safe or not offline"; copy feels obscure/wordy/jargony; reset interpreted as removing experimental features; saw reassurance that conversations are not lost.

## User Testing Ask / Plan
- Targeted micro-validation (tier 2): continue.
  - Rationale: E-0003 DoD requires user-perception evidence for offline safety and first-run clarity.
  - Next probe timing: after T-0025 ships.
  - Where results will be recorded: T-0025 Evidence section (and referenced from E-0003).

## Decisions And Rationale
- Accept T-0023 back to `done/`.
  - Rationale: ticket includes 2026-03-01 QA revalidation evidence after the reopen (`tickets/meta/qa/2026-03-01-qa-checkpoint-t0023-reopen.md`).
- Do not accept T-0024 yet.
  - Rationale: probes show "safe offline" comprehension and Settings scanability still fail in practice (despite deterministic checks passing).
- Create and prioritize a follow-up ready ticket (T-0025) for offline safety messaging + Settings copy/layout simplification.
  - Rationale: this is now the highest-leverage remaining blocker for E-0003’s validation plan.

## Feedback IDs Touched
- F-20260301-001 (created; ticketed -> T-0025)

## Ticket Updates
- Accepted to `done/`:
  - T-0023
- Still `review/`:
  - T-0024 (probe evidence recorded 2026-03-01; follow-up created)
- Moved to `ready/`:
  - T-0025 (ranked #1 in `tickets/status/ready/ORDER.md`)
- Still `blocked/`:
  - T-0022 (blocked pending post-T-0025 rerun of E-0003 probes)

## Epic Updates
- E-0003: added T-0025; updated progress/status notes.

## PM Process Improvement Proposal
- When a review ticket depends on perception, treat "tier-2 probe PASS" as a gating artifact (not just an optional subtask), and always record:
  - the probe date,
  - whether the offline state was intentionally exercised,
  - and a one-line accept/reject decision.

Suggested commit message: `PM: record 2026-03-01 probes; accept T-0023; ticket T-0025 and update ready order`

Next-step suggestion: Pick up T-0025 (rank #1) for implementation.
