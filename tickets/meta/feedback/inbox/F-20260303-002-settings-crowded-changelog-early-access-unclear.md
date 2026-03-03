# F-20260303-002: Settings panel crowded; Changelog and Early Access/Updates unclear

## Metadata
- ID: F-20260303-002
- Status: ticketed
- Source: user-feedback
- Theme: ux, clarity
- Severity: S2
- Linked Tickets: T-0065
- Received: 2026-03-03
- Updated: 2026-03-03

## Raw Feedback (Sanitized)
- "The settings panel is still too crowded."
- "The Changelog section is very hard to understand, and very crowded."
- "Not sure I understand early access & the 'updates' section."

## Normalized Summary
Settings panel has excessive visual density; the Changelog section is hard to parse and feels crowded; the relationship between "Updates" (channel) and "Early Access" (beta toggles) is unclear to the user.

## PM Notes
- Follow-up to prior settings improvements (T-0025, T-0034, T-0063). User explicitly says "still" crowded — layout/sectioning and information hierarchy need another pass.
- Changelog currently mixes (1) applied code patches (M8) with Undo/diff and (2) runtime changelog entries (flags, channel) in one block with similar card styling; labels like "Beta" vs "Stable" and ticket/proposal IDs may not convey meaning to a non-technical user.
- "Updates" is the channel selector (Stable vs Beta); "Early Access" is a collapsible subsection with beta toggles. The copy does not clearly explain that "Updates" = "which version of the app you get" and "Early Access" = "optional beta features when on Beta channel."

## Triage Decision
- Decision: ticketed
- Rationale: Actionable UX improvements; single ticket scoped to Settings panel layout, Changelog clarity, and Updates/Early Access copy and structure.
- Linked: T-0065
- Revisit Trigger: After T-0065 implementation and QA; consider micro-validation if comprehension remains a risk.
