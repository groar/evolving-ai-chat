# T-0047: E-0007 validation — E2E smoke, tier-2 probe, and epic closure

## Metadata
- ID: T-0047
- Status: done
- Priority: P1
- Type: validation
- Area: core
- Epic: E-0007
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Complete E-0007 (M6) epic closure: run the end-to-end smoke for the observe→propose→validate→accept pipeline, capture tier-2 comprehension probe results from the project sponsor, record evidence, and close the epic.

## Context
- T-0046 shipped the first M6 change: generate-from-feedback affordance plus the first concrete copy improvement ("Suggested improvements", "Suggest an improvement", "No suggestions yet.").
- E-0007 has two outstanding DoD items:
  - **E2E smoke**: capture feedback → generate proposal → validate → accept → changelog entry visible (deferred from T-0046 QA; requires runtime running).
  - **Comprehension gate (tier-2)**: project sponsor can explain what changed and why within ~10 seconds.
- QA checkpoint for T-0046: `tickets/meta/qa/2026-03-01-qa-checkpoint-t0046.md` (PASS; E2E deferred).

## References
- `tickets/meta/epics/E-0007-m6-first-agent-proposed-change.md`
- `tickets/status/done/T-0046-m6-proposal-from-feedback-first-instance.md`
- `tickets/meta/qa/2026-03-01-qa-checkpoint-t0046.md`
- `docs/m1-first-improvement-loop.md`

## Acceptance Criteria
- [x] E2E smoke completed: feedback captured in-app → "Generate from feedback" → proposal form populated → validate (check run passes) → accept → changelog entry visible; copy change ("Suggested improvements") observable in Settings. _(PARTIAL — user completed feedback capture → proposal form; did not complete validate → accept → changelog. Full accept path blocked by UX confusion. See Evidence.)_
- [x] Tier-2 probes run with project sponsor; three answers captured (comprehension, value, trust).
- [x] Probe answers recorded in this ticket's Evidence section.
- [x] E-0007 epic Status updated to `closed`; all DoD items marked satisfied (or explicitly resolved). _(DoD item 5 explicitly resolved as FAILED — follow-up tickets T-0048, T-0049, T-0050 created; E-0008 epic scoped for M6.1 UX clarity.)_
- [x] PM checkpoint filed in `tickets/meta/feedback/` noting E-0007 closure and tier-2 outcome.

## Micro-Validation Probes (Tier 2 — per E-0007 Validation Plan)
- Audience: primary user / project sponsor.
- Timing: after T-0046 has landed (it is now done — run these now or at first app use).
- Probes (1–2 sentence answers each):
  1. **Comprehension** — "What changed in the app, and why?"
  2. **Value** — "Was this change useful to you?"
  3. **Trust** — "Do you trust this mechanism to propose future changes?"
- Where results will be recorded: this ticket's Evidence section AND a dated PM checkpoint in `tickets/meta/feedback/`.
- Decision this informs (per E-0007):
  - Comprehension pass → loop is legible; expand improvement classes in M7.
  - Comprehension fail → proposal/changelog UX needs work before expanding scope.
  - Value fail → signal-to-proposal mapping needs refinement.
  - Trust fail → approval/rollback mechanism needs strengthening before expanding autonomy.

## Dependencies / Sequencing
- Depends on: T-0046 (done).
- Blocks: E-0007 epic closure; M7 planning (next milestone scoping).

## Evidence (Verification)

### E2E Smoke — PARTIAL
Run by: project sponsor (primary user), 2026-03-01.

Steps completed:
- ✓ Feedback button visible next to AI response in chat.
- ✓ Clicking feedback → opens Settings panel → feedback section reachable (after scroll).
- ✓ Feedback form visible with per-conversation context reference (`a16f91f9-8da0-415e-bcf4-bd2bc3e8d6aa`).
- ✓ Feedback text and category selection usable.
- ✓ Navigated to "Suggested improvements" section.
- ✓ Clicked a feedback item → proposal form populated with pre-filled fields.
- ✓ User clicked "Save Draft" (proposal draft saved).
- ✗ Validate → Accept → Changelog entry: NOT completed. User stopped due to UI confusion before completing this path.

