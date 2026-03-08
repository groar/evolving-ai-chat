/**
 * @vitest-environment happy-dom
 */
import type { ComponentProps } from "react";
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivitySheet } from "./activitySheet";
import type { PatchEntry } from "./PatchNotification";
import type { ChangelogEntry } from "./settingsPanel";

beforeEach(() => cleanup());

/** Scope queries to the last-rendered Activity sheet (portals leave multiple in DOM). */
function getCurrentSheet(): HTMLElement {
  const sheets = screen.getAllByTestId("activity-sheet");
  return sheets[sheets.length - 1] as HTMLElement;
}

function makePatch(overrides: Partial<PatchEntry> = {}): PatchEntry {
  return {
    id: "patch-1",
    status: "applied",
    title: "Add focus trap to dialog",
    description: "Improve a11y",
    unified_diff: "--- a/file.ts\n+++ b/file.ts\n@@ -1,3 +1,4 @@\n line",
    created_at: "2026-03-01T14:00:00.000Z",
    applied_at: "2026-03-01T14:00:01.000Z",
    ...overrides
  };
}

function renderSheet(overrides: Partial<ComponentProps<typeof ActivitySheet>> = {}) {
  return render(
    <ActivitySheet
      open={true}
      onOpenChange={() => undefined}
      patches={[]}
      changelog={[]}
      isBusy={false}
      onRollbackPatch={() => undefined}
      {...overrides}
    />
  );
}

