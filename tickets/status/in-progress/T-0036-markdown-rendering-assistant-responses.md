# T-0036: Markdown rendering in assistant responses

## Metadata
- ID: T-0036
- Status: review
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
- [x] Assistant messages render Markdown: headings (h1-h4), bold, italic, inline code, links, ordered/unordered lists, blockquotes, horizontal rules.
- [x] User messages remain plain text (no Markdown rendering).
- [x] Messages without Markdown syntax render normally (no visual artifacts or broken layout).
- [x] Links in rendered Markdown open in the default browser (Tauri external link handling).
- [x] Rendered Markdown is styled consistently with the app's design tokens (font, colors, spacing).
- [x] XSS protection: raw HTML in Markdown input is escaped (not rendered as HTML).

## UX Acceptance Criteria
- [ ] Primary flow is keyboard-usable.
- [ ] Empty/error states are clear and actionable.
- [ ] Copy/microcopy is consistent and unambiguous.
- [ ] Layout works at common breakpoints.

## Dependencies / Sequencing
- Depends on: T-0031 (Tailwind integration for consistent Markdown styling). Can be implemented without it but styling will be easier with Tailwind typography plugin.
- Blocks: T-0037 (code block syntax highlighting builds on Markdown code block rendering).

## Subtasks
- [x] Choose Markdown library (react-markdown or similar)
- [x] Implement Markdown renderer component for assistant messages
- [x] Style rendered Markdown with app design tokens (or @tailwindcss/typography)
- [x] Ensure XSS safety (sanitize HTML)
- [x] Add tests for Markdown rendering (key patterns)
- [x] Verify user messages are unaffected

## Evidence
- `MarkdownMessage.tsx`: component using react-markdown + remark-gfm; @tailwindcss/typography prose classes; custom link handler for external URLs (window.open); user messages unchanged in App.tsx.
- `MarkdownMessage.test.tsx`: 7 tests for plain text, bold, inline code, links, headings, lists, XSS escape.
- Build and test: `npm run build`, `npm run test` pass.

## Notes
`react-markdown` with `remark-gfm` (GitHub Flavored Markdown) is the standard choice. Pair with `@tailwindcss/typography` (the `prose` class) for instant, beautiful Markdown styling if T-0031 is done first.

## Change Log
- 2026-03-01: Ticket created (F-20260301-002 product & design review).
- 2026-03-01: Moved to ready (PM checkpoint 17).
- 2026-03-01: Implementation complete. Added react-markdown, remark-gfm, @tailwindcss/typography. Created MarkdownMessage component for assistant messages. User messages remain plain text. Links open in default browser via window.open. XSS-safe. Moved to review.
