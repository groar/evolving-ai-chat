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
node -e 'require("http").createServer((req,res)=>{if(req.url==="/health"){res.writeHead(200,{"Content-Type":"application/json"});res.end("{\"ok\":true}");return;}if(req.url==="/chat"&&req.method==="POST"){let b="";req.on("data",c=>b+=c);req.on("end",()=>{const m=JSON.parse(b||"{}").message||"";res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({reply:"stub: "+m}));});return;}res.writeHead(404);res.end("not found");}).listen(8787,"127.0.0.1",()=>console.log("runtime on 8787"));'
```

Then run the health probe in terminal B:
```bash
npm run smoke
```

Expected behavior:
- If runtime is not started on `127.0.0.1:8787`, smoke fails and the UI shows "Runtime unavailable".
- Once runtime is available, smoke should pass and chat requests can receive responses.
