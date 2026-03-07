# T-0089: Prompt improvements — structured template + dynamic allowlist + context assembly

## Metadata
- ID: T-0089
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07

## Summary
Replace the single-sentence prompt sent to `pi` with a structured, multi-section template that includes scope constraints (Layer 1), codebase context (file tree, recent commits), output format guidance, and the change request. Read allowlist patterns dynamically from `patch-allowlist.json` so Layer 1 (prompt) and Layer 2 (server-side check) stay automatically in sync.

## Context
- The current prompt in `patch_agent.py` (line 376–378) is a single generic sentence: `"Run the self-evolving agent with the following user feedback…"`. The agent receives no scope constraints, no codebase context, and no output format guidance.
- M8 spec §6 defined a scope-guard system prompt that was never implemented.
- The M13 design spec (§7) specifies the full structured template and context assembly logic.

## References
- `docs/m13-self-evolve-reliability.md` — §7 (Prompt Improvements)
- `apps/desktop/runtime/agent/patch_agent.py` — `_call_pi()` method
- `apps/desktop/runtime/config/patch-allowlist.json` — Layer 2 allowlist

## Feedback References
- F-20260307-001 (conversational feedback refinement — overall M13 input)
- F-20260301-008 (direction pivot — original impetus)

## Acceptance Criteria
- [ ] `_call_pi()` sends a multi-section prompt matching the template in spec §7.1 (ROLE, SCOPE CONSTRAINTS, CHANGE REQUEST, CODEBASE CONTEXT, OUTPUT REQUIREMENTS, PREVIOUS ATTEMPT sections).
- [ ] Scope constraints section is populated dynamically by reading `patch-allowlist.json` at prompt-assembly time (not hardcoded).
- [ ] A new `_assemble_prompt_context()` method (or equivalent) in `patch_agent.py` produces the file tree (allowlisted directories only, via `git ls-files` or equivalent) and recent commits (`git log --oneline -5`).
- [ ] Total assembled context is capped at ~8,000 tokens.
- [ ] The PREVIOUS ATTEMPT section is included only when `retry_context` is provided (empty otherwise). This enables T-0091 (retry) to inject failure context without further prompt changes.
- [ ] Existing tests continue to pass: `uv run pytest` exits 0.
- [ ] The structured prompt is exercised in at least one unit test that verifies template sections are present and allowlist patterns appear.

## Dependencies / Sequencing
- Depends on: none
- Blocks: T-0091 (retry uses the same prompt template), T-0092 (refinement feeds into CHANGE REQUEST section)

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Implement `_assemble_prompt_context()` in `patch_agent.py`
- [ ] Replace the single-sentence prompt in `_call_pi()` with the structured template
- [ ] Add unit test for prompt assembly
- [ ] Documentation updates (if any)

## Notes
- The CHANGE REQUEST section currently receives raw `feedback_summary`. After T-0092 (refinement), it will receive the validated functional description. The prompt template should accept either format.
- Keep the `--tools`, `--provider`, `--api-key`, `--model`, `--thinking`, `--verbose` CLI args as-is; only the `-p` prompt content changes.

## Change Log
- 2026-03-07: Ticket created from M13 design spec §9 (rank 1).
