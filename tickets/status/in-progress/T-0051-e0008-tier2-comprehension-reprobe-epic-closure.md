# T-0051: E-0008 validation — tier-2 comprehension re-probe and epic closure

## Metadata
- ID: T-0051
- Status: in-progress
- Priority: P1
- Type: validation
- Area: core
- Epic: E-0008
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Run the E-0008 tier-2 comprehension re-probe with the project sponsor after the M6.1 batch (T-0048, T-0049, T-0050) has shipped. The re-probe tests a single focused question: can the primary user explain what the observe-propose-validate loop does within ~10 seconds? Pass result closes E-0008 and unblocks M7 scope. Fail result triggers one more targeted UX iteration.

## Context
- E-0007 closed with a failed comprehension gate (F-20260301-006): the loop was not legible to the project sponsor.
- M6.1 (E-0008) fixed the three concrete UX blockers: duplicate heading (T-0048), feedback navigation (T-0049), and proposal form complexity (T-0050). All three tickets are done.
- E-0008 DoD item 4 requires a targeted re-probe to confirm the gate now passes before M7 expansion.
- The re-probe requires the project sponsor to interact with the shipped app (not a simulation).

## References
- `tickets/meta/epics/E-0008-m6.1-loop-legibility.md`
- `tickets/status/done/T-0047-e0007-validation-e2e-smoke-tier2-closure.md` (prior probe structure)
- `tickets/meta/feedback/inbox/F-20260301-006-e0007-tier2-probe-comprehension-fail.md`

## Micro-Validation Probe (Tier 2 — per E-0008 Validation Plan)
- Audience: primary user / project sponsor.
- Timing: run now (M6.1 batch is shipped).
- Probe (single, focused — per E-0008 Validation Plan):
  - **"You see a feedback button next to an AI answer. What do you think clicking it does? And once you're in the suggestions area, what do you think happens next?"**
- Pass criterion: user can describe the loop in plain terms within ~10 seconds.
- Where results will be recorded: this ticket's Evidence section AND a dated PM checkpoint in `tickets/meta/feedback/`.
- Decision:
  - **Pass** → proceed to M7 improvement class expansion. Close E-0008.
  - **Fail** → one more focused UX iteration; scope follow-up tickets before closing E-0008.

## Acceptance Criteria
- [ ] Tier-2 re-probe run with project sponsor; single probe answer captured.
- [ ] Probe result (pass/fail) recorded in this ticket's Evidence section with verbatim or close-paraphrase of sponsor's answer.
- [ ] E-0008 epic Status updated (`closed` on pass; `active` with new follow-up tickets on fail).
- [ ] E-0008 DoD item 4 marked as satisfied (pass) or explicitly resolved (fail + follow-up scope).
- [ ] PM checkpoint filed in `tickets/meta/feedback/` noting E-0008 closure decision and M7 gate status.

## Dependencies / Sequencing
- Depends on: T-0048, T-0049, T-0050 (all done — app is running with M6.1 changes).
- Blocks: E-0008 epic closure; M7 scope planning and replenishment of the ready queue.

## Evidence (Verification)
_(to be filled in when probe is run)_

### Tier-2 Re-probe Result
- Date: 
- Respondent: project sponsor (primary user)
- Probe: "You see a feedback button next to an AI answer. What do you think clicking it does? And once you're in the suggestions area, what do you think happens next?"
- Response:
- Verdict: PASS / FAIL

### E-0008 DoD Resolution
1. Duplicate heading fixed — ✓ (T-0048 done)
2. Feedback navigation direct — ✓ (T-0049 done)
3. Proposal form simplified — ✓ (T-0050 done)
4. Comprehension gate re-passed (tier-2) — _(pending this ticket)_

## Handoff — Project Sponsor Action Required

**This ticket cannot be completed by the AI agent.** The tier-2 probe must be run by you (the project sponsor) with the shipped app.

### What to do

1. **Run the app** (if not already running):
   ```bash
   cd apps/desktop && npx tauri dev
   ```
2. **Interact with the app**: Send a message, get an AI response, then locate the feedback button next to the answer.
3. **Answer this probe** (verbatim or in your own words; aim for ~10 seconds):
   > "You see a feedback button next to an AI answer. What do you think clicking it does? And once you're in the suggestions area, what do you think happens next?"
4. **Report back** in this chat:
   - Your answer (verbatim or close paraphrase)
   - Your verdict: **PASS** (you could describe the loop in plain terms within ~10 seconds) or **FAIL** (you couldn't)

### After you report

Once you provide the probe result, I will:
- Record it in this ticket's Evidence section
- Update E-0008 epic (close on pass; scope follow-up on fail)
- Create the PM checkpoint
- Move this ticket to review → doc review → PM acceptance → done

---

## Change Log
- 2026-03-01: Ticket created by PM checkpoint-29. M6.1 batch done; tier-2 re-probe is remaining E-0008 gate. Moved to ready.
- 2026-03-01: Implementation agent pickup. Moved to in-progress. **Blocker: probe requires project sponsor.** See handoff section above.
