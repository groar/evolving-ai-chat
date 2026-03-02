/**
 * @vitest-environment happy-dom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PatchNotification, type PatchEntry, type PatchStatus } from "./PatchNotification";

afterEach(cleanup);

function makePatch(overrides: Partial<PatchEntry> = {}): PatchEntry {
  return {
    id: "PA-001",
    status: "applied",
    title: "Updated welcome copy",
    description: "Changed the greeting in the chat header.",
    unified_diff: "--- a/src/App.tsx\n+++ b/src/App.tsx\n@@ -1 +1 @@\n-Hello\n+Hi there",
    created_at: "2026-03-01T14:22:00Z",
    ...overrides
  };
}

const noop = () => undefined;

describe("PatchNotification — UI states (spec §5 copy compliance)", () => {
  const spinnerStates: PatchStatus[] = ["pending_apply", "pending", "applying", "reverting"];

  it.each(spinnerStates)("shows spinner for %s state", (status) => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup).toContain("animate-spin");
  });

  it("pending_apply shows spec copy: 'Working on a change based on your feedback…'", () => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status: "pending_apply" })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup).toContain("Working on a change based on your feedback");
  });

  it("pending shows spec copy: 'Working on a change based on your feedback…'", () => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status: "pending" })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup).toContain("Working on a change based on your feedback");
  });

  it("applying shows spec copy: 'Applying change…'", () => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status: "applying" })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup).toContain("Applying change");
  });

  it("applied shows description with Undo?", () => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status: "applied" })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup).toContain("Changed the greeting in the chat header");
    expect(markup).toContain("Undo?");
  });

  it("apply_failed shows spec copy: 'Couldn't apply the change'", () => {
    const markup = renderToStaticMarkup(
      <PatchNotification
        patch={makePatch({ status: "apply_failed", failure_reason: "validation_failed" })}
        onUndo={noop}
        onDismiss={noop}
      />
    );
    expect(markup).toContain("apply the change");
    expect(markup).toContain("No files were modified");
  });

  it("scope_blocked shows spec copy", () => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status: "scope_blocked" })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup).toContain("The agent tried to modify files outside the allowed area");
    expect(markup).toContain("Change blocked");
  });

  it("reverted shows spec copy: 'Change undone. The app is back to how it was.'", () => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status: "reverted" })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup).toContain("Change undone. The app is back to how it was");
  });

  it("rollback_conflict shows spec copy", () => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status: "rollback_conflict" })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup).toContain("undo this automatically");
    expect(markup).toContain("a later change modified the same files");
  });

  it("rollback_unavailable shows spec copy", () => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status: "rollback_unavailable" })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup).toContain("Rollback is no longer available for this change");
  });
});

describe("PatchNotification — copy constraints (spec §5 must-not violations)", () => {
  const allStatuses: PatchStatus[] = [
    "pending_apply",
    "pending",
    "applying",
    "applied",
    "apply_failed",
    "scope_blocked",
    "reverted",
    "rollback_conflict",
    "rollback_unavailable",
    "reverting"
  ];

  it.each(allStatuses)("must not say 'approved' in %s state", (status) => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup.toLowerCase()).not.toContain("approved");
  });

  it.each(allStatuses)("must not say 'permanent' in %s state", (status) => {
    const markup = renderToStaticMarkup(
      <PatchNotification patch={makePatch({ status })} onUndo={noop} onDismiss={noop} />
    );
    expect(markup.toLowerCase()).not.toContain("permanent");
  });

  it.each(["pending_apply", "pending", "applying"] as PatchStatus[])(
    "must not say 'Done' in spinner state %s",
    (status) => {
      const markup = renderToStaticMarkup(
        <PatchNotification patch={makePatch({ status })} onUndo={noop} onDismiss={noop} />
      );
      expect(markup).not.toContain(">Done<");
    }
  );
});

describe("PatchNotification — Undo action", () => {
  it("shows Undo button in applied state", () => {
    render(
      <PatchNotification patch={makePatch({ status: "applied" })} onUndo={noop} onDismiss={noop} />
    );
    expect(screen.getByRole("button", { name: /Undo/i })).toBeTruthy();
  });

  it("does NOT show Undo button in reverted state", () => {
    render(
      <PatchNotification patch={makePatch({ status: "reverted" })} onUndo={noop} onDismiss={noop} />
    );
    expect(screen.queryByRole("button", { name: /^Undo$/i })).toBeNull();
  });

  it("calls onUndo with patch id when Undo is clicked", async () => {
    const onUndo = vi.fn();
    render(
      <PatchNotification
        patch={makePatch({ status: "applied", id: "PA-42" })}
        onUndo={onUndo}
        onDismiss={noop}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /Undo/i }));
    expect(onUndo).toHaveBeenCalledWith("PA-42");
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});

describe("PatchNotification — Dismiss action", () => {
  const dismissableStatuses: PatchStatus[] = [
    "apply_failed",
    "scope_blocked",
    "rollback_conflict",
    "rollback_unavailable"
  ];

  it.each(dismissableStatuses)("shows Dismiss button in %s state", (status) => {
    render(
      <PatchNotification patch={makePatch({ status })} onUndo={noop} onDismiss={noop} />
    );
    expect(screen.getByRole("button", { name: /Dismiss/i })).toBeTruthy();
  });

  it("calls onDismiss when Dismiss is clicked", async () => {
    const onDismiss = vi.fn();
    render(
      <PatchNotification patch={makePatch({ status: "apply_failed" })} onUndo={noop} onDismiss={onDismiss} />
    );
    await userEvent.click(screen.getByRole("button", { name: /Dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("PatchNotification — diff toggle", () => {
  it("shows 'See what changed' button in applied state when diff present", () => {
    render(
      <PatchNotification patch={makePatch({ status: "applied" })} onUndo={noop} onDismiss={noop} />
    );
    const btn = screen.getByRole("button", { name: /See what changed/i });
    expect(btn).toBeTruthy();
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("shows 'See what was reverted' button in reverted state when diff present", () => {
    render(
      <PatchNotification patch={makePatch({ status: "reverted" })} onUndo={noop} onDismiss={noop} />
    );
    expect(screen.getByRole("button", { name: /See what was reverted/i })).toBeTruthy();
  });

  it("expands and collapses the diff on toggle", async () => {
    render(
      <PatchNotification patch={makePatch({ status: "applied" })} onUndo={noop} onDismiss={noop} />
    );
    const toggleBtn = screen.getByRole("button", { name: /See what changed/i });

    // Initially collapsed
    expect(screen.queryByRole("code")).toBeNull();

    await userEvent.click(toggleBtn);
    // Now expanded
    const code = screen.getByRole("code");
    expect(code.textContent).toContain("Hello");

    // Toggle closed
    await userEvent.click(screen.getByRole("button", { name: /Hide changes/i }));
    expect(screen.queryByRole("code")).toBeNull();
  });

  it("does not show diff toggle when unified_diff is empty", () => {
    render(
      <PatchNotification
        patch={makePatch({ status: "applied", unified_diff: "" })}
        onUndo={noop}
        onDismiss={noop}
      />
    );
    expect(screen.queryByRole("button", { name: /See what changed/i })).toBeNull();
  });
});

describe("PatchNotification — accessibility", () => {
  it("has role=status and aria-live=polite for screen-reader announcements", () => {
    render(
      <PatchNotification patch={makePatch({ status: "applied" })} onUndo={noop} onDismiss={noop} />
    );
    const notification = screen.getByRole("status");
    expect(notification.getAttribute("aria-live")).toBe("polite");
  });

  it("Undo button has accessible label", () => {
    render(
      <PatchNotification patch={makePatch({ status: "applied" })} onUndo={noop} onDismiss={noop} />
    );
    expect(screen.getByRole("button", { name: /Undo this change/i })).toBeTruthy();
  });

  it("diff toggle button tracks aria-expanded state", async () => {
    render(
      <PatchNotification patch={makePatch({ status: "applied" })} onUndo={noop} onDismiss={noop} />
    );
    const btn = screen.getByRole("button", { name: /See what changed/i });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    await userEvent.click(btn);
    expect(screen.getByRole("button", { name: /Hide changes/i }).getAttribute("aria-expanded")).toBe("true");
  });
});
