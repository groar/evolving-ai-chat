# Feedback Catalog

Tracks all feedback intake items for easy triage, deferral, and ticket linkage.

## Columns
- `ID` feedback item ID (`F-YYYYMMDD-NNN`).
- `Status` one of `new`, `triaged`, `deferred`, `ticketed`, `closed`.
- `Theme` short category (for example `clarity`, `economy`, `difficulty`, `ux`).
- `Severity` `S1`, `S2`, `S3`, or `S4` (see `tickets/README.md`).
- `Linked Tickets` ticket IDs if applicable (for example `T-0007`).
- `Updated` last date touched.

## Items
| ID | Status | Theme | Severity | Linked Tickets | Updated |
| --- | --- | --- | --- | --- | --- |
| F-20260226-001 | ticketed | direction | S2 | T-0002, T-0003, T-0004, T-0005, T-0006, T-0007, T-0008, T-0009, T-0010, T-0011, T-0012, T-0013, T-0014, T-0015, T-0016 | 2026-02-27 |
| F-20260228-001 | closed | ux | S2 | T-0017 | 2026-02-28 |
| F-20260228-002 | ticketed | ux | S2 | T-0019, T-0020, T-0021, T-0022 | 2026-02-28 |
| F-20260228-003 | ticketed | ux | S2 | T-0023, T-0024 | 2026-02-28 |
| F-20260301-001 | ticketed | ux | S2 | T-0025 | 2026-03-01 |
| F-20260301-002 | ticketed | direction | S2 | T-0031, T-0032, T-0033, T-0034, T-0035, T-0036, T-0037, T-0038, T-0039, T-0040 | 2026-03-01 |
| F-20260301-003 | ticketed | ux | S2 | T-0042 | 2026-03-01 |
| F-20260301-004 | ticketed | ux | S3 | T-0043 | 2026-03-01 |
| F-20260301-005 | ticketed | ux | S2 | T-0044 | 2026-03-01 |
| F-20260301-006 | ticketed | ux | S1 | T-0047, T-0048, T-0049, T-0050 | 2026-03-01 |
