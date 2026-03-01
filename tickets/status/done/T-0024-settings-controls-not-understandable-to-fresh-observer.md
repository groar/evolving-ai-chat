# T-0024: Settings controls not understandable to a fresh observer (stable/experiments/proposals)

## Metadata
- ID: T-0024
- Status: done
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0003
- Owner: ai-agent
- Created: 2026-02-28
- Updated: 2026-03-01

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
- [x] Release channel selection is a single canonical control (no separate “Switch to Stable” action that duplicates the same intent).
- [x] Channel helper copy explicitly states what it does *and* what it does not do (including: “does not delete conversations/history” and “does not roll back code”).
- [x] “Reset Experiments” (or renamed equivalent) helper copy explicitly states it resets only early-access toggles and **does not delete conversations/history**.
- [x] Default Settings scan is not “super crowded” because advanced concepts are behind progressive disclosure (collapsed Advanced section or separate surface).
- [x] The UI defines “early-access feature” and “change draft/proposal” in user terms at point of need (1 line each or equivalent “What’s this?”).
- [x] “proposal/experiment” jargon is avoided in default copy, or defined inline if present.
- [x] Regression coverage exists for the above rules.

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
- [x] Design/copy pass for Settings/Changelog/Proposals concepts
- [x] Implement small UI adjustments (progressive disclosure)
- [x] Add/adjust tests
- [x] Run fresh-observer comprehension probes and record results (2026-03-01)
- [x] Rerun E-0002 probes and record results

## Evidence
- Automated checks:
  - `npm --prefix apps/desktop test` (PASS)
  - `npm --prefix apps/desktop run build` (PASS)
  - `npm --prefix apps/desktop run smoke:fastapi` (PASS)
    - Artifact: `tickets/meta/qa/artifacts/runtime-smoke/2026-02-28T20-36-20-072Z/smoke-fastapi.log`
- Implementation notes:
  - Reframed Settings copy to “Updates & Safety” language and removed duplicate stable action so release channel is controlled in one canonical location.
  - Added explicit guardrail copy that channel switching and early-access resets do not delete conversations/history and do not roll back code.
  - Moved early-access toggles and change-draft tooling behind progressive disclosure, with in-place definitions for “early-access feature” and “change draft”.
  - Added regression assertions in `apps/desktop/src/settingsPanel.test.tsx` for canonical channel control, progressive disclosure labels, and safety copy.
- QA notes:
  - QA checkpoint: `tickets/meta/qa/2026-02-28-qa-checkpoint-t0024.md` (PASS, no bugs filed).
- Micro-validation (fresh observer, mac 14", no hints) — 2026-03-01:
  - Probe 1 (verbatim):
    - "This app is a local AI chat I think. I would try it by sending messages, and would expect the aI to answer, much like chatgpt"
  - Probe 2 (verbatim):
    - "When it is offline, I can't use the chat, which means the AI runs online. I can still access settings and things like that. I would press retry to access the app, since the chat is the main thing to do."
  - Probe 3 (verbatim):
    - "Yes I can find the settings, they are easily found, but just a bit weird they are under \"conversations\".. No idea what is safe or not offline. I imagine it's going to choose between an experimental or stable version of the chat app. This whole panel is a bit mysteriously worded and a bit obscure to me.. It says conversations are not lost. I guess resetting would remove access to all experimental features?"
  - Interpretation:
    - Probe 1: PASS (correct mental model: local AI chat; primary action: send message).
    - Probe 2: PARTIAL (banner is actionable, but implies "AI runs online" when offline; offline/safe-usage remains unclear).
    - Probe 3: PARTIAL/FAIL (Settings found, but "safe offline" not understood; copy reads as jargon-heavy/wordy and hard to scan).
- T-0022 rerun (2026-03-01, post-T-0025): All 3 probes PASS; observer answers offline-safety and Settings correctly. T-0025 addressed Probe 2/3 gaps; combined flow validated.

## Change Log
- 2026-02-28: Ticket created from E-0002 micro-validation probe results (T-0018).
- 2026-02-28: Implemented copy/hierarchy update in Settings to clarify channel/reset safety, renamed jargon to user-facing language, and collapsed advanced surfaces behind progressive disclosure.
- 2026-02-28: Updated settings regression coverage in `apps/desktop/src/settingsPanel.test.tsx`; all desktop unit tests passing via `npm --prefix apps/desktop test`.
- 2026-02-28: Moved ticket to `review/` and completed QA checkpoint with passing automated checks and UX heuristic pass (`tickets/meta/qa/2026-02-28-qa-checkpoint-t0024.md`).
- 2026-03-01: T-0022 probe rerun (post-T-0025) passed; PM accepted to done.
