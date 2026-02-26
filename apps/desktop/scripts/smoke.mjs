const base = "http://127.0.0.1:8787";

const checks = [
  {
    name: "Runtime health endpoint",
    run: async () => {
      const response = await fetch(`${base}/health`);
      return response.ok;
    }
  },
  {
    name: "Runtime chat payload contract",
    run: async () => {
      const response = await fetch(`${base}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "hello runtime" })
      });
      if (!response.ok) {
        return false;
      }

      const payload = await response.json();
      return (
        payload.reply === "stub: hello runtime" &&
        payload.model_id === "stub" &&
        typeof payload.created_at === "string" &&
        payload.created_at.length > 0 &&
        typeof payload.cost === "number"
      );
    }
  }
];

let failed = false;

for (const check of checks) {
  try {
    const ok = await check.run();
    if (!ok) {
      failed = true;
      console.error(`FAIL: ${check.name}`);
      continue;
    }
    console.log(`PASS: ${check.name}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL: ${check.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failed) {
  process.exit(1);
}
