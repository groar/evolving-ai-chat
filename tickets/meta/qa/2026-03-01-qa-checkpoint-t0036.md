# QA Checkpoint — T-0036 Markdown rendering in assistant responses

**Date:** 2026-03-01  
**Ticket:** T-0036  
**Scope:** T-0036 only (Area: ui)

## Test Plan
- Automated tests: MarkdownMessage unit tests, app shell tests
- UX/UI Design QA: heuristic pass per `tests/UX_QA_CHECKLIST.md`
- Manual validation: Markdown rendering, user vs assistant differentiation, link handling, XSS

## Automated Tests
- **MarkdownMessage.test.tsx**: 7 tests — PASS
  - Plain text, bold, inline code, links, headings, lists, XSS escape
- **appShell.test.tsx**: 8 tests — PASS
- **Build:** `npm run build` — PASS

## UX/UI Design QA Checklist (Heuristic)
- **1) Mental Model and Framing**: PASS — Message content is primary; Markdown supports structured answers.
- **2) Hierarchy and Focus**: PASS — Formatted message content is visually primary.
- **3) IA and Navigation**: N/A — No nav changes.
- **4) States and Error Handling**: N/A — No new states; plain text fallback works.
- **5) Copy and Terminology**: PASS — No new copy; existing copy unchanged.
- **6) Affordances**: PASS — Links are styled and clickable; keyboard tab order preserved.
- **7) Visual Accessibility**: PASS — Prose styling; sufficient contrast; headings/body hierarchy.
- **8) Responsive**: PASS — Layout unchanged; prose max-width prevents overflow.

## Validation Summary
| Criterion | Result | Evidence |
| --- | --- | --- |
| Assistant messages render Markdown | PASS | MarkdownMessage component; tests for headings, bold, code, links, lists |
| User messages remain plain text | PASS | App.tsx conditional: `message.role === "assistant"` uses MarkdownMessage; else `whitespace-pre-wrap` |
| No artifacts for plain text | PASS | Unit test "renders plain text without artifacts" |
| Links open in default browser | PASS | Custom `a` component with `window.open(url, "_blank")` for http(s) URLs |
| Styling consistent | PASS | prose-sm prose-neutral; inline overrides for links, pre |
| XSS protection | PASS | react-markdown escapes HTML; unit test verifies `<script>` not rendered |

## Copy Regression Sweep
- No user-facing text changed by this ticket. N/A.

## Findings
- None. All acceptance criteria met.

## Recommendation
**PASS** — Accept and move to done.

## Suggested Commit Message
```
feat(T-0036): Markdown rendering for assistant responses

- Add react-markdown, remark-gfm, @tailwindcss/typography
- MarkdownMessage component for assistant messages; user messages stay plain text
- Links open in default browser; XSS-safe (HTML escaped)
- 7 unit tests for key patterns
```

## Next Step
PM acceptance: verify evidence, move T-0036 to done, record checkpoint.