describe("ActivitySheet", () => {
  it("renders empty state when no patches and no changelog", () => {
    renderSheet();
    const sheet = getCurrentSheet();
    expect(within(sheet).getByTestId("activity-empty-state")).toBeTruthy();
    expect(within(sheet).getByText("No activity yet. Changes applied by AI will appear here.")).toBeTruthy();
  });

  it("renders sheet with Activity title", () => {
    renderSheet();
    expect(within(getCurrentSheet()).getByRole("heading", { name: "Activity" })).toBeTruthy();
  });

  it("renders patch cards grouped by date", () => {
    const patches: PatchEntry[] = [
      makePatch({ id: "p1", title: "First patch", created_at: "2026-03-04T10:00:00.000Z" }),
      makePatch({ id: "p2", title: "Second patch", created_at: "2026-03-04T11:00:00.000Z" })
    ];
    renderSheet({ patches });
    const sheet = getCurrentSheet();
    expect(within(sheet).queryByTestId("activity-empty-state")).toBeNull();
    expect(within(sheet).getByTestId("activity-patch-p1")).toBeTruthy();
    expect(within(sheet).getByTestId("activity-patch-p2")).toBeTruthy();
    expect(within(sheet).getByText("First patch")).toBeTruthy();
    expect(within(sheet).getByText("Second patch")).toBeTruthy();
    expect(within(sheet).getAllByText("Applied").length).toBeGreaterThanOrEqual(1);
  });

  it("expands card on click to show diff and Undo button", async () => {
    const patches = [makePatch({ id: "p1", title: "Focus trap" })];
    renderSheet({ patches });
    const sheet = getCurrentSheet();
    const card = within(sheet).getByTestId("activity-patch-p1");
    expect(within(sheet).queryByRole("button", { name: /^Undo:/ })).toBeNull();

    await userEvent.click(within(card).getByRole("button"));

    expect(within(sheet).getByRole("button", { name: /Undo: Focus trap/ })).toBeTruthy();
    expect(within(sheet).getByText(/--- a\/file.ts/)).toBeTruthy();
  });

  it("shows Undo button only for applied patches when expanded", async () => {
    const appliedPatch = makePatch({ id: "p1", status: "applied", title: "Applied patch" });
    renderSheet({ patches: [appliedPatch] });
    const sheet = getCurrentSheet();
    const card = within(sheet).getByTestId("activity-patch-p1");
    await userEvent.click(within(card).getByRole("button"));
    expect(within(sheet).getByRole("button", { name: /Undo: Applied patch/ })).toBeTruthy();
  });

  it("does not show Undo for reverted patch when expanded", async () => {
    const revertedPatch = makePatch({ id: "p1", status: "reverted", title: "Reverted patch" });
    renderSheet({ patches: [revertedPatch] });
    const sheet = getCurrentSheet();
    const card = within(sheet).getByTestId("activity-patch-p1");
    await userEvent.click(within(card).getByRole("button"));
    expect(within(sheet).queryByRole("button", { name: /^Undo:/ })).toBeNull();
  });

  it("calls onRollbackPatch when Undo is clicked", async () => {
    const onRollbackPatch = vi.fn();
    const patches = [makePatch({ id: "p1", title: "Fix" })];
    renderSheet({ patches, onRollbackPatch });
    const sheet = getCurrentSheet();
    await userEvent.click(within(within(sheet).getByTestId("activity-patch-p1")).getByRole("button"));
    await userEvent.click(within(sheet).getByRole("button", { name: /Undo: Fix/ }));
    expect(onRollbackPatch).toHaveBeenCalledWith("p1");
  });

  it("renders Release notes section when changelog has entries", () => {
    const changelog: ChangelogEntry[] = [
      {
        created_at: "2026-03-01T12:00:00.000Z",
        title: "New feature",
        summary: "Something new.",
        channel: "stable"
      }
    ];
    renderSheet({ changelog });
    const sheet = getCurrentSheet();
    expect(within(sheet).getByText("Release notes")).toBeTruthy();
    expect(within(sheet).getByText("New feature")).toBeTruthy();
  });

  it("has data-testid activity-sheet when open", () => {
    renderSheet({ open: true });
    const sheets = screen.getAllByTestId("activity-sheet");
    expect(sheets.length).toBeGreaterThanOrEqual(1);
    expect(sheets[0]).toBeTruthy();
  });

  it("loads and renders agent log when details are expanded", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        patch_id: "p1",
        log_text: "agent log line",
        created_at: "2026-03-04T12:00:00.000Z"
      })
    } as any);

    const patches = [makePatch({ id: "p1", title: "With log" })];
    renderSheet({ patches });
    const sheet = getCurrentSheet();
    const card = within(sheet).getByTestId("activity-patch-p1");

    await userEvent.click(within(card).getByRole("button"));
    const details = within(card).getByText(/Agent log/);
    await userEvent.click(details);

    await waitFor(() => {
      expect(within(card).getByText("agent log line")).toBeTruthy();
    });

    fetchSpy.mockRestore();
  });

  it("shows offline message when log fetch fails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch" as any).mockRejectedValue(new Error("offline"));

    const patches = [makePatch({ id: "p1", title: "With log error" })];
    renderSheet({ patches });
    const sheet = getCurrentSheet();
    const card = within(sheet).getByTestId("activity-patch-p1");

    await userEvent.click(within(card).getByRole("button"));
    const details = within(card).getByText(/Agent log/);
    await userEvent.click(details);

    await waitFor(() => {
      expect(within(card).getByText("Log not available (runtime offline).")).toBeTruthy();
    });

    fetchSpy.mockRestore();
  });

  it("calls onOpenRefinement with refinement_conversation_id when opening discussion from Activity (T-0103)", async () => {
    const onOpenRefinement = vi.fn();
    const patch = makePatch({
      id: "p1",
      feedback_id: "fb-1",
      title: "My patch",
      refinement_conversation_id: "conv-ref-1"
    });
    renderSheet({ patches: [patch], onOpenRefinement });
    const sheet = getCurrentSheet();
    const card = within(sheet).getByTestId("activity-patch-p1");
    await userEvent.click(within(card).getByRole("button"));
    await userEvent.click(within(sheet).getByRole("button", { name: "Open refinement discussion" }));
    expect(onOpenRefinement).toHaveBeenCalledWith("fb-1", "My patch", "conv-ref-1");
  });

  it("groups stub and low-signal entries under collapsible sections", () => {
    const patches: PatchEntry[] = [
      makePatch({ id: "main1", title: "Real change with diff", unified_diff: "--- a/x\n+++ b/x\n", created_at: "2026-03-04T10:00:00.000Z" }),
      makePatch({ id: "stub1", title: "[stub] UI adjustment: test", status: "applied", unified_diff: "", description: "", created_at: "2026-03-04T10:05:00.000Z" }),
      makePatch({ id: "inprog1", title: "Pending change", status: "pending_apply", created_at: "2026-03-04T10:10:00.000Z" })
    ];
    renderSheet({ patches });
    const sheet = getCurrentSheet();
    expect(within(sheet).getByTestId("activity-patch-main1")).toBeTruthy();
    expect(within(sheet).getByTestId("activity-in-progress-details")).toBeTruthy();
    expect(within(sheet).getByTestId("activity-other-details")).toBeTruthy();
    expect(within(sheet).getByText("In progress (1)")).toBeTruthy();
    expect(within(sheet).getByText("Other activity (1)")).toBeTruthy();
    expect(within(sheet).getByTestId("activity-patch-stub1")).toBeTruthy();
    expect(within(sheet).getByTestId("activity-patch-inprog1")).toBeTruthy();
  });
});
