/**
 * T-0092: Refinement conversation hook.
 *
 * Manages the two-phase flow: feedback → refinement conversation
 * (functional-only clarification) → validated functional description
 * → self-evolving agent.
 */
import { useCallback, useRef, useState } from "react";
import { runtimeBase } from "./useRuntime";

export type RefinementMessage = {
  role: "user" | "assistant";
  text: string;
  meta?: string;
};

export type RefinementFeedbackInfo = {
  feedbackId: string;
  feedbackTitle: string;
  feedbackSummary: string;
  feedbackArea: string;
};

const REFINEMENT_SYSTEM_PROMPT = `You are a product analyst helping a user clarify their feedback about a personal AI chat application. Your goal is to produce a clear, validated functional description of what the user wants changed — from the user's perspective only.

You have access to product documentation that describes the application's current state, scope, and goals. Use this context to ground your questions.

Your job:
1. Understand what the user wants to experience differently.
2. Ask 1-3 focused clarifying questions if the feedback is ambiguous.
   Focus on user-facing behavior: what they see, what they expect, what feels wrong.
3. When you have enough clarity, produce a functional description in this exact format:

**Goal**: [what the user wants to experience differently — one sentence]
**Current behavior**: [what happens now, from the user's perspective]
**Desired behavior**: [what should happen instead, from the user's perspective]
**Constraints**: [what should NOT change from the user's perspective]

4. Ask the user to confirm: "Does this capture what you want?"

Rules:
- Be concise. Each clarifying question should be one sentence.
- Do not ask more than 3 questions per round.
- If the feedback is already clear and specific, skip to the description immediately.
- Stay strictly functional: describe what the user sees and experiences.
- Do NOT reference file names, component names, code, or implementation details.
- Do NOT suggest how to implement the change.
- Do NOT propose technical approaches or architecture decisions.
- Your output will be handed to a coding agent that decides the implementation.`;

/** ~10 user messages triggers auto-summarise nudge. */
const AUTO_SUMMARISE_AT = 10;

function buildSystemPrompt(productContext: string): string {
  if (!productContext.trim()) return REFINEMENT_SYSTEM_PROMPT;
  return `${REFINEMENT_SYSTEM_PROMPT}\n\n---\nPRODUCT CONTEXT:\n${productContext}\n---`;
}

/** Returns true when the text contains a fully-formed functional description. */
export function hasFunctionalDescription(text: string): boolean {
  return text.includes("**Goal**:") || text.includes("**Goal** :");
}

