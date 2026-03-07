# M13 Self-Evolve Reliability Hardening — Design Spec

*Source of truth for all M13 implementation tickets. See T-0088 (spec ticket) and E-0016 (epic).*

---

## 1. Goals and Non-Goals

### Goals
- Design and specify the **conversational feedback-refinement phase**: a chat interaction that takes raw user feedback, asks clarifying questions grounded in product-level context (not code), and produces a validated **functional description** of the desired change. The refinement conversation focuses exclusively on the "what" (user-facing behavior); the self-evolving agent handles the "how" (technical translation → ticket → implementation).
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
**Proposed flow**: Feedback → **Refinement Conversation** (functional only, no code access) → Validated Functional Description → Self-Evolving Agent → Ticket/Spec → Patch

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

When the user clicks "Fix with AI", the system opens a **refinement conversation** instead of immediately dispatching the raw feedback to the patch agent. A model (using the existing chat infrastructure) converses with the user to:
1. Understand what the user wants changed **from a functional/user-experience perspective**.
2. Ask clarifying questions grounded in product-level context (not code).
3. Produce a validated **functional description** of the desired behavior change.
4. Get explicit user confirmation before the self-evolving agent runs.

**Key design principle**: The refinement conversation is strictly functional. It focuses on *what changes for the user*, not *how to implement it*. The model does not see source code, does not reference file names or components, and does not propose implementation approaches. The self-evolving agent (which runs after refinement) handles all technical translation: creating a ticket/spec, choosing which files to modify, and implementing the change.

This separation avoids the refinement model making bad technical assumptions that would constrain or mislead the coding agent.

### 4.2 Conversation Flow

```
User clicks "Fix with AI" on a feedback item
    │
    ▼
System opens refinement conversation (new conversation mode: "refine")
    │
    ▼
System sends initial message:
  "I'll help clarify this feedback before the coding agent works on it.
   Here's what I understand so far: [feedback text]
   Let me ask a few questions to make sure the change is clear..."
    │
    ▼
Model receives: system prompt + feedback text + product context documents (see §4.3)
    │
    ▼
Model asks 1-3 clarifying questions about user-facing behavior
  (or confirms understanding if feedback is already clear)
    │
    ▼
User answers / provides more detail
    │
    ▼  (1-3 rounds typical; max 10 rounds before auto-summarize)
    │
    ▼
Model produces a functional description:
  "Here's what I'll send to the coding agent:

   **Goal**: [what the user wants to experience differently]
   **Current behavior**: [what happens now, from the user's perspective]
   **Desired behavior**: [what should happen instead]
   **Constraints**: [what should NOT change from the user's perspective]

   Ready to proceed? [Run Agent] [Edit] [Cancel]"
    │
    ▼
User clicks [Run Agent]
    │
    ▼
System sends the validated functional description to the self-evolving agent
```

### 4.3 Context Injection

The refinement model receives **product-level context only** — no source code, no file trees, no technical implementation details. Context is limited to a fixed set of functional documents defined in an explicit allowlist.

**Context document allowlist**: `apps/desktop/runtime/config/refinement-context-docs.json`

```json
{
  "version": "1",
  "docs": [
    "STATUS.md",
    "docs/m13-self-evolve-reliability.md"
  ],
  "notes": "Documents available to the refinement conversation model. These must be functional/product-level only — no source code. Order matters: first document gets highest priority if context budget is tight."
}
```

The runtime reads the listed documents and includes their contents (or truncated excerpts) in the refinement model's system message. Documents are included in the order listed; if the total exceeds the context budget, later documents are truncated first.

**Context budget**: Cap total injected document content at ~8,000 tokens. `STATUS.md` (product snapshot, scope, success criteria, current state) is always included in full. Subsequent documents are truncated if needed.

**New endpoint**: `GET /agent/refine-context` — reads the allowlist, assembles document contents, and returns the context payload. The frontend calls this when opening the refinement conversation, then passes the context to the chat model as a system message.

**What is NOT included**: file trees, source code, git history, feature flags, patch history, component names, or any technical implementation details. The refinement model operates at the product/UX level only.

### 4.4 Spec Format

The refined output is a **functional description** (not a technical spec). It is a structured JSON object that replaces the current raw `feedback_summary` in the `CodePatchRequest`:

```json
{
  "goal": "Make the welcome message in new conversations feel more conversational and friendly",
  "current_behavior": "New conversations open with a generic, robotic-sounding greeting",
  "desired_behavior": "New conversations open with a warm, conversational greeting that feels like talking to a helpful colleague",
  "constraints": [
    "The overall chat layout should not change",
    "Existing conversations should not be affected"
  ],
  "refinement_conversation_id": "conv-refine-abc123"
}
```

The `CodePatchRequest` model gains an optional `refined_spec` field. When present, the self-evolving agent uses the functional description to create a proper ticket/spec and then implement. The functional description does not contain file names, component references, or implementation guidance — that is the agent's job.

### 4.5 Integration with Existing UI

The refinement conversation **replaces** the current "Fix with AI → patch agent" flow entirely. There is no "skip refinement" option. The flow is always: feedback → refinement conversation → validated functional description → self-evolving agent.

