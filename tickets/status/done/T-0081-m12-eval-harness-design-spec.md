# T-0081: M12 Design Spec — Eval Harness Architecture and Integration

## Metadata
- ID: T-0081
- Status: done
- Priority: P1
- Type: spec
- Area: core
- Epic: E-0015
- Owner: ai-agent
- Created: 2026-03-05
- Updated: 2026-03-05 (PM accepted, moved to done)

## Summary
Produce a concrete design spec for the M12 lightweight eval harness: confirm the `evals/` directory architecture, the first deterministic check type, the YAML/JSON case format, the entry point contract (`uv run python evals/run.py`), and how the harness integrates with `patch_agent.py`'s apply flow. Output: (a) a complete design spec in this ticket, and (b) an M12 implementation ticket list (T-0082+) ready for PM to create and queue.

This is a spec ticket: no production code is changed. The implementation agent reads the existing eval harness sketch from T-0077, inspects relevant files (`patch_agent.py`, the existing test/runtime structure), and resolves any open design questions before implementation begins.

## Context
- The eval harness is the last "known gap" in STATUS.md after M11.
- T-0077 Notes provides a design sketch: `evals/run.py`, `evals/cases/`, `evals/checks/`, a YAML case format, and a preferred standalone entry point (`uv run python evals/run.py`).
- The harness does not need to be comprehensive in M12 — one working deterministic check (e.g., `patch_applies_cleanly`) is sufficient to prove the pattern and unblock future checks.
- Integration with `patch_agent.py` should be lightweight: run evals after `validate_patch` and before `apply_patch`; if evals fail, treat as validation failure.

## References
- T-0077 Notes: eval harness design sketch
- `apps/desktop/runtime/agent/patch_agent.py` — apply/validate flow
- `apps/desktop/runtime/` — existing directory structure
- `STATUS.md` — "No eval harness" known gap
- `tickets/meta/epics/E-0015-m12-eval-harness.md`

## Design Spec

### Goals
- Define the `evals/` directory layout (location, modules, case format).
- Define the entry point contract: inputs, outputs, exit codes.
- Define the first check type and case schema.
- Define the integration hook in `patch_agent.py` (where evals run, how failures are reported).
- Produce a scoped M12 implementation ticket list.

### Non-Goals
- Building a full CI pipeline or multi-case eval suite in M12.
- Prompt/LLM-based scoring (deterministic only in M12).
- Changing `patch_agent.py` apply/rollback logic beyond adding one optional eval call.

### Open Design Questions — Resolved

1. **Location**: **`apps/desktop/runtime/evals/`** (co-located with runtime).
   - Rationale: all current tooling (`agent/`, `adapters/`, `config/`) lives under `runtime/`. The eval harness is specifically for the patch agent workflow. Co-location keeps imports simple and avoids cross-package dependencies. If shared cross-app evals are needed later, the directory can be promoted to repo root.

2. **Case format**: **YAML**.
   - Rationale: more readable than JSON, supports inline comments for documenting case intent, and is easy to hand-edit. `pyyaml` is a standard Python dependency (add to `requirements.txt`). Each case file is a single YAML document.

3. **First check type**: **`patch_applies_cleanly`** — verifies a unified diff can be applied to the target tree without error using `patch -p1 --dry-run`.
   - Rationale: this mirrors how `apply_pipeline.py` (`_apply_patch()`) applies patches in production — it uses the `patch` utility with `-p1`. The check uses `--dry-run` to verify without modifying files. This is more faithful to the real apply path than `git apply --check`, since the production code does not use `git apply`. If `patch` is unavailable, the check falls back to `git apply --check` and logs a warning.

4. **Integration mode**: **Advisory** for M12 (eval failure = warning logged in artifact; user can still accept the patch).
   - Rationale: preserves the existing apply flow without risk of regressions. `ApplyPipeline._run_evals()` is called after `_sandboxed_validate()` and before `_apply_and_commit()`. If evals fail, a warning is logged and eval results are attached to the artifact's `log_text`. The patch is NOT rejected. A hard gate mode can be added behind a config flag in M13+.

