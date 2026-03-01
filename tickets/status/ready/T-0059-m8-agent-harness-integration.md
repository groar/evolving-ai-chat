# T-0059: M8 agent harness integration

## Metadata
- ID: T-0059
- Status: ready
- Priority: P1
- Type: feature
- Area: core
- Epic: E-0010
- Owner: ai-agent
- Created: 2026-03-01
- Updated: 2026-03-01

## Summary
Implement the `PatchAgent` interface and the `POST /agent/code-patch` runtime endpoint. This wires feedback payloads to an external code-generation agent harness (pi.dev API or equivalent), injects the M8 scope-guard system prompt, collects the structured patch response, validates it against the file-path allowlist, and stores the resulting patch artifact. This is the "brain" of the M8 loop; apply/rollback (T-0060) and UI (T-0061) depend on it.

## Context
- Spec: `docs/m8-code-loop.md` §§3.1, 3.2, 4, 6, 8.
- The harness call must include the current content of all allowlisted source files as context so the agent can make coherent patches.
- The `PatchAgent` interface must be swappable so the concrete harness (pi.dev, Claude API tool use, local model) can change without touching apply/rollback logic.

## References
- `docs/m8-code-loop.md`
- `apps/desktop/runtime/adapters/router.py` (pattern for provider abstraction)
- `apps/desktop/src/proposalGenerator.ts` (existing artifact creation pattern)

## Feedback References
- F-20260301-008

## Acceptance Criteria
- [ ] `PatchAgent` abstract interface defined in Python with method `generate_patch(feedback, base_ref) -> PatchArtifact`.
- [ ] Concrete `PiDevPatchAgent` implementation calls pi.dev API (or stub for offline/test) with scope-guard system prompt prepended.
- [ ] `POST /agent/code-patch` endpoint accepts `{ feedback_id, feedback_title, feedback_summary, feedback_area, base_ref }` and returns `{ patch_id, status, title, description }`.
- [ ] Scope validation (Layer 2 server-side allowlist) runs before artifact is persisted; any violation sets `scope_violations` and returns `status: scope_blocked` — no files touched.
- [ ] Patch artifact JSON stored in `apps/desktop/runtime/storage/patches/<patch_id>.json` with all required fields (see spec §3.2).
- [ ] `GET /agent/patch-status/{patch_id}` endpoint returns current artifact status.
- [ ] Unit tests cover: successful patch generation, scope-blocked response, malformed agent response, harness timeout.
- [ ] Harness API key/credential consumed from environment variable; never logged or stored in artifacts.

## Dependencies / Sequencing
- Depends on: T-0058 (spec, done).
- Blocks: T-0060 (apply/rollback reads patch artifacts), T-0061 (UI polls patch status).
- Sequencing: implement T-0059 first; T-0060 and T-0061 can proceed in parallel after.

## Evidence (Verification)
_(to be filled during implementation)_

## Subtasks
- [ ] Define `PatchAgent` interface + `PatchArtifact` dataclass
- [ ] Implement `PiDevPatchAgent` (with offline stub)
- [ ] Implement `POST /agent/code-patch` and `GET /agent/patch-status/{patch_id}`
- [ ] Implement Layer 2 allowlist validation
- [ ] Write unit tests
- [ ] Document credential setup in README or env sample

## Change Log
- 2026-03-01: Created from T-0058 design spec (M8 implementation ticket 1 of 3).
