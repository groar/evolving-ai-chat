# Desktop App (Tauri + React)

Minimal desktop shell for the self-evolving chat workbench.

## Prerequisites
- Node.js 20+
- Rust toolchain (`cargo`, `rustc`)
- Tauri CLI (`npm exec tauri -- --version` once dependencies are installed)

## Local Run
```bash
npm install
npm run tauri:dev
```

## Smoke Checks
Runtime health probe:
```bash
npm run smoke
```

Expected behavior:
- If runtime is not started on `127.0.0.1:8787`, smoke fails and the UI shows "Runtime unavailable".
- Once runtime is available, smoke should pass and chat requests can receive responses.

