import { describe, expect, it } from "vitest";
import { getFirstModelWithKey } from "./useRuntime";

const MODELS = [
  { provider: "openai", model_id: "gpt-4o-mini", display_name: "GPT-4o Mini" },
  { provider: "openai", model_id: "gpt-4o", display_name: "GPT-4o" },
  { provider: "anthropic", model_id: "claude-3-5-sonnet-20241022", display_name: "Claude Sonnet" },
  { provider: "anthropic", model_id: "claude-3-5-haiku-20241022", display_name: "Claude Haiku" }
];

describe("getFirstModelWithKey", () => {
  it("returns first OpenAI model when only OpenAI has key", () => {
    const result = getFirstModelWithKey(MODELS, { openai: true, anthropic: false });
    expect(result).toBe("gpt-4o-mini");
  });

  it("returns first Anthropic model when only Anthropic has key", () => {
    const result = getFirstModelWithKey(MODELS, { openai: false, anthropic: true });
    expect(result).toBe("claude-3-5-sonnet-20241022");
  });

  it("returns first model when both have keys (OpenAI first in registry)", () => {
    const result = getFirstModelWithKey(MODELS, { openai: true, anthropic: true });
    expect(result).toBe("gpt-4o-mini");
  });

  it("returns null when no keys configured", () => {
    const result = getFirstModelWithKey(MODELS, { openai: false, anthropic: false });
    expect(result).toBe(null);
  });

  it("returns null when models array is empty", () => {
    const result = getFirstModelWithKey([], { openai: true, anthropic: true });
    expect(result).toBe(null);
  });
});
