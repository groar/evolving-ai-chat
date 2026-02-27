import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { FeedbackPanel } from "./feedbackPanel";
import { appendFeedbackItem, createFeedbackItem, readFeedbackItems, type FeedbackTag } from "./feedbackStore";

type StorageMap = Map<string, string>;

function makeMemoryStorage() {
  const values: StorageMap = new Map();
  return {
    getItem(key: string): string | null {
      return values.has(key) ? values.get(key) ?? null : null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    }
  };
}

function renderPanel(overrides: Partial<ComponentProps<typeof FeedbackPanel>> = {}) {
  return FeedbackPanel({
    isOpen: true,
    isBusy: false,
    draftText: "The capture action should be easier to spot.",
    selectedTags: ["confusing"],
    contextPointer: "conv-1",
    items: [],
    notice: null,
    error: null,
    onToggleOpen: () => undefined,
    onChangeDraftText: () => undefined,
    onToggleTag: (_tag: FeedbackTag) => undefined,
    onSubmitFeedback: () => undefined,
    ...overrides
  });
}

function findFormSubmitHandler(node: unknown): ((event: { preventDefault: () => void }) => void) | null {
  if (!node || typeof node !== "object") {
    return null;
  }

  const reactNode = node as { type?: unknown; props?: { children?: unknown; onSubmit?: (event: { preventDefault: () => void }) => void } };
  if (reactNode.type === "form" && reactNode.props && typeof reactNode.props.onSubmit === "function") {
    return reactNode.props.onSubmit;
  }

  if (!reactNode.props || reactNode.props.children === undefined) {
    return null;
  }

  const children = Array.isArray(reactNode.props.children) ? reactNode.props.children : [reactNode.props.children];
  for (const child of children) {
    const maybeHandler = findFormSubmitHandler(child);
    if (maybeHandler) {
      return maybeHandler;
    }
  }

  return null;
}

describe("FeedbackPanel", () => {
  it("submitting feedback creates and persists an item", () => {
    const storage = makeMemoryStorage();
    const onSubmitFeedback = () => {
      const item = createFeedbackItem(
        {
          text: "The capture action should be easier to spot.",
          tags: ["confusing"],
          contextPointer: "conv-1"
        },
        "2026-02-27T12:00:00.000Z",
        () => "fixed-id"
      );
      appendFeedbackItem(storage, item);
    };

    const element = renderPanel({ onSubmitFeedback });
    const submit = findFormSubmitHandler(element);
    expect(submit).not.toBeNull();

    submit?.({ preventDefault: () => undefined });

    const savedItems = readFeedbackItems(storage);
    expect(savedItems).toHaveLength(1);
    expect(savedItems[0]?.status).toBe("new");
    expect(savedItems[0]?.text).toBe("The capture action should be easier to spot.");
    expect(savedItems[0]?.tags).toEqual(["confusing"]);
  });
});
