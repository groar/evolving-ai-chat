# M13 Self-Evolve Reliability Hardening — Design Spec

*Source of truth for all M13 implementation tickets. See T-0088 (spec ticket) and E-0016 (epic).*

---

## 1. Goals and Non-Goals

### Goals
- Design and specify the **conversational feedback-refinement phase**: a chat interaction that takes raw user feedback, asks clarifying questions grounded in the current software state, and produces a structured, user-validated spec to pass to the patch agent.
- Harden the feedback → patch → eval → apply → reload pipeline so it reliably produces useful, safe patches.
- Expand evals from advisory to blocking where appropriate.
- Add retry with failure-context feedback so the agent can self-correct.
- Improve prompt quality with scope constraints, output format guidance, and codebase context.

### Non-Goals (M13)
- Multi-model agent support (keep the existing `pi` harness).
- Changing the fundamental architecture (`PiDevPatchAgent` → `ApplyPipeline` flow stays).
- Fully autonomous self-evolution (user still confirms the refined spec and can undo applied patches).
- Complex multi-agent orchestration or planning phases.
- New eval checks beyond the M13 minimum viable set (scope-compliance + lint/test-pass).

---

## 2. Current Pipeline (Audit Summary)

### Flow
1. User writes feedback in improvement sheet, clicks **"Fix with AI"**.
2. Frontend sends `POST /agent/code-patch` with raw feedback text (`feedback_id`, `feedback_title`, `feedback_summary`, `feedback_area`, `base_ref`).
3. `PiDevPatchAgent._call_pi()` runs `pi` as a subprocess with prompt:
   `"Run the self-evolving agent with the following user feedback, without asking for any external output. Feedback: <content>"`
4. `pi` runs for up to 600s. No incremental progress is surfaced.
5. After `pi` finishes, `_git_diff()` computes a unified diff.
6. `validate_scope()` checks files against Layer 2 allowlist.
7. `ApplyPipeline.apply()` runs: base_ref guard → sandboxed `npm run validate` → advisory evals → `patch` utility + `git commit` → no-op reload.
8. Frontend polls `GET /agent/patch-status/{patch_id}` every 1.5s until terminal status. On `applied`, 400ms delay then `window.location.reload()`.

### Key Files
| File | Role |
|---|---|
| `apps/desktop/src/App.tsx` | Improvement sheet, "Fix with AI" trigger |
| `apps/desktop/src/feedbackPanel.tsx` | "Fix with AI →" button |
| `apps/desktop/src/hooks/useRuntime.ts` | `requestPatch` + status polling |
| `apps/desktop/src/PatchNotification.tsx` | Floating status banner |
| `apps/desktop/runtime/main.py` | `POST /agent/code-patch` endpoint |
| `apps/desktop/runtime/agent/patch_agent.py` | `PiDevPatchAgent` (pi subprocess) |
| `apps/desktop/runtime/agent/apply_pipeline.py` | Apply/rollback pipeline |
| `apps/desktop/runtime/evals/` | Eval harness (`run.py`, `patch_applies_cleanly`) |
| `apps/desktop/runtime/config/patch-allowlist.json` | Layer 2 scope allowlist |

---

## 3. Gap Analysis

### Gap 1: No Feedback Refinement (F-20260307-001) — Priority: Critical

**Problem**: Raw one-sentence feedback goes directly to the patch agent. The agent has no way to ask "what exactly do you mean?" and the user has no way to verify what the agent will attempt before it runs. This is the root cause of variable patch quality: garbage in → garbage out.

**Current flow**: Feedback → Agent → Patch
**Proposed flow**: Feedback → **Refinement Conversation** → Validated Spec → Agent → Patch

**Design**: See §4 (Conversational Feedback-Refinement Phase).

### Gap 2: No Layer 1 Scope Prompt — Priority: High

**Problem**: M8 spec §6 defines a scope-guard system prompt that should constrain the agent to UI-layer files. It was never implemented. `_call_pi()` sends a single generic sentence. The agent wastes time generating out-of-scope changes that Layer 2 then blocks.

