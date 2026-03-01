import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App, offlineStateRetryIntervalMs, shouldAutoRetryOfflineState } from "./App";

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
    expect(markup).toContain("Chat is unavailable because a local service on this device is not reachable.");
    expect(markup).toContain("Start the local service, then Retry.");
    expect(markup).toContain(">Retry<");
    expect(markup).not.toContain("online");
  });

  it("disables composer input when runtime is offline", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain('id="composer"');
    expect(markup).toContain('placeholder="Chat requires the local service. Start it, then send."');
    expect(markup).toContain("disabled");
  });

  it("avoids duplicate empty-state instruction blocks", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup.match(/class=\"empty-state\"/g)).toHaveLength(1);
    expect(markup).not.toContain("press Enter to send");
  });

  it("auto-retry guard only activates for offline runtime state", () => {
    expect(shouldAutoRetryOfflineState({ kind: "offline" })).toBe(true);
    expect(shouldAutoRetryOfflineState({ kind: "error", detail: "Bad request" })).toBe(false);
    expect(shouldAutoRetryOfflineState(null)).toBe(false);
  });

  it("uses a short retry cadence for offline recovery", () => {
    expect(offlineStateRetryIntervalMs).toBe(2000);
  });
});
