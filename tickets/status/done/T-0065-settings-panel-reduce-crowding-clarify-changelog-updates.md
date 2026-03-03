# T-0065: Settings panel — reduce crowding, clarify Changelog and Updates/Early Access

## Metadata
- ID: T-0065
- Status: done
- Priority: P2
- Type: feature
- Area: ui
- Epic: none
- Owner: ai-agent
- Created: 2026-03-03
- Updated: 2026-03-03

## Summary
User feedback (F-20260303-002): the Settings panel still feels too crowded; the Changelog section is hard to understand and crowded; the relationship between "Updates" and "Early Access" is unclear. This ticket reduces visual density, clarifies the Changelog (structure and copy), and makes Updates vs Early Access understandable at a glance.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - Reduce perceived crowding in the Settings panel (spacing, sectioning, progressive disclosure where appropriate).
  - Make the Changelog section easier to scan and understand (clear separation of "applied code changes" vs "release/version history" if both exist; clearer labels; less dense cards).
  - Clarify what "Updates" and "Early Access" mean: Updates = which update channel (Stable vs Beta); Early Access = optional beta toggles when on Beta.
- Non-goals:
  - Changing runtime or backend behavior for channel/flags.
  - Removing Changelog or Early Access; only reorganize and reword.
- Rules and state transitions:
  - All existing behavior preserved (channel switch, flag toggles, changelog entries, patch Undo).
  - Copy must not imply data loss or that switching channel rolls back code (constraints from T-0024/T-0025).
- User-facing feedback plan:
  - User can answer "what do Updates and Early Access do?" from the UI without guessing.
  - Changelog is scannable (user can tell "what changed" at a glance).
- Scope bounds:
  - Layout, section order, copy, and optional collapsible/accordion for Changelog or Early Access only; no new features.
- Edge cases / failure modes:
  - Offline: existing inline messaging preserved; no new implied promises.
  - Empty changelog: existing empty state preserved or simplified.
- Validation plan:
  - Deterministic: UI tests for key headings/copy and accessibility of sections.
  - Optional: one micro-probe ("What do Updates and Early Access mean here?") after implementation.

### UI Spec Addendum (Required If `Area: ui`)
- Primary job-to-be-done: Configure connections, update channel, and optional beta features without confusion; see what changed (changelog) at a glance.
- Primary action and what must be visually primary: Connections and "Updates" (channel choice) are the main decisions; Changelog and Early Access are secondary but clearly labeled.
- Navigation / progressive disclosure notes:
  - Consider: Changelog as a collapsible block (default open) or two sub-sections ("Applied code changes" vs "Release notes") with clearer headings.
  - Early Access can remain in a `<details>` block; ensure the summary line explains "Optional beta features (only when on Beta channel)" or equivalent.
  - "Updates" section: add one short line above the channel buttons, e.g. "Choose which version of the app you get. Stable = recommended; Beta = early access to new features."
- Key states to design and verify: Happy (all sections readable, not cramped); empty changelog; offline (unchanged from current).
- Copy constraints:
  - Must not imply that switching to Stable removes features permanently or deletes data.
  - "Early access" must be tied to "Beta channel" so the relationship is explicit.

## Context
- Builds on T-0025 (offline safety, simplify copy), T-0034 (Settings as sheet, Danger Zone), T-0063 (legacy cleanup). User explicitly reported ongoing crowding and confusion.

## References
- `apps/desktop/src/settingsPanel.tsx`
- F-20260303-002
- T-0025, T-0034, T-0024

## Feedback References
- F-20260303-002

## Acceptance Criteria
- [x] Settings panel has reduced visual density (e.g. spacing between sections, less cramped cards in Changelog).
- [x] Changelog section is easier to understand: clearer headings and/or separation between applied patches and other changelog entries; copy/labels understandable to a non-technical user.
- [x] "Updates" is clearly explained (e.g. one line: which version of the app you get; Stable vs Beta).
- [x] "Early Access" is clearly tied to Beta channel (e.g. summary line states it applies when on Beta; no implied data loss).
- [x] All existing behavior preserved (channel toggle, flag toggles, patch Undo, Connections, Danger Zone).

## UX Acceptance Criteria (Only If `Area: ui`)
- [x] Primary flow is keyboard-usable (no mouse required for core actions).
- [x] Empty/error states are clear and actionable.
- [x] Copy/microcopy is consistent and unambiguous.
- [x] Layout works at common breakpoints (desktop; mobile if Settings is used there).

## Dependencies / Sequencing
- None. Ready after PM triage.

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: `tickets/meta/qa/2026-03-03-qa-T-0065.md` (PASS).
- Screenshots/artifacts: (design/code review; screenshots not captured)

## Evidence (Verification)
- Tests run: `npm test -- --run settingsPanel` — 12 tests passed (including new test "explains Updates and Early Access clearly (T-0065)").
- Manual checks performed: Section spacing (gap-6, border-t pt-5), Updates copy, Early Access summary and body copy, Changelog as collapsible with "Applied code changes" / "What's new" sub-headings, empty state "No changes yet."
- Screenshots/logs/notes: Implementation in `apps/desktop/src/settingsPanel.tsx`; test in `settingsPanel.test.tsx`.
- Doc review (for docs-only changes): N/A.

## Subtasks
- [x] Design/layout and copy pass
- [x] Implementation
- [x] Tests
- [x] Documentation updates (if copy changes)

## Notes
- Implementation may use smaller typography or collapsible sections only where it reduces crowding without hiding critical actions.
- Changelog: consider "Applied code changes" (patches) vs "What's new" (runtime changelog) as two sub-headings if both are present.

## Change Log
- 2026-03-03: Ticket created from F-20260303-002.
- 2026-03-03: Implementation complete. Reduced crowding (gap-6, section borders, Changelog/patches card padding); clarified Updates copy and Early Access tied to Beta; Changelog collapsible with "Applied code changes" / "What's new" sub-headings; tests updated and added. Moved to review.
- 2026-03-03: QA checkpoint PASS (2026-03-03-qa-T-0065.md). PM acceptance: acceptance criteria and UX checklist satisfied; moved to done.
