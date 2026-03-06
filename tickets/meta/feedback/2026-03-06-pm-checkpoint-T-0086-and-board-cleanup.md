# PM Checkpoint — 2026-03-06: Apply Pipeline Bug Intake + Board Cleanup

## Summary
Two feedback items triaged this run. One S1 reliability bug (apply-pipeline patch timeout) converted to a P1 ticket inserted at rank 1. One pre-existing model-picker duplicate resolved. Ready queue updated.

---

## Feedback Themes
- **Reliability / observability (S1):** `patch` subprocess timeout fires after 30 seconds on larger patches; the `TimeoutExpired` exception bypasses the `ApplyError` handler and surfaces as `"unexpected_error"` — opaque and not actionable for the user. Feedback: F-20260306-003.
- **UX polish (S3):** Model picker requested to be slicker and more visually appealing. Feedback: F-20260306-002. Already had duplicate tickets (T-0001, T-1001) from prior run.

---

## Decisions and Rationale

| Feedback | Decision | Rationale |
| --- | --- | --- |
| F-20260306-003 (timeout bug) | Create T-0086, P1, rank 1 | S1 bug; blocks the core "Fix with AI" apply flow for non-trivial patches. No design ambiguity — fix is deterministic and well-scoped. |
| F-20260306-002 (model picker UX) | Canonicalize T-1001, delete T-0001 | T-0001 was a poorly-structured duplicate created outside the workflow. T-1001 now carries the full spec. P2 cosmetic; does not block M12. |

---

## Ticket / Epic Updates

| Ticket | Action | Notes |
| --- | --- | --- |
| T-0086 | Created, status: ready, rank 1 | Apply-pipeline patch timeout + user-facing error reporting fix. |
| T-0001 | Deleted | Unstructured duplicate of T-1001 model picker ticket. |
| T-1001 | Updated | Design spec fleshed out; UI spec addendum added; acceptance criteria made observable/testable; canonical model-picker ticket. |

---

## Feedback IDs Touched

| ID | Prior Status | New Status | Action |
| --- | --- | --- | --- |
| F-20260306-002 | (not logged) | ticketed | Inbox item created; linked to T-1001. |
| F-20260306-003 | (not logged) | ticketed | Inbox item created; linked to T-0086. |

---

## User Testing Ask
Skipped — both items are tier 1 (deterministic validation). The timeout bug is a deterministic fix verifiable by unit test. The model picker polish is a visual regression check, not a user-perception question warranting external probing at this stage.

---

## Ready Queue (Post-Run)

| Rank | Ticket | Priority |
| --- | --- | --- |
| 1 | T-0086 | P1 — apply-pipeline timeout bug |
| 2 | T-0082 | P1 — eval harness core |
| 3 | T-0083 | P1 — advisory integration |
| 4 | T-0084 | P1 — harness tests + cleanup |
| 5 | T-1001 | P2 — model picker UI polish |

---

## PM Process Improvement Proposal
**Proposal:** Add a lint step in the PM workflow (or doable by the implementation agent) that checks `tickets/status/ready/` for any ticket file not listed in `ORDER.md`, and flags it as a board gap. The T-0001/T-1001 situation (tickets in `ready/` but absent from `ORDER.md`) was a silent inconsistency that required manual cleanup. A lightweight check would catch this automatically on each PM run.

**Adoption status:** Proposed. If adopted, update `tickets/AGENTS.md` step 7 (ticket quality pass) to include: "Verify all files in `ready/` have an entry in `ORDER.md`; add or remove entries as needed."

---

## Suggested Commit Message
```
pm(2026-03-06): triage apply-pipeline timeout bug; clean up model-picker duplicates

- F-20260306-003 → T-0086 (P1 rank 1): fix patch timeout + error reporting
- F-20260306-002 → T-1001 (P2 rank 5): canonicalize model-picker UI ticket; delete T-0001 duplicate
- INDEX.md, ORDER.md updated
```
