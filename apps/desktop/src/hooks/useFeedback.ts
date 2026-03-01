import { useCallback, useEffect, useState } from "react";
import {
  appendFeedbackItem,
  clearFeedbackItems,
  createFeedbackItem,
  readFeedbackItems,
  type FeedbackItem,
  type FeedbackTag
} from "../feedbackStore";
import { useConversationStore } from "../stores/conversationStore";

export type PendingFeedbackContext = {
  conversationId: string;
  messageId: string | number;
};

/**
 * Encapsulates feedback draft state and localStorage persistence.
 * Per ticket: feedback stays in localStorage (feedbackStore.ts), not Zustand.
 * Supports per-response feedback: call openFeedbackForMessage before opening the panel.
 */
export function useFeedback(isBusy: boolean) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [tags, setTags] = useState<FeedbackTag[]>([]);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingContext, setPendingContext] = useState<PendingFeedbackContext | null>(null);

  const activeConversationId = useConversationStore((s) => s.activeConversationId);

  useEffect(() => {
    try {
      setItems(readFeedbackItems(window.localStorage));
      setError(null);
    } catch {
      setError("Could not load local feedback. You can still use chat.");
    }
  }, []);

  const toggleTag = useCallback((tag: FeedbackTag) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  }, []);

  const submitFeedback = useCallback(() => {
    const nextText = draftText.trim();
    if (nextText.length === 0 || isBusy) return;

    const contextPointer = pendingContext
      ? `${pendingContext.conversationId}:${pendingContext.messageId}`
      : activeConversationId || undefined;

    const nextItem = createFeedbackItem({
      text: nextText,
      tags,
      contextPointer
    });

    try {
      const nextItems = appendFeedbackItem(window.localStorage, nextItem);
      setItems(nextItems);
      setDraftText("");
      setTags([]);
      setPendingContext(null);
      setNotice("Saved locally. You can review captured items below.");
      setError(null);
      setIsOpen(true);
    } catch {
      setNotice(null);
      setError("Could not save feedback locally. Core chat is unaffected.");
    }
  }, [draftText, tags, pendingContext, activeConversationId, isBusy]);

  const openFeedbackForMessage = useCallback(
    (conversationId: string, messageId: string | number) => {
      setPendingContext({ conversationId, messageId });
      setIsOpen(true);
    },
    []
  );

  const clearPendingContext = useCallback(() => {
    setPendingContext(null);
  }, []);

  const clearAll = useCallback(() => {
    clearFeedbackItems(window.localStorage);
    setItems([]);
    setDraftText("");
    setTags([]);
    setNotice(null);
    setError(null);
  }, []);

  const displayContextPointer =
    pendingContext
      ? `${pendingContext.conversationId}:${pendingContext.messageId}`
      : activeConversationId || null;

  return {
    isOpen,
    setIsOpen,
    draftText,
    setDraftText,
    tags,
    items,
    notice,
    error,
    toggleTag,
    submitFeedback,
    clearAll,
    openFeedbackForMessage,
    clearPendingContext,
    contextPointer: displayContextPointer
  };
}
