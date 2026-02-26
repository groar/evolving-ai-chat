import { createServer } from "node:http";

const host = "127.0.0.1";
const port = 8787;

const server = createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.url === "/chat" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      let message = "";
      try {
        const payload = JSON.parse(body || "{}");
        message = typeof payload.message === "string" ? payload.message : "";
      } catch {
        message = "";
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ reply: `stub: ${message}` }));
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

server.listen(port, host, () => {
  console.log(`runtime stub on http://${host}:${port}`);
});

