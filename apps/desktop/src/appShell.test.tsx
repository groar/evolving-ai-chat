import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App, offlineStateRetryIntervalMs, shouldAutoRetryOfflineState } from "./App";

describe("App shell IA", () => {
  it("defaults to chat-first layout with app name in top bar", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("Evolving AI Chat");
    expect(markup).not.toContain("Local Desktop Chat");
    expect(markup).not.toContain("SQLite");
  });

  it("shows progressive-disclosure entry points for sidebar and settings", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("Toggle conversation list");
    expect(markup).toContain("Open Settings");
    expect(markup).toContain("Cmd+B");
  });

  it("does not render secondary-surface content by default (chat pane only)", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).not.toContain("+ New Conversation");
    expect(markup).not.toContain("Back to Conversations");
  });

  it("renders a single runtime-offline status with clear next action", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("The assistant service is not running.");
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
    expect((markup.match(/\bempty-state\b/g) || []).length).toBe(1);
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
