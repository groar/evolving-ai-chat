import { describe, expect, it } from "vitest";
import { generateProposalFromFeedback } from "./proposalGenerator";

describe("proposalGenerator", () => {
  it("produces concrete proposal for Improvements section feedback", () => {
    const result = generateProposalFromFeedback({
      id: "fb-1",
      text: "Improvements section is confusing"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.title).not.toMatch(/^Clarify:\s*Improvements section is confusing/);
      expect(result.title.length).toBeGreaterThan(10);
      expect(result.rationale).toContain("User");
      expect(result.diffSummary).toBeTruthy();
    }
  });

  it("produces concrete proposal for Safe Offline feedback", () => {
    const result = generateProposalFromFeedback({
      id: "fb-2",
      text: "What does Safe Offline mean?"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.title).toContain("Safe Offline");
      expect(result.title).toContain("Works without internet");
    }
  });

  it("returns error for empty feedback", () => {
    const result = generateProposalFromFeedback({ id: "fb-3", text: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("couldn't generate");
    }
  });

  it("rejects feedback that would produce echo (generator must not output echo)", () => {
    const result = generateProposalFromFeedback({
      id: "fb-4",
      text: "x y z random gibberish feedback that does not match any pattern"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.title).not.toBe("Clarify: x y z random gibberish feedback that does not match any pattern");
      expect(result.rationale).not.toBe("x y z random gibberish feedback that does not match any pattern");
    }
  });

  it("produces persona proposal for tone feedback (system-prompt-persona-v1)", () => {
    const result = generateProposalFromFeedback(
      { id: "fb-5", text: "AI responses are too long and verbose" },
      2,
      "system-prompt-persona-v1"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.improvementClass).toBe("system-prompt-persona-v1");
      expect(result.title).toContain("conciseness");
      expect(result.diffSummary).toMatch(/Append/);
      expect(result.diffSummary).toContain("Keep responses concise");
    }
  });

  it("persona proposal diff_summary contains exact sentence to append", () => {
    const result = generateProposalFromFeedback(
      { id: "fb-6", text: "Too wordy" },
      2,
      "system-prompt-persona-v1"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.diffSummary).toMatch(/Append\s+".+?"\s+to/);
    }
  });
});
