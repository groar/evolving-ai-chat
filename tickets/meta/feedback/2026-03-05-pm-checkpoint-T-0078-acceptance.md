# PM Checkpoint — T-0078 Acceptance

**Date**: 2026-03-05  
**Type**: Post-QA acceptance  

## What was accepted

**T-0078: Fix test_chat.py — Apply Chat Mock at Request Time** — moved from `review/` to `done/`.

Shippable because:

- The chat endpoint now supports a FastAPI `get_chat_router` dependency that defaults to the existing `chat_router` instance, enabling clean injection of fakes in tests without changing user-facing behavior.
- `test_chat.py` was updated to use `app.dependency_overrides[get_chat_router]` for chat and streaming tests, ensuring mocks are applied at request time and eliminating the previous 502 responses from the error handler.
- QA checkpoint `2026-03-05-qa-T-0078.md` confirms all chat tests (including previously failing happy-path and streaming cases) now pass, with no live network calls during unit tests and no regressions in `test_proposals.py` or `test_apply_rollback.py`.
- This continues M11’s goal of driving toward a green baseline via narrowly scoped runtime/test harness fixes.

## Queue / board update

- T-0078 moved from `tickets/status/review/` to `tickets/status/done/`.
- M11 ready queue (T-0079, T-0080) remains valid; no reprioritization requested as part of this acceptance.

## Validation testing

- No tier-2/3 external validation required (`Area: core`, runtime/test harness change only).
- Deterministic pytest coverage is sufficient for this ticket; future chat behavior changes should continue to lean on unit tests + targeted QA.

## PM process note

- Dependency-based injection for adapters (via FastAPI `dependency_overrides`) should be the preferred pattern for future runtime tests that need strict isolation from external providers; direct `unittest.mock.patch` on deep attributes is fragile when apps evolve.

## Suggested commit message (PM perspective)

```
test(m11): fix chat runtime mocks via FastAPI dependency override and accept T-0078
```

