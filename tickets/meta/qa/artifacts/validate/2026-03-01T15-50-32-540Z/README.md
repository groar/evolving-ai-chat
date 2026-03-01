# Validation Artifact 2026-03-01T15-50-32-540Z

- Started: 2026-03-01T15:50:32.540Z
- Finished: 2026-03-01T15:50:34.531Z
- Mode: standard
- Overall: failed
- Overall reason: required check skipped

## Exit Code Rules
- `0`: every required check passed.
- `1`: at least one required check failed or was skipped.

## Step Results
- `desktop-build`: passed (logs/desktop-build.log)
- `runtime-contract-smoke`: skipped (logs/runtime-contract-smoke.log)
Reason: runtime stub exited early with code 1

## Sandbox Notes
- This runner is sandbox-first and only uses local commands.
- Runtime smoke uses a local Node stub on `127.0.0.1:8787`.
- If port binding is denied (for example `EPERM`), the step is marked `skipped` and the run exits non-zero.
- See `summary.json` for machine-readable status and per-step metadata.
