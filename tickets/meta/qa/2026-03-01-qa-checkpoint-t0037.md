# QA Checkpoint — T-0037 Code block syntax highlighting + copy-to-clipboard

**Date:** 2026-03-01  
**Ticket:** T-0037  
**Scope:** T-0037 only (Area: ui)

## Test Plan
- Automated tests: MarkdownMessage unit tests (including new code-block tests)
- UX/UI Design QA: heuristic pass per `tests/UX_QA_CHECKLIST.md`
- Manual validation: fenced code rendering, syntax highlighting, copy button, overflow behavior

## Automated Tests
- **MarkdownMessage.test.tsx**: 10 tests — PASS
  - Plain text, bold, inline code, links, headings, lists, XSS escape
  - Fenced code with language + copy button, fenced code without language, copy button aria-label
- **appShell.test.tsx**: 8 tests — PASS
- **Build:** `npm run build` — PASS

## UX/UI Design QA Checklist (Heuristic)
- **1) Mental Model and Framing**: PASS — Code blocks are clearly code; "Copy code block" label is unambiguous.
- **2) Hierarchy and Focus**: PASS — Code content is visually primary; copy button is secondary (top-right, always visible).
- **3) IA and Navigation**: N/A — Code blocks are inline in message flow.
- **4) States and Error Handling**: PASS — "Copied!" feedback confirms action. Clipboard failure handled silently (no alarming error).
- **5) Copy and Terminology**: PASS — "Copy code block" does not imply copying the entire message; "Copied!" is clear.
- **6) Affordances**: PASS — Copy button is tabbable, sized appropriately, focus ring present.
- **7) Visual Accessibility**: PASS — oneLight theme; sufficient contrast; code font and spacing consistent.
- **8) Responsive**: PASS — overflow-x-auto for horizontal scroll; max-h-[24rem] with overflow-y-auto for long blocks; no layout breakage.

## Validation Summary
| Criterion | Result | Evidence |
| --- | --- | --- |
| Syntax highlighting for tagged blocks | PASS | react-syntax-highlighter Prism; JS/TS/Python/Rust/HTML/CSS/JSON/Bash supported |
| Plain monospace for no-language | PASS | Unit test; div+code with font-mono |
| Copy-to-clipboard button | PASS | Button with aria-label, Clipboard API |
| Copy writes code only | PASS | navigator.clipboard.writeText(code) |
| "Copied!" feedback | PASS | useState + 2s reset; CheckIcon + "Copied!" text |
| Horizontal overflow | PASS | overflow-x-auto on container |
| Theme consistency | PASS | oneLight Prism; bg-muted/50, border-border, focus:ring-accent |

## Copy Regression Sweep
- New copy: "Copy", "Copy code block" (title/aria-label), "Copied!" — all specific to code blocks, no conflict with existing UI.
- "Copy code block" explicitly scopes the action; does not imply full message copy.

## Findings
- None. All acceptance criteria met.

## Recommendation
**PASS** — Accept and move to done.

## Suggested Commit Message
```
feat(T-0037): Code block syntax highlighting + copy-to-clipboard

- react-syntax-highlighter (Prism + oneLight) for fenced code blocks
- Copy button with Clipboard API and "Copied!" feedback
- Supports JS/TS/Python/Rust/HTML/CSS/JSON/Bash; plain monospace when no language
- overflow-x-auto for horizontal scroll; theme-aligned styling
- 10 MarkdownMessage tests
```

## Next Step
PM acceptance: verify evidence, move T-0037 to done, record checkpoint.
