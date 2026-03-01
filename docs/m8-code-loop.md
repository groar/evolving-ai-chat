# M8 Agentic Code Modification Loop — Design Spec

*Source of truth for all M8 implementation tickets. See T-0058 (spec ticket) and E-0010 (epic).*

---

## 1. Goals and Non-Goals

### Goals
- Define the end-to-end data flow: feedback event → agent invocation → patch artifact → autonomous apply → rollback path.
- Establish M8 scope bounds so implementers don't need to invent critical decisions.
- Define what "apply" means mechanically (git commit + rebuild).
- Define what "rollback" means mechanically (git revert + rebuild).
- Specify the scope guard that prevents the agent from touching files outside the M8 allowlist.
- Enumerate edge cases and their explicit handling decisions.

### Non-Goals (M8)
- User code review before apply — the user sees the *result*, not the diff. Rollback is the safety valve.
- Backend (Python runtime) self-modification.
- Multi-file refactors, dependency additions, schema migrations.
- Model routing or feature flag changes via the loop.
- The improvement-class registry (M7 concept) — replaced by simpler feedback-to-agent routing.
- Autonomous acceptance without rollback availability.

---

## 2. Principle: No-Review, Git-Backed Autonomy

M8 deliberately removes the code-review step from the user's path. The key insight from F-20260301-008 is that the user expects the system to *just make the change* — they shouldn't have to read diffs. Safety comes from:

1. **Tight scope guard**: agent is hard-constrained to the UI layer (allowlisted files/directories).
2. **Sandboxed build gate**: lint + tests run before the commit lands; failures auto-abort.
3. **Reversible by default**: every applied change is a named git commit. Rollback is one action, always available.
4. **Human-readable description**: the user sees a plain-language summary ("Updated the welcome copy to be more conversational"), not source code.

This mirrors how a capable human collaborator operates: "I made a small change to the UI copy — let me know if it doesn't feel right and I'll revert it."

---

## 3. Loop Data Flow

### 3.1 Feedback → Agent Trigger

| Step | Description |
|---|---|
| **Event** | User submits feedback via the in-app feedback form (existing `feedbackStore.ts` capture path). |
| **Payload** | Feedback item: `{ id, title, summary, area, severity }`. The frontend attaches the current git SHA as `base_ref` for traceability. |
| **Eligibility** | Any feedback with `area` that maps to a UI-layer concern is eligible for M8 code generation. Eligibility check is a frontend classification: if `area` starts with `ui.` or `settings.` or is otherwise tagged as UI-layer, route to agent. Other areas are stored but do not trigger the code agent in M8. |
| **Agent invocation** | Frontend calls a new runtime endpoint `POST /agent/code-patch` (see §4). The runtime forwards the request to an external code-generation agent harness (pi.dev API or equivalent). The harness receives the feedback payload + the current state of allowed source files. |
| **System prompt / constraint injection** | The runtime prepends a scope-guard system prompt (see §6) to every agent call. The model cannot see or modify files outside the allowlist. |

### 3.2 Patch Artifact Format

The agent harness returns a structured response. The runtime stores this as a **patch artifact** before any file is written.

```json
{
  "id": "PA-20260301-001",
  "created_at": "2026-03-01T14:22:00Z",
  "feedback_id": "FB-20260301-001",
  "base_ref": "abc1234",
  "status": "pending_apply",
  "title": "Updated welcome copy to feel more conversational",
  "description": "Changed the greeting in the chat header and adjusted two placeholder strings in the settings panel for clarity.",
  "files_changed": [
    "apps/desktop/src/App.tsx",
    "apps/desktop/src/settingsPanel.tsx"
  ],
  "unified_diff": "--- a/apps/desktop/src/App.tsx\n+++ ...",
  "scope_violations": [],
  "agent_model": "claude-3-5-sonnet",
  "agent_harness": "pi.dev-v1"
}
```

**Storage**: patch artifacts are stored in `apps/desktop/runtime/storage/patches/` as JSON files, keyed by `id`. They are also recorded in the existing proposal/changelog store so the UI can surface them.

**Metadata invariants**:
- `base_ref` must match the git SHA at invocation time. If the working tree has drifted before apply, the apply is rejected with `base_ref_mismatch`.
- `scope_violations` must be empty before the patch is allowed to proceed to apply. If the harness returns violations, the artifact is stored as `status: scope_blocked` and the user is notified (see §5 failure states).
- `unified_diff` is stored for traceability and to power the "see what changed" toggle, but the user is never required to read it.

### 3.3 Apply Path

1. **Receive artifact**: runtime receives the patch artifact from the agent harness.
2. **Scope validation**: runtime re-checks every file path in `files_changed` against the allowlist (belt-and-suspenders; the system prompt already constrains the agent).
3. **Sandboxed build/lint gate**: runtime applies the patch to a temporary working copy and runs `npm run validate` (lint + unit tests). If validation fails → artifact status set to `apply_failed`, user notified, no source files modified.
4. **Atomic git commit**: if validation passes, the patch is written to the actual working copy and committed:
   ```
   git add <files_changed>
   git commit -m "agent(m8): <title> [PA-<id>]"
   ```
   The commit message embeds the patch artifact ID for full traceability.
