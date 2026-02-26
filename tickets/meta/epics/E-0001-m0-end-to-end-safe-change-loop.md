# E-0001: M0 — End-to-end safe change loop

## Metadata
- ID: E-0001
- Status: active
- Owner: pm-agent
- Created: 2026-02-26
- Updated: 2026-02-26

## Goal
Prove the core promise safely: the desktop app can observe friction/feedback, propose a small change, validate it, and ship it behind controls with rollback and a clear changelog.

## Definition of Done
- A minimal desktop chat UI exists and is usable for basic conversations.
- The app can call a local agent/runtime and render responses (even if stubbed initially).
- The system can capture at least one feedback signal (explicit or implicit) and record it locally.
- A “change proposal” can be generated as a bounded diff with a short rationale.
- Validation gates run (tests/smoke/evals) and results are recorded.
- Release controls exist (stable vs experimental) and rollback is straightforward.

## Non-goals
- Fully autonomous self-modification with no review.
- Multi-tenant SaaS hosting and enterprise auth/compliance.
- Deep integrations beyond the core loop.

## Linked Feedback
- F-20260226-001

## Linked Tickets
- T-0002 Define autonomy + data boundary defaults
- T-0003 Desktop app skeleton (Tauri + React)
- T-0004 Local runtime API + UI integration (stub agent)
- T-0005 Storage: conversations + event log (SQLite)
- T-0006 Feature flags + release channels (stable/experimental)
- T-0007 Validation gates + sandboxed verification runner
- T-0008 Changelog + rollback UX
- T-0009 Agentic harness baseline (pi.dev-like PR/ticket loop)
- T-0010 FastAPI runtime dev startup + smoke verification

## Progress (Ticket Status)
- Done:
  - T-0002, T-0003, T-0004, T-0005, T-0006, T-0007, T-0009, T-0010
- Next up:
  - T-0008
- Planned:
  - (none)

## Notes
Keep slices small. Ship something “boring but solid” first, then accelerate iteration once gates are trustworthy.
