# E-0011: M9 — Design System & UX Polish

## Metadata
- ID: E-0011
- Milestone: M9
- Status: in-progress
- Priority: P1
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Goal
Establish a formal design system and redesign the three most friction-heavy surfaces (changelog/history, settings, agent logs) so the app feels as coherent and refined as the user's stated reference standard (Claude UI). Give implementers — human and AI — a canonical design spec they can always follow.

## Problem Statement
As the app self-evolves, features accumulate without a shared design language. The changelog panel is already unusable at scale. Settings conflates history, config, and diagnostics. Agent execution logs are invisible. Without design guidelines, each new feature risks drifting further from the intended experience.

## Definition of Done
- [x] `docs/design-guidelines.md` is published, references the existing token set in `styles.css`, and is cited in at least one UI ticket implementation.
- [x] The changelog/history is moved out of Settings into a dedicated Activity sheet, scales gracefully, and supports expandable diffs.
- [x] Settings is redesigned: focused on config only, clean section hierarchy, no stale/misplaced content.
- [x] Per-patch agent execution logs are accessible as expandable hidden detail inside the Activity sheet.
- [ ] Tier-2 micro-validation: user is asked "Does the app feel as polished and coherent as you'd expect from a tool like Claude?" (T-0070).

## Linked Tickets
| Ticket | Title | Status |
|---|---|---|
| T-0066 | Design guidelines document | done |
| T-0067 | Changelog UX redesign — dedicated Activity sheet | done |
| T-0068 | Settings UX holistic rethink | done |
| T-0069 | Agent execution logs — per-patch hidden log in Activity sheet | done |
| T-0070 | E-0011 tier-2 validation — epic closure | ready |

## Feedback References
- F-20260304-001 (changelog unusable)
- F-20260304-002 (settings & UX rethink)
- F-20260304-003 (agent execution logs)
- F-20260304-004 (design guidelines)

## Design Principles (from user brief)
1. **Calm minimalism / AI-native productivity** — no clutter, no chrome, AI workspace feel
2. **Center-stage interaction** — chat is primary; all else is peripheral, reachable on demand
3. **Warm neutral palette** — off-white/parchment bg (#F5F3EA), single warm accent (#D25722), dark-grey (not pure black) text
4. **Editorial typography** — large welcoming headline, clean sans-serif body (Avenir Next already in place)
5. **Soft rounded components** — rounded cards, minimal separators, calm hover states
6. **Progressive disclosure** — secondary features (history, settings, logs) accessible but never in the way

## Validation Plan
- Tier 2 micro-validation after all four tickets are accepted (before closing the epic):
  - Probe 1: "Does this feel as polished and calm as a tool like Claude or Notion AI?"
  - Probe 2: "Does the Settings panel feel focused and easy to navigate?"
  - Probe 3: "Can you easily find the change history and understand what changed?"
- Results will be recorded in the closure ticket evidence section and in a dated PM checkpoint.

## Notes
- T-0067 (changelog) and T-0068 (settings) both depend on T-0066 (design guidelines) for their design decisions, so T-0066 is rank 1.
- T-0069 (agent logs) depends on T-0067 (Activity sheet) for its UI home; sequenced after.
- The design guidelines doc is also intended to act as a machine-readable design guardrail for the self-evolution pipeline (AI agents proposing UI changes should cite it).

## Change Log
- 2026-03-04: Epic created from user feedback F-20260304-001 through F-20260304-004.
- 2026-03-04: T-0066–T-0069 all done; T-0070 (tier-2 validation closure) added to ready queue. Epic DoD 4/5 complete; tier-2 validation (T-0070) remains.
