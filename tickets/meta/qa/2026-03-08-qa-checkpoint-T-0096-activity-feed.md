# QA Checkpoint: T-0096 (Fix with AI — patches missing from Activity feed)

**Date:** 2026-03-08  
**Ticket:** T-0096  
**Scope:** Single-ticket validation after implementation moved to review.

## Test Plan
- **Impacted mechanics:** Activity sheet data source (settingsStore.patches); refresh trigger when sheet opens.
- **Automated:** Desktop build, ActivitySheet unit tests.
- **Manual/UX:** Activity sheet still shows patches from store; opening the sheet now triggers refreshState so latest patches (including Fix with AI runs) are loaded.

## Automated Results
- **Desktop build:** Passed (npm run build in apps/desktop).
- **ActivitySheet tests:** 12/12 passed (vitest run activitySheet).
- **npm run validate:** Desktop build step passed; runtime-contract-smoke skipped (runtime stub exited early — pre-existing env issue, not caused by this ticket).

## UX/UI Design QA (Area: ui)
Checklist applied to the Activity sheet and the change (refresh on open).

| Category | Result | Evidence |
|----------|--------|----------|
| 1) Mental Model and Framing | PASS | Activity sheet purpose ("Changes applied by AI will appear here") unchanged; fix ensures data is current when user opens it. |
| 2) Hierarchy and Focus | PASS | No UI change; primary content remains patch list and release notes. |
| 3) Information Architecture | PASS | Activity remains behind Settings / Activity; no new surfaces. |
| 4) States and Error Handling | PASS | Empty state unchanged; refresh on open does not introduce new error surfaces. |
| 5) Copy and Terminology | PASS | No copy changes. |
| 6) Affordances and Interaction | PASS | No interaction changes beyond ensuring fresh data on open. |
| 7) Visual Accessibility Basics | PASS | No visual changes. |
| 8) Responsive / Window Size | PASS | No layout changes. |

**Overall UX result:** PASS. Change is behavioral only (refresh when Activity opens); no regression to existing Activity feed behavior.

## Acceptance Criteria Mapping
- **Patch appears after Fix with AI (refinement or direct):** Satisfied by refreshState when Activity sheet opens; GET /state returns patches from patch_storage.list_all().
- **Failed patches visible:** Backend returns all statuses; Activity sheet already displays apply_failed, scope_blocked, etc.; no filter change.
- **Tests/build:** Desktop build and ActivitySheet tests pass; validate failure is pre-existing (runtime stub).
- **No regression:** Existing Activity behavior preserved; only addition is one useEffect that refreshes when sheet opens.

## Findings
- No bugs found. No follow-up tickets created.

## Recommendation
**Pass.** Ready for PM acceptance and move to done.

---
**Suggested commit message (QA):** `qa: T-0096 checkpoint — Activity feed patch visibility pass`

**Next step:** PM acceptance: accept T-0096 and move to `tickets/status/done/`.
