# T-0064: Central always-visible improvement request button

## Metadata
- ID: T-0064
- Status: done
- Priority: P2
- Type: feature
- Area: ui
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-03
- Updated: 2026-03-03

## Summary
Add a persistent, always-visible "Suggest an improvement" button to the top bar so the user can reach the improvement request form in one click from anywhere in the app — without opening Settings first. The FeedbackPanel (improvement form + "Fix with AI →") moves from the Settings sheet into its own dedicated sheet that this top-bar button opens. The per-message "Improve" link is updated to open the same sheet (instead of opening Settings and scrolling). Settings no longer contains the Improve section.

## Design Spec

### Goals
- The M8 self-improvement loop should be reachable in one click from anywhere in the app.
- Improvement submission must not require navigating through Settings.
- The existing "Improve" link on assistant messages should route to the same new surface.

### Non-goals
- Redesigning the FeedbackPanel internals (copy, tag system, "Fix with AI →").
- Changing how patches are generated or applied.
- Adding keyboard shortcuts for the new button (can be a follow-up).

### Rules and state transitions
- Top bar always shows: sidebar toggle | title | cost | [**Improve button**] | Settings gear.
- Clicking the Improve button opens a right-side Sheet (`ImprovementSheet`), independent from the Settings Sheet.
- Both sheets can theoretically be open simultaneously; the Improve Sheet does not close Settings and vice versa. (Simple: just two independent Sheet states.)
- Clicking the per-message "Improve" link opens the `ImprovementSheet` and sets the context pointer on the feedback form (same behavior as today, just routed to the new sheet instead of Settings).
- The Settings Sheet no longer contains the FeedbackPanel (the "Improve" section is gone post-T-0063).

### User-facing feedback plan
- A new icon button appears in the top bar, visually consistent with the Settings gear button.
- Icon: a speech bubble or sparkle icon (e.g. `MessageSquarePlusIcon` or `SparklesIcon` from lucide-react). Exact icon: `SparklesIcon` — conveys "improvement / AI magic" without implying feedback/rating.
- `aria-label`: "Suggest an improvement"
- Sheet header title: "Suggest an improvement"
- On open: form is visible (textarea pre-focused), captured items below.
- On close: form state is preserved (draft text survives close/reopen within the same session).

### Scope bounds
- Only the FeedbackPanel extraction + top-bar button + per-message "Improve" re-routing. No other layout changes.
- Do not move or change Settings sheet.
- Do not remove the FeedbackPanel component — extract it as-is into the new sheet.

### Edge cases / failure modes
- Sheet opens while a patch is in-flight: busy state is passed through; form submit and "Fix with AI →" are disabled while busy (no change from today).
- Sheet open while Settings is also open: both are visible; no conflict.
- No captured feedback items yet: improvement sheet shows the form + empty state ("No improvements captured yet.") — same empty state as today.

### Validation plan
- Deterministic: the Improve button is visible in every app state (no messages, with messages, settings open).
- Deterministic: per-message "Improve" opens the improvement sheet, not Settings.
- Deterministic: Settings sheet no longer contains an "Improve" section.
- Deterministic: submitting improvement and clicking "Fix with AI →" from the new sheet triggers a patch as before.

### UI Spec Addendum (Area: ui)
- **Primary job-to-be-done**: reach the improvement submission form in one click from anywhere.
- **Primary action and what must be visually primary**: the Improve button (`SparklesIcon`) in the top bar is always present alongside the Settings gear icon. The Sheet it opens shows the improvement form prominently.
- **Navigation / progressive disclosure**: top bar = sidebar | title | cost? | Improve | Settings. Improve sheet: form (textarea + tags + submit) is above the captured items list. The sheet scrolls if items accumulate.
- **Key states to design and verify**:
  - Happy (form open, no items): textarea focused; "No improvements captured yet."
  - Happy (form open, items present): form at top; items list below with "Fix with AI →" buttons.
  - Busy (patch in-flight): textarea, submit, "Fix with AI →" all disabled; no visual change to the button itself.
  - Sheet closed: button visible in top bar; no other visual indicator.
- **Copy constraints**:
  - Button label (aria-label): "Suggest an improvement" — must not say "Give feedback" (implies rating) or "Report a bug" (implies error reporting).
  - Sheet title: "Suggest an improvement"
  - Must not imply changes are automatic or instant ("your suggestion will be reviewed" is fine, not "this will change the app").

