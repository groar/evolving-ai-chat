# PM Checkpoint — T-0059 Acceptance

**Date**: 2026-03-01
**Type**: Post-QA acceptance

## What was accepted

**T-0059: M8 agent harness integration** — moved from `review/` to `done/`.

Shippable because:
- All 8 acceptance criteria verified with passing tests.
- QA checkpoint `2026-03-01-qa-T-0059.md` recorded: 27/27 tests pass, 0 regressions.
- One implementation deviation documented (pi is a local CLI, not remote API) and captured in the ticket's change log and `.env.example`.
- Follow-ups properly sequenced: T-0060 and T-0061 unblocked and queued.

## Queue update

- T-0059 removed from `ready/ORDER.md`.
- T-0060 is now rank 1 (git-backed apply/rollback).
- T-0061 is rank 2 (non-review UI).

## Validation testing

T-0059 is backend-only (`Area: core`); no tier-2 user perception probe required at this stage. Tier-2 validation is planned for E-0010 as a whole once T-0060 and T-0061 ship (see E-0010 Validation Plan).

## PM process improvement proposal

None for this checkpoint — the scope clarification (pi is local, not remote) was caught during implementation from a quick web check before writing code. This is the intended behaviour of the "spec ambiguity" guardrail — good.

## Suggested commit message

```
feat(m8): implement PatchAgent harness integration (T-0059)

- Add apps/desktop/runtime/agent/ package: PatchAgent ABC, PiDevPatchAgent
  (pi subprocess + stub), PatchArtifact dataclass, PatchStorage
- Add POST /agent/code-patch and GET /agent/patch-status/{patch_id} endpoints
- Layer 2 scope validation (apps/desktop/src/ allowlist) before any file is written
- API key consumed from PATCH_AGENT_API_KEY env var; never stored in artifacts
- 27 unit tests passing; 0 regressions
- .env.example documents credential setup for pi harness
```