5. **Test coverage**: **Dedicated `test_evals.py`** in `apps/desktop/runtime/` (follows existing pattern: `test_chat.py`, `test_proposals.py`, etc.).
   - The test file contains pytest fixtures that invoke `run.py` as a subprocess against known-good and known-bad fixture patches, asserting exit code 0 and non-zero respectively.

### Architecture

```
apps/desktop/runtime/evals/
├── __init__.py
├── run.py                            # Entry point
├── checks/
│   ├── __init__.py                   # CheckResult dataclass + check registry
│   └── patch_applies_cleanly.py      # First deterministic check
└── cases/
    ├── good_patch_applies.yaml       # Known-good case (expect: pass)
    └── bad_patch_applies.yaml        # Known-bad case (expect: fail)
```

Fixture patch files (for test cases) live in `evals/cases/fixtures/`:

```
apps/desktop/runtime/evals/cases/fixtures/
├── good.diff       # Valid unified diff against current src/
└── bad.diff        # Malformed or inapplicable diff
```

### Entry Point Contract (`run.py`)

**Invocation**: `uv run python apps/desktop/runtime/evals/run.py [OPTIONS]`

**CLI arguments**:
| Argument | Required | Default | Description |
|---|---|---|---|
| `--case <path>` | No | `evals/cases/` | Path to a single YAML case file or a directory of case files. |
| `--patch-file <path>` | No | (from case) | Override the patch source for all cases (useful for ad-hoc eval of a specific patch). |
| `--repo-root <path>` | No | auto-detect | Repository root for checks that need filesystem context. |
| `--verbose` | No | false | Print per-check details to stderr. |

**Outputs**:
- **stdout**: JSON summary:
  ```json
  {
    "total": 2,
    "passed": 1,
    "failed": 1,
    "skipped": 0,
    "results": [
      {
        "case_id": "good-patch-applies",
        "check_type": "patch_applies_cleanly",
        "passed": true,
        "expected": "pass",
        "message": "Patch applies cleanly (dry-run)"
      },
      {
        "case_id": "bad-patch-applies",
        "check_type": "patch_applies_cleanly",
        "passed": false,
        "expected": "fail",
        "message": "patch -p1 --dry-run failed: ..."
      }
    ]
  }
  ```
- **Exit codes**:
  | Code | Meaning |
  |---|---|
  | 0 | All cases matched their `expect` field (pass cases passed, fail cases failed). |
  | 1 | At least one case did not match its expectation. |
  | 2 | Runner error (bad YAML, missing check module, unhandled exception). |

**Behavior when no cases found**: exits 0 with `{"total": 0, "passed": 0, "failed": 0, "skipped": 0, "results": []}` and a stderr message "No eval cases found, skipping."

### Case Schema (YAML)

```yaml
id: "good-patch-applies"
description: "A valid patch against the current src/ tree applies without error"
check_type: "patch_applies_cleanly"
inputs:
  patch_file: "fixtures/good.diff"    # Relative to the case file's directory
  # OR:
  # patch_inline: |
  #   --- a/apps/desktop/src/App.tsx
  #   +++ b/apps/desktop/src/App.tsx
  #   @@ -1,3 +1,3 @@
  #   ...
  target_dir: null                     # null = temp copy of apps/desktop/; or path to fixture
expect:
  result: "pass"                       # "pass" or "fail"
```

**Schema rules**:
- `id` (string, required): unique case identifier.
- `description` (string, optional): human-readable explanation.
- `check_type` (string, required): maps to a module name in `evals/checks/`.
- `inputs` (dict, required): check-specific input parameters.
  - `patch_file` or `patch_inline`: one is required for patch-based checks.
  - `target_dir`: null (use default desktop src copy) or a path to a fixture directory.
- `expect.result` (string, required): `"pass"` or `"fail"` — the expected check outcome.

### Check Module Contract

Each module in `evals/checks/` exposes:

```python
def run(inputs: dict, repo_root: Path) -> CheckResult
```

