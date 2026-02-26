import { createServer } from "node:http";

const host = "127.0.0.1";
const port = 8787;
let activeConversationId = "stub-conversation";
const conversations = [
  {
    conversation_id: "stub-conversation",
    title: "Today's Session",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
const messages = [];
let releaseChannel = "stable";
const experimentalFlags = { show_runtime_diagnostics: false };
const changelog = [];

function activeFlags() {
  return {
    show_runtime_diagnostics: releaseChannel === "experimental" && experimentalFlags.show_runtime_diagnostics
  };
}

function appendChangelog(title, summary, flagsChanged = []) {
  changelog.unshift({
    created_at: new Date().toISOString(),
    title,
    summary,
    channel: releaseChannel,
    ticket_id: "T-0008",
    flags_changed: flagsChanged
  });
  if (changelog.length > 20) {
    changelog.length = 20;
  }
}

const server = createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.url === "/state" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        active_conversation_id: activeConversationId,
        conversations,
        messages: messages.filter((message) => message.conversation_id === activeConversationId),
        settings: {
          channel: releaseChannel,
          experimental_flags: experimentalFlags,
          active_flags: activeFlags()
        },
        changelog
      })
    );
    return;
  }

  if (req.url === "/settings/channel" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        if (payload.channel !== "stable" && payload.channel !== "experimental") {
          throw new Error("Unsupported release channel.");
        }
        releaseChannel = payload.channel;
        appendChangelog(
          `Release channel set to ${releaseChannel}`,
          "Updated feature toggle channel preference. This does not roll back code or data."
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            settings: {
              channel: releaseChannel,
              experimental_flags: experimentalFlags,
              active_flags: activeFlags()
            }
          })
        );
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ detail: "Unsupported release channel." }));
      }
    });
    return;
  }

  if (req.url?.startsWith("/settings/flags/") && req.method === "POST") {
    if (releaseChannel !== "experimental") {
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "Experimental flags can only be changed in experimental channel." }));
      return;
    }

    const flagKey = req.url.replace("/settings/flags/", "");
    if (flagKey !== "show_runtime_diagnostics") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "Unknown experimental flag." }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      let enabled = false;
      try {
        const payload = JSON.parse(body || "{}");
        enabled = payload.enabled === true;
      } catch {
        enabled = false;
      }
      experimentalFlags[flagKey] = enabled;
      appendChangelog(
        `${flagKey} ${enabled ? "enabled" : "disabled"}`,
        `Feature toggle rollback only: set ${flagKey} to ${enabled ? "on" : "off"}.`,
        [flagKey]
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          settings: {
            channel: releaseChannel,
            experimental_flags: experimentalFlags,
            active_flags: activeFlags()
          }
        })
      );
    });
    return;
  }

  if (req.url === "/settings/experiments/reset" && req.method === "POST") {
    const changedFlags = Object.keys(experimentalFlags).filter((flagKey) => experimentalFlags[flagKey]);
    for (const flagKey of Object.keys(experimentalFlags)) {
      experimentalFlags[flagKey] = false;
    }
    appendChangelog(
      "Experiments reset",
      "Disabled all experimental feature toggles. This does not roll back code or stored data.",
      changedFlags
    );
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        settings: {
          channel: releaseChannel,
          experimental_flags: experimentalFlags,
          active_flags: activeFlags()
        }
      })
    );
    return;
  }

  if (req.url === "/conversations" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      let title = "New Conversation";
      let setActive = true;
      try {
        const payload = JSON.parse(body || "{}");
        title = typeof payload.title === "string" && payload.title.trim().length > 0 ? payload.title : title;
        setActive = payload.set_active !== false;
      } catch {
        title = "New Conversation";
      }
      const conversationId = `stub-conversation-${Date.now()}`;
      const now = new Date().toISOString();
      conversations.unshift({
        conversation_id: conversationId,
        title,
        created_at: now,
        updated_at: now
      });
      if (setActive) {
        activeConversationId = conversationId;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ conversation_id: conversationId }));
    });
    return;
  }

  if (req.url?.startsWith("/conversations/") && req.url?.endsWith("/activate") && req.method === "POST") {
    const conversationId = req.url.replace("/conversations/", "").replace("/activate", "");
    const match = conversations.find((conversation) => conversation.conversation_id === conversationId);
    if (!match) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "Conversation does not exist." }));
      return;
    }
    activeConversationId = conversationId;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ conversation_id: conversationId }));
    return;
  }

  if (req.url === "/data" && req.method === "DELETE") {
    const now = new Date().toISOString();
    activeConversationId = "stub-conversation";
    conversations.splice(0, conversations.length, {
      conversation_id: "stub-conversation",
      title: "Today's Session",
      created_at: now,
      updated_at: now
    });
    messages.splice(0, messages.length);
    releaseChannel = "stable";
    experimentalFlags.show_runtime_diagnostics = false;
    changelog.splice(0, changelog.length);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, active_conversation_id: activeConversationId }));
    return;
  }

  if (req.url === "/chat" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      let message = "";
      let conversationId = activeConversationId;
      try {
        const payload = JSON.parse(body || "{}");
        message = typeof payload.message === "string" ? payload.message : "";
        conversationId = typeof payload.conversation_id === "string" ? payload.conversation_id : activeConversationId;
      } catch {
        message = "";
      }
      activeConversationId = conversationId;
      messages.push({
        message_id: messages.length + 1,
        conversation_id: conversationId,
        role: "user",
        text: message,
        meta: null,
        created_at: new Date().toISOString()
      });
      const createdAt = new Date().toISOString();
      messages.push({
        message_id: messages.length + 1,
        conversation_id: conversationId,
        role: "assistant",
        text: `stub: ${message}`,
        meta: `stub | ${createdAt} | $0.00`,
        created_at: createdAt
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          conversation_id: conversationId,
          reply: `stub: ${message}`,
          model_id: "stub",
          created_at: createdAt,
          cost: 0
        })
      );
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

server.listen(port, host, () => {
  console.log(`runtime stub on http://${host}:${port}`);
});
