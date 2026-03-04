## Design Guidelines

### 1. Design Philosophy

This app is an **AI workspace, not a dashboard**. The chat should feel like a calm, focused desk surface where you can think, write, and iterate with an assistant—closer to Claude and Notion AI than to a busy analytics UI. Visually, we lean into **warm parchment neutrals**, **editorial typography**, and **soft rounded components** so that even complex tools (settings, logs, proposals) feel like part of a coherent writing environment rather than a control panel. The UI should stay **quiet and legible by default**, with progressive disclosure for advanced controls and only a few strong moments of color (the orange accent) to indicate focus, primary actions, or important state changes.

### 2. Color System

The color system is defined in `apps/desktop/src/styles.css` and in the Tailwind theme tokens. Treat these tokens as the **source of truth** for both light and dark modes.

#### 2.1 Core warm-neutral tokens

- `--color-bg`  
  - **Role**: App background parchment wash.  
  - **Usage**: Root background for the main viewport, beneath all surfaces.  
  - **Do**: Use as the page-level background on the `<body>` or app root.  
  - **Don't**: Use for cards or interactive surfaces; they should sit slightly above this tone.

- `--color-panel`  
  - **Role**: Default card/panel background.  
  - **Usage**: Chat bubbles, cards, sheets, most content panels.  
  - **Do**: Use for primary content surfaces (panels, cards) that sit on top of the parchment.  
  - **Don't**: Mix with pure white `#fff` on the same layer; keep the look cohesive and soft.

- `--color-panel-strong`  
  - **Role**: Emphasized panel background.  
  - **Usage**: Highlighted blocks such as currently selected items or important summary sections.  
  - **Do**: Use sparingly to call out an especially important card or section.  
  - **Don't**: Use everywhere; overuse makes the hierarchy noisy.

- `--color-ink`  
  - **Role**: Primary text color.  
  - **Usage**: Body text, headings, and most icons in light mode.  
  - **Do**: Use for all standard text on light backgrounds.  
  - **Don't**: Use on dark surfaces where contrast would be too low; in that case, use the appropriate foreground token.

- `--color-muted`  
  - **Role**: Muted text and subtle framing.  
  - **Usage**: Secondary labels, helper text, subdued borders.  
  - **Do**: Use for timestamps, secondary labels, and explanatory copy.  
  - **Don't**: Use for primary actions or critical warnings; it should always read as secondary.

- `--color-border`  
  - **Role**: Default border color.  
  - **Usage**: Panel borders, inputs, subtle dividers.  
  - **Do**: Use for low-contrast borders that keep the UI soft.  
  - **Don't**: Darken it heavily; instead, rely on spacing and layout for separation.

#### 2.2 Accent and semantic feedback tokens

- `--color-accent`  
  - **Role**: Primary accent (warm orange).  
  - **Usage**: Primary buttons, key highlights, focused states.  
  - **Do**: Use for the single most important call-to-action in a context (e.g., "Send", "Apply change").  
  - **Don't**: Use for destructive actions—orange implies positive, energizing actions.

- `--color-accent-soft`  
  - **Role**: Soft accent background.  
  - **Usage**: Pills, subtle highlights, selection backgrounds.  
  - **Do**: Use behind text or icons when you need a soft accent field.  
  - **Don't**: Pair with full-strength `--color-accent` text on the same element.

- `--color-danger-bg` and `--color-danger-ink`  
  - **Role**: Error/destructive feedback.  
  - **Usage**: Error banners, destructive confirmations, critical status pills.  
  - **Do**: Use together for destructive confirmation states or serious errors.  
  - **Don't**: Use orange accent for destructive actions; reserve orange for constructive actions.

- `--color-success-bg`, `--color-success-border`, `--color-success-ink`  
  - **Role**: Success confirmation.  
  - **Usage**: Success banners, "change applied" confirmations.  
  - **Do**: Use for completion states and positive feedback.  
  - **Don't**: Overuse success styling for neutral informational messages.

- `--color-warning-bg`, `--color-warning-border`, `--color-warning-ink`  
  - **Role**: Warning / caution.  
  - **Usage**: Non-blocking warnings or "pay attention" hints.  
  - **Do**: Use for "risky but allowed" actions or states.  
  - **Don't**: Conflate with errors; reserve danger styling for truly blocking problems.

#### 2.3 Tailwind theme aliases

