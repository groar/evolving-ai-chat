# T-0079: Fix test_proposals.py — sqlite3.Row.get() Compatibility

## Metadata
- ID: T-0079
- Status: ready
- Priority: P1
- Type: bug
- Area: core
- Epic: E-0014
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
`test_proposals.py` fails with `AttributeError: 'sqlite3.Row' object has no attribute 'get'` in `storage.py`. Root cause (from T-0077 triage): code calls `row.get("improvement_class", "")` (and possibly other `.get()` calls) on `sqlite3.Row` objects, which only support index access (`row["key"]`), not `.get()`. Fix by replacing all `row.get(...)` calls in `storage.py` with Row-safe equivalents (e.g. `row["key"] if "key" in row.keys() else default`) or a small helper, and verify all proposal tests pass.

## Context
- T-0077 (M11 triage) pinpointed the exact line (`storage.py` line ~806).
- Effort estimate from triage: S (< 1 h).
- This is the lowest-effort fix in the M11 batch; recommended as first pickup if doing tickets sequentially.

## References
- `apps/desktop/runtime/test_proposals.py`
- `apps/desktop/runtime/storage.py` (line ~806 and audit for other `.get()` usages)
- T-0077 (root-cause table), E-0014 (M11 epic)

## Acceptance Criteria
- [ ] `uv run pytest runtime/test_proposals.py -v` exits 0 from `apps/desktop/`.
- [ ] All tests that were failing with `AttributeError: 'sqlite3.Row' object has no attribute 'get'` now pass.
- [ ] `storage.py` is audited for all occurrences of `row.get(...)` on `sqlite3.Row`; all are replaced or wrapped.
- [ ] No functional behavior change for end users (the fix is in test plumbing / defensive access patterns only).
- [ ] `uv run pytest runtime/test_chat.py runtime/test_apply_rollback.py` is not broken by this change.

## Dependencies / Sequencing
- Depends on: T-0077 (done).
- Blocks: none (T-0078 and T-0080 are independent).
- Sequencing notes: smallest effort; recommended first pickup in the M11 batch.

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Read `storage.py` and search for all `row.get(` usages
- [ ] Replace each with Row-safe access (index + key existence check, or a helper function)
- [ ] Run `uv run pytest runtime/test_proposals.py -v` — all pass
- [ ] Run full `uv run pytest runtime/` — no new failures introduced

## Notes
Preferred fix pattern:
```python
# Instead of:
row.get("improvement_class", "")
# Use:
row["improvement_class"] if "improvement_class" in row.keys() else ""
```
Or introduce a small helper at the top of `storage.py`:
```python
def _row_get(row, key, default=None):
    return row[key] if key in row.keys() else default
```
This avoids converting the entire Row to a dict (which would change memory usage) while keeping the access safe.

## Change Log
- 2026-03-04: Ticket created by PM run (M11 queue replenishment from T-0077 triage output).
