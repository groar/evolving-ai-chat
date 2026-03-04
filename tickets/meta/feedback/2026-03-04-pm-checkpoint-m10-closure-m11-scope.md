# PM Checkpoint — 2026-03-04 (M10 Closure + M11 Scoping)

## Feedback Themes (De-duplicated)
No new feedback in inbox since the previous PM run. All F-20260304-001 through F-20260304-005 items are `ticketed` and resolved (T-0066–T-0073).

## Interview Topics + Key Answers
Skipped. No ambiguous or high-impact feedback requiring PM interview this run.

## User Testing Ask / Plan

### M10 Live-Apply — Tier-2 Micro-Validation (Requested)
M10 shipped two user-facing changes:
- **T-0075**: Live apply hot-reload — a new UX moment where the app briefly shows "Applying your update — reloading…" then reloads. This is a new user-visible state that users have not seen before.
- **T-0076**: Color-coded diff view (green/red/muted) — visual improvement to the "See what changed" toggle.

The QA checkpoint for T-0075 deferred manual E2E validation (ACs 1 and 3 require PATCH_AGENT_STUB=true + running app).

**Tier-2 micro-validation ask**: A single short manual session (5–10 min) to verify the live-apply UX end-to-end:

**Protocol** (from QA checkpoint T-0075):
1. `cd apps/desktop/runtime && PATCH_AGENT_STUB=true uv run fastapi dev main.py`
2. `cd apps/desktop && npm run dev`
3. Trigger improvement flow (Improvement → submit feedback).
4. Observe:
   - "Applying your update — reloading…" banner visible for ~400ms.
   - Page reloads automatically.
   - Notification reappears with "Undo?" on the applied state.
5. Click "Undo" before reload fires on a second attempt — confirm reload cancels.

**Probe question**: Does "Applying your update — reloading…" clearly communicate that the change is about to go live? (Yes/Needs work)

**Where results will be recorded**: T-0075 Evidence section (update the deferred ACs 1 and 3 with ✅ or a follow-up note); link to this checkpoint.

*Note: This is a validation ask, not a blocker. M10 is accepted and done. The probe closes the deferred E2E gap.*

## Decisions + Rationale

| Decision | Rationale |
|----------|------------|
| Accept E-0013 (M10) as done | T-0075 and T-0076 are in `done/` with QA PASS checkpoints; PM acceptance was already recorded in both ticket change logs. Closing the epic with a note about partial tier-1 validation (component tests pass; full E2E deferred per above). |
| Close all M8 open questions | T-0074/T-0075/T-0076 collectively resolved all three M8 open questions (patch scope guard, hot-reload mechanism, diff UI). Cleared from STATUS.md. |
| Scope M11 as "Test Suite Green Baseline" (E-0014) | Three pre-existing pytest failures (`test_chat.py`, `test_proposals.py`, `test_apply_rollback.py`) reduce CI trustworthiness for the self-modification loop. Fixing these before adding more features is the highest-leverage next step for loop reliability. This also creates an opportunity to lay the eval harness groundwork. |
| Create T-0077 as first M11 ticket (spec/triage) | Root causes must be investigated before writing fix tickets; a triage spec prevents wasted implementation on the wrong fix. T-0077 is a low-risk, high-information ticket that unlocks T-0078+. |
| No user-testing ask for M10 color-coded diff | The DiffBlock color change is cosmetic and passes the UX QA checklist. Tier-1 (deterministic) validation suffices; no perception probe needed. |

## Feedback IDs Touched
None new. All prior feedback items remain `ticketed` and unchanged.

## Ticket / Epic Updates
| Artifact | Change |
|---|---|
| `E-0013` | Status: `in-progress` → `done`; change log updated with T-0075, T-0076 acceptance and tier-1 note. |
| `STATUS.md` | Current state date updated to 2026-03-04; M10 marked complete; M11 scoping note added; known gaps updated; M8 open questions marked resolved. |
| `E-0014` | Created. M11 — Test Suite Green Baseline. T-0077 linked as first ticket. |
| `T-0077` | Created in `tickets/status/ready/`. M11 design spec — triage + eval groundwork. |
| `ORDER.md` | T-0077 added as rank 1. Notes updated. |

## PM Process Improvement Proposal
**Proposal**: When a test file is known-failing at ticket acceptance time (pre-existing failure, not introduced by the ticket), the QA checkpoint should include a `## Pre-existing Failures` section that lists each failing file, a one-line hypothesis for the cause, and a recommended ticket to file. This gives the next PM run a pre-populated triage input rather than re-reading the QA checkpoint from scratch.

*Adoption decision*: adopt. Update `tests/AGENTS.md` QA checkpoint template to add a `## Pre-existing Failures (Not Introduced by This Ticket)` section. Track as a process improvement to make in the next PM run if the QA agent has not already added it.

## Suggested Commit Message

```
chore(tickets): PM run — E-0013 closed, M10 complete, E-0014 + T-0077 scoped (M11 test baseline)
```

## Next Step

**Recommended**: Run the **implementation agent** on **T-0077** (M11 triage/design spec). The agent reads the 3 failing test files, runs `uv run pytest` per-file, identifies root causes, and produces a root-cause table + implementation ticket list. This unblocks T-0078+ (the actual fixes).

**Alternates**:
- If you want to validate the live-apply UX first (tier-2 probe above), run that 5-min session before implementation and record results in T-0075 Evidence.
- If you want to prioritize a different next milestone (e.g. conversation persistence, multi-model routing), raise it now so PM can rescope E-0014 and update ORDER.md before the implementation agent picks up T-0077.
