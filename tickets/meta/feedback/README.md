# PM Feedback Intake and Checkpoints

Use a lightweight two-layer flow:
- Continuous intake queue so feedback can be captured immediately.
- Periodic PM checkpoint summaries for triage and roadmap/ticket decisions.

## Folder Contents
- `inbox/` individual feedback items (one file per item).
- `INDEX.md` quick catalog of intake items, statuses, and ticket links.
- `YYYY-MM-DD-pm-checkpoint.md` dated PM checkpoint summaries.
- Feedback item template: `tickets/meta/templates/TEMPLATE.feedback-item.md`.

## Intake Item Naming
- Filename format: `F-YYYYMMDD-NNN-short-kebab-title.md`
- Example: `F-20260215-001-settings-flow-confusing.md`
- Feedback ID is the prefix (for example `F-20260215-001`).

## Intake Status Values
- `new` feedback captured but not triaged.
- `triaged` reviewed; pending decision/action execution.
- `deferred` intentionally postponed; rationale and revisit trigger recorded.
- `ticketed` linked to one or more ticket IDs.
- `closed` intentionally no further action.

Lifecycle note: when all linked tickets are accepted (`tickets/status/done/`) or intentionally dropped (`tickets/status/cancelled/`), update the feedback item and `INDEX.md` status to `closed` and bump `Updated`.

## Severity Scale
Use the same severity scale as bug tickets (see `tickets/README.md`):
- `S1` blocker
- `S2` major
- `S3` minor
- `S4` trivial

## PM Checkpoint Summary Convention
- Filename: `YYYY-MM-DD-pm-checkpoint.md`
- If multiple PM runs happen on the same date, suffix with `-N` (for example `YYYY-MM-DD-pm-checkpoint-2.md`).
- Example: `2026-02-14-pm-checkpoint.md`
- Minimum content:
  - Feedback themes (grouped, de-duplicated).
  - Interview topics and key answers (if PM interview was run).
  - Decisions made (act now, defer, reject) with rationale.
  - Ticket changes (created/updated/moved).
  - Epic changes (created/updated).
  - One proposed process improvement for the next cycle.
  - Feedback IDs touched during the checkpoint.

## Ticket Referencing Rule
- Tickets that originate from feedback should reference feedback IDs under a `Feedback References` section.
- When a feedback item is converted to ticket work, update both:
  - the feedback file (`Linked Tickets` field),
  - `INDEX.md` (`Linked Tickets` column).
