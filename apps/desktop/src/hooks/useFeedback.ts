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

/**
 * Encapsulates feedback draft state and localStorage persistence.
 * Per ticket: feedback stays in localStorage (feedbackStore.ts), not Zustand.
 */
export function useFeedback(isBusy: boolean) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [tags, setTags] = useState<FeedbackTag[]>([]);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const nextItem = createFeedbackItem({
      text: nextText,
      tags,
      contextPointer: activeConversationId || undefined
    });

    try {
      const nextItems = appendFeedbackItem(window.localStorage, nextItem);
      setItems(nextItems);
      setDraftText("");
      setTags([]);
      setNotice("Saved locally. You can review captured items below.");
      setError(null);
      setIsOpen(true);
    } catch {
      setNotice(null);
      setError("Could not save feedback locally. Core chat is unaffected.");
    }
  }, [draftText, tags, activeConversationId, isBusy]);

  const clearAll = useCallback(() => {
    clearFeedbackItems(window.localStorage);
    setItems([]);
    setDraftText("");
    setTags([]);
    setNotice(null);
    setError(null);
  }, []);

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
    clearAll
  };
}
