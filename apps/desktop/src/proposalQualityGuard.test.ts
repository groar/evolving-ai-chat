import { describe, expect, it } from "vitest";
import { isConcreteProposal } from "./proposalQualityGuard";

describe("proposalQualityGuard", () => {
  it("rejects feedback echo as title", () => {
    const result = isConcreteProposal({
      title: "Clarify: Improvements section is confusing",
      rationale: "User reported confusion about the Improvements section.",
      diffSummary: "Rename labels in Settings.",
      feedbackText: "Improvements section is confusing"
    });
    expect(result).toBe(false);
  });

  it("rejects when rationale is verbatim feedback copy", () => {
    const result = isConcreteProposal({
      title: "Clarify Improvements section labels",
      rationale: "Improvements section is confusing and I don't know what Change Drafts means",
      diffSummary: "Rename 'Change Drafts' to 'Suggested improvements'.",
      feedbackText: "Improvements section is confusing and I don't know what Change Drafts means"
    });
    expect(result).toBe(false);
  });

  it("accepts compliant proposal with named target, described change, linked rationale, and no echo", () => {
    const result = isConcreteProposal({
      title: "Rename 'Safe Offline' label to 'Works without internet'",
      rationale: "User reported the 'Safe Offline' label is unclear. Replacing with 'Works without internet' clarifies that the app works locally when disconnected.",
      diffSummary: "Rename 'Safe Offline' → 'Works without internet' in Settings.",
      feedbackText: "I don't understand what Safe Offline means"
    });
    expect(result).toBe(true);
  });

  it("accepts proposal for Improvements section", () => {
    const result = isConcreteProposal({
      title: "Clarify Improvements section labels in Settings",
      rationale: "User reported confusion about the Improvements section labels. Rename 'Change Drafts' to 'Suggested improvements'.",
      diffSummary: "Rename 'Change Drafts' → 'Suggested improvements'.",
      feedbackText: "Improvements section is confusing"
    });
    expect(result).toBe(true);
  });
});
