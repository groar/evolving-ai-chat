export type FeedbackStatus = "new" | "triaged" | "converted" | "closed";

export type FeedbackTag = "confusing" | "feature-request" | "bug-risk" | "copy" | "tone";

export type FeedbackDraft = {
  text: string;
  tags: FeedbackTag[];
  contextPointer?: string;
};

export type FeedbackItem = {
  id: string;
  timestamp: string;
  text: string;
  tags: FeedbackTag[];
  context_pointer?: string;
  status: FeedbackStatus;
};

export const feedbackStorageKey = "local_feedback_items_v1";

export const feedbackTagOptions: Array<{ value: FeedbackTag; label: string }> = [
  { value: "confusing", label: "Confusing" },
  { value: "feature-request", label: "Feature request" },
  { value: "bug-risk", label: "Bug risk" },
  { value: "copy", label: "Copy" },
  { value: "tone", label: "Response tone & style" }
];

export function createFeedbackItem(
  draft: FeedbackDraft,
  nowIso = new Date().toISOString(),
  idFactory: () => string = () => Math.random().toString(36).slice(2, 10)
): FeedbackItem {
  return {
    id: `fb-${nowIso}-${idFactory()}`,
    timestamp: nowIso,
    text: draft.text.trim(),
    tags: draft.tags,
    context_pointer: draft.contextPointer,
    status: "new"
  };
}

export function readFeedbackItems(storage: Pick<Storage, "getItem">): FeedbackItem[] {
  const rawValue = storage.getItem(feedbackStorageKey);
  if (!rawValue) {
    return [];
  }

  const parsed = JSON.parse(rawValue) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isFeedbackItem);
}

export function appendFeedbackItem(
  storage: Pick<Storage, "getItem" | "setItem">,
  item: FeedbackItem
): FeedbackItem[] {
  const currentItems = readFeedbackItems(storage);
  const nextItems = [item, ...currentItems];
  storage.setItem(feedbackStorageKey, JSON.stringify(nextItems));
  return nextItems;
}

export function clearFeedbackItems(storage: Pick<Storage, "removeItem">): void {
  storage.removeItem(feedbackStorageKey);
}

function isFeedbackItem(value: unknown): value is FeedbackItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.text === "string" &&
    Array.isArray(candidate.tags) &&
    typeof candidate.status === "string"
  );
}
