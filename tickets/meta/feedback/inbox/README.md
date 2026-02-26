# Feedback Inbox

Store one raw/sanitized feedback item per file using the feedback template.

## Purpose
- Capture feedback immediately without forcing same-day triage.
- Preserve traceability from incoming feedback to later ticket decisions.

## Rules
- Use filename format: `F-YYYYMMDD-NNN-short-kebab-title.md`.
- Keep personally identifying details out unless explicitly needed for follow-up.
- Add each new item to `tickets/meta/feedback/INDEX.md`.
- Keep `Status`, `Linked Tickets`, and `Updated` fields current as triage progresses.
