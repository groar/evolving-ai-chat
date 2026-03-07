# T-0089: Prompt improvements — structured template + dynamic allowlist + context assembly

## Metadata
- ID: T-0089
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0016
- Owner: ai-agent
- Created: 2026-03-07
- Updated: 2026-03-07 (accepted)

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
- [x] `_call_pi()` sends a multi-section prompt matching the template in spec §7.1 (ROLE, SCOPE CONSTRAINTS, CHANGE REQUEST, CODEBASE CONTEXT, OUTPUT REQUIREMENTS, PREVIOUS ATTEMPT sections).
- [x] Scope constraints section is populated dynamically by reading `patch-allowlist.json` at prompt-assembly time (not hardcoded).
- [x] A new `_assemble_prompt_context()` method (or equivalent) in `patch_agent.py` produces the file tree (allowlisted directories only, via `git ls-files` or equivalent) and recent commits (`git log --oneline -5`).
- [x] Total assembled context is capped at ~8,000 tokens.
- [x] The PREVIOUS ATTEMPT section is included only when `retry_context` is provided (empty otherwise). This enables T-0091 (retry) to inject failure context without further prompt changes.
- [x] Existing tests continue to pass: `uv run pytest` exits 0.
- [x] The structured prompt is exercised in at least one unit test that verifies template sections are present and allowlist patterns appear.

## Dependencies / Sequencing
- Depends on: none
- Blocks: T-0091 (retry uses the same prompt template), T-0092 (refinement feeds into CHANGE REQUEST section)

## Evidence (Verification)
- Tests run: `uv run pytest` — 78 passed, 13 skipped (integration), 0 failed. New `PromptAssemblyTests` class (7 tests) and updated `test_structured_prompt_contains_feedback_text_and_sections` all pass.
- Manual checks performed: Reviewed prompt output structure in tests — all 6 sections present; allowlist patterns from `patch-allowlist.json` appear verbatim in SCOPE CONSTRAINTS; PREVIOUS ATTEMPT section absent when `retry_context=None`, present when provided.
- Screenshots/logs/notes: No behavioral change to stub mode. `generate_patch()` and `PatchAgent` abstract interface updated to accept optional `retry_context` parameter (defaults to `None` — backward compatible).

## Subtasks
- [x] Implement `_assemble_prompt_context()` in `patch_agent.py`
- [x] Replace the single-sentence prompt in `_call_pi()` with the structured template
- [x] Add unit test for prompt assembly
- [x] Documentation updates (if any)

## Notes
- The CHANGE REQUEST section currently receives raw `feedback_summary`. After T-0092 (refinement), it will receive the validated functional description. The prompt template should accept either format.
- Keep the `--tools`, `--provider`, `--api-key`, `--model`, `--thinking`, `--verbose` CLI args as-is; only the `-p` prompt content changes.

## Change Log
- 2026-03-07: Ticket created from M13 design spec §9 (rank 1).
- 2026-03-07: Implementation complete. Added `_assemble_prompt_context()` and `_build_structured_prompt()` to `PiDevPatchAgent`; updated `_call_pi()` and `generate_patch()` to use structured template with optional `retry_context`; abstract `PatchAgent.generate_patch()` signature updated; `PromptAssemblyTests` (7 tests) added; existing prompt test updated. `uv run pytest` exits 0 (78 passed).
- 2026-03-07: QA PASS — all acceptance criteria met, 7 new unit tests pass, no bugs found. QA checkpoint: `tickets/meta/qa/2026-03-07-qa-T-0089.md`.
- 2026-03-07: Accepted by PM. Moving to done.