**Current prompt** (`patch_agent.py` line 377):
```
"Run the self-evolving agent with the following user feedback, without asking for any external output. Feedback: {content}"
```

**M8 §6 specified prompt** (never implemented):
```
You are a UI code assistant for an Electron/React desktop application.
You may ONLY modify files in the following allowlist: ...
```

**Proposed fix**: Replace the generic prompt with a structured system prompt containing scope constraints, codebase context, output format guidance, and the refined spec. See §7 (Prompt Improvements).

### Gap 3: Spec vs. Allowlist Mismatch — Priority: Low (Document Only)

**Problem**: M8 §6 says the allowlist is `^apps/desktop/src/` only, but `patch-allowlist.json` allows five patterns including `apps/desktop/runtime/`, `tickets/`, `docs/`, `tests/`.

**Resolution**: This is **intentional**. The allowlist was broadened during M10 (T-0076) to support runtime and documentation changes through the self-evolve loop. The Layer 1 prompt should reflect the actual allowlist, not the original M8-era restriction.

**Action**: No allowlist change needed. The Layer 1 prompt (Gap 2 fix) will read patterns from `patch-allowlist.json` dynamically so the prompt and the server-side check stay in sync.

### Gap 4: Evals Advisory Only — Priority: High

**Problem**: `_run_evals()` in `apply_pipeline.py` catches all exceptions and continues. Even if every eval fails, the patch is still committed. There is no mechanism for evals to block apply.

**Current code** (line 298-357): The method appends results to `artifact.log_text` and returns. It never raises `ApplyError`.

**Proposed fix**: Introduce a blocking vs. advisory policy. See §5 (Eval Policy).

### Gap 5: Single Eval Check — Priority: High

**Problem**: The eval registry contains only `patch_applies_cleanly`. This checks whether the diff can be applied but not whether the result is correct or safe.

**Proposed fix**: Add at least two new checks:
1. **Scope compliance** (`files_in_allowlist`): verify every changed file matches the allowlist (duplicates Layer 2 but catches issues earlier, before the sandbox step).
2. **Build passes** (`npm_validate_passes`): run `npm run validate` in the sandbox and report pass/fail (this is already done by `_sandboxed_validate` but making it an eval check lets it participate in the blocking/advisory framework and produce structured results).

Lint-only and test-only checks can follow in later milestones if the `npm run validate` composite check is insufficient.

### Gap 6: No Retry — Priority: High

**Problem**: When a patch fails (build gate, eval, or apply), the user must manually re-trigger from the UI. No failure context is fed back to the agent for self-correction.

**Proposed fix**: See §6 (Retry Strategy).

### Gap 7: Pi Timeout 600s / No Progress — Priority: Medium

**Problem**: `pi` subprocess runs for up to 600s. The frontend only sees "working on a change" with no incremental progress. Users don't know if the agent is stuck or making progress.

**Proposed fix**: Two approaches (implement the simpler one first):
1. **Elapsed-time reporting**: The runtime already knows when `pi` started. Expose elapsed time in the poll response. The frontend can show "Working… (45s)" or a progress indicator. Cheap to implement, limited information.
2. **Streaming stdout capture** (future): Replace `subprocess.run()` with `subprocess.Popen()` and read stdout/stderr lines incrementally. Forward them via a streaming endpoint or batch them into the poll response. More useful but more complex.

**M13 scope**: Implement approach 1 (elapsed-time reporting). Approach 2 is a future enhancement.

### Gap 8: Prompt Quality — Priority: High

**Problem**: The prompt sent to `pi` is a single sentence with no codebase context, no output format guidance, no few-shot examples, and no scope constraints. Patch quality depends entirely on pi's own behavior.

**Proposed fix**: See §7 (Prompt Improvements).

### Gap 9: `_trigger_reload()` No-Op — Priority: Low (Resolved)

**Problem**: The method is a no-op stub. However, the frontend already handles reload: after seeing `applied` status, it waits 400ms then calls `window.location.reload()`. Vite HMR watches the filesystem for dev mode.

**Resolution**: This is **working as designed**. The runtime doesn't need to trigger a reload because the frontend handles it. The method name is misleading but harmless.