The Tailwind theme in `styles.css` exposes semantic `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, and `--ring` tokens, along with `--sidebar-*` tokens for the navigation rail.

- **Do**: Prefer these semantic tokens (via Tailwind utility classes) in new components instead of hard-coded hex values.  
- **Don't**: Introduce new color variables without a follow-up design ticket; use the existing palette whenever possible.

### 3. Typography

- **Font family**: `"Avenir Next", "Segoe UI", sans-serif`.  
- **Tone**: Editorial, calm, and legible; no hyper-condensed or overly playful faces.

Define a small, stable scale:

- **Display**: Rare, used for the app title or major section headers.  
  - Size: large, with generous line-height and letter-spacing.  
- **Heading**: Section and panel titles.  
  - Size: medium-large; weight semi-bold.  
- **Body**: Default for chat messages, settings copy, and explanatory text.  
  - Size: base; comfortable line-height; regular weight.  
- **Label**: Small caps or small-size text for field labels and secondary UI copy.  
  - Size: smaller than body; muted color tone.  
- **Mono**: For inline code or log-like data when needed.  
  - Use sparingly, only when structure benefits from fixed-width alignment.

Rules:

- **Do**: Keep most body text at the base size with comfortable line-height; let hierarchy come from weight, spacing, and layout rather than large jumps in size.  
- **Do**: Use muted color (`--color-muted` / `--muted-foreground`) for secondary text rather than shrinking everything.  
- **Don't**: Mix many font sizes within the same panel; aim for 1–2 levels plus labels.  
- **Don't**: Use bold on large blocks of text; reserve it for headings and short emphasis.

### 4. Spacing & Layout

The layout is **chat-first**: the conversation area is central, with navigation and controls in peripheral rails or sheets. Spacing should feel airy but not wasteful.

- **Spacing scale**: Use Tailwind’s rem-based steps (e.g., `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`) consistently.  
  - **Do**: Use even increments for vertical rhythm (e.g., 8/12/16/24px equivalents).  
  - **Don't**: Introduce one-off pixel spacing unless aligning with existing components.

- **Panels and sheets**:  
  - Main chat column: center stage in desktop layout.  
  - Side panels (settings, changelog, proposals) use consistent widths and padding.  
  - On small screens (`max-width: 900px`), content should gracefully stack into a single column.

- **Alignment**:  
  - Align primary text and actions along a clear vertical axis.  
  - Use consistent padding inside cards and buttons (horizontal padding slightly larger than vertical).

### 5. Component Patterns

These patterns are reflected in existing class utilities in `apps/desktop/src/lib/ui-classes.ts` and the broader Tailwind setup.

- **Card / Panel**  
  - Background: `--color-panel` / `--card`.  
  - Border: `--color-border` with soft radius (`--radius-md`/`--radius-lg`).  
  - Internal spacing: medium padding; clear separation between header, body, and footer when present.

- **Input** (`settingsInput`, `settingsTextarea`)  
  - Border: `border-border`.  
  - Background: white on top of panel.  
  - Focus: subtle ring using the accent color (no intense glow).  
  - Do: Keep inputs full-width in forms; align labels above or to the left consistently.

- **Button**  
  - **Primary**: warm orange accent (`--primary` / `--color-accent`), white text, strong hierarchy.  
  - **Secondary**: neutral background (panel or white), border-border, foreground text.  
  - **Destructive** (`railBtnDanger` pattern): use danger colors, with clear labeling.  
  - Do: Use one primary action per context; demote others to secondary or tertiary.  
  - Don't: Use destructive styling for neutral actions; red should always mean "danger".

- **Badge / Pill**  
  - Background: `--color-accent-soft` or muted tones.  
  - Shape: fully rounded or high radius.  
  - Usage: lightweight status or category tags, not full buttons.

- **Detail / Summary block**  
  - Use for logs, metadata, or collapsed advanced settings.  
  - Maintain a clear header row with summary text and an affordance (chevron) for expansion.

- **Sheet / Drawer**  
  - Slide-over panels for secondary flows (settings, proposals, changelog).  
  - Background: panel; border on the inside edge only if needed.  
  - Do: Maintain consistent width and padding across sheets.  
  - Don't: Introduce full-screen modals for flows that can live in a sheet.

- **Diff view**  
  - Purpose: show code/config diffs in a way that feels integrated with the workspace.  
  - Use neutral backgrounds with minimal but clear color coding; do not introduce new saturated colors beyond the existing palette without a follow-up design ticket.

### 6. Interaction Principles

- **Progressive disclosure**  
  - Keep the main chat surface clean; move advanced and rarely used options into drawers, accordions, or overflow menus.  
  - Do: Show only the controls needed for the current task; reveal more on intent (click, hover, or explicit toggle).  
  - Don't: Show full configuration panels by default.

- **Animation**  
  - Current animations: `streaming-blink` (typing indicator) and `spin` (loading).  
  - Do: Use animations sparingly to indicate system activity or progression.  
  - Don't: Add bouncing, pulsing, or high-frequency animations; the workspace should feel calm.

- **Hover & focus**  
  - Hover: slightly lift or lighten backgrounds; adjust borders using the accent color.  
  - Focus: clear but subtle rings using `--ring` / accent tokens; always keyboard-accessible.  
  - Do: Ensure focus indicators are visible on all interactive elements.  
  - Don't: Rely only on color for state; pair with shape, border, or underline when helpful.

### 7. Dos and Don'ts

1. **Do** use `--color-panel` / `--card` for cards and panels. **Don't** use pure white `#fff` directly against `--color-bg` for large surfaces.  
2. **Do** use `--color-accent` / `--primary` for the single primary action. **Don't** use it for destructive or ambiguous actions.  
3. **Do** keep typography simple: one body size, one heading level, and labels. **Don't** introduce many ad-hoc text sizes and weights.  
4. **Do** use spacing and grouping to create hierarchy. **Don't** rely solely on borders and lines.  
5. **Do** keep settings and meta controls off to the side or in sheets. **Don't** let them crowd the main chat surface.  
6. **Do** use muted colors for secondary information. **Don't** use high-contrast or saturated colors for low-priority details.  
7. **Do** keep animations subtle and purposeful. **Don't** animate elements purely for decoration.  
8. **Do** align new components with existing patterns in `ui-classes.ts`. **Don't** create one-off visual treatments without a follow-up design review.

### 8. Self-Evolution Note (For AI Agents)

When proposing UI or UX changes, **always reference this document** as the canonical design guardrail.

- **If a proposal follows these guidelines**:  
  - Call out which sections you are aligning with (e.g., color system, component patterns, interaction principles).

- **If a proposal needs to deviate** (for example, introducing a new component pattern or color token):  
  - Explicitly justify the deviation in the ticket or proposal: why the existing system is insufficient, and how the new pattern still respects the design philosophy.  
  - Suggest a follow-up ticket to update this document if the deviation becomes part of the stable system.

Agents should treat these guidelines as **constraints, not suggestions**. The goal is to let the app self-evolve while preserving a coherent, calm, and trustworthy visual language over time.

