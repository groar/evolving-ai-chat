# T-0024: Settings controls not understandable to a fresh observer (stable/experiments/proposals)

## Metadata
- ID: T-0024
- Status: ready
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0003
- Owner: ai-agent
- Created: 2026-02-28
- Updated: 2026-02-28

## Summary
Fresh-observer micro-validation indicates that the Settings surface (including “Switch to Stable”, “Reset Experiments”, and the changelog/proposals concepts) is not self-explanatory (“No idea”, “super crowded”, “what is a proposal/experiment?”). This blocks trust in the safety/rollback promise and prevents the intended validation loop from completing.

## Design Spec (Required When Behavior Is Ambiguous)
- Goals:
  - A fresh observer can correctly explain what “Switch to Stable” does and does not do (no data-loss implication).
  - A fresh observer can correctly explain what “Reset Experiments” does and does not do (no conversation/history deletion implication).
  - The Settings/Changelog/Proposals surfaces feel scannable rather than “super crowded”.
  - The user can answer “what is a proposal?” from the UI itself (short definition or contextual help).
- Non-goals:
  - Full visual redesign or a new design system.
  - Removing proposals/experiments as concepts (instead: clarify and progressively disclose).
- Rules and state transitions:
  - Canonicalization: there must be exactly one place to change release channel (no duplicated “stable” controls).
  - Concepts must be defined in-place (one line) the first time they appear, or behind a lightweight “What’s this?” affordance.
  - Advanced concepts (proposals/experiments) should not be visually peer-level with the primary chat flow.
- User-facing feedback plan:
  - Rerun the E-0002 probes after shipping this ticket; record verbatim answers and interpretation.
- Scope bounds:
  - Copy + small layout adjustments + progressive disclosure; no backend changes required.
- Edge cases / failure modes:
  - Runtime offline: the UI must still correctly communicate what is safe/available and not overload the user with jargon.
- Validation plan:
  - Deterministic: add/adjust UI tests to assert:
    - only one release channel control exists,
    - “Switch to Stable” and “Reset Experiments” helper copy includes “does not delete conversations/history” constraint.
  - Micro-validation: rerun the 3 E-0002 probes and record results.

## Proposed UX (Recommended)
This ticket’s job is to make the *default* Settings experience readable to a brand-new user, without removing the underlying mechanisms.

### Option A (Recommended): Reframe + regroup, keep everything in Settings
**1) Rename and regroup into “intent-based” sections (reduces concept overload).**
- Replace `Changelog + Experiments` with **Updates & Safety** (plain language).
- Keep **Recent Changes** (changelog) inside that same Updates & Safety section as a read-only, scannable list.
- Move anything that sounds technical or developer-y (diagnostics, proposals lifecycle tooling) behind **Advanced** disclosure.

**2) Make “channel” the single canonical control; remove duplicate “stable” actions.**
- Use exactly one control for channel selection (segmented control or select):
  - `Stable (recommended)`
  - `Beta (early access)` (maps to `experimental`)
- Remove/avoid an additional “Switch to Stable” button if the channel control already provides that action.

**3) Replace “Experiments” language with “Early-access features” (and define it).**
- Rename any “Experiments” labels to **Early-access features**.
- Helper copy (adjacent, always visible when the section is visible):
  - “Optional beta features. Turning these on/off only changes feature behavior.”
  - “Does not delete conversations or history.”
- Put early-access toggles behind progressive disclosure:
  - Only show the toggles when channel is `Beta`, and/or
  - Show the section collapsed by default with a clear “Advanced” label.

**4) Replace “Proposals” surface framing with “Improvements (advanced)” and define it.**
- Rename section title from `Proposals` to **Improvements (advanced)** (or **Change drafts (advanced)**).
- Add a 1-line definition at point of need:
  - “A change draft is a suggested improvement you review locally. Nothing ships automatically.”
- Add a compact, readable “how it works” stepper line:
  - “Feedback → Draft → Run checks → Decide”
- Hide the full create/validate/accept/reject form behind a primary “Draft an improvement” button, so the first scan doesn’t look like a crowded console.

