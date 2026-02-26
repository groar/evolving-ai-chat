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
        messages: messages.filter((message) => message.conversation_id === activeConversationId)
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
