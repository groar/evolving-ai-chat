import { create } from "zustand";

export type ChatMessage = {
  id: string | number;
  role: "user" | "assistant";
  text: string;
  meta?: string;
};

export type Conversation = {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type ConversationStore = {
  conversations: Conversation[];
  activeConversationId: string;
  messages: ChatMessage[];
  composer: string;
  isSending: boolean;
  streamingText: string;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setComposer: (value: string) => void;
  setIsSending: (value: boolean) => void;
  setStreamingText: (value: string) => void;
};

export const useConversationStore = create<ConversationStore>((set) => ({
  conversations: [],
  activeConversationId: "",
  messages: [],
  composer: "",
  isSending: false,
  streamingText: "",
  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  setComposer: (value) => set({ composer: value }),
  setIsSending: (value) => set({ isSending: value }),
  setStreamingText: (value) => set({ streamingText: value })
}));
