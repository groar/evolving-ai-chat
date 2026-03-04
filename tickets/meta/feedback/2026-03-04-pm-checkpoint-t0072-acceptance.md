# PM Checkpoint — 2026-03-04: T-0072 Acceptance

## Summary
Accepted T-0072 (Activity/history stub clutter cleanup) and moved to `tickets/status/done/`.

## Accepted
- **Ticket:** T-0072
- **Implementation:** Activity sheet classifies patches as main (high-signal), in-progress (transient), other (stub/low-signal). Main list shown first; "In progress (N)" and "Other activity (N)" in collapsible details. Stubs and transient entries no longer dominate the default view.
- **QA:** 2026-03-04-qa-T-0072.md — PASS. UX checklist (Area: ui) passed; no bug tickets.

## Why shippable
- Acceptance criteria and UX acceptance criteria met. Stub/placeholder entries grouped; meaningful change events remain clearly visible. Labels "In progress" and "Other activity" are clear; design system consistent.

## Suggested commit message (PM)
```
chore(pm): accept T-0072 (Activity/history stub clutter cleanup) to done
```
