import { describe, expect, it, vi } from "vitest";
import { runAgentFromRefinement } from "./App";

describe("runAgentFromRefinement", () => {
  it("activates refinement conversation before requesting patch", async () => {
    const calls: string[] = [];
    const activateConversation = vi.fn(async (_conversationId: string) => {
      calls.push("activate");
    });
    const requestPatch = vi.fn(async () => {
      calls.push("request");
    });

    await runAgentFromRefinement({
      description: "**Goal**: keep context",
      isRequestingPatch: false,
      patchInProgress: false,
      feedbackInfo: {
        feedbackId: "F-1",
        feedbackTitle: "Title",
        feedbackSummary: "Summary",
        feedbackArea: "ui",
      },
      refinementConversationId: "conv-refine-1",
      activateConversation,
      requestPatch,
    });

    expect(activateConversation).toHaveBeenCalledWith("conv-refine-1");
    expect(requestPatch).toHaveBeenCalledWith(
      "F-1",
      "Title",
      "Summary",
      "ui",
      {
        raw_description: "**Goal**: keep context",
        refinement_conversation_id: "conv-refine-1",
      }
    );
    expect(calls).toEqual(["activate", "request"]);
  });

  it("returns early when patch request is already busy", async () => {
    const activateConversation = vi.fn(async () => undefined);
    const requestPatch = vi.fn(async () => undefined);

    await runAgentFromRefinement({
      description: "desc",
      isRequestingPatch: true,
      patchInProgress: false,
      feedbackInfo: {
        feedbackId: "F-1",
        feedbackTitle: "Title",
        feedbackSummary: "Summary",
        feedbackArea: "ui",
      },
      refinementConversationId: "conv-refine-1",
      activateConversation,
      requestPatch,
    });

    expect(activateConversation).not.toHaveBeenCalled();
    expect(requestPatch).not.toHaveBeenCalled();
  });

  it("still requests a patch when no refinement conversation id is available", async () => {
    const activateConversation = vi.fn(async () => undefined);
    const requestPatch = vi.fn(async () => undefined);

    await runAgentFromRefinement({
      description: "desc",
      isRequestingPatch: false,
      patchInProgress: false,
      feedbackInfo: {
        feedbackId: "F-1",
        feedbackTitle: "Title",
        feedbackSummary: "Summary",
        feedbackArea: "ui",
      },
      refinementConversationId: null,
      activateConversation,
      requestPatch,
    });

    expect(activateConversation).not.toHaveBeenCalled();
    expect(requestPatch).toHaveBeenCalledWith(
      "F-1",
      "Title",
      "Summary",
      "ui",
      { raw_description: "desc", refinement_conversation_id: null }
    );
  });
});
