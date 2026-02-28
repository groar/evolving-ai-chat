import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App shell IA", () => {
  it("defaults the left rail to conversations-first copy", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("Conversations");
    expect(markup).toContain("Start here, then open other surfaces when needed.");
    expect(markup).not.toContain("SQLite");
  });

  it("shows progressive-disclosure entry points", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("Conversations");
    expect(markup).toContain("Settings");
    expect(markup).toContain("Feedback");
    expect(markup).toContain("Advanced");
  });

  it("does not render secondary-surface content by default", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("+ New Conversation");
    expect(markup).not.toContain("Back to Conversations");
  });

  it("renders a single runtime-offline status with clear next action", () => {
    const markup = renderToStaticMarkup(<App />);
    const offlineBannerCopy = "Runtime is the local background service that loads saved conversations and powers assistant replies.";
    expect(markup).toContain(offlineBannerCopy);
    expect(markup.match(new RegExp(offlineBannerCopy, "g"))).toHaveLength(1);
    expect(markup).toContain("Chat sending is currently unavailable. Start the runtime, then retry.");
    expect(markup).toContain(">Retry<");
    expect(markup).not.toContain("Runtime unavailable. Retry once runtime is running.");
  });

  it("disables composer input when runtime is offline", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain('id="composer"');
    expect(markup).toContain('placeholder="Chat is disabled while runtime is offline."');
    expect(markup).toContain("disabled");
  });

  it("avoids duplicate empty-state instruction blocks", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup.match(/class=\"empty-state\"/g)).toHaveLength(1);
    expect(markup).not.toContain("press Enter to send");
  });
});
