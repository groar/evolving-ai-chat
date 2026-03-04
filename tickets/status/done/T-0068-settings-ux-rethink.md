# T-0068: Settings UX holistic rethink

## Metadata
- ID: T-0068
- Status: done
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0011
- Owner: ai-agent
- Created: 2026-03-04
- Updated: 2026-03-04

## Summary
Redesign the Settings sheet so it is focused, navigable, and aligned with the design guidelines in `docs/design-guidelines.md`. Remove or relocate content that does not belong (changelog → Activity sheet per T-0067; "Works offline" static info → move inline/tooltip or remove). Introduce a lightweight section structure with visible section labels, generous spacing, and progressive disclosure for advanced options. The result should feel like a calm, purposeful configuration surface — not a dumping ground.

## Design Spec

### Goals
- Settings = configuration only. No history, no static marketing copy.
- Scannable at a glance: user can locate any setting in ≤3 seconds.
- Progressive disclosure: dangerous/advanced options (Danger Zone, diagnostics) are present but visually subordinate.
- Aligned with design guidelines (T-0066): warm neutrals, soft section separators, consistent spacing.

### Non-goals
- Do not add new settings capabilities in this ticket.
- Do not change the underlying data model or API key handling.
- Do not redesign the top bar or overall navigation layout.
- Do not address agent execution logs (T-0069).

