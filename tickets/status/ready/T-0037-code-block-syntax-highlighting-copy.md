# T-0037: Code block syntax highlighting + copy-to-clipboard

## Metadata
- ID: T-0037
- Status: ready
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0006
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Add syntax highlighting to fenced code blocks in assistant responses and a one-click copy-to-clipboard button on each code block. This is the most-used affordance in AI chat products — users frequently ask for code and need to copy it.

### UI Spec Addendum
- Primary job-to-be-done: Code in assistant responses is readable (syntax colored) and instantly copyable.
- Primary action and what must be visually primary: The code content with syntax coloring. Copy button is secondary (visible on hover or always visible in the block header).
- Navigation / progressive disclosure notes: Copy button can be a small icon in the top-right corner of the code block (appears on hover, or always visible).
- Key states to design and verify:
  - Happy: code block with language tag renders with syntax highlighting and copy button.
  - No language: code block without language tag renders as plain monospace with copy button.
  - After copy: brief "Copied!" feedback (tooltip or icon change).
  - Long code: horizontal scroll within the block, no layout breakage.
- Copy constraints: Must not imply the copy button copies the entire message — only the code block.

## Context
- Depends on T-0036 (Markdown rendering) — code blocks are a Markdown feature.
- Standard approach: `react-syntax-highlighter` or `shiki` for highlighting, Clipboard API for copy.
- Every AI chat product has this; its absence is immediately noticeable.

## References
- T-0036 (Markdown rendering)
- `apps/desktop/src/App.tsx`
- E-0006-m5-conversational-ux-table-stakes.md
- F-20260301-002

## Feedback References
- F-20260301-002

## Acceptance Criteria
- [ ] Fenced code blocks with a language tag render with syntax highlighting (at minimum: JavaScript, TypeScript, Python, Rust, HTML, CSS, JSON, Bash).
- [ ] Fenced code blocks without a language tag render as plain monospace.
- [ ] Each code block has a copy-to-clipboard button.
- [ ] Clicking copy writes the code block content to the system clipboard.
- [ ] Brief visual feedback ("Copied!" or icon change) confirms the copy action.
- [ ] Code blocks handle horizontal overflow gracefully (scroll, no layout breakage).
- [ ] Syntax highlighting theme is consistent with the app's color palette.

## UX Acceptance Criteria
- [ ] Primary flow is keyboard-usable.
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.
- [ ] Layout works at common breakpoints.

## Dependencies / Sequencing
- Depends on: T-0036 (Markdown rendering must be in place).
- Blocks: none.

## Subtasks
- [ ] Choose syntax highlighting library (react-syntax-highlighter or shiki)
- [ ] Integrate as custom code component in react-markdown
- [ ] Add copy-to-clipboard button to code blocks
- [ ] Style code blocks and highlighting to match app theme
- [ ] Add tests for syntax highlighting and copy behavior
- [ ] Verify non-code Markdown is unaffected

## Notes
Consider `shiki` for build-time-safe syntax highlighting (it uses TextMate grammars and is very accurate). For a lighter option, `react-syntax-highlighter` with `Prism` is battle-tested. Choose based on bundle size constraints.

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
- 2026-03-01: Moved to ready (PM run; T-0036 done, dependency satisfied).