Where `CheckResult` is defined in `evals/checks/__init__.py`:

```python
@dataclass
class CheckResult:
    passed: bool
    message: str          # Human-readable summary
    details: dict         # Arbitrary check-specific data (e.g., patch command output)
```

The runner compares `CheckResult.passed` against `expect.result` to determine if the case matched expectations.

### `patch_applies_cleanly` Check

**Purpose**: verify that a unified diff applies to the target file tree without errors, using the same tool (`patch`) that `apply_pipeline.py` uses in production.

**Algorithm**:
1. Resolve patch content from `inputs.patch_file` (relative to case file) or `inputs.patch_inline`.
2. Determine target directory: if `inputs.target_dir` is null, create a temp copy of `apps/desktop/` (excluding `node_modules`, `dist`, `.vite`, etc. — same exclusions as `_sandboxed_validate` in `apply_pipeline.py`).
3. Write patch to a temp file.
4. Run `patch -p1 --dry-run --input <temp_file>` in the target directory.
5. If exit code 0 → `CheckResult(passed=True, message="Patch applies cleanly (dry-run)", details={...})`.
6. If exit code non-zero → `CheckResult(passed=False, message="patch dry-run failed: <stderr>", details={...})`.
7. Cleanup temp files.

**Fallback**: if `patch` is not on PATH, attempt `git apply --check --stat` instead. If neither is available, return `CheckResult(passed=False, message="No patch tool available", ...)`.

### Integration with `apply_pipeline.py`

**Hook location**: new `_run_evals()` method on `ApplyPipeline`, called in `apply()` between `_sandboxed_validate()` and `_apply_and_commit()`.

**Sequence** (updated `apply()` flow):
1. `_check_base_ref()` — reject if HEAD drifted.
2. `_sandboxed_validate()` — sandbox build gate (npm run validate).
3. **`_run_evals()`** — run eval harness (advisory, new in M12).
4. `_apply_and_commit()` — apply patch to real working copy + git commit.

**`_run_evals()` behavior**:
- Writes the artifact's `unified_diff` to a temp file.
- Invokes `uv run python evals/run.py --patch-file <temp> --repo-root <repo>` as a subprocess.
- Captures stdout (JSON results).
- Appends eval results summary to `artifact.log_text`.
- If the subprocess exits non-zero, logs a warning: `"Eval harness reported failures (advisory): ..."`. Does NOT raise `ApplyError`.
- If `evals/` directory or `evals/cases/` doesn't exist, skips silently (no error).
- Timeout: 60 seconds (generous for M12; can be tightened later).

**No new fields on `PatchArtifact` in M12**: eval results go into `log_text`. A dedicated `eval_results` field can be added in M13+ if the UI needs to surface them distinctly.

### Edge Cases / Failure Modes

| Scenario | Handling |
|---|---|
| `evals/cases/` is empty | `run.py` exits 0 with `{"total": 0, ...}` and stderr "No eval cases found, skipping." |
| A check module raises an unhandled exception | `run.py` catches the exception, marks the case as failed with the traceback in `message`, and continues to the next case. Runner exits 1. |
| `patch` command not on PATH | `patch_applies_cleanly` falls back to `git apply --check`. If neither available, the check fails with a descriptive message. |
| YAML case file is malformed | `run.py` logs a warning to stderr, skips the case (counts as "skipped"), continues. Exits 2 only if ALL cases are unparseable. |
| `patch_agent.py` integration: evals fail | Advisory warning logged in `artifact.log_text`. Patch is NOT rejected. |
| `_run_evals()` subprocess times out | Logged as warning; apply continues. |
| `evals/` directory doesn't exist | `_run_evals()` skips silently (no-op). |

### Scope Bounds
- Read: `patch_agent.py`, `apply_pipeline.py`, `apps/desktop/runtime/` directory layout, T-0077 Notes.
- Write: only this ticket file (Design Spec section, Evidence, Notes/implementation ticket list).
- No production code changes.