5. **Rebuild / hot-reload**: runtime triggers a Vite dev-server hot module reload (or full rebuild for production). The change is live.
6. **Artifact status update**: artifact updated to `status: applied`, `applied_at`, `git_commit_sha` recorded.
7. **User notification**: in-app notification: "I made a change: [description]. Undo?" with a one-action rollback affordance.

### 3.4 Rollback Path

Rollback is always available for any `status: applied` patch artifact. It is exposed:
- In the in-app notification immediately after apply.
- In the Changelog panel (persistent history), as an "Undo" action on each entry.

**Mechanical steps**:
1. User clicks "Undo" on a patch entry.
2. Frontend calls `POST /agent/rollback` with `{ patch_id }`.
3. Runtime checks: is `git_commit_sha` still reachable (not squashed/rebased/overwritten)? If yes, proceed. If no, return `rollback_unavailable` with explanation.
4. Runtime runs:
   ```
   git revert <git_commit_sha> --no-edit
   ```
   This creates a new revert commit, preserving full history.
5. Runtime triggers rebuild/hot-reload.
6. Artifact status updated to `status: reverted`, `reverted_at`, `revert_commit_sha` recorded.
7. User notification: "Change undone. The app is back to how it was."

**Ordering / conflict concern**: if a later patch has modified the same files, `git revert` may produce conflicts. In M8, this is handled as follows:
- If revert produces conflicts → abort revert → return `rollback_conflict` status → user is notified: "Can't undo this change automatically — a later change modified the same files. Create a new feedback item to guide a corrective change."
- No partial or forced conflict resolution in M8.

### 3.5 Diff Toggle (Optional / Non-blocking)

Even though the user is not required to review code, the system provides a "See what changed ↓" toggle in the notification and changelog entry. Tapping it reveals a formatted unified diff in a read-only panel. This is purely informational and does not block or gate any action.

---

## 4. Runtime Endpoint Spec (`POST /agent/code-patch`)

**Request**:
```json
{
  "feedback_id": "FB-20260301-001",
  "feedback_title": "Welcome message feels robotic",
  "feedback_summary": "The first message in a new chat feels stiff and unfriendly.",
  "feedback_area": "ui.chat",
  "base_ref": "abc1234"
}
```

**Response** (success — patch generated and queued for apply):
```json
{
  "patch_id": "PA-20260301-001",
  "status": "applying",
  "title": "Updated welcome copy to feel more conversational",
  "description": "...",
  "eta_seconds": 15
}
```

**Response** (scope blocked):
```json
{
  "patch_id": "PA-20260301-001",
  "status": "scope_blocked",
  "scope_violations": ["apps/desktop/runtime/main.py"]
}
```

The apply runs asynchronously; the frontend polls `GET /agent/patch-status/{patch_id}` until `status` transitions to `applied`, `apply_failed`, or `scope_blocked`.

---

## 5. UI States and Notifications

The user never sees a blocking review screen. All feedback is delivered as non-blocking in-app notifications and changelog entries.

| State | What the user sees | Available actions |
|---|---|---|
| `pending` | "Working on a change based on your feedback…" (spinner) | — |
| `applying` | "Applying change…" (spinner) | — |
| `applied` | "I made a change: [description]. Undo?" | Undo · See what changed |
| `apply_failed` | "Couldn't apply the change: [reason]. No files were modified." | Dismiss · See details |
| `scope_blocked` | "The agent tried to modify files outside the allowed area. Change blocked." | Dismiss · See details |
| `reverted` | "Change undone. The app is back to how it was." | See what was reverted |
| `rollback_conflict` | "Can't undo this automatically — a later change modified the same files." | Dismiss |
| `rollback_unavailable` | "Rollback is no longer available for this change." | Dismiss |

**Copy constraints**:
- Must not say "approved" or imply user did anything before the change was applied.
- Must not hide the Undo action after `applied` — it must remain accessible from the Changelog.
- Must not say "the change is permanent" — all applied changes are revocable until a conflict prevents it.
- Spinner states must not say "Done" until apply is confirmed.

---

## 6. Scope Guard

Two complementary layers:

### Layer 1 — System Prompt Constraint (agent-side)
Every call to the code-generation agent harness begins with:

```
You are a UI code assistant for an Electron/React desktop application.
You may ONLY modify files in the following allowlist:
  - apps/desktop/src/ (React components, stores, hooks, styles)
You MUST NOT modify:
  - Any file outside apps/desktop/src/
  - Any Python file (.py)
  - package.json, package-lock.json, tsconfig.json, vite.config.ts, or any build/config file
  - Any file in apps/desktop/runtime/
  - Any file in tickets/, docs/, or tests/
Changes must be limited to: UI copy, component layout, CSS/styles, and small logic changes within existing components.
Do not add new npm dependencies. Do not delete files.
```

