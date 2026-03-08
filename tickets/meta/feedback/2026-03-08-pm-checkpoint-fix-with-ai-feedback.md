# PM Checkpoint — 2026-03-08 (Fix with AI playtest feedback)

## Feedback Themes (De-duplicated)
- Fix with AI reliability: git commit not occurring when agent succeeds
- Fix with AI observability: patches missing from Activity feed
- Fix with AI UX: progress visibility in refinement context, in-progress Activity cards

## Interview Topics + Key Answers
Skipped — feedback was explicit and well-structured from playtest.

## User Testing Ask / Plan
Skipped — feedback came from direct playtest; no additional validation requested.

## Decisions + Rationale

### Positive feedback (keep direction)
- Conversational refinement flow (Fix with AI → Run agent) is smooth and worked well.
- Agent produced the right result.
- Overall experience is great; continue in this direction.

### Bugs (ticketed)
1. **F-20260308-002 → T-0095**: Nothing got git committed when pi agent finished. Root cause: apply pipeline failed with `patch_timeout` (180s) during sandboxed validate step; git commit never ran. T-0095 to ensure successful agent runs result in committed changes (timeout/config/fallback).
2. **F-20260308-003 → T-0096**: No trace in Activity feed. Patches from Fix with AI flow do not appear in Activity. T-0096 to investigate and fix (state refresh, persistence, or filtering).

### Improvements (ticketed)
3. **F-20260308-004 → T-0097**: Progress in refinement context + Activity in-progress cards. User wants: (a) progress visible in the refinement discussion after Run agent, not in Suggest an improvement panel; (b) more granular progress (sub-agents deferred); (c) in-progress evolutions as Activity cards with link to refinement discussion; when done, regular card (optionally keep link). T-0097 depends on T-0096.

## Feedback IDs Touched
| ID | Status | Linked Tickets |
| --- | --- | --- |
| F-20260308-002 | ticketed | T-0095 |
| F-20260308-003 | ticketed | T-0096 |
| F-20260308-004 | ticketed | T-0097 |

## Ticket Updates
- **Created**: T-0095 (git commit when agent succeeds), T-0096 (patches missing from Activity), T-0097 (progress in refinement + Activity cards).
- **Moved to ready**: T-0095, T-0096.
- **Remains in backlog**: T-0097 (depends on T-0096).
- **Ready queue order**: T-0096 (rank 1), T-0095 (rank 2).

## Epic Updates
- E-0016 (M13 Self-Evolve Reliability): Added T-0095, T-0096, T-0097 to scope.

## Proposed PM Process Improvement (Next Cycle)
- When triaging Fix with AI feedback, cross-check patch storage artifacts (e.g. `storage/patches/*.json`) to validate root-cause hypotheses (status, failure_reason, applied_at) before writing tickets.