**5) Replace jargon with user language (glossary mapping).**
- `experiment` → “early-access feature”
- `proposal` → “change draft” / “improvement draft”
- `validation` → “checks”
- `runtime` → avoid in default copy; use “local service” only in Advanced details

**6) Action microcopy and confirmations must directly answer the probe prompts.**
- For channel selection helper copy:
  - “Switching channels does not delete conversations/history.”
  - “This is feature-toggle preference only (not a rollback of code).”
- For reset helper copy:
  - “Resets early-access feature toggles to defaults.”
  - “Does not delete conversations/history.”

### Option B (Bigger change): Move “Improvements” out of Settings into its own surface
If Settings remains crowded after Option A, create a dedicated left-rail surface (for example **Improve**) that contains:
- Feedback capture history
- Change drafts (proposals) lifecycle (draft/check/decide)
- Recent changes

Tradeoff: clearer mental model and less Settings clutter, but requires more IA and navigation changes than this ticket’s intended “small layout + copy” scope.

### UI Spec Addendum (Required If `Area: ui`)
- Primary job-to-be-done:
  - Help a first-time user understand safety/rollback controls and the self-improvement loop without prior context.
- Primary action and what must be visually primary:
  - Conversations + chat composer are primary; Settings is discoverable but does not feel like a “control panel first”.
- Navigation / progressive disclosure notes (what is secondary, and where it lives):
  - Early-access features and improvements tooling live behind clear progressive disclosure (Advanced or “Learn more”).
- Key states to design and verify (happy, empty, error/offline):
  - Runtime offline state, Settings open with runtime-backed surfaces unavailable, first-time viewing of Proposals/Changelog.
- Copy constraints (what must not be implied):
  - No implication that switching channels or resetting experiments deletes data or rolls back code.
  - Avoid jargon without definition (“proposal”, “experiment”, “runtime”) in default view; prefer user-language labels.

## Context
E-0002’s tier-2 probes (fresh observer) produced “No idea” answers for both controls and a strong confusion signal for “proposal/experiment” concepts, indicating the UX still reads as a crowded, technical console rather than a safe, comprehensible chat product.

## References
- Probe results: `tickets/status/done/T-0018-rerun-e0002-micro-validation-probes.md`
- Feedback: `tickets/meta/feedback/inbox/F-20260228-003-e0002-probe-failed-runtime-offline-and-settings-confusion.md`
- Epic: `tickets/meta/epics/E-0003-m2-desktop-ux-clarity-and-hierarchy.md`

## Feedback References (Optional)
- F-20260228-003

## Acceptance Criteria
- [ ] Release channel selection is a single canonical control (no separate “Switch to Stable” action that duplicates the same intent).
- [ ] Channel helper copy explicitly states what it does *and* what it does not do (including: “does not delete conversations/history” and “does not roll back code”).
- [ ] “Reset Experiments” (or renamed equivalent) helper copy explicitly states it resets only early-access toggles and **does not delete conversations/history**.
- [ ] Default Settings scan is not “super crowded” because advanced concepts are behind progressive disclosure (collapsed Advanced section or separate surface).
- [ ] The UI defines “early-access feature” and “change draft/proposal” in user terms at point of need (1 line each or equivalent “What’s this?”).
- [ ] “proposal/experiment” jargon is avoided in default copy, or defined inline if present.
- [ ] Regression coverage exists for the above rules.

## Micro-Validation Probes (Optional; Tier 2/3)
- Probes (answer in 1-2 sentences each):
  - In Settings, what do you think "Switch to Stable" does? What do you think it does not do?
  - What do you think "Reset Experiments" does? Would you expect it to affect your conversations/data?
  - After using the changelog once, do you feel you can understand "what changed + why" in under 10 seconds?
- Timing:
  - After the copy + progressive disclosure changes are shipped.
- Where results will be recorded:
  - Ticket Evidence section OR a dated PM checkpoint file in `tickets/meta/feedback/`.

## Subtasks
- [ ] Design/copy pass for Settings/Changelog/Proposals concepts
- [ ] Implement small UI adjustments (progressive disclosure)
- [ ] Add/adjust tests
- [ ] Rerun E-0002 probes and record results

## Change Log
- 2026-02-28: Ticket created from E-0002 micro-validation probe results (T-0018).
