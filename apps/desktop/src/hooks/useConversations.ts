import { useConversationStore } from "../stores/conversationStore";
import { useRuntime } from "./useRuntime";

/**
 * Encapsulates conversation CRUD and active conversation tracking.
 * Composes conversation store state with runtime HTTP actions.
 */
export function useConversations() {
  const conversations = useConversationStore((s) => s.conversations);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const messages = useConversationStore((s) => s.messages);
  const runtime = useRuntime();

  return {
    conversations,
    activeConversationId,
    messages,
    createConversation: runtime.createConversation,
    activateConversation: runtime.activateConversation
  };
}
