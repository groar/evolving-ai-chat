# Project Status — Self-Evolving Personal Chat Software

This is the living snapshot of the project: what we believe is true right now, what “good” looks like, and what we plan to do next.

## Ownership And Update Policy
- Owner: User (project sponsor) until delegated; PM role updates this file by default.
- Update cadence:
  - Initial fill (2026-02-26).
  - At each milestone/epic boundary.
  - After major discoveries, pivots, or user feedback.
- Rule: If `STATUS.md` and tickets disagree, update `STATUS.md` or adjust tickets so they match the intended direction.

## Current Snapshot
### One-Liner
A personal, chatbot-like AI workbench that continuously adapts its UI/UX and capabilities from your usage, using agentic coding in the background—without sacrificing safety, stability, or control.

### Target Users
- Primary: a single power user who wants a “living” assistant that improves daily and can go in surprising directions (by consent).
- Later (optional): small teams that want a shared, evolving assistant with guardrails and clear change ownership.

### Problem / Opportunity
- Today’s AI chat products are powerful but largely static: same UX, same feature set, slow iteration, and shallow personalization.
- LLMs + tools can observe friction, generate improvements, and ship changes quickly—if we can do it safely (tests, rollback, audit, user control).
- The opportunity is “personal software” reborn: software that molds to one person’s workflows over time, including UI and new agent behaviors.

### What “Self-Evolving” Means Here (Pragmatic)
Self-evolving ≠ random. It means a tight loop with guardrails:
1. Observe: capture interaction signals (explicit feedback + implicit friction).
2. Propose: agents draft small, reviewable changes (UX tweaks, new commands, new tools, better prompts/routing).
3. Validate: run fast checks (lint/tests/evals, smoke flows, cost/safety budgets).
4. Release: ship behind a feature flag / channel with easy rollback and a changelog.

Agentic harness options (to evaluate): pi.dev-style “coding agents that open PRs/tickets”, plus local sandboxed execution for tests and UI builds.

### Success Criteria (Initial)
- Trust: changes are explainable, attributable, and reversible (one-click rollback for end-user-facing regressions).
- Stability: core chat never becomes unusable; “stable mode” remains predictable.
- Momentum: meaningful improvements land weekly (initially), then daily once validation is solid.
- Personal fit: the assistant measurably reduces time/friction for the primary user’s top 3 workflows.
- Safety/privacy: user data stays within the intended boundary (local-first preferred), with explicit consent for any external sharing.

### Scope
- In scope:
  - Chat UI/UX that can be iterated continuously (layouts, shortcuts, “workbench” panels, saved views).
  - Multi-model routing (e.g., ChatGPT/Claude/Gemini equivalents), with clear provenance of outputs and costs.
  - Agent runtime that can run tools (filesystem, shell, web, project-specific tools later) with explicit permissions.
  - A “self-improvement pipeline”: propose → validate → release, driven by tickets in this repo.
  - Observability: interaction logs (redacted), cost tracking, failure tracking, and per-change evaluation results.
  - Guardrails: feature flags, release channels (stable/experimental), rollback, and an auditable changelog.
- Out of scope (non-goals) for initial phases:
  - Multi-tenant SaaS hosting, enterprise auth/compliance.
  - Fully autonomous self-modification with no review gates.
  - “Collect everything” surveillance analytics.
  - Product-specific integrations until the base loop is reliable.

### Key Constraints (Non-Negotiables)
- User control: no high-impact changes without opt-in (UI redesigns, data migrations, tool permission expansions).
- Auditability: every shipped change ties back to a ticket, diff, and validation evidence.
- Rollback-first: the system must be able to revert UI and behavior changes quickly.
- Security: treat secrets as toxic; avoid exfiltration; run code in a sandbox; least-privilege tool permissions.
- Cost boundaries: model/tool usage should be budgeted; “expensive modes” must be explicit.

### Initial Technology Choices (v1)
- Desktop container: Tauri (Rust shell) for a local-first desktop app.
- UI: React + Vite + Tailwind + shadcn/ui; state: Zustand.
- Local API/runtime: Python `FastAPI` + `pydantic` for the agent runtime API and tool permission layer.
- Storage: SQLite for settings/events/feature flags/runs; filesystem for artifacts.
- Eval + test gates: Vitest (UI), Pytest (runtime), Playwright (smoke), plus a lightweight prompt/behavior eval runner.
- Safe execution: run agent-proposed changes and tests in an isolated sandbox (e.g., Docker) before applying patches to the working copy.
- Model adapters: thin provider wrappers per vendor (OpenAI/Anthropic/Google), with a later option to unify via LiteLLM if needed.

