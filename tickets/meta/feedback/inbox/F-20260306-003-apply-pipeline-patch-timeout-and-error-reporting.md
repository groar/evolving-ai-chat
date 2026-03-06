# F-20260306-003: Apply pipeline — patch timeout & unhelpful error reporting

## Metadata
- ID: F-20260306-003
- Status: ticketed
- Source: user-observation
- Theme: reliability, observability
- Severity: S1
- Linked Tickets: T-0086
- Received: 2026-03-06
- Updated: 2026-03-06

## Raw Feedback (Sanitized)
User observed `subprocess.TimeoutExpired` crashing the apply pipeline for patch `PA-20260306-61d5451d`. The `patch -p1` command timed out after 30 seconds. The resulting artifact status shows `failure_reason = "unexpected_error"` — the generic catch-all — giving the user no actionable information.

Verbatim traceback excerpt:
```
subprocess.TimeoutExpired: Command '['patch', '-p1', '--input', '...tmptymn7670.patch']' timed out after 30 seconds
```

User requests:
1. Increase the timeout to at least 3 minutes.
2. Better handle and report those errors to the user.

## Normalized Summary
The `patch` subprocess in `apply_pipeline._apply_patch()` uses a 30-second timeout that fires on legitimate but slow patches. The `TimeoutExpired` exception bypasses the `ApplyError` handler and lands in the bare `except Exception` branch, setting `failure_reason = "unexpected_error"` — which is opaque to the user and to diagnostics.

## PM Notes
- Concrete mismatch:
  - **User context**: Fix with AI flow, patch application step.
  - **Expected behavior**: Patch applies (or fails with a clear, actionable reason).
  - **Observed behavior**: Apply fails silently with `failure_reason = "unexpected_error"`; console shows a long Python traceback but the user sees only a generic error.
  - **Why it reads as broken**: The product logged a successful status poll (`GET /agent/patch-status/... 200 OK`) immediately after the crash, masking the failure from the user.
- The fix is straightforward and well-scoped: no design ambiguity.
- Both the timeout value and the error classification path need to change.

## Triage Decision
- Decision: ticketed → T-0086 (P1, rank 1 in ready queue)
- Rationale: S1 reliability bug; blocks the core "Fix with AI" apply flow for non-trivial patches. No external validation required — deterministic fix.
- Revisit Trigger: After T-0086 ships; verify `failure_reason` surfaces correctly in UI.
