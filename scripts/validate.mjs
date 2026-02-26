import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const desktopDir = path.join(repoRoot, "apps", "desktop");
const artifactsRoot = path.join(repoRoot, "tickets", "meta", "qa", "artifacts", "validate");
const startedAt = new Date();
const runId = startedAt.toISOString().replace(/[:.]/g, "-");
const runDir = path.join(artifactsRoot, runId);
const logsDir = path.join(runDir, "logs");
const summaryPath = path.join(runDir, "summary.json");
const readmePath = path.join(runDir, "README.md");
const isSandboxMode = process.argv.includes("--sandbox");

const steps = [];

function commandForDisplay(command, args) {
  return [command, ...args].join(" ");
}

async function runStep(command, args, options) {
  const { name, id, required = true, cwd = repoRoot, env = process.env, logFileName = `${id}.log` } = options;
  const logPath = path.join(logsDir, logFileName);
  const logLines = [];
  const started = new Date();
  const commandLine = commandForDisplay(command, args);
  let status = "passed";
  let reason = "";
  let code = 0;

  logLines.push(`[${started.toISOString()}] START ${name}`);
  logLines.push(`COMMAND: ${commandLine}`);
  logLines.push(`CWD: ${cwd}`);

  await new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    child.stdout.on("data", (chunk) => {
      logLines.push(chunk.toString());
    });

    child.stderr.on("data", (chunk) => {
      logLines.push(chunk.toString());
    });

    child.on("error", (error) => {
      status = "skipped";
      code = -1;
      reason = `Unable to start command: ${error.message}`;
      resolve();
    });

    child.on("close", (exitCode) => {
      if (status !== "skipped") {
        code = exitCode ?? 1;
        if (code !== 0) {
          status = "failed";
          reason = `Exit code ${code}`;
        }
      }
      resolve();
    });
  });

  const finished = new Date();
  logLines.push(`[${finished.toISOString()}] END ${name}`);
  if (reason) {
    logLines.push(`REASON: ${reason}`);
  }
  await writeFile(logPath, logLines.join("\n"), "utf8");

  return {
    id,
    name,
    required,
    command: commandLine,
    cwd,
    log: path.relative(runDir, logPath),
    status,
    reason,
    exit_code: code,
    started_at: started.toISOString(),
    finished_at: finished.toISOString()
  };
}

async function runRuntimeSmokeStep() {
  const id = "runtime-contract-smoke";
  const name = "Runtime contract smoke";
  const required = true;
  const runtimeLogPath = path.join(logsDir, "runtime-stub.log");
  const smokeLogPath = path.join(logsDir, `${id}.log`);
  const started = new Date();
  const smokeLogLines = [];
  let status = "passed";
  let reason = "";
  let exitCode = 0;

  smokeLogLines.push(`[${started.toISOString()}] START ${name}`);
  smokeLogLines.push(`COMMAND: npm run smoke`);
  smokeLogLines.push(`CWD: ${desktopDir}`);
  smokeLogLines.push("Runtime stub command: node scripts/runtime-stub.mjs");

  const runtime = spawn("node", ["scripts/runtime-stub.mjs"], {
    cwd: desktopDir,
    stdio: ["ignore", "pipe", "pipe"]
  });

  const runtimeLogs = [];
  runtime.stdout.on("data", (chunk) => {
    runtimeLogs.push(chunk.toString());
  });
  runtime.stderr.on("data", (chunk) => {
    runtimeLogs.push(chunk.toString());
  });

  let runtimeStartError = "";
  runtime.on("error", (error) => {
    runtimeStartError = error.message;
  });

  await delay(1000);

  if (runtime.exitCode !== null || runtimeStartError) {
    status = "skipped";
    reason = runtimeStartError || `runtime stub exited early with code ${runtime.exitCode}`;
    if (runtimeLogs.join("").includes("EPERM")) {
      reason = "sandbox denied local port binding (EPERM)";
    }
    exitCode = -1;
  } else {
    const smokeResult = await runStep("npm", ["run", "smoke"], {
      id,
      name,
      required,
      cwd: desktopDir,
      logFileName: `${id}.log`
    });
    status = smokeResult.status;
    reason = smokeResult.reason;
    exitCode = smokeResult.exit_code;
  }

  runtime.kill("SIGTERM");
  await delay(250);
  if (runtime.exitCode === null) {
    runtime.kill("SIGKILL");
  }

  await writeFile(runtimeLogPath, runtimeLogs.join(""), "utf8");

  const finished = new Date();
  smokeLogLines.push(`[${finished.toISOString()}] END ${name}`);
  if (reason) {
    smokeLogLines.push(`REASON: ${reason}`);
  }
  await writeFile(smokeLogPath, smokeLogLines.join("\n"), "utf8");

  return {
    id,
    name,
    required,
    command: "npm run smoke (with runtime stub)",
    cwd: desktopDir,
    log: path.relative(runDir, smokeLogPath),
    runtime_log: path.relative(runDir, runtimeLogPath),
    status,
    reason,
    exit_code: exitCode,
    started_at: started.toISOString(),
    finished_at: finished.toISOString()
  };
}

