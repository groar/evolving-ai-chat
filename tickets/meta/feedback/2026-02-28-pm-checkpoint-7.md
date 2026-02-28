# PM Checkpoint - 2026-02-28 (7)

## Feedback Themes
- Fresh-observer comprehension failure: “proposal/experiment” terms and rollback controls read as jargon and create a “crowded control panel” feeling.
- Redundancy amplifies confusion: multiple “stable” affordances (channel selector + “Switch to Stable”) makes the UI feel contradictory.
- Missing “definition at point of need”: the UI asks users to reason about internal system concepts without a 1-line explanation or progressive disclosure.

## Interview Topics And Key Answers
- Source: E-0002 tier-2 micro-validation rerun (fresh observer) recorded in `tickets/status/done/T-0018-rerun-e0002-micro-validation-probes.md`.
- Key verbatims:
  - “No idea” (for both “Switch to Stable” and “Reset Experiments”).
  - “super crowded… what’s a proposal/experiment… why several stable buttons… I’m lost”.

## User Testing Ask / Plan
- External user testing: **skipped** for this run.
  - Rationale: The current state is already a clear probe failure; first ship the follow-up fixes (T-0023, T-0024), then rerun probes once the UX signal is trustworthy.

## Decisions And Rationale
- Treat “Experiments/Proposals” as internal mechanisms that must be presented as *user intent* (Updates/Safety, Early access, Improvements), not as jargon peer-level to chat.
- Use progressive disclosure: default Settings must be scannable; advanced tools move behind an Advanced section or a dedicated surface (future option).
- Canonicalize channel controls: eliminate duplicate “stable” actions and make the channel picker the single source of truth.

## Feedback IDs Touched
- F-20260228-003

## Ticket Updates
- Moved to `ready/` and reprioritized:
  - T-0023 (P1): runtime reachability state must be correct before further UX probes.
  - T-0024 (P1): detailed UX redesign proposal added (intent-based IA, terminology mapping, progressive disclosure).
- Moved to `blocked/`:
  - T-0022: E-0003 micro-validation rerun blocked until T-0023/T-0024 ship (avoid wasting “fresh observer” sample on known-bad signals).
- Updated `tickets/status/ready/ORDER.md` to prioritize T-0023 then T-0024.

## Epic Updates
- E-0003:
  - Linked follow-ups (T-0023, T-0024) and marked T-0022 blocked pending their acceptance.

## PM Process Improvement Proposal
- For any user-facing “system lever” UI (channels, experiments, proposals), require:
  - an intent-based section label,
  - a 1-line definition at point of need,
  - and progressive disclosure for advanced/technical tooling.

Suggested commit message: `PM: propose intent-based Settings UX for early-access + improvements; prioritize T-0023/T-0024`

Next-step suggestion: Pick up T-0023 for implementation (it blocks chat trust and corrupts UX testing signal).

