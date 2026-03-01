# T-0059: M8 agent harness integration

## Metadata
- ID: T-0059
- Status: done
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01 (accepted)

## Summary
Implement the `PatchAgent` interface and the `POST /agent/code-patch` runtime endpoint. This wires feedback payloads to pi (https://pi.dev) — a local terminal coding agent — injects the M8 scope-guard system prompt, captures file changes via before/after diff in a temp sandbox, validates paths against the server-side allowlist, and stores the resulting patch artifact. This is the "brain" of the M8 loop; apply/rollback (T-0060) and UI (T-0061) depend on it.

## Context
- Spec: `docs/m8-code-loop.md` §§3.1, 3.2, 4, 6, 8.
- **pi integration note**: pi.dev is a local CLI agent (`npm install -g @mariozechner/pi-coding-agent`), not a remote API. The harness runs pi as a subprocess in a temp copy of `apps/desktop/`, then diffs `apps/desktop/src/` before vs after to produce the unified diff. T-0060 applies the diff to the real working copy.
- The `PatchAgent` interface is swappable; the concrete harness can change without touching apply/rollback logic.

## References
- `docs/m8-code-loop.md`
- `apps/desktop/runtime/agent/patch_agent.py` — PatchAgent ABC, PiDevPatchAgent, validate_scope, helpers
- `apps/desktop/runtime/agent/patch_storage.py` — PatchStorage (filesystem JSON store)
- `apps/desktop/runtime/agent/__init__.py`
- `apps/desktop/runtime/test_patch_agent.py` — 27 unit tests
- `apps/desktop/runtime/.env.example` — credential setup docs
- `apps/desktop/runtime/main.py` — POST /agent/code-patch, GET /agent/patch-status/{patch_id}
- `apps/desktop/runtime/models.py` — CodePatchRequest, CodePatchResponse, PatchStatusResponse

## Feedback References
- F-20260301-008

## Acceptance Criteria
- [x] `PatchAgent` abstract interface defined in Python with method `generate_patch(feedback, base_ref) -> PatchArtifact`.
- [x] Concrete `PiDevPatchAgent` implementation invokes pi as a local subprocess in a temp sandbox with scope-guard system prompt appended (`--append-system-prompt`). Falls back to stub when `PATCH_AGENT_API_KEY` is absent or `PATCH_AGENT_STUB=true`.
- [x] `POST /agent/code-patch` endpoint accepts `{ feedback_id, feedback_title, feedback_summary, feedback_area, base_ref }` and returns `{ patch_id, status, title, description }`.
- [x] Scope validation (Layer 2 server-side allowlist) runs before artifact is persisted; any violation sets `scope_violations` and returns `status: scope_blocked` — no files touched.
- [x] Patch artifact JSON stored in `apps/desktop/runtime/storage/patches/<patch_id>.json` with all required fields (see spec §3.2).
- [x] `GET /agent/patch-status/{patch_id}` endpoint returns current artifact status.
- [x] Unit tests cover: successful patch generation, scope-blocked response, malformed agent response (no file changes), harness timeout, pi not installed, API key not stored in artifact.
- [x] Harness API key/credential consumed from `PATCH_AGENT_API_KEY` env var; passed to pi via `--api-key`; never logged or stored in artifacts.

## Dependencies / Sequencing
- Depends on: T-0058 (spec, done).
- Blocks: T-0060 (apply/rollback reads patch artifacts), T-0061 (UI polls patch status).
- Sequencing: implement T-0059 first; T-0060 and T-0061 can proceed in parallel after.

## Evidence (Verification)

### Automated tests — 2026-03-01
```
27 passed in 0.35s (Python 3.12.12, pytest 9.0.2)

Test classes:
  ValidateScopeTests          — 6 tests: allowlist pass/fail, mixed, empty, nested
  ComputeDiffTests            — 3 tests: no-change, single-file diff, multi-file
  PiDevStubTests              — 4 tests: artifact fields, scope check, API key isolation
  PiDevHarnessErrorTests      — 6 tests: pi not installed, timeout, exit code 2,
                                  no changes (MalformedPatch), changes returned,
                                  API key not in artifact
  PatchArtifactSerializationTests — 1 test: to_dict/from_dict round-trip
  CodePatchEndpointTests      — 5 tests: success, scope_blocked, harness_unavailable,
                                  malformed_patch, patch_in_progress (409)
  PatchStatusEndpointTests    — 2 tests: found, 404 not found
```
Run: `uv run --python 3.12 --with "pytest,fastapi,pydantic,httpx,openai,anthropic,anyio" python -m pytest apps/desktop/runtime/test_patch_agent.py -v`

### Pre-existing failures confirmed unrelated — 2026-03-01
`test_chat.py` and `test_proposals.py` had 13 pre-existing failures before this ticket (confirmed via git stash). T-0059 introduced 0 new failures.

### Files changed
- `apps/desktop/runtime/agent/__init__.py` — new package
- `apps/desktop/runtime/agent/patch_agent.py` — PatchAgent ABC, PiDevPatchAgent (pi subprocess + stub), PatchArtifact, validate_scope, _compute_diff, _snapshot_src
- `apps/desktop/runtime/agent/patch_storage.py` — PatchStorage (filesystem JSON store + in-flight check)
- `apps/desktop/runtime/test_patch_agent.py` — 27 unit tests (all passing)
- `apps/desktop/runtime/.env.example` — credential setup documentation
- `apps/desktop/runtime/main.py` — imports + `POST /agent/code-patch` + `GET /agent/patch-status/{patch_id}` endpoints
- `apps/desktop/runtime/models.py` — CodePatchRequest, CodePatchResponse, PatchStatusResponse

## Subtasks
- [x] Define `PatchAgent` interface + `PatchArtifact` dataclass
- [x] Implement `PiDevPatchAgent` (with offline stub)
- [x] Implement `POST /agent/code-patch` and `GET /agent/patch-status/{patch_id}`
- [x] Implement Layer 2 allowlist validation
- [x] Write unit tests
- [x] Document credential setup in `.env.example`

## Change Log
- 2026-03-01: Created from T-0058 design spec (M8 implementation ticket 1 of 3).
- 2026-03-01: Implemented. pi.dev is a local subprocess harness (not a remote API — corrected during implementation). Credential env vars: PATCH_AGENT_API_KEY, PATCH_AGENT_PROVIDER, PATCH_AGENT_MODEL, PATCH_AGENT_STUB. 27 tests passing. Moved to review.
- 2026-03-01: QA passed (27/27 tests, all AC verified, 0 regressions). PM accepted. Moved to done.