**Action**: Rename to `_on_post_apply()` and add a comment clarifying the contract. No behavioral change.

---

## 4. Conversational Feedback-Refinement Phase

This is the primary new capability for M13 and the highest-leverage reliability improvement.

### 4.1 Concept

When the user clicks "Fix with AI", instead of immediately dispatching the raw feedback to the patch agent, the system opens a **refinement conversation**. A model (using the existing chat infrastructure) converses with the user to:
1. Understand what they want changed.
2. Ask clarifying questions grounded in the current software state.
3. Produce a structured spec.
4. Get explicit user confirmation before the patch agent runs.

### 4.2 Conversation Flow

```
User clicks "Fix with AI" on a feedback item
    │
    ▼
System opens refinement conversation (new conversation mode: "refine")
    │
    ▼
System sends initial message:
  "I'll help refine this into a clear spec for the coding agent.
   Here's what I understand so far: [feedback text]
   Let me look at the relevant code to understand the current state..."
    │
    ▼
Model receives: system prompt + feedback text + software context (see §4.3)
    │
    ▼
Model asks 1-3 clarifying questions (or confirms understanding if feedback is clear)
    │
    ▼
User answers / provides more detail
    │
    ▼  (1-3 rounds typical; max 10 rounds before auto-summarize)
    │
    ▼
Model produces a structured spec summary:
  "Here's what I'll ask the coding agent to do:
   **Goal**: [one sentence]
   **Changes**: [bulleted list of specific file/component changes]
   **Constraints**: [what should NOT change]
   **Acceptance**: [how the user will know it worked]

   Ready to proceed? [Run Agent] [Edit] [Cancel]"
    │
    ▼
User clicks [Run Agent]
    │
    ▼
System sends the structured spec to POST /agent/code-patch (replaces raw feedback)
```

### 4.3 Context Injection

The refinement model receives context about the current software state so it can ask informed questions and propose realistic changes. Context is assembled by the runtime and sent alongside the feedback.

| Context piece | Source | When included |
|---|---|---|
| **File tree** (allowlisted dirs) | `find` on allowlisted patterns | Always |
| **Recent changes** (last 5 commits) | `git log --oneline -5` | Always |
| **Relevant source excerpts** | Read files matching feedback keywords/area | When feedback mentions a specific component or area |
| **Current feature flags** | Feature flag store | Always (small payload) |
| **Recent patch history** (last 3) | `PatchStorage` | Always (helps avoid repeating failures) |

**Context budget**: Cap total injected context at ~8,000 tokens. Prioritize file tree + recent changes + relevant excerpts. Truncate excerpts if needed.

**New endpoint**: `POST /agent/refine-context` — assembles and returns the context payload. The frontend calls this when opening the refinement conversation, then passes the context to the chat model as a system message.

### 4.4 Spec Format

The refined spec is a structured JSON object that replaces the current raw `feedback_summary` in the `CodePatchRequest`:

```json
{
  "goal": "Make the welcome message in new conversations feel more conversational and friendly",
  "changes": [
    "Update greeting text in apps/desktop/src/App.tsx",
    "Adjust placeholder text in the composer component"
  ],
  "constraints": [
    "Do not change the layout or component structure",
    "Keep the app name unchanged"
  ],
  "acceptance": [
    "New chat shows a warmer greeting",
    "Composer placeholder is conversational"
  ],
  "context_excerpts": ["// relevant code snippets included by the refinement model"],
  "refinement_conversation_id": "conv-refine-abc123"
}
```

The `CodePatchRequest` model gains an optional `refined_spec` field. When present, the patch agent uses the structured spec instead of raw `feedback_summary`.

### 4.5 Integration with Existing UI

The refinement conversation reuses the existing chat infrastructure:

- **Conversation mode**: A new conversation with `mode: "refine"` (distinct from regular chat).
- **Model routing**: Uses the user's configured chat model (no separate model config needed).
- **System prompt**: A dedicated refinement system prompt (see §4.6) replaces the normal chat system prompt.
- **UI treatment**: The refinement conversation opens in the main chat area. The improvement sheet closes. A header badge indicates "Refining feedback" mode. The conversation ends with the structured spec and action buttons.