### Validation Plan
- Spec ticket: done when Design Spec and implementation ticket list are recorded in Evidence/Notes.
- No QA run needed; doc review by PM suffices.
- Implementation tickets (T-0082+) will carry their own acceptance criteria and deterministic test coverage.

## Acceptance Criteria
- [x] Design Spec section is fully populated: architecture, case format, entry point contract, first check type, integration approach, open questions resolved.
- [x] Implementation ticket list is in the Notes section with at least one ticket per major deliverable (entry point + first check, integration hook, test coverage).
- [x] No production source code was modified by this ticket.
- [x] Notes section either contains a concrete eval harness design or documents a decision to narrow scope further (with rationale).

## Dependencies / Sequencing
- Depends on: T-0077 (eval sketch, already done), T-0078–T-0080 (green test baseline, done).
- Blocks: T-0082+ (M12 implementation tickets).
- Sequencing: must complete before any M12 implementation tickets.

## Evidence (Verification)
- Design Spec section: fully populated with architecture diagram, entry point contract (CLI args, exit codes, JSON output format), YAML case schema, check module contract (`CheckResult` dataclass), `patch_applies_cleanly` algorithm, integration approach (advisory `_run_evals()` in `ApplyPipeline`), and all 5 open questions resolved with rationale.
- Implementation ticket list: 3 tickets (T-0082, T-0083, T-0084) covering entry point + first check, integration hook, and test coverage respectively.
- No production source code modified.
- Doc review: PM to verify.

## Notes

### Implementation Ticket List (M12)

| Ticket | Title | Deliverables | Effort |
|--------|-------|-------------|--------|
| T-0082 | Eval harness core + first check | `evals/` directory with `__init__.py`, `run.py` entry point, `checks/__init__.py` (`CheckResult`, check registry), `checks/patch_applies_cleanly.py`, YAML case loader, `cases/good_patch_applies.yaml`, `cases/bad_patch_applies.yaml`, `cases/fixtures/good.diff`, `cases/fixtures/bad.diff`. Add `pyyaml` to `requirements.txt`. AC: `uv run python apps/desktop/runtime/evals/run.py` exits 0 with both cases matching expectations. | M |
| T-0083 | Apply pipeline advisory integration | Add `_run_evals()` to `ApplyPipeline` (called after `_sandboxed_validate`, before `_apply_and_commit`). Advisory mode: log results in `artifact.log_text`, never reject. Skip silently if `evals/` absent. AC: apply flow works as before; when evals/ exists, eval results appear in artifact log; `uv run pytest` exits 0. | S |
| T-0084 | Eval harness test coverage + STATUS.md cleanup | `test_evals.py` in `apps/desktop/runtime/` with pytest fixtures: invoke `run.py` against known-good and known-bad patches, assert exit codes. Remove "No eval harness" from STATUS.md known gaps. AC: `uv run pytest apps/desktop/runtime/test_evals.py` exits 0; `uv run pytest` (full suite) exits 0. | S |

### Sequencing
- T-0082 first (standalone harness).
- T-0083 depends on T-0082 (needs the harness to integrate).
- T-0084 depends on T-0082 (tests the harness); can be done in parallel with T-0083.

### Future Work (M13+)
- Hard gate mode: config flag to make eval failure reject the patch (blocks `_apply_and_commit`).
- Additional check types: `no_new_dependencies`, `scope_allowlist_respected`, `typescript_compiles`, prompt-based scoring.
- `PatchArtifact.eval_results` field for structured UI surfacing.
- CI integration: run `evals/run.py` in GitHub Actions alongside `uv run pytest`.

## Change Log
- 2026-03-05: Ticket created by PM run (M12 scoping; eval harness deferred from M11/T-0077).
- 2026-03-05: Implementation agent completed design spec. All 5 open questions resolved. Architecture, entry point contract, case schema, first check type, and advisory integration approach documented. Implementation ticket list (T-0082–T-0084) produced.
- 2026-03-05: PM acceptance (doc review). Spec ticket; no QA run. All AC met. Accepted and moved to done.
