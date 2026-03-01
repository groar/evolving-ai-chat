# PM Checkpoint — 2026-03-01 Run 23 (Tier-3 Validation Blockers)

## Summary
User attempted E-0006 tier-3 external validation but encountered two blockers. Triage: captured feedback, created bug tickets, promoted to ready queue.

## Feedback Captured
- **F-20260301-003**: With only OpenAI API key, app shows "Add API key for this model in Settings" and blocks chat; user cannot pick model. Should default to OpenAI model when that's the only key.
- **F-20260301-004**: "New conversation" button at bottom of list — must scroll when many conversations.

## Decisions and Rationale

| Decision | Rationale |
| --- | --- |
| T-0042 (model selector bug) → ready rank 1 | S2 blocker; prevents chat with OpenAI-only config. P1. |
| T-0043 (new conversation button) → ready rank 2 | S3 UX fix; quick win. P2. |
| Both block tier-3 validation | User could not proceed with probe. |

## Ticket/Epic Updates

| File | Change |
| --- | --- |
| F-20260301-003, F-20260301-004 | Created in inbox; linked to T-0042, T-0043 |
| T-0042 | Created in ready (rank 1) — model selector default to first model with key |
| T-0043 | Created in ready (rank 2) — new conversation button at top |
| INDEX.md | Added F-20260301-003, F-20260301-004 |
| ORDER.md | T-0042 rank 1, T-0043 rank 2 |

## User Testing Status
Tier-3 validation **paused** until T-0042 (and optionally T-0043) are fixed. User can retry probe after implementation.

---

**Suggested commit message:** `PM: Triage tier-3 blockers — T-0042 model selector, T-0043 new conversation button`

**Next step:** Implementation agent picks T-0042 (model selector default) from ready. After T-0042 and T-0043 ship, user can resume E-0006 tier-3 validation.