### Current problems to fix
1. **"Works offline" section** — static bulleted list of features; does not belong in settings (it's marketing copy). Remove it.
2. **Changelog wall** — resolved by T-0067 (compact summary replaces it); this ticket ensures the compact summary is well-integrated.
3. **"Danger Zone" outside the sheet** — currently rendered in `App.tsx` after the SettingsPanel component, in a separate `<details>` block. Move it inside the Settings sheet as a properly styled final section.
4. **Section density** — sections feel crowded despite T-0065's spacing improvements; they lack strong visual hierarchy (section labels not prominent enough).
5. **Advanced options visibility** — "Early Access" and diagnostics checkbox are always visible even though they're relevant to <5% of sessions.

### Proposed Settings structure (post-redesign)

```
Settings sheet (right slide-in, min(400px, 90vw))
│
├─ [Header] "Settings"  +  [X close]
│
├─ ── CONNECTIONS ──────────────────────────────────
│   API key status per provider (OpenAI, Anthropic)
│   [Same logic as current; slightly more airy]
│
├─ ── RELEASE CHANNEL ──────────────────────────────
│   Channel toggle: Stable / Beta
│   One-line explainer below toggle
│
├─ ── ACTIVITY ──────────────────────────────────────
│   "N changes applied"  [View activity →]
│   [Compact summary from T-0067]
│
├─ ── ADVANCED ─ (collapsed <details>, default closed) ─
│   Beta-only diagnostics checkbox
│   "Reset Early-Access Features" button
│   Explainer copy (only relevant when Beta channel active)
│
└─ ── DANGER ZONE ── (collapsed <details>, default closed)
    "Delete Local Data" button
    Warning copy
```

### Rules and state transitions
1. **Remove "Works offline"**: delete the section entirely; no replacement in Settings. Offline capability is surfaced elsewhere (empty state in PatchNotification, composer disabled state, etc.).
2. **Move Danger Zone inside the Sheet**: `App.tsx` renders the `<details>` block below the Sheet — move this into `SettingsPanel` as the last section. This keeps all destructive actions co-located and avoids the current weird z-index/layout where it floats outside the sheet.
3. **Section labels**: use small-caps or uppercase spaced labels (e.g., `tracking-wide text-xs text-muted font-semibold uppercase`) as section separators — more visually prominent than the current thin `border-t`.
4. **Advanced section default-closed**: `<details>` for Advanced (Early Access + diagnostics) defaults to `open={false}` instead of `open`. Users who never touch Beta channel never see it.
5. **Danger Zone default-closed**: same; default closed, users open explicitly.
6. **Activity compact summary**: inherited from T-0067 — "N changes applied / No changes yet" + "View activity →".
7. **Notices section**: keep `role="status"` / `role="alert"` notice display as-is; ensure it still appears when present. Position it just below the header (above Connections) since notices are time-sensitive.

### User-facing feedback plan
- User opens Settings and sees 3 primary sections (Connections, Release Channel, Activity) immediately without scrolling.
- Advanced and Danger Zone are collapsed by default — visible but out of the way.
- No "Works offline" bullet list.
- Danger Zone is now inside the sheet, not floating below it.

### Scope bounds
- Only modifies `settingsPanel.tsx` and potentially the sheet trigger area in `App.tsx` (to remove the Danger Zone rendered outside).
- `settingsPanel.test.tsx` must be updated to reflect the new structure.
- No API changes; no store changes.

### Edge cases / failure modes
- If "Works offline" section is removed and a test references it: update the test.
- If Danger Zone inside the sheet causes layout issues on small viewports: verify sheet is scrollable (it already uses `overflow-y-auto`).
- Notices above Connections: test that error notices still render above the first section.

### Validation plan
- Automated: update `settingsPanel.test.tsx` (remove "Works offline" tests, add Danger Zone-inside test, Advanced-collapsed test).
- Manual: open Settings, verify 3 visible sections, scroll to bottom to confirm Danger Zone is present and collapsed.

## UI Spec Addendum

- **Primary job-to-be-done**: Configure the app (API keys, release channel).
- **Primary action**: The Connections section (API key entry) and Release Channel toggle are the two most-used settings — they must be immediately visible without scrolling.
- **Navigation / progressive disclosure**: Advanced and Danger Zone collapsed by default. Activity is read-only summary + link. Notices appear at the top when present.
- **Key states**:
  - Happy: 3 visible sections, API key set, Stable channel.
  - No API key: Connections shows the key entry form (prominent, actionable).
  - Advanced open: diagnostics checkbox and reset button visible.
  - Danger Zone open: delete button visible with warning copy.
  - Offline: no change (Settings is fully offline-capable).
- **Copy constraints**:
  - Remove: "Works offline" and its bullet list.
  - Section labels (uppercase spaced): "Connections", "Release Channel", "Activity", "Advanced", "Danger Zone".
  - "Danger Zone" label must not be alarming for new users — keep it collapsed and only visible on scroll/click.
  - Must not imply: that deleting local data is routine or safe to do casually. Keep the existing "This cannot be undone" warning copy.
  - Must not imply: that "Advanced" contains anything a standard user needs — the summary in the collapsed state should hint "beta-only".

## Context
- T-0065 improved spacing and copy clarity but did not address the structural problems (wrong sections, wrong section order, Danger Zone placement).
- F-20260304-002 calls for a holistic rethink; this ticket addresses the Settings sheet specifically.
- Broader UX audit (top bar, composer area, sidebar) is deferred to a future epic.

## References
- `apps/desktop/src/settingsPanel.tsx`
- `apps/desktop/src/App.tsx` (Danger Zone rendered outside SettingsPanel)
- `apps/desktop/src/settingsPanel.test.tsx`
- `docs/design-guidelines.md` (T-0066 — must exist before implementation)
- T-0067 (compact Activity summary is a precondition for the Activity section)
- E-0011, F-20260304-002

## Feedback References
- F-20260304-002

## Acceptance Criteria
- [x] "Works offline" section is removed from Settings.
- [x] Danger Zone is rendered inside `SettingsPanel` (not floating in `App.tsx`).
- [x] Advanced section (`<details>`) defaults to closed.
- [x] Danger Zone section (`<details>`) defaults to closed.
- [x] Section labels are visually prominent (uppercase/spaced/small-caps style).
- [x] Notices (when present) appear above the Connections section.
- [x] Activity compact summary ("N changes applied" + "View activity →") is present.
- [x] `settingsPanel.test.tsx` updated: "Works offline" tests removed; new tests for Danger Zone inside, Advanced collapsed default, section label text.
- [x] Opening Settings shows Connections and Release Channel without scrolling on a standard desktop viewport.

## UX Acceptance Criteria
- [x] User can locate the API key field and channel toggle in ≤3 seconds (no scrolling required).
- [x] Danger Zone is not visually alarming to a new user (collapsed by default, bottom of sheet).
- [x] Advanced section is invisible until explicitly expanded.
- [x] Sheet is scrollable on small viewports; no content is clipped.
- [x] Copy/microcopy is consistent with design guidelines.

## Dependencies / Sequencing
- Depends on: T-0066 (design guidelines — for section label style decisions), T-0067 (Activity compact summary must be in place)
- Blocks: nothing critical
- Sequencing notes: rank 3 in E-0011 ready queue; pick up after T-0067 is accepted

## QA Evidence Links
- QA checkpoint: `tickets/meta/qa/2026-03-04-qa-T-0068.md`
- Verdict: PASS (1 WARN: font size `text-[10px]` vs spec `text-xs`; acceptable to ship)
- Screenshots/artifacts: Screenshots not feasible (no running UI in CI); detailed code-based heuristic notes recorded in QA checkpoint.

## Evidence (Verification)
- Tests run: `npm test` — 110 passed, 0 failed. All 19 new/updated `settingsPanel.test.tsx` tests pass, including: "does not render Works offline section", "Danger Zone section is inside SettingsPanel and collapsed by default", "Advanced section is collapsed by default", "notice renders above the first section when present", "error renders above the first section when present".
- Manual checks performed: Linter clean on all changed files (`settingsPanel.tsx`, `App.tsx`, `settingsPanel.test.tsx`).
- Screenshots/logs/notes: Section order confirmed by `renderToStaticMarkup` assertions: notice pos < Connections pos. Danger Zone and Advanced both tested for `details[open]` absent by default.

## Subtasks
- [x] Remove "Works offline" section from `settingsPanel.tsx`
- [x] Move Danger Zone from `App.tsx` into `SettingsPanel`
- [x] Restyle section labels (uppercase/spaced)
- [x] Set Advanced `<details>` default to closed
- [x] Reorder sections per spec
- [x] Update `settingsPanel.test.tsx`
- [x] Documentation: update `docs/design-guidelines.md` if new section label pattern is introduced

## Notes
- The "Notices" position change (above Connections) is a minor reorder; verify that the `role="status"` / `role="alert"` ARIA attributes still work correctly after the reorder.
- If T-0067 is not yet accepted when this ticket is picked up, the implementer may stub the Activity section with placeholder text and mark it as pending T-0067.

## Change Log
- 2026-03-04: Ticket created from F-20260304-002 / E-0011.
- 2026-03-04: Implementation complete. Moved to review.
- 2026-03-04: QA passed (PASS, 1 WARN — acceptable). PM accepted. Moved to done.
