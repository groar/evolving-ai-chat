# T-0086: Fix apply-pipeline patch timeout & user-facing error reporting

## Metadata
- ID: T-0086
- Status: ready
- Priority: P1
- Type: bug
- Area: core
- Epic: none
- Owner: ai-agent
- Created: 2026-03-06
- Updated: 2026-03-06

## Summary
The `patch` subprocess in `apply_pipeline._apply_patch()` has a 30-second timeout (`_PATCH_TIMEOUT = 30`) that fires on legitimate but slower patches. When it fires, `subprocess.TimeoutExpired` propagates out of `_apply_patch()` uncaught, bypasses the `except ApplyError` handler in `apply()`, and lands in the bare `except Exception` branch — setting `failure_reason = "unexpected_error"`. The user sees a generic, actionable-nothing error. Two fixes are required: (1) raise the timeout to 180 seconds (3 minutes), and (2) catch `TimeoutExpired` explicitly in `_apply_patch()` and re-raise it as a typed `ApplyError("patch_timeout", ...)` so the user receives a clear, diagnostic message.

## Design Spec

- **Goals:**
  - Raise `_PATCH_TIMEOUT` from 30 → 180 seconds.
  - Catch `subprocess.TimeoutExpired` in `_apply_patch()` and raise `ApplyError("patch_timeout", f"patch command timed out after {_PATCH_TIMEOUT}s")`.
  - Ensure `apply()` records `failure_reason = "patch_timeout"` (not `"unexpected_error"`) and appends the timeout detail to `artifact.description`.
  - The user-visible failure message in the UI must surface a human-readable timeout explanation (not "unexpected error").

- **Non-goals:**
  - Do not change the overall apply/rollback contract or status machine.
  - Do not change timeout for `_validate` or git subprocess steps (they have separate constants).
  - Do not implement retry logic (out of scope).

- **Rules and state transitions:**
  - `_PATCH_TIMEOUT = 180` (replace constant value only; no rename).
  - `_apply_patch()` wraps the `subprocess.run(...)` call with an additional `except subprocess.TimeoutExpired` block that raises `ApplyError("patch_timeout", f"patch command timed out after {_PATCH_TIMEOUT}s")`.
  - The same pattern should be applied to the dry-run `patch` call in `_sandboxed_validate()` if it also uses `_PATCH_TIMEOUT` (check and fix consistently).
  - The `except ApplyError` branch in `apply()` already appends `exc.details` to `artifact.description` — no changes needed there.

- **User-facing feedback plan:**
  - `failure_reason = "patch_timeout"` must surface in the UI as a readable message such as "The patch timed out. This can happen with large or complex changes. Please try again."
  - Verify via `useRuntime.ts` (or equivalent frontend hook) that `failure_reason` is displayed, not swallowed. If the UI currently swallows `failure_reason`, add a display path for it as part of this ticket.

- **Scope bounds:**
  - Change confined to `apply_pipeline.py` for the backend, and the minimal frontend path needed to surface `failure_reason` to the user.
  - Do not change `_GIT_TIMEOUT` or `_VALIDATE_TIMEOUT`.

- **Edge cases / failure modes:**
  - Patch that takes exactly 180 seconds: timeout fires, `ApplyError("patch_timeout")` raised, artifact set to `apply_failed`, `failure_reason = "patch_timeout"`.
  - `_apply_patch()` called from both `_sandboxed_validate()` and `_apply_and_commit()` — verify both call sites benefit from the fix.
  - Existing tests that mock or call `_apply_patch()` with a mocked subprocess must not break.

- **Validation plan:**
  - Unit test: mock `subprocess.run` to raise `TimeoutExpired`; assert `ApplyError("patch_timeout")` is raised by `_apply_patch()`.
  - Integration test (or manual): confirm `apply()` sets `failure_reason = "patch_timeout"` when timeout fires.
  - Frontend smoke check: verify UI shows a non-generic error string when `failure_reason = "patch_timeout"`.

## Context
- Observed in production: patch `PA-20260306-61d5451d` triggered the 30-second timeout, landed in the bare `except Exception` handler, and the user received no diagnostic information.
- The fix is unambiguous — no design invention required.
- The 3-minute minimum was specified by the user based on observed patch durations.

## References
- `apps/desktop/runtime/agent/apply_pipeline.py` — `_PATCH_TIMEOUT`, `_apply_patch()`, `apply()`
- `apps/desktop/src/hooks/useRuntime.ts` — frontend status/failure_reason consumption
- F-20260306-003

## Feedback References
- F-20260306-003

## Acceptance Criteria
- [ ] `_PATCH_TIMEOUT` is set to `180` in `apply_pipeline.py`.
- [ ] `_apply_patch()` catches `subprocess.TimeoutExpired` and raises `ApplyError("patch_timeout", f"patch command timed out after {_PATCH_TIMEOUT}s")`.
- [ ] The same `TimeoutExpired` catch is present (or not needed) in any other `subprocess.run(["patch", ...])` call within `apply_pipeline.py` — verified and consistent.
- [ ] `apply()` records `failure_reason = "patch_timeout"` (not `"unexpected_error"`) when a timeout occurs.
- [ ] Unit test added: `mock subprocess.run` raises `TimeoutExpired` → `_apply_patch()` raises `ApplyError` with `reason = "patch_timeout"`.
- [ ] `uv run pytest` exits 0 — no regressions.

## User-Facing Acceptance Criteria
- [ ] When a patch times out, the user sees a human-readable message that explains the timeout (not "unexpected error" or a raw exception string).
- [ ] The failure state is visually distinct from a permanent failure (if the UI currently has such a distinction) — or a follow-up ticket is created to add one.

## Dependencies / Sequencing
- Depends on: none
- Blocks: nothing directly, but clears the way for larger-patch workflows and reliable M12 eval harness integration

## QA Evidence Links (Required Only When Software/Behavior Changes)
- QA checkpoint: (to be filled after implementation)
- Screenshots/artifacts: (to be filled after implementation)

## Evidence (Verification)
- Tests run:
- Manual checks performed:
- Screenshots/logs/notes:

## Subtasks
- [ ] Change `_PATCH_TIMEOUT = 30` → `_PATCH_TIMEOUT = 180`
- [ ] Add `except subprocess.TimeoutExpired` in `_apply_patch()` → raise `ApplyError("patch_timeout", ...)`
- [ ] Audit other `subprocess.run(["patch", ...])` calls in the file for the same pattern
- [ ] Add unit test for timeout path
- [ ] Verify/fix frontend `failure_reason` display for `"patch_timeout"`
- [ ] Run full test suite

## Notes
- `_PATCH_TIMEOUT` is used in `_apply_patch()` at line ~360. Verify whether `_sandboxed_validate()` calls `_apply_patch()` with `--dry-run` or a separate run; if the same constant applies, the fix covers both.
- The bare `except Exception` handler in `apply()` (lines ~141–160) is a reasonable last-resort backstop; the goal is not to remove it but to ensure `TimeoutExpired` never reaches it.

## Change Log
- 2026-03-06: Ticket created by PM run. Feedback: F-20260306-003. S1 reliability bug — rank 1 in ready queue.
