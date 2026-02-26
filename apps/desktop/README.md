# Desktop App (Tauri + React)

Minimal desktop shell for the self-evolving chat workbench.

## Prerequisites
- Node.js 20+
- Rust toolchain (`cargo`, `rustc`)
- macOS build tools (`xcode-select --install`)

## Environment Setup (macOS)
```bash
xcode-select --install
brew update
brew install rustup-init
rustup-init -y
source "$HOME/.cargo/env"
cargo --version
```

## Install Dependencies
```bash
npm install
npm i -D @tauri-apps/cli
python3 -m pip install -r runtime/requirements.txt
```

## Run Desktop App
```bash
npm run tauri:dev
```

## Smoke Checks
Start the local FastAPI runtime in terminal A:
```bash
npm run runtime:fastapi
```

If Python dependencies are not available in your environment, use the Node fallback stub for local smoke checks:
```bash
npm run runtime:stub:node
```

Then run the health probe in terminal B:
```bash
npm run smoke
```

Or run the managed FastAPI smoke (starts runtime, runs checks, writes an artifact log):
```bash
npm run smoke:fastapi
```

Use an already-running runtime:
```bash
npm run smoke:fastapi -- --assume-running
```

Expected behavior:
- If runtime is not started on `127.0.0.1:8787`, smoke fails and the UI shows "Runtime unavailable".
- Once runtime is available, smoke should pass and chat requests can receive responses.
- `smoke:fastapi` writes a timestamped artifact log under `tickets/meta/qa/artifacts/runtime-smoke/`.

## Release Channels (T-0006)
- The app persists a local-only release channel setting: `stable` (default) or `experimental`.
- Switch channels from the left-rail Settings card.
- In `experimental`, you can opt into experimental flags (currently: runtime diagnostics card).
- In `stable`, experimental flags are not toggleable and their UI stays hidden.

## Changelog And Rollback UX (T-0008)
- The left-rail settings surface includes both changelog visibility and experiment controls.
- Changelog entries are local-only and list newest first with title, summary, channel, optional ticket ID, and changed flags.
- `Switch to Stable` and `Reset Experiments` are feature-toggle rollback controls only; they do not roll back code or stored data.

## Codex Sandbox Note (QA Runs)
In Codex sandboxed execution, local port binding can fail with `EPERM` for both runtime (`8787`) and Vite (`5173`).  
If that happens, rerun smoke with escalated permissions and start/stop the stub runtime in one command:

```bash
/bin/zsh -c 'npm run runtime:stub >/tmp/t0003-runtime.log 2>&1 & pid=$!; sleep 1; npm run smoke; code=$?; kill $pid; wait $pid 2>/dev/null; exit $code'
```

For desktop startup verification under the same constraint:

```bash
/bin/zsh -c 'npm run tauri:dev >/tmp/t0003-tauri.log 2>&1 & pid=$!; sleep 20; kill $pid; wait $pid 2>/dev/null; tail -n 120 /tmp/t0003-tauri.log'
```

## Validation Gate (T-0007)
From the repository root:

```bash
npm run validate
```

What it runs (required checks):
- `npm run build` in `apps/desktop`
- `npm run smoke` in `apps/desktop` with an auto-managed local Node runtime stub

Artifacts:
- `tickets/meta/qa/artifacts/validate/<timestamp>/README.md`
- `tickets/meta/qa/artifacts/validate/<timestamp>/summary.json`
- `tickets/meta/qa/artifacts/validate/<timestamp>/logs/*.log`

Sandbox support:
- Use `npm run validate:sandbox` when you want the run labeled as sandbox mode.
- If local port bind is denied (`EPERM`), runtime smoke is marked `skipped` with reason and the overall run exits non-zero.
