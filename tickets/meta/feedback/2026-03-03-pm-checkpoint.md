# PM Checkpoint — 2026-03-03

## Summary
Single feedback drop (F-20260303-001) from primary sponsor. Two themes triaged into two ready tickets (T-0063 / T-0064), both linked to E-0010 as polish items. T-0062 accepted and noted as done.

---

## Feedback Themes

### Theme 1 — Settings panel crowded with legacy cruft (S2, cleanup)
The AI Persona section and the full Improvements proposals pipeline (draft → validate → decide) were built for the pre-M8 config-only approach (M6/M7). Since M8 pivoted to real code self-modification, these surfaces and the backing code (`improvementClasses`, `proposalGenerator`, `proposalQualityGuard`) serve no purpose. User explicitly confirmed they should be removed.

### Theme 2 — Improvement request entry point is buried (S2, ux)
Submitting an improvement to trigger the M8 loop requires: open Settings → scroll down → click "New improvement" → fill form. This is too many steps for the primary interaction the product is built around. The user suggested a persistent button.

---

## Interview Topics and Key Answers
No interview conducted. Feedback was specific and actionable; no ambiguity on intent.

---

## User Testing Ask / Plan
Skipped — changes are structural/cleanup (T-0063) and a focused UX improvement (T-0064). The tier-2 micro-validation probe from E-0010 already passed (2026-03-03). After T-0064 ships, a quick informal probe ("Can you submit an improvement request from this screen?") is recommended but not gating.

---

## Decisions and Rationale

| Item | Decision | Rationale |
| --- | --- | --- |
| Remove AI Persona section | Create T-0063 | Obsolete post-M8 pivot; E-0010 Non-goals already called this out. No user-facing value remaining. |
| Remove Proposals pipeline UI | Create T-0063 (same ticket) | Same rationale; the draft/validate/decide UI flow is replaced by the direct "Fix with AI →" / `requestPatch` path. |
| Delete backing modules | Create T-0063 (same ticket) | Dead code: `improvementClasses.ts`, `proposalGenerator.ts`, `proposalQualityGuard.ts` have no callers once the proposals UI is gone. |
| Central improvement button | Create T-0064 | The M8 loop's primary trigger should be one click away; FeedbackPanel promotes to its own Sheet. |
| Placement: top-bar button | Defaulted to top-bar `SparklesIcon` | Most discoverable persistent location; consistent with existing Settings gear; icon clearly connotes "improve/AI" not "feedback rating". Alternative (FAB overlay) rejected as visually heavier for a utility action. |
| Sequencing T-0063 before T-0064 | T-0063 rank 1, T-0064 rank 2 | T-0063 removes the Improve section from Settings; T-0064 fills the gap with the new surface. Doing T-0064 first would create duplication. |

---

## Feedback IDs Touched

| ID | Status Change | Notes |
| --- | --- | --- |
| F-20260303-001 | new → ticketed | Split into T-0063 + T-0064 |

---

## Ticket and Epic Updates

| Artifact | Change |
| --- | --- |
| `tickets/meta/feedback/inbox/F-20260303-001-*.md` | Created |
| `tickets/status/ready/T-0063-*.md` | Created (rank 1) |
| `tickets/status/ready/T-0064-*.md` | Created (rank 2) |
| `tickets/meta/feedback/INDEX.md` | F-20260303-001 row added |
| `tickets/status/ready/ORDER.md` | T-0062 removed (done); T-0063 rank 1, T-0064 rank 2 added |
| `tickets/meta/epics/E-0010-*.md` | T-0062 marked done; T-0063 + T-0064 linked; metadata updated |

---

## PM Acceptance: T-0062
T-0062 (notification dismiss + human-readable failure reasons) was confirmed done in `tickets/status/done/`. No QA checkpoint was found for T-0062 specifically (follow-up item: if a QA checkpoint exists, link it). Accepted as done based on done-folder placement and matching ORDER.md notes.

---

## PM Process Improvement Proposal
**Proposal**: Add a `Done: YYYY-MM-DD` column to `ORDER.md`'s Notes section as tickets complete, so the PM can verify done-state without a separate `ls done/` check. This would have made it immediately clear that T-0062 was done rather than stale in the ready queue.

*Not adopting this run — too small to warrant a doc change now. Record for the next scaffold review.*

---

## Suggested Commit Message
```
pm: triage F-20260303-001 — settings cleanup (T-0063) and central improvement button (T-0064)

- Feedback intake: F-20260303-001 (settings legacy + improvement entry point)
- T-0063 (ready, P2): remove AI Persona + Proposals pipeline + backing code from Settings
- T-0064 (ready, P2): add persistent top-bar SparklesIcon button opening dedicated improvement sheet
- ORDER.md updated: T-0062 cleared (done), T-0063 rank 1, T-0064 rank 2
- E-0010 updated: T-0062 done, T-0063/T-0064 linked as polish items
```

---

## Next Step
**Recommended**: run the implementation agent on T-0063 (settings panel legacy cleanup). It is rank 1 in the ready queue, fully specced, and unblocks T-0064.

*Alternate*: if you want to see both changes ship together in one session, you can run T-0063 → (auto-QA + PM accept) → T-0064 back-to-back.
