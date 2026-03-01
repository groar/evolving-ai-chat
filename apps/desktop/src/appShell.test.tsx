import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App, offlineStateRetryIntervalMs, shouldAutoRetryOfflineState } from "./App";

describe("App shell IA", () => {
  it("defaults the left rail to conversations-first copy", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("Conversations");
    expect(markup).toContain("Evolving AI Chat");
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
    expect(markup).toContain("The local runtime is not running.");
    expect(markup).toContain("Start it, then press Retry.");
    expect(markup).toContain(">Retry<");
    expect(markup).not.toContain("online");
  });

  it("disables composer input when runtime is offline or API key not configured", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain('id="composer"');
    expect(
      markup.includes('placeholder="Add your API key in Settings to chat."') ||
        markup.includes('placeholder="Start the runtime to chat."')
    ).toBe(true);
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
