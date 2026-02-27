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
| F-20260226-001 | ticketed | direction | S2 | T-0002, T-0003, T-0004, T-0005, T-0006, T-0007, T-0008, T-0009, T-0010, T-0011, T-0012, T-0013 | 2026-02-27 |
