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

### Current State (2026-03-04)
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
  - ~~UI is system-centric~~ — addressed by M4, M9, M9.1.
  - ~~Tech stack mismatch~~ — Tailwind + shadcn/ui adopted (T-0031); Zustand pending (T-0032).
  - ~~No Markdown rendering~~ — addressed by M5.
  - Product/technical architecture docs (UI platform, agent runtime, storage, release channels).
  - **Pre-existing test failures**: `test_chat.py` (502/API mocking), `test_proposals.py` (sqlite3.Row schema mismatch), `test_apply_rollback.py` (git sandbox restrictions). Reduces CI trustworthiness. M11 addresses.
  - **No eval harness** — lightweight prompt/behavior eval runner to gate agent-proposed changes automatically. M11 lays groundwork.
- Known risks:
  - UX churn: frequent changes can annoy more than help without stability controls.
  - Regressions: agent-written changes can break core flows without strong tests/evals.
  - Privacy drift: “helpful” logging can become invasive if not constrained early.
  - Local complexity: self-modifying systems accumulate cruft without periodic refactors and pruning.

### Near-Term Plan
- **M8 — "Agentic Code Self-Modification Loop" (E-0010) — complete (2026-03-03)**
  - All tickets shipped: T-0058 (spec), T-0059 (harness), T-0060 (apply/rollback), T-0061 (notification UI + Changelog Undo), T-0062 (dismiss + failure copy), T-0063 (settings legacy cleanup), T-0064 (central improvement button).
  - Tier-2 micro-validation PASS (sponsor): diff → accept → apply → undo validated; patch quality noted as variable (model/prompt tuning can be a follow-up).
- **M9 — "Design System & UX Polish" (E-0011) — complete (2026-03-04)**
  - T-0066 (design guidelines), T-0067 (Activity sheet), T-0068 (Settings rethink), T-0069 (agent execution logs), T-0070 (tier-2 validation) done. Tier-2 micro-validation PASS; follow-up cleanups captured in E-0012.
- **M9.1 — "E-0011 Follow-Up UX Cleanup" (E-0012) — complete (2026-03-04)**
  - T-0071 (Settings release-channel/early-access cleanup) done: section clarified to "Updates"; Beta channel description added. T-0072 (Activity/history stub clutter) done: stubs grouped under collapsible "In progress (N)" / "Other activity (N)" sections. T-0073 (Fix with AI progress/error visibility) done — F-20260304-005.
- **M10 — "Agentic Loop Polish" (E-0013) — complete (2026-03-04)**
  - T-0074 (design spec) resolved 3 open M8 questions. T-0075: live-apply hot-reload (400ms delay + `window.location.reload()`; reloading display state). T-0076: prompt engineering + config-driven scope allowlist + `patch_metrics` table + color-coded DiffBlock. All QA PASS. Tier-2 micro-validation deferred pending manual E2E (PATCH_AGENT_STUB=true steps documented in QA checkpoint T-0075).
  - **Next**: scope next milestone. Ready queue replenishment in progress (T-0077).
- **M11 — "Test Suite Green Baseline" (E-0014) — in-progress (2026-03-04)**
  - T-0077 (M11 design spec / triage) done. Root causes identified for all 3 failing test files. Implementation tickets T-0078 (test_chat.py mock), T-0079 (sqlite3.Row.get), T-0080 (git/sandbox isolation) now in ready queue. Fixes 3 pre-existing pytest failures; lays eval harness groundwork. Restores reliable CI for self-modification loop.
- Previous: M7 (E-0009) superseded 2026-03-01; T-0056 cancelled, T-0057 cancelled. T-0052–T-0055 done but scope superseded.
- Previous: M7 — "Improvement Class Expansion" (E-0009) (superseded 2026-03-01; T-0052–T-0055 done, T-0056 cancelled)
- Previous: M6.1 — "Loop Legibility and UX Clarity" (E-0008) (completed 2026-03-01)
  - T-0048, T-0049, T-0050 (M6.1 batch), T-0051 (tier-2 re-probe). Comprehension gate passed.
- Previous: M6 — "First Agent-Proposed Change" (E-0007) (completed 2026-03-01; comprehension gate failed → E-0008 scoped)
- Previous: M5 — "Conversational UX Table Stakes" (E-0006) (completed 2026-03-01)
  - T-0036–T-0040, T-0042, T-0043, T-0044. Tier-3 validation: partial pass, proceed.
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
- ~~M8 patch scope guard: UI-only allowlist, prompt constraint, or both?~~ — Resolved by T-0074/T-0076: both (prompt constraint + config-driven `^apps/desktop/src/` allowlist via `patch-allowlist.json`).
- ~~M8 build step: hot-reload on patch accept, or full Tauri rebuild?~~ — Resolved by T-0074/T-0075: `window.location.reload()` after 400ms (frontend-only; no Tauri restart); "change is live" signal = `reloading` display state → reload.
- ~~M8 diff UI: unified diff view inline, or dedicated panel?~~ — Resolved by T-0074/T-0076: color-coded `DiffBlock` inline in `PatchNotification`; no dedicated panel needed.
- **M11**: Are `test_chat.py` / `test_proposals.py` / `test_apply_rollback.py` failures caused by missing mocks, schema drift, or genuine code bugs? → T-0077 (triage) will answer before implementation.
- **M11**: What is the minimum viable eval harness for gating agent-proposed patches? → T-0077 will scope.