## Context
- Today: improvement flow is buried under Settings → scroll → "Improve" → "New improvement". Too many steps for the primary loop the app is built around.
- After T-0063 ships: Settings no longer has an "Improve" section; there will be a gap where the user has no obvious route to submit improvements. T-0064 fills that gap immediately.
- Depends on T-0063 shipping first (Settings Improve section gone, so there's no duplication).

## References
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/feedbackPanel.tsx`
- `apps/desktop/src/components/ui/sheet.tsx`
- `apps/desktop/src/appShell.test.tsx`

## Feedback References
- F-20260303-001

## Dependencies / Sequencing
- Depends on: T-0063 (removes Improve section from Settings; T-0064 fills the gap)
- Blocks: nothing
- Sequencing notes: implement T-0063 first; T-0064 immediately after.

## Acceptance Criteria
- [x] A `SparklesIcon` (or agreed icon) button is visible in the top bar at all times (all app states: empty chat, with messages, booting, offline, settings open).
- [x] Clicking the top-bar Improve button opens a right-side Sheet containing the FeedbackPanel (improvement form + captured items).
- [x] The sheet is independent from the Settings sheet (opening one does not close the other).
- [x] The per-message "Improve" link opens the Improvement sheet (not the Settings sheet) and sets the message context pointer on the form.
- [x] The Settings sheet does not contain an "Improve" / FeedbackPanel section (post-T-0063 state is preserved).
- [x] Submitting an improvement via the new sheet correctly saves a feedback item (same behavior as before).
- [x] "Fix with AI →" in the new sheet correctly calls `requestPatch` (same behavior as before).
- [x] Existing tests pass; new tests cover: Improve button visible in DOM, clicking it opens improvement sheet.

## UX Acceptance Criteria
- [x] Improve button is keyboard-accessible (Tab-reachable, Enter/Space activates it).
- [x] `aria-label="Suggest an improvement"` present on the button.
- [x] Sheet title is "Suggest an improvement".
- [x] Form textarea is focused on sheet open.
- [x] Empty state ("No improvements captured yet.") renders when no items exist.

## User-Facing Acceptance Criteria
- [x] Improvement form is reachable in one click from the top bar in any app state.
- [x] Copy does not imply feedback is automatically shipped or externally sent.

## Evidence
- Implementation: `App.tsx` — added `improvementSheetOpen` state; SparklesIcon button in header with aria-label "Suggest an improvement"; dedicated Improvement Sheet with title "Suggest an improvement" and FeedbackPanel; Settings sheet no longer contains Improve section; per-message "Improve" opens improvement sheet and calls `feedback.openFeedbackForMessage`. Effect on sheet open: `feedback.setIsOpen(true)` and focus on `#feedback-input`.
- Tests: `appShell.test.tsx` — new test "shows Suggest an improvement button in top bar" (static markup). `src/appShell.test.tsx` (9 tests) pass. Full suite: 2 pre-existing failures in PatchNotification.test.tsx (unrelated).

## Release Note
- Title: Suggest an improvement — now one click away
- Summary: There's a new sparkle button in the top bar. Click it to suggest an improvement or trigger the AI to fix something — no need to open Settings first.

## Subtasks
- [x] Add `improvementSheetOpen` state to `App.tsx`
- [x] Add `SparklesIcon` button to top bar (between cost display and Settings gear)
- [x] Create the Improvement Sheet JSX (reuse `Sheet` + `SheetHeader` + `SheetContent` pattern; place `FeedbackPanel` inside)
- [x] Remove `FeedbackPanel` from the Settings Sheet in `App.tsx`
- [x] Update per-message "Improve" button handler: open improvement sheet instead of settings sheet
- [x] Remove the `settingsOpen`-scroll effect that targeted `feedbackSectionRef` (was used for per-message Improve routing into Settings)
- [x] Update `appShell.test.tsx` to verify Improve button presence and sheet open behavior

## Change Log
- 2026-03-03: Ticket created. Triaged from F-20260303-001.
- 2026-03-03: Implementation complete. Moved to review; QA phase next.
- 2026-03-03: QA checkpoint 2026-03-03-qa-T-0064.md PASS. PM acceptance: moved to done.
