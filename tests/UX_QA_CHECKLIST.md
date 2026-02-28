# UX/UI Design QA Checklist (Heuristic)

Use this checklist during QA runs when `Area: ui`.

Goal: catch "UI horror" early via expert-style heuristic evaluation (not external playtesting).

## How To Use
- Mark each category as PASS/WARN/FAIL with 1-3 bullets of evidence.
- If you mark FAIL:
  - If it violates the ticket acceptance criteria or breaks a core flow, create a bug ticket (severity S1/S2 as appropriate).
  - Otherwise create a scoped follow-up ticket (usually `Type: feature`, `Area: ui`) and link it from the QA report.

## Checklist
### 1) Mental Model and Framing
- [ ] The UI answers within 10 seconds:
  - what this is
  - what I can do
  - what I should do next
- [ ] The default surface reflects the primary job-to-be-done (not admin/dev surfaces).

### 2) Hierarchy and Focus
- [ ] One primary action is visually and structurally primary.
- [ ] Secondary actions are visibly secondary (not competing as peers).
- [ ] The screen avoids "everything is a card" syndrome (over-framed sections with equal emphasis).

### 3) Information Architecture and Navigation
- [ ] Primary navigation is obvious and stable.
- [ ] Advanced/dev features use progressive disclosure (moved behind Settings/Advanced rather than always visible).
- [ ] No duplicated control surfaces for the same concept (single source of truth for toggles/modes).

### 4) States and Error Handling
- [ ] Empty states provide a single clear next action.
- [ ] Error states are:
  - scoped (only claims what actually failed)
  - actionable (user knows what to do next)
  - non-alarming unless genuinely catastrophic
- [ ] Global status messaging is consolidated (no repeated banners/errors for the same root condition).

### 5) Copy and Terminology
- [ ] Labels prefer user intent/value over implementation detail.
- [ ] If technical terms appear, they have immediate context (tooltip/help text or one-line explanation).
- [ ] No duplicated instructions (for example the same guidance in empty state + placeholder + helper text).
- [ ] Copy does not imply unsupported behaviors ("promise control").

### 6) Affordances and Interaction
- [ ] Controls look interactive and are sized appropriately.
- [ ] Destructive actions are clearly labeled and confirm intent where needed.
- [ ] Keyboard-first usage works for the primary flow (tab order, enter-to-send, focus visibility).

### 7) Visual Accessibility Basics
- [ ] Text contrast is sufficient for comfortable scanning.
- [ ] Headings, body text, and helper text have consistent hierarchy.
- [ ] Spacing and alignment do most of the grouping work (not only borders).

### 8) Responsive / Window Size Sanity (Desktop)
- [ ] Narrow window still works (left rail scroll/collapse/tabs, no clipped CTAs).
- [ ] Wide window does not create "empty desert" without purpose (content density feels intentional).

## Evidence Expectations (For QA Reports)
- Include at least 1 screenshot (or detailed notes if screenshots are not feasible).
- Prefer capturing:
  - primary happy path view
  - key empty state
  - key error state (runtime offline, permission denied, etc.) if applicable

