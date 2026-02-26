import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = "http://127.0.0.1:8787";
const runtimeCommand = ["python3", "-m", "uvicorn", "runtime.main:app", "--host", "127.0.0.1", "--port", "8787"];
const assumeRunning = process.argv.includes("--assume-running");

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const artifactDir = path.resolve(process.cwd(), "../../tickets/meta/qa/artifacts/runtime-smoke", timestamp);
const logPath = path.join(artifactDir, "smoke-fastapi.log");
const logLines = [];

function appendLog(line) {
  const stampedLine = `[${new Date().toISOString()}] ${line}`;
  logLines.push(stampedLine);
  console.log(stampedLine);
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Keep polling until timeout.
    }
    await sleep(250);
  }
  return false;
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({ code: 1, stdout, stderr: `${stderr}\n${error.message}`.trim() });
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function run() {
  let runtime = null;
  let failed = false;

  appendLog(`START smoke:fastapi (${assumeRunning ? "assume-running" : "managed-runtime"})`);
  appendLog(`Runtime base: ${base}`);

  if (!assumeRunning) {
    appendLog(`Starting FastAPI runtime: ${runtimeCommand.join(" ")}`);
    runtime = spawn(runtimeCommand[0], runtimeCommand.slice(1), {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    runtime.stdout.on("data", (chunk) => {
      for (const line of chunk.toString().trim().split("\n")) {
        if (line) {
          appendLog(`runtime stdout: ${line}`);
        }
      }
    });

    runtime.stderr.on("data", (chunk) => {
      for (const line of chunk.toString().trim().split("\n")) {
        if (line) {
          appendLog(`runtime stderr: ${line}`);
        }
      }
    });

    const ready = await waitForHealth(10000);
    if (!ready) {
      failed = true;
      appendLog("FAIL: runtime did not become healthy within 10s.");
    } else {
      appendLog("PASS: runtime health endpoint became available.");
    }
  }

  if (!failed) {
    appendLog("Running contract smoke: node scripts/smoke.mjs");
    const smoke = await runCommand("node", ["scripts/smoke.mjs"]);

    if (smoke.stdout.trim()) {
      for (const line of smoke.stdout.trim().split("\n")) {
        appendLog(`smoke stdout: ${line}`);
      }
    }
    if (smoke.stderr.trim()) {
      for (const line of smoke.stderr.trim().split("\n")) {
        appendLog(`smoke stderr: ${line}`);
      }
    }

    if (smoke.code !== 0) {
      failed = true;
      appendLog(`FAIL: smoke command exited with code ${smoke.code}.`);
    } else {
      appendLog("PASS: smoke command completed successfully.");
    }
  }

  if (runtime) {
    runtime.kill("SIGTERM");
    await sleep(250);
    if (runtime.exitCode === null) {
      runtime.kill("SIGKILL");
    }
    appendLog("Stopped managed FastAPI runtime.");
  }

  appendLog(`END smoke:fastapi status=${failed ? "failed" : "passed"}`);
  await mkdir(artifactDir, { recursive: true });
  await writeFile(logPath, `${logLines.join("\n")}\n`, "utf8");
  console.log(`Artifact log: ${logPath}`);

  if (failed) {
    process.exit(1);
  }
}

await run();
