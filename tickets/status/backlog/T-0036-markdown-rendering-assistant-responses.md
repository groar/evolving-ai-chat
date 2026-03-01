# T-0036: Markdown rendering in assistant responses

## Metadata
- ID: T-0036
- Status: backlog
- Priority: P1
- Type: feature
- Area: ui
- Epic: E-0006
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Render assistant response text as Markdown instead of plain text. Support headings, bold, italic, inline code, links, ordered/unordered lists, blockquotes, and horizontal rules. This is table-stakes for any AI chat product — LLMs naturally produce Markdown.

### UI Spec Addendum
- Primary job-to-be-done: Assistant responses display rich formatting so users can scan, read, and use structured answers.
- Primary action and what must be visually primary: The formatted message content.
- Navigation / progressive disclosure notes: N/A — applies to message rendering only.
- Key states to design and verify:
  - Happy: Markdown renders correctly (headings, lists, code, links).
  - Plain text: Messages without Markdown render normally (no artifacts).
  - Long responses: Scroll behavior unchanged.
  - User messages: remain plain text (no Markdown rendering for user input).
- Copy constraints: N/A.

## Context
- Currently, assistant messages are rendered as `<p>{message.text}</p>` with `white-space: pre-wrap`.
- Every modern AI chat product (ChatGPT, Claude, Gemini) renders Markdown.
- Without this, code responses, structured answers, and lists are unreadable.

## References
- `apps/desktop/src/App.tsx` (message rendering, lines 664-670)
- E-0006-m5-conversational-ux-table-stakes.md
- F-20260301-002

## Feedback References
- F-20260301-002

## Acceptance Criteria
- [ ] Assistant messages render Markdown: headings (h1-h4), bold, italic, inline code, links, ordered/unordered lists, blockquotes, horizontal rules.
- [ ] User messages remain plain text (no Markdown rendering).
- [ ] Messages without Markdown syntax render normally (no visual artifacts or broken layout).
- [ ] Links in rendered Markdown open in the default browser (Tauri external link handling).
- [ ] Rendered Markdown is styled consistently with the app's design tokens (font, colors, spacing).
- [ ] XSS protection: raw HTML in Markdown input is escaped (not rendered as HTML).

## UX Acceptance Criteria
- [ ] Primary flow is keyboard-usable.
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.
- [ ] Layout works at common breakpoints.

## Dependencies / Sequencing
- Depends on: T-0031 (Tailwind integration for consistent Markdown styling). Can be implemented without it but styling will be easier with Tailwind typography plugin.
- Blocks: T-0037 (code block syntax highlighting builds on Markdown code block rendering).

## Subtasks
- [ ] Choose Markdown library (react-markdown or similar)
- [ ] Implement Markdown renderer component for assistant messages
- [ ] Style rendered Markdown with app design tokens (or @tailwindcss/typography)
- [ ] Ensure XSS safety (sanitize HTML)
- [ ] Add tests for Markdown rendering (key patterns)
- [ ] Verify user messages are unaffected

## Notes
`react-markdown` with `remark-gfm` (GitHub Flavored Markdown) is the standard choice. Pair with `@tailwindcss/typography` (the `prose` class) for instant, beautiful Markdown styling if T-0031 is done first.

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
