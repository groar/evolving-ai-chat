/**
 * @vitest-environment happy-dom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PatchEntry } from "./PatchNotification";
import { RefinementConversation } from "./RefinementConversation";

afterEach(cleanup);

function makePatch(overrides: Partial<PatchEntry> = {}): PatchEntry {
  return {
    id: "PA-001",
    status: "pending_apply",
    title: "Patch title",
    description: "Patch description",
    unified_diff: "",
    created_at: "2026-03-08T10:00:00.000Z",
    ...overrides,
  };
}

function renderConversation(activePatch: PatchEntry | null) {
  render(
    <RefinementConversation
      messages={[
        { role: "assistant", text: "## Functional Description\n\n- Update the status card." },
      ]}
      streamingText=""
      isSending={false}
      isLoading={false}
      error={null}
      feedbackTitle="Status feedback"
      activePatch={activePatch}
      onSendMessage={vi.fn()}
      onRunAgent={vi.fn()}
      onEdit={vi.fn()}
      onCancel={vi.fn()}
    />
  );
}

describe("RefinementConversation patch status", () => {
  it("shows in-progress status while patch is running", () => {
    renderConversation(makePatch({ status: "applying" }));
    expect(screen.getByText(/Applying change/)).toBeTruthy();
  });

  it("shows terminal failure status with reason when patch fails", () => {
    renderConversation(makePatch({ status: "apply_failed", failure_reason: "patch_timeout" }));
    expect(screen.getByText(/Failed: the patch timed out/i)).toBeTruthy();
  });
});
