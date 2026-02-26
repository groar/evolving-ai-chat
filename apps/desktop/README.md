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
```

## Run Desktop App
```bash
npm run tauri:dev
```

## Smoke Checks
Start a temporary local runtime in terminal A:
```bash
npm run runtime:stub
```

Then run the health probe in terminal B:
```bash
npm run smoke
```

Expected behavior:
- If runtime is not started on `127.0.0.1:8787`, smoke fails and the UI shows "Runtime unavailable".
- Once runtime is available, smoke should pass and chat requests can receive responses.

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