**User can always skip refinement**: A "Skip → Run Agent Directly" option is available for users who know exactly what they want. This sends raw feedback as today.

### 4.6 Refinement System Prompt

```
You are a requirements analyst helping a user refine their feedback into a clear, 
actionable spec for a coding agent.

The user has submitted feedback about a desktop application built with 
React + Tailwind + shadcn/ui (Tauri shell, FastAPI runtime).

Your job:
1. Understand what the user wants changed.
2. Ask 1-3 focused clarifying questions if the feedback is ambiguous. 
   Ground your questions in the actual code/state provided in the context.
3. When you have enough clarity, produce a structured spec in this exact format:

**Goal**: [one sentence describing the desired outcome]
**Changes**: 
- [specific file or component change 1]
- [specific file or component change 2]
**Constraints**: 
- [what should NOT change]
**Acceptance**: 
- [how the user will verify the change worked]

4. Ask the user to confirm: "Ready to run the coding agent with this spec?"

Rules:
- Be concise. Each clarifying question should be one sentence.
- Do not ask more than 3 questions per round.
- If the feedback is already clear and specific, skip to the spec immediately.
- Reference actual file names, component names, and current behavior from the context.
- Do not propose changes outside the scope of the user's feedback.
```

### 4.7 Edge Cases

| Edge case | Handling |
|---|---|
| User clicks "Skip → Run Agent Directly" | Raw feedback sent as today. No refinement conversation created. |
| User abandons refinement conversation | Conversation stored but no patch triggered. Feedback item remains in feedback panel. |
| Model asks too many questions | Auto-summarize after 10 user messages. Present spec for confirmation. |
| Refinement model hallucinates file names | Context injection provides the real file tree. The spec is validated against the allowlist before dispatch. |
| User edits the generated spec | Supported: "Edit" button re-opens the conversation for another round. |
| Feedback already references a specific message | Context pointer (`conv-123:msg-456`) is passed to the refinement model as additional context. |

---

## 5. Eval Policy: Blocking vs. Advisory

### Policy

| Check | Mode | Rationale |
|---|---|---|
| `patch_applies_cleanly` | **Blocking** | A patch that doesn't apply is useless. Must block before wasting sandbox time. |
| `files_in_allowlist` (new) | **Blocking** | Scope violations are a hard constraint. Already enforced by Layer 2 but catching it in evals produces better error messages and feeds into retry context. |
| `npm_validate_passes` (new) | **Blocking** | Build/lint/test failures mean the patch would break the app. Already enforced by `_sandboxed_validate` but structured eval results enable retry. |
| Future checks (e.g., prompt-eval quality) | Advisory | Subjective quality checks should inform but not block. |

### Implementation

`_run_evals()` gains a `blocking` parameter per check result. The method signature changes:

```python
def _run_evals(self, artifact: PatchArtifact) -> None:
    # ... run checks ...
    # If any blocking check fails:
    #   raise ApplyError("eval_blocked", "Blocking eval failed: {details}")
    # Advisory failures: log to artifact.log_text, continue
```

Each check's YAML case gains a `blocking: true/false` field. The harness returns structured results including the blocking flag. `_run_evals` reads the flag and raises `ApplyError` for any blocking failure.

### Eval Check: `files_in_allowlist`

Inputs: `patch_content` (unified diff), `allowlist_path` (path to `patch-allowlist.json`).
Logic: Parse file paths from diff headers (`--- a/...`, `+++ b/...`), check each against allowlist patterns.
Pass: All files match at least one pattern.
Fail: Any file violates the allowlist.

### Eval Check: `npm_validate_passes`

Inputs: `patch_content`, `repo_root`.
Logic: Copy `apps/desktop/` to temp dir, apply patch, run `npm run validate`.
Pass: Exit code 0.
Fail: Non-zero exit code (include stdout/stderr in details).

Note: This duplicates `_sandboxed_validate`. Once this eval check exists, `_sandboxed_validate` can be replaced by the eval framework, unifying the validation path. This refactoring is optional for M13 but recommended.