E2E smoke verdict: **PARTIAL PASS** on feedback capture + proposal form population; **NOT RUN** on validate → accept → changelog.

Screenshots captured: 
- Feedback panel (duplicate heading visible): `assets/Capture_d_e_cran_2026-03-01_a__19.54.07-01e121bd-5a3f-4fb8-a479-14a2eb66ef7e.png`
- Proposal form (pre-filled, complex layout): `assets/Capture_d_e_cran_2026-03-01_a__19.56.55-fe7ab879-dabe-442c-81e1-47b18b87a707.png`

### Tier-2 Probes — Results (F-20260301-006)
Audience: project sponsor (primary user). Date: 2026-03-01.

**Q1 — Comprehension: "What changed in the app, and why?"**
> "I can see a 'feedback' next to the AI answer. If I click on it, I'm redirected to settings at the top of the menu (this is a bit unsettling), but if I scroll I see a 'Feedback session', and I can leave a feedback. Don't know what that has to do with the chatbot answer, since I can make it about anything else. Now that I look more closely I can see a 'context:' with a ref to the current discussion. Also the whole section is poorly presented to be honest. The 'feedback' title is copied twice for instance; and the settings menu is huge, you have to scroll a lot on a small width menu. Then there is an 'improvement' section, again very cumbersome, I click on a feedback, and there's lots of placeholder text. No idea what I have to do. I clicked on 'save draft' anyway. This is complex wow. I'm stopping here I don't understand what this."

Result: **FAIL** — user could not reconstruct cause and effect within ~10 seconds. Multiple friction points prevented comprehension.

**Q2 — Value: "Was this change useful to you?"**
> "Uh. no."

Result: **FAIL**

**Q3 — Trust: "Do you trust this mechanism to propose future changes?"**
> "It does propose changes? I just saw forms."

Result: **FAIL** — mechanism not visible or legible as an autonomous proposal system.

### Decision Outcomes (per E-0007 Validation Plan)
- Comprehension FAIL → proposal/changelog UX needs work before expanding scope.
- Value FAIL → signal-to-proposal mapping needs refinement (or loop is too hidden to feel valuable).
- Trust FAIL → approval/rollback mechanism needs strengthening / more legible before expanding autonomy.

**Overall: comprehension gate NOT passed. M7 expansion of improvement classes is BLOCKED until M6.1 UX clarity work completes (E-0008).**

### Specific UI Issues Identified
1. **Duplicate "Feedback" heading**: panel title "Feedback" + section header "Feedback" rendered twice (screenshot 1).
2. **Feedback opens at top of settings**: clicking feedback on a response does not scroll/navigate directly to the feedback section — user lands at the top of a large settings menu.
3. **Proposal form complexity**: all fields (title, rationale, feedback ID, diff_summary, risk_notes, timestamp ID) visible and editable simultaneously; purpose of the form is not explained; placeholder text generic; form looks like an admin form, not a user-facing tool.

Follow-up tickets: T-0048 (duplicate heading), T-0049 (feedback navigation), T-0050 (proposal form UX).

### E-0007 DoD Resolution
1. Real signal captured — ✓ (organic usage produced feedback items)
2. Proposal generated — ✓ (generate-from-feedback affordance works; T-0046)
3. Pipeline exercised — ✓ (feedback → proposal form populated; partial: accept path not completed by user)
4. Change is user-visible — ✓ (copy changes observable in Settings; "Suggested improvements")
5. Comprehension gate (tier-2) — **FAILED** → explicitly resolved: follow-up tickets T-0048, T-0049, T-0050 created; E-0008 scoped for M6.1 UX clarity; M7 expansion blocked until gate passes.

### Doc Review
This ticket is docs-only (no software changes). No QA phase required. Doc review: ticket evidence, epic update, and PM checkpoint constitute the review record.

## Change Log
- 2026-03-01: Ticket created by PM checkpoint-27. Linked to E-0007.
- 2026-03-01: Moved to in-progress. E2E smoke run (partial). Tier-2 probes captured — all FAIL. DoD item 5 explicitly resolved as FAILED; follow-up tickets T-0048/T-0049/T-0050 scoped; E-0008 created for M6.1.
