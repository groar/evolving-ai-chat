# F-20260228-002: UI/UX needs redesign (external designer review)

## Metadata
- ID: F-20260228-002
- Status: ticketed
- Source: external-designer-review
- Theme: ux
- Severity: S2
- Linked Tickets: T-0019, T-0020, T-0021, T-0022
- Received: 2026-02-28
- Updated: 2026-02-28

## Raw Feedback (Sanitized)
Professional UI/UX designer review based on provided screenshots of the current desktop app UI (empty-state, runtime offline/unavailable).

## Normalized Summary
The current UI does not establish a clear user mental model or hierarchy: primary chat usage is visually and structurally competing with developer/admin controls (runtime, experiments, proposals), states are confusing/redundant, and the layout wastes space while still feeling dense. Result: low trust, low discoverability, and unclear next action.

## PM Notes
### Overall Product Framing (First Impression)
- The product is titled like a chat app, but the UI reads like an internal debug console.
- Technical language is front-and-center (`SQLite`, `runtime`, `changelog + experiments`, `proposals`) without progressive disclosure. This increases perceived complexity and reduces confidence for first-time users.
- The UI does not clearly answer: "What is this?", "What can I do here?", "What should I do next?"

### Information Architecture (IA) Issues
- Too many peer-level sections in the left rail (Feedback, Settings/Experiments, Proposals) competing with what should likely be the primary nav: conversations.
- The left rail title says "Conversation List (SQLite)" but the visible content is dominated by non-conversation modules. If conversations are core, they are not treated as core.
- Dev-only features (experiments, runtime diagnostics, proposals) appear as primary navigation rather than "Advanced" or "Developer" areas.

### Layout and Hierarchy
- The main chat area has large empty space, while the left rail is crowded with stacked "cards". This creates an odd tension: visually busy but functionally empty.
- Borders and rounded rectangles are heavily over-used, making everything look equally important and reducing scannability.
- The "Stable (default)" pill in the top-right conflicts with the presence of "Stable/Experimental" controls in the left rail (duplicated control surface, unclear source of truth).
- Primary action hierarchy is unclear:
  - The composer exists but competes with a prominent "Runtime status" banner and "Retry" button.
  - "Capture Feedback" is visually large but does not feel anchored to a clear workflow.

### States, Feedback, and Error Handling
- Runtime-offline state is surfaced multiple times and in multiple places with different copy ("Runtime unavailable...", "Could not load changelog and proposals..."). This reads like the app is broken, not like a subsystem is offline.
- The UI does not make clear what is functional offline vs dependent on runtime.
- "Retry" appears as a call-to-action, but there is no adjacent explanation of what "runtime" is, how to start it, or what the user is expected to do.

### Copy and Labeling
- Many labels are implementation details rather than user value:
  - "Conversation List (SQLite)" is not user-facing value.
  - "Changelog + Experiments" is ambiguous: is it release notes, feature flags, or both?
  - "Proposals" is unclear without context: proposals for what, created by whom, and what is the user decision loop?
- Instructions are duplicated and passive:
  - "Use the composer below and press Enter to send."
  - Composer placeholder repeats the same instruction.
- Some controls read contradictory:
  - "Switch to Stable" appears even when "Stable (default)" is already indicated.

### Visual Design and Accessibility
- Low contrast and low emphasis hierarchy: the beige background + thin borders + light type makes it hard to parse structure quickly.
- Typographic hierarchy is inconsistent (some headers are strong, but most body copy looks same-weight/importance).
- The design uses many subtle separators, but not enough clear grouping through spacing, alignment, and typography alone.

### Interaction Model Concerns (Implied By UI)
- Users likely need a single primary flow:
  1) pick/create a conversation
  2) send messages
  3) optionally manage settings/feedback/experiments
  The current UI presents (2) and (3) simultaneously, which is cognitively expensive and increases the chance of "what do I click?" paralysis.

### Concrete Recommendations (Actionable)
1. Establish primary navigation and remove dev features from the default surface:
   - Left rail: Conversations (list + search + new conversation).
   - Secondary nav items (bottom or top): Settings, Feedback, Developer (or Advanced).
2. Make runtime state a single, well-designed banner with clear guidance:
   - If chat cannot work without runtime, disable composer and show a clear "Start runtime" CTA with short explanation.
   - If chat can work without runtime, only surface runtime offline in Settings/Developer, not blocking the main flow.
3. Unify environment mode controls (Stable/Experimental):
   - One location, one control. Remove the redundant top-right pill or make it purely informational but clearly linked to the control surface.
4. Reduce visual noise:
   - Fewer bordered boxes; use whitespace and typography for grouping.
   - Reserve strong borders/filled surfaces for interactive components and high-priority alerts.
5. Improve empty state:
   - Replace "No messages yet" with a more helpful, product-framing empty state:
     - What this app is
     - A single suggested first action (start a new conversation; try an example prompt)
     - Optional: link to "Advanced/Developer" for experiments/proposals.
6. Rewrite copy for user intent:
   - Replace implementation terms with value terms; keep technical terms behind tooltips/help text.
   - Avoid duplicated instruction text in both empty state and placeholder.

## Triage Decision
- Decision: ticketed
- Rationale: The issues are systemic (IA, hierarchy, state messaging) and are blocking basic trust/usability; split into three scoped, testable UI tickets under a dedicated UX epic.
- Revisit Trigger: after T-0019..T-0021 are accepted, rerun the E-0003 micro-probes and close the item.

## Follow-up Tracking
- 2026-02-28: T-0019..T-0021 accepted; micro-validation probe rerun tracked in T-0022.