### Layer 2 — Server-side Allowlist Validation (runtime-side)
After receiving the patch artifact, the runtime checks every path in `files_changed` against the allowlist regex:
```
^apps/desktop/src/
```
Any path that does not match → reject the entire patch, set `scope_violations`, return `scope_blocked`.

This double-layer means even a misbehaving or jailbroken agent cannot touch files outside the UI layer.

---

## 7. Edge Cases and Explicit Handling Decisions

| Edge case | Handling |
|---|---|
| **Agent returns malformed or empty patch** | Artifact stored as `apply_failed` with reason `empty_or_malformed_patch`. User notified. No files touched. |
| **Patch applies but lint/tests fail** | Artifact stored as `apply_failed` with reason `validation_failed` + gate details. No commit created. User notified. |
| **User feedback area is not UI-layer** | Feedback stored normally. No code agent triggered. User sees no notification (the feedback is just captured; future milestones may route non-UI feedback differently). |
| **base_ref mismatch at apply time** | Apply aborted. Artifact status `apply_failed`, reason `base_ref_mismatch`. User notified: "The codebase changed since this patch was generated. Resubmit your feedback." |
| **Rollback after a later patch modified same files** | `git revert` conflict → abort revert → status `rollback_conflict`. User notified with explanation. No corrective action attempted automatically. |
| **Agent tries to modify files outside allowlist** | Layer 2 scope check catches it. Artifact `scope_blocked`. User notified. Logged for review. |
| **Agent harness is unreachable / times out** | Request fails with `harness_unavailable`. User notified: "Couldn't reach the change agent right now. Try again later." Feedback item retained. |
| **Two patches queued simultaneously** | M8 allows only one patch in `pending` or `applying` state at a time. A second trigger while one is in-flight returns `patch_in_progress`; the new feedback is stored for later. |

---

## 8. Agent Harness Integration (pi.dev / External)

M8 relies on an external code-generation agent harness — the reference implementation is pi.dev or a compatible API that accepts:
- A natural-language change description (derived from feedback).
- The current content of the allowlisted source files (as context).
- The scope constraint system prompt (§6).

And returns a structured patch (unified diff or file-content deltas).

**Runtime responsibilities**:
1. Read current content of allowlisted files and include as context in the harness request.
2. Strip any file contents from the response that are not in the allowlist.
3. Translate the harness response into the canonical patch artifact schema (§3.2).

**Harness abstraction**: the runtime wraps the harness call behind a `PatchAgent` interface so the concrete harness (pi.dev, Claude API with tool use, local model, etc.) can be swapped without changing the apply/rollback logic.

---

## 9. M8 Scope Bounds Summary

| In scope (M8) | Out of scope (M8) |
|---|---|
| `apps/desktop/src/**` React components | Any file outside `apps/desktop/src/` |
| UI copy changes | Python runtime (`apps/desktop/runtime/`) |
| CSS / Tailwind styles | `package.json`, build configs |
| Small logic changes inside existing components | New files (no file creation in M8) |
| One patch in flight at a time | Multi-file refactors, dependency additions |
| Rollback via `git revert` | Schema migrations, data migrations |

---

## 10. Implementation Tickets (Drafted from This Spec)

| Ticket | Area | Summary |
|---|---|---|
| T-0059 | core | Agent harness integration — `PatchAgent` interface, `POST /agent/code-patch`, harness API client, scope-guard system prompt, patch artifact schema |
| T-0060 | core | Git-backed apply/rollback — sandboxed build gate, `git commit` on accept, `git revert` on rollback, `POST /agent/rollback`, status transitions |
| T-0061 | ui | Non-review UI — in-app notification states, Changelog panel Undo action, "See what changed" diff toggle, all copy strings |

---

## 11. Validation Plan

### Tier 1 (deterministic, covers all three implementation tickets)
- End-to-end: submit feedback → `POST /agent/code-patch` → patch artifact created → build gate passes → git commit created → hot-reload → user notification shows "applied".
- Rollback: apply a patch → call `POST /agent/rollback` → revert commit created → hot-reload → notification shows "reverted".
- Scope guard: craft a patch that targets a Python file → server rejects with `scope_blocked` → no files modified.
- Build-gate failure: craft a patch that breaks lint → artifact `apply_failed` → no commit created.
- Evidence: QA checkpoint in `tickets/meta/qa/`.

### Tier 2 (micro-validation — after first real loop ships; per E-0010 Validation Plan)
- "Here's what the system changed [show description]. Does this look right?"
- "You can undo it. How would you do that?"
- Pass criteria: user understands what changed and can locate rollback without guidance.