---

## 6. Retry Strategy

### Trigger Conditions
Retry is attempted when a patch fails due to:
- `eval_blocked` (any blocking eval failure)
- `validation_failed` (sandbox build gate)
- `patch_apply_failed` (patch utility failure)

Retry is **not** attempted for:
- `scope_blocked` (fundamental input problem — needs human refinement)
- `base_ref_mismatch` (timing issue — needs fresh base_ref)
- `harness_unavailable` (infrastructure problem)
- `patch_timeout` (agent took too long — retrying won't help)

### Retry Flow

```
Patch fails (retriable reason)
    │
    ▼
Construct retry context:
  - Original refined spec (or raw feedback)
  - Failure reason + details (eval output, build errors, patch rejection)
  - The diff that failed (so the agent can see what went wrong)
    │
    ▼
Append retry context to prompt:
  "Your previous attempt failed. Here's what went wrong:
   [failure reason + details]
   [failed diff]
   Please try again, addressing the failure."
    │
    ▼
Re-invoke patch agent with enriched prompt
    │
    ▼
If retry succeeds → normal apply flow
If retry fails → give up, notify user
```

### Configuration

| Parameter | Value | Rationale |
|---|---|---|
| Max retries | 1 | One retry with failure context is high-value. Multiple retries have diminishing returns and multiply cost/time. |
| Retry delay | 0s | No delay needed; the retry runs immediately with enriched context. |
| Context injection | Failure reason + details + failed diff | The agent needs to know why it failed to produce a better patch. |
| Give-up behavior | Set status to `apply_failed` with `failure_reason: "retry_exhausted"`. User sees "The coding agent couldn't produce a working change after two attempts. Try refining your feedback and running again." |

### State Machine Update

The `PatchArtifact.status` gains one new value: `retrying`. Transitions:

```
pending_apply → applying → [eval/validation failure] → retrying → applying → applied
                                                                            → apply_failed (retry_exhausted)
```

---

## 7. Prompt Improvements

### 7.1 Structured Prompt Template

Replace the current single-sentence prompt with a multi-section template. The runtime assembles this from config + context before sending to `pi`.

```
=== ROLE ===
You are a code modification agent for a desktop application.
Technology: React + TypeScript + Tailwind CSS + shadcn/ui (frontend),
            Python FastAPI (runtime), Tauri (shell).

=== SCOPE CONSTRAINTS ===
You may ONLY modify files matching these patterns:
{allowlist_patterns_from_config}

You MUST NOT:
- Modify package.json, tsconfig.json, vite.config.ts, or any build config
- Add new npm or pip dependencies
- Delete files
- Create files outside the allowlisted directories

=== CHANGE REQUEST ===
{refined_spec_or_raw_feedback}

=== CODEBASE CONTEXT ===
File tree (allowlisted directories):
{file_tree}

Recent changes (last 5 commits):
{recent_commits}

{relevant_source_excerpts}

=== OUTPUT REQUIREMENTS ===
- Make the minimal change that satisfies the request.
- Preserve existing code style and conventions.
- Do not add comments explaining what you changed.
- If the change requires modifying multiple files, modify all of them in a single pass.
- If you cannot make the change within scope constraints, explain why and stop.

=== PREVIOUS ATTEMPT (if retry) ===
{retry_context_if_applicable}
```

### 7.2 Dynamic Allowlist in Prompt

Instead of hardcoding the allowlist in the prompt, read patterns from `patch-allowlist.json` at prompt-assembly time. This keeps Layer 1 (prompt) and Layer 2 (server-side check) automatically in sync.

### 7.3 Context Assembly

The prompt context assembly function (`_assemble_prompt_context`) lives in `patch_agent.py` and:
1. Reads `patch-allowlist.json` patterns.
2. Runs `find` or `git ls-files` to produce a file tree of allowlisted directories.
3. Runs `git log --oneline -5` for recent changes.
4. If a refined spec includes `context_excerpts`, includes them. Otherwise, performs a keyword search in the file tree.
5. Caps total context at ~8,000 tokens.

---

## 8. Progress Reporting

### Elapsed-Time Reporting (M13 Scope)

**Runtime change**: Track `started_at` timestamp when `pi` is invoked. Add `elapsed_seconds` and `started_at` to the `GET /agent/patch-status/{patch_id}` response for in-flight patches.

**Frontend change**: Display elapsed time in `PatchNotification` during `pending`/`applying` states. Format: "Working on your change… (45s)" with a live-updating counter.

**Model change**: Add `started_at: str | None` and `elapsed_seconds: int | None` to `PatchStatusResponse`.

---

## 9. Implementation Tickets (Prioritized)

Tickets should be implemented in order. Dependencies are noted.

| Rank | Ticket ID | Title | Area | Dependencies | Effort |
|---|---|---|---|---|---|
| 1 | TBD-1 | Prompt improvements: structured template + dynamic allowlist + context assembly | core | None | M |
| 2 | TBD-2 | Eval harness expansion: `files_in_allowlist` + `npm_validate_passes` + blocking policy | core | None | M |
| 3 | TBD-3 | Retry with failure context: one auto-retry on retriable failures | core | TBD-1, TBD-2 | M |
| 4 | TBD-4 | Conversational feedback-refinement: refinement conversation mode + context endpoint + UI | core+ui | TBD-1 | L |
| 5 | TBD-5 | Progress reporting: elapsed-time in poll response + frontend counter | core+ui | None | S |

### Rationale for Order
1. **Prompt improvements first**: Immediately improves patch quality for every run. No UI changes needed. Unblocks the retry ticket (retry context uses the same prompt template).
2. **Eval expansion second**: Adds blocking checks that prevent bad patches from landing. Independent of prompt work but required for retry to be meaningful.
3. **Retry third**: Depends on both prompt template (for context injection format) and eval expansion (for structured failure results to feed back).
4. **Refinement conversation fourth**: Largest scope ticket. Depends on prompt template (the refined spec feeds into the same template). Can be developed in parallel with TBD-2/TBD-3 since it's mostly frontend + a new endpoint.
5. **Progress reporting last**: Smallest, independent. Nice UX improvement but not on the critical reliability path.

### Ticket Sizing Legend
- **S**: < 1 session, straightforward changes, well-scoped.
- **M**: 1 session, some design decisions within the ticket, moderate file spread.
- **L**: 1-2 sessions, frontend + backend + new endpoint/mode, needs subtask breakdown.

---

## 10. Migration and Backward Compatibility

- **`CodePatchRequest`** gains an optional `refined_spec: dict | None` field. Existing callers that send raw feedback continue to work (the agent falls back to `feedback_summary` when `refined_spec` is absent).
- **Eval YAML cases** gain an optional `blocking: true` field. Existing cases default to `blocking: false` (advisory) for backward compat.
- **`PatchArtifact.status`** gains `retrying` as a new value. Frontend polling should treat unknown statuses as "in progress" (already the case).
- **No database migration**: All changes are to the Python runtime and React frontend. No schema changes to SQLite tables.

---

## 11. Validation Plan

### Tier 1: Deterministic (per-ticket)

Each implementation ticket includes its own deterministic acceptance criteria. Cross-cutting checks:
- `uv run pytest` exits 0 after each ticket.
- `npm run validate` passes in `apps/desktop/`.
- Existing eval cases continue to pass.

### Tier 2: Micro-Validation (epic-level, after batch ships)

After TBD-1 through TBD-4 are shipped:

1. **Prompt quality probe**: Run the self-evolve flow with 3 sample feedback items. Compare patch quality (applies cleanly, addresses the feedback, no scope violations) before and after prompt improvements.
2. **Refinement conversation probe**: Walk through the refinement flow with a vague feedback item. Verify the model asks relevant clarifying questions and produces a structured spec. Verify "Skip" still works.
3. **Retry probe**: Deliberately trigger a retriable failure (e.g., introduce a syntax error in the stub). Verify the retry fires, feeds back failure context, and produces a different patch.

Micro-validation results recorded in the E-0016 epic file and/or a dedicated QA checkpoint.
