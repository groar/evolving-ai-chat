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
});