function summarizeOverall(stepResults) {
  const required = stepResults.filter((step) => step.required);
  const failed = required.filter((step) => step.status === "failed");
  const skipped = required.filter((step) => step.status === "skipped");
  if (failed.length > 0) {
    return { status: "failed", reason: "required check failed", exitCode: 1 };
  }
  if (skipped.length > 0) {
    return { status: "failed", reason: "required check skipped", exitCode: 1 };
  }
  return { status: "passed", reason: "", exitCode: 0 };
}

function buildReadme(summary) {
  const lines = [];
  lines.push(`# Validation Artifact ${runId}`);
  lines.push("");
  lines.push(`- Started: ${summary.started_at}`);
  lines.push(`- Finished: ${summary.finished_at}`);
  lines.push(`- Mode: ${summary.mode}`);
  lines.push(`- Overall: ${summary.overall.status}`);
  if (summary.overall.reason) {
    lines.push(`- Overall reason: ${summary.overall.reason}`);
  }
  lines.push("");
  lines.push("## Exit Code Rules");
  lines.push("- `0`: every required check passed.");
  lines.push("- `1`: at least one required check failed or was skipped.");
  lines.push("");
  lines.push("## Step Results");
  for (const step of summary.steps) {
    lines.push(`- \`${step.id}\`: ${step.status} (${step.log})`);
    if (step.reason) {
      lines.push(`Reason: ${step.reason}`);
    }
  }
  lines.push("");
  lines.push("## Sandbox Notes");
  lines.push("- This runner is sandbox-first and only uses local commands.");
  lines.push("- Runtime smoke uses a local Node stub on `127.0.0.1:8787`.");
  lines.push("- If port binding is denied (for example `EPERM`), the step is marked `skipped` and the run exits non-zero.");
  lines.push("- See `summary.json` for machine-readable status and per-step metadata.");
  return lines.join("\n");
}

await mkdir(logsDir, { recursive: true });

steps.push(
  await runStep("npm", ["run", "build"], {
    id: "desktop-build",
    name: "Desktop build",
    required: true,
    cwd: desktopDir
  })
);
steps.push(await runRuntimeSmokeStep());

const finishedAt = new Date();
const overall = summarizeOverall(steps);
const summary = {
  run_id: runId,
  mode: isSandboxMode ? "sandbox" : "standard",
  started_at: startedAt.toISOString(),
  finished_at: finishedAt.toISOString(),
  overall: {
    status: overall.status,
    reason: overall.reason
  },
  steps
};

await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
await writeFile(readmePath, `${buildReadme(summary)}\n`, "utf8");

console.log(`Validation artifact: ${runDir}`);
console.log(`Overall status: ${overall.status}`);
process.exit(overall.exitCode);