### Current State (2026-03-01)
- Shipped / working:
  - This repository scaffold: ticketing board + PM/QA workflow docs.
  - Desktop app skeleton (Tauri + React) with polished chat UI shell (T-0003, T-0026).
  - Release controls + user trust surfaces: stable/experimental channels, changelog, and rollback UX (T-0006, T-0008).
  - A process path for agentic iteration (tickets → in-progress → review → QA → done).
  - In-app feedback capture (local-only) with deterministic UI test coverage (T-0012).
  - Change proposal artifact persistence + decision gating (local-only) (T-0013).
  - Settings proposals panel (draft + validate + decide) (T-0016).
  - Desktop nav hierarchy, progressive disclosure, and offline-state clarity (E-0003: T-0019–T-0025).
  - UX/UI design refresh: copy, typography, hover states, tab bar, modern composer (T-0026).
  - FastAPI runtime skeleton with stub responses + smoke verification (T-0004, T-0010).
  - In-app API key configuration in Settings → Connections (T-0030); key stored via Tauri plugin-store; composer disabled when no key.
  - Real AI chat: OpenAI adapter (T-0027), streaming (T-0028), multi-turn context (T-0029). Full end-to-end chat when API key is set.
- Known gaps:
  - **UI is system-centric** — meta-surfaces (Settings, proposals, flags) dominate over chat (M4 addresses this).
  - ~~Tech stack mismatch~~ — Tailwind + shadcn/ui adopted (T-0031); Zustand pending (T-0032).
  - **No Markdown rendering** — assistant responses are plain text; no code highlighting or copy (M5 addresses this).
  - Product/technical architecture docs (UI platform, agent runtime, storage, release channels).
  - An evaluation harness (tests/evals) that can gate changes automatically.
- Known risks:
  - UX churn: frequent changes can annoy more than help without stability controls.
  - Regressions: agent-written changes can break core flows without strong tests/evals.
  - Privacy drift: “helpful” logging can become invasive if not constrained early.
  - Local complexity: self-modifying systems accumulate cruft without periodic refactors and pruning.

### Near-Term Plan
- Most recent milestone: M6 — "First Agent-Proposed Change from Real Usage" (E-0007) (scoped 2026-03-01)
  - Goal: Ship the first agent-proposed change driven by real usage signal.
  - Ready: T-0044 (Beta→Stable bug fix), T-0045 (M6 scope).
- Previous: M5 — "Conversational UX Table Stakes" (E-0006) (completed 2026-03-01)
  - T-0036–T-0040, T-0042, T-0043. Tier-3 validation: partial pass, proceed.
- M4 — "UI Simplification & Chat-First Redesign" (E-0005) (completed 2026-03-01)
  - T-0031–T-0035, T-0041. Tier-2 validation 2/3 passed.

## Decisions (Draft; confirm/adjust as we start)
Record important decisions so future agents do not re-litigate context.

| Date | Decision | Rationale | Links |
| --- | --- | --- | --- |
| 2026-02-26 | Single-user first, local-first bias | Simplifies privacy/trust and accelerates iteration | STATUS.md |
| 2026-02-26 | Two release channels: stable + experimental | Enables “unexpected directions” without breaking daily use | STATUS.md |
| 2026-02-26 | No silent high-impact changes | Keeps user agency and reduces risk of trust loss | STATUS.md |
| 2026-02-26 | Ticket-driven self-evolution | Forces traceability: every change has scope, tests, and rollback plan | tickets/README.md |
| 2026-02-26 | Desktop-first via Tauri | Local-first UX, tighter control over permissions and data boundaries | STATUS.md |
| 2026-02-26 | Data boundary: local-only (default) | Keeps trust surface small; explicit opt-in required for any export/sync | tickets/status/done/T-0002-define-autonomy-and-data-boundary-defaults.md |
| 2026-02-26 | Autonomy: UI-level gated changes (default) | Seamless experience with user control; code diffs remain auditable when needed | tickets/status/done/T-0002-define-autonomy-and-data-boundary-defaults.md |
| 2026-02-26 | Harness baseline: local-first patch workflow (optional PR mirror) | Works in offline/sandboxed environments while preserving auditable diffs, validation artifacts, and ticketed approvals | tickets/status/done/T-0009-agentic-harness-baseline-pidev-like-loop.md |
| 2026-03-01 | Chat-first, then self-evolve | Self-evolution infrastructure was over-invested before core chat works; course-correct by shipping M3 fast, then M4 (UI simplification) and M5 (chat UX table stakes) before resuming self-evolution work | F-20260301-002, E-0005, E-0006 |

## Open Questions (Pick early; unblock architecture)
- When should self-evolution resume? After M5 (safe bet) or overlap with M4/M5 (faster but riskier)?
- Should M6 (First Agent-Proposed Change) target UI changes, system prompt tuning, or tool additions?