- **Conversation mode**: A new conversation with `mode: "refine"` (distinct from regular chat).
- **Model routing**: Uses the user's configured chat model (no separate model config needed).
- **System prompt**: A dedicated refinement system prompt (see §4.6) replaces the normal chat system prompt.
- **UI treatment**: The refinement conversation opens in the main chat area. The improvement sheet closes. A header badge indicates "Refining feedback" mode. The conversation ends with the functional description and action buttons ([Run Agent] [Edit] [Cancel]).

### 4.6 Refinement System Prompt

```
You are a product analyst helping a user clarify their feedback about a personal
AI chat application. Your goal is to produce a clear, validated functional
description of what the user wants changed — from the user's perspective only.

You have access to product documentation that describes the application's current
state, scope, and goals. Use this context to ground your questions.

Your job:
1. Understand what the user wants to experience differently.
2. Ask 1-3 focused clarifying questions if the feedback is ambiguous.
   Focus on user-facing behavior: what they see, what they expect, what feels wrong.
3. When you have enough clarity, produce a functional description in this exact format:

**Goal**: [what the user wants to experience differently — one sentence]
**Current behavior**: [what happens now, from the user's perspective]
**Desired behavior**: [what should happen instead, from the user's perspective]
**Constraints**: [what should NOT change from the user's perspective]

4. Ask the user to confirm: "Does this capture what you want? [Run Agent] [Edit] [Cancel]"

Rules:
- Be concise. Each clarifying question should be one sentence.
- Do not ask more than 3 questions per round.
- If the feedback is already clear and specific, skip to the description immediately.
- Stay strictly functional: describe what the user sees and experiences.
- Do NOT reference file names, component names, code, or implementation details.
- Do NOT suggest how to implement the change.
- Do NOT propose technical approaches or architecture decisions.
- Your output will be handed to a coding agent that decides the implementation.
```

### 4.7 Edge Cases

| Edge case | Handling |
|---|---|
| User abandons refinement conversation | Conversation stored but no agent triggered. Feedback item remains in feedback panel for later retry. |
| Model asks too many questions | Auto-summarize after 10 user messages. Present functional description for confirmation. |
| Model references code/files despite prompt | System prompt explicitly forbids this. If it happens, the output is still usable — the self-evolving agent ignores any accidental technical references and works from the functional intent. |
| User edits the generated description | Supported: "Edit" button re-opens the conversation for another round. |
| Feedback already references a specific message | Context pointer (`conv-123:msg-456`) is passed to the refinement model as additional context about which interaction prompted the feedback. |
| Context document not found | Skip missing documents, log a warning. If all documents are missing, proceed with feedback text only (degraded but functional). |

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
  - Original functional description
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
{refined_functional_description}

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
4. Caps total context at ~8,000 tokens.

Note: The **refinement conversation** (§4) provides only functional/product-level context (from `refinement-context-docs.json`). The **patch agent prompt** (this section) provides technical/codebase context (file tree, commits). This is the correct separation: the user-facing refinement stays functional, while the coding agent gets the technical context it needs to implement.

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
| 4 | TBD-4 | Conversational feedback-refinement: functional-only refinement conversation + context doc allowlist + UI (replaces direct "Fix with AI" flow) | core+ui | TBD-1 | L |
| 5 | TBD-5 | Progress reporting: elapsed-time in poll response + frontend counter | core+ui | None | S |

### Rationale for Order
1. **Prompt improvements first**: Immediately improves patch quality for every run. No UI changes needed. Unblocks the retry ticket (retry context uses the same prompt template).
2. **Eval expansion second**: Adds blocking checks that prevent bad patches from landing. Independent of prompt work but required for retry to be meaningful.
3. **Retry third**: Depends on both prompt template (for context injection format) and eval expansion (for structured failure results to feed back).
4. **Refinement conversation fourth**: Largest scope ticket. Replaces the current direct "Fix with AI → patch agent" flow entirely with: feedback → functional refinement conversation → validated description → self-evolving agent. Depends on prompt template (the functional description feeds into the same template). Can be developed in parallel with TBD-2/TBD-3 since it's mostly frontend + a new endpoint.
5. **Progress reporting last**: Smallest, independent. Nice UX improvement but not on the critical reliability path.

### Ticket Sizing Legend
- **S**: < 1 session, straightforward changes, well-scoped.
- **M**: 1 session, some design decisions within the ticket, moderate file spread.
- **L**: 1-2 sessions, frontend + backend + new endpoint/mode, needs subtask breakdown.

---

## 10. Migration and Backward Compatibility

- **`CodePatchRequest`** gains a `refined_spec: dict | None` field. After TBD-4 ships, the refinement conversation is the only entry point (no more raw feedback path). During development of TBD-1 through TBD-3, the raw `feedback_summary` path continues to work as a transitional measure.
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
2. **Refinement conversation probe**: Walk through the refinement flow with a vague feedback item. Verify the model asks relevant functional clarifying questions (no code references), produces a functional description, and the self-evolving agent receives it after user confirmation.
3. **Retry probe**: Deliberately trigger a retriable failure (e.g., introduce a syntax error in the stub). Verify the retry fires, feeds back failure context, and produces a different patch.

Micro-validation results recorded in the E-0016 epic file and/or a dedicated QA checkpoint.
