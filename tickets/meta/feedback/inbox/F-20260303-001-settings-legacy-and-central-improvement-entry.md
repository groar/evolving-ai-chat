# F-20260303-001: Settings panel crowded with legacy items; no central improvement entry point

## Metadata
- ID: F-20260303-001
- Status: ticketed
- Source: user-playtest (primary sponsor)
- Theme: ux, cleanup
- Severity: S2
- Linked Tickets: T-0063, T-0064
- Received: 2026-03-03
- Updated: 2026-03-03

## Raw Feedback (Sanitized)
"Since we pivoted to self code modification instead of experiments and AI personas, the settings panel is crowded with legacy stuff. We should remove all that (and the code behind it) since it's not needed anymore. Also I feel like we should have another, more central place to provide an improvement request — maybe something like a button that should always be visible."

## Normalized Summary
Two concerns in one feedback drop:
1. **Legacy settings cruft**: the AI Persona section and the full Improvements pipeline (draft → validate → decide) in Settings were built for the pre-M8 config-only approach. Now that M8 ships real code patches, these sections are dead weight; the backing code (`improvementClasses`, `proposalGenerator`, `proposalQualityGuard`) is also unused.
2. **Buried improvement entry**: submitting an improvement request (the primary trigger for the M8 loop) requires opening Settings → scrolling to "Improve" → clicking "New improvement". This path is too hidden for something the user should reach in one step.

## PM Notes
- The legacy code is confirmed unused: `improvementClasses.ts`, `proposalGenerator.ts`, `proposalQualityGuard.ts` only fed the old proposals pipeline removed in theme 1.
- E-0010 Non-goals already stated: "Improvement class registry (the M7 classification system is deprioritised in favour of simpler feedback-to-agent routing)." This is long-overdue cleanup.
- The FeedbackPanel component itself is not legacy — it hosts the improvement submission form and "Fix with AI →" trigger. It should remain but be promoted to its own always-accessible surface.

## Triage Decision
- Decision: split into two tickets (T-0063 cleanup, T-0064 new feature)
- Rationale: cleanup is independently shippable and unblocks T-0064 by simplifying the Settings panel; the new central button is a distinct UX feature with its own design spec requirements.
- Revisit Trigger: after T-0064 ships, confirm per-message "Improve" link still routes to the new improvement panel.
