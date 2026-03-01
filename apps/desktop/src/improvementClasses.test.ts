/**
 * Unit tests for improvement class registry and routing per docs/m7-improvement-classes.md.
 */
import { describe, expect, it } from "vitest";
import { getClassById, routeFeedbackToClass } from "./improvementClasses";

describe("improvementClasses", () => {
  describe("routeFeedbackToClass", () => {
    it("routes tone-tagged feedback to system-prompt-persona-v1", () => {
      expect(
        routeFeedbackToClass({ text: "Something is wrong", tags: ["tone"] })
      ).toBe("system-prompt-persona-v1");
    });

    it("routes text about verbosity to system-prompt-persona-v1", () => {
      expect(
        routeFeedbackToClass({ text: "Responses are too long and wordy" })
      ).toBe("system-prompt-persona-v1");
    });

    it("routes text about conciseness to system-prompt-persona-v1", () => {
      expect(
        routeFeedbackToClass({ text: "I want more concise answers" })
      ).toBe("system-prompt-persona-v1");
    });

    it("routes copy-tagged feedback to settings-trust-microcopy-v1", () => {
      expect(
        routeFeedbackToClass({ text: "Labels need work", tags: ["copy"] })
      ).toBe("settings-trust-microcopy-v1");
    });

    it("routes settings text to settings-trust-microcopy-v1", () => {
      expect(
        routeFeedbackToClass({ text: "The Improvements section is confusing" })
      ).toBe("settings-trust-microcopy-v1");
    });

    it("returns null when no class matches", () => {
      expect(
        routeFeedbackToClass({ text: "Random feature request", tags: ["feature-request"] })
      ).toBeNull();
    });
  });

  describe("getClassById", () => {
    it("returns class for valid id", () => {
      const cls = getClassById("system-prompt-persona-v1");
      expect(cls).not.toBeNull();
      expect(cls?.label).toBe("AI Persona & Tone");
      expect(cls?.apply_target).toBe("system_prompt");
    });

    it("returns null for unknown id", () => {
      expect(getClassById("unknown-class" as never)).toBeNull();
    });
  });
});