export function useRefinement() {
  const [feedbackInfo, setFeedbackInfo] = useState<RefinementFeedbackInfo | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RefinementMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const systemPromptRef = useRef<string>("");
  const userMessageCountRef = useRef(0);

  const isActive = feedbackInfo !== null;

  const cancel = useCallback(() => {
    setFeedbackInfo(null);
    setConversationId(null);
    setMessages([]);
    setIsSending(false);
    setStreamingText("");
    setError(null);
    setIsLoading(false);
    systemPromptRef.current = "";
    userMessageCountRef.current = 0;
  }, []);

  const sendRefinementMessage = useCallback(async (
    text: string,
    currentMessages: RefinementMessage[],
    currentConversationId: string,
    currentSystemPrompt: string,
  ) => {
    setIsSending(true);
    setStreamingText("");
    const userMsg: RefinementMessage = { role: "user", text };
    const nextMessages = [...currentMessages, userMsg];
    setMessages(nextMessages);

    const history = currentMessages.map((m) => ({ role: m.role, content: m.text }));

    try {
      const response = await fetch(`${runtimeBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          message: text,
          conversation_id: currentConversationId,
          model_id: null,
          history,
          system_prompt: currentSystemPrompt,
        }),
      });

      if (!response.ok) {
        setError("Could not reach the assistant. Please try again.");
        setIsSending(false);
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let streamEnded = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const raw = line.slice(6);
              if (raw === "[DONE]" || raw.trim() === "") continue;
              try {
                const event = JSON.parse(raw) as {
                  delta?: string;
                  done?: boolean;
                  error?: string;
                  detail?: string;
                  meta?: string;
                };
                if (event.error) {
                  setError(event.detail ?? event.error);
                  streamEnded = true;
                  break;
                }
                if (event.delta) {
                  accumulated += event.delta;
                  setStreamingText(accumulated);
                }
                if (event.done) streamEnded = true;
              } catch {
                // skip malformed
              }
            }
          }
          if (streamEnded) break;
        }
        const assistantMsg: RefinementMessage = { role: "assistant", text: accumulated };
        setMessages([...nextMessages, assistantMsg]);
        setStreamingText("");
      } else {
        const payload = (await response.json()) as { reply?: string; model_id?: string };
        const assistantMsg: RefinementMessage = {
          role: "assistant",
          text: payload.reply ?? "",
        };
        setMessages([...nextMessages, assistantMsg]);
      }
    } catch {
      setError("Could not reach the assistant. Check if it's running.");
    } finally {
      setIsSending(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !text.trim() || isSending) return;
      userMessageCountRef.current += 1;

      let finalText = text;
      // Edge case: auto-summarise nudge at max messages
      if (userMessageCountRef.current >= AUTO_SUMMARISE_AT) {
        finalText =
          text +
          "\n\n[Please now summarise what you understand and produce the functional description in the standard format.]";
      }

      await sendRefinementMessage(
        finalText,
        messages,
        conversationId,
        systemPromptRef.current,
      );
    },
    [conversationId, isSending, messages, sendRefinementMessage],
  );

  const start = useCallback(
    async (
      feedbackId: string,
      feedbackTitle: string,
      feedbackSummary: string,
      feedbackArea: string,
    ) => {
      cancel();
      setIsLoading(true);
      setFeedbackInfo({ feedbackId, feedbackTitle, feedbackSummary, feedbackArea });

      try {
        // Load product context
        let productContext = "";
        try {
          const ctxResponse = await fetch(`${runtimeBase}/agent/refine-context`);
          if (ctxResponse.ok) {
            const ctxPayload = (await ctxResponse.json()) as { context?: string };
            productContext = ctxPayload.context ?? "";
          }
        } catch {
          // Degraded mode: proceed without context
        }

        const sysPrompt = buildSystemPrompt(productContext);
        systemPromptRef.current = sysPrompt;

        // Create a dedicated conversation for the refinement session
        // API allows title max_length=120 (NewConversationRequest); feedbackTitle can be up to 240 chars.
        const refinementTitle = `Refining: ${feedbackTitle}`.slice(0, 120);
        const convResponse = await fetch(`${runtimeBase}/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: refinementTitle, set_active: false }),
        });
        if (!convResponse.ok) {
          setError("Could not create a refinement conversation. Please try again.");
          setIsLoading(false);
          return;
        }
        const convPayload = (await convResponse.json()) as { conversation_id: string };
        const newConvId = convPayload.conversation_id;
        setConversationId(newConvId);
        setIsLoading(false);

        // Kick off the refinement with the feedback as the first user message
        const kickoff = feedbackSummary.trim() || feedbackTitle;
        userMessageCountRef.current += 1;
        await sendRefinementMessage(kickoff, [], newConvId, sysPrompt);
      } catch {
        setError("Could not start the refinement conversation. Please try again.");
        setIsLoading(false);
      }
    },
    [cancel, sendRefinementMessage],
  );

  const getLastAssistantMessage = useCallback((): string | null => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    return last?.text ?? null;
  }, [messages]);

  return {
    isActive,
    feedbackInfo,
    conversationId,
    messages,
    isSending,
    streamingText,
    isLoading,
    error,
    start,
    sendMessage,
    cancel,
    getLastAssistantMessage,
  };
}
