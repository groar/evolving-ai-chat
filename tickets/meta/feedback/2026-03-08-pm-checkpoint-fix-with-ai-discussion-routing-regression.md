# PM Checkpoint — 2026-03-08 (Fix with AI discussion-routing regression triage)

## Feedback Themes (De-duplicated)
- Fix with AI discussion navigation reliability
- Activity deep-link routing correctness
- Run-state isolation by discussion

## Interview Topics + Key Answers
Skipped — user feedback contained concrete repro symptoms and expected behavior.

## User Testing Ask / Plan
Skipped — this is a direct bug report in a known flow; prioritize deterministic regression coverage and QA reproduction.

## Decisions + Rationale
1. **F-20260308-005 -> T-0103 (ticketed, P1, ready rank 1)**
   - Rationale: Reported behavior breaks discussion control and trust in run state:
     - left-panel discussion click can be ignored,
     - Activity discussion deep-link can start a new discussion and trigger unexpected model output,
     - "in progress" can appear in unrelated discussion.
   - Action: Create one cohesive bug ticket to fix routing + state-scoping as a single slice to avoid partial regressions.

## Feedback IDs Touched
| ID | Status | Linked Tickets |
| --- | --- | --- |
| F-20260308-005 | ticketed | T-0103 |

## Ticket Updates
- **Created**: T-0103 (Fix discussion routing during agent run).
- **Moved to ready**: T-0103.
- **Ready queue order**: T-0103 (rank 1), T-0102 (rank 2).

## Epic Updates
- No epic changes in this checkpoint. Ticket is tracked as `Epic: none` pending implementation outcome.

## Proposed PM Process Improvement (Next Cycle)
- Add a PM triage checklist item for Fix with AI reports: verify the reported symptom across all navigation entry points (left panel, Activity deep-link, and refinement-return path) before marking related tickets done.
