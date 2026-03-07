/**
 * T-0092: Refinement conversation UI.
 *
 * Shown in the main chat area when the user clicks "Fix with AI".
 * Displays the conversational refinement session with action buttons
 * after the model produces a functional description.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MarkdownMessage } from "./MarkdownMessage";
import { hasFunctionalDescription, type RefinementMessage } from "./hooks/useRefinement";

type RefinementConversationProps = {
  messages: RefinementMessage[];
  streamingText: string;
  isSending: boolean;
  isLoading: boolean;
  error: string | null;
  feedbackTitle: string;
  onSendMessage: (text: string) => void;
  onRunAgent: (description: string) => void;
  onEdit: () => void;
  onCancel: () => void;
};

export function RefinementConversation({
  messages,
  streamingText,
  isSending,
  isLoading,
  error,
  feedbackTitle,
  onSendMessage,
  onRunAgent,
  onEdit,
  onCancel,
}: RefinementConversationProps) {
  const [composer, setComposer] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const text = composer.trim();
    if (!text || isSending) return;
    setComposer("");
    onSendMessage(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Show action buttons below the last assistant message if it contains a functional description
  const lastAssistantText = [...messages].reverse().find((m) => m.role === "assistant")?.text ?? null;
  const showActionButtons =
    lastAssistantText !== null &&
    hasFunctionalDescription(lastAssistantText) &&
    !isSending &&
    streamingText.length === 0;

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-0 flex-1">
      {/* Refinement mode badge */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[#efbe91] bg-[#fff8f2]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b85a1a] border border-[#efbe91] rounded-full py-0.5 px-2.5 bg-white">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d97706] animate-pulse" aria-hidden="true" />
            Refining feedback
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={feedbackTitle}>
            "{feedbackTitle}"
          </span>
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground underline focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-1 rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      {/* Messages */}
      <div className="overflow-auto p-4 grid gap-3 content-start" aria-live="polite">
        {isLoading && (
          <div className="border border-dashed border-border rounded-xl p-4 text-muted-foreground bg-[#fffaf0]">
            <p className="m-0">Setting up refinement conversation…</p>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="m-0 border border-[#f4a58b] rounded-lg bg-[#fff0ea] text-destructive text-sm py-2 px-3"
          >
            {error}
          </p>
        )}

        {messages.map((message, index) => (
          <article
            key={index}
            className={`border rounded-xl py-3 px-3.5 max-w-[700px] ${
              message.role === "user"
                ? "ml-auto bg-[#fff2e6] border-[#efbe91]"
                : "border-[#c8d3c1] bg-[#f8fff5]"
            }`}
          >
            <p className="m-0 mb-1 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              {message.role === "user" ? "You" : "Product analyst"}
            </p>
            {message.role === "assistant" ? (
              <MarkdownMessage text={message.text} />
            ) : (
              <p className="m-0 text-[0.9375rem] leading-relaxed whitespace-pre-wrap">{message.text}</p>
            )}
            {message.meta && (
              <p className="mt-1.5 text-muted-foreground text-xs m-0">{message.meta}</p>
            )}
          </article>
        ))}

        {streamingText.length > 0 && (
          <article className="border border-[#c8d3c1] rounded-xl py-3 px-3.5 max-w-[700px] bg-[#f8fff5]">
            <p className="m-0 mb-1 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Product analyst
            </p>
            <p className="m-0 text-[0.9375rem] leading-relaxed whitespace-pre-wrap">
              {streamingText}
              <span
                className="inline-block w-0.5 h-4 ml-0.5 bg-primary animate-[streaming-blink_0.8s_step-end_infinite] align-text-bottom"
                aria-hidden="true"
              />
            </p>
          </article>
        )}

        {/* Action buttons once the model produces a functional description */}
        {showActionButtons && lastAssistantText && (
          <div
            className="border border-[#efbe91] rounded-xl p-4 bg-[#fffaf0] grid gap-3"
            data-testid="refinement-action-buttons"
          >
            <p className="m-0 text-sm font-semibold text-foreground">
              Ready to proceed with this description?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="border border-[#d25722] bg-[#d25722] text-white font-semibold text-sm rounded-lg py-2 px-4 cursor-pointer transition-colors hover:bg-[#b84a1c] hover:border-[#b84a1c] focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2"
                onClick={() => onRunAgent(lastAssistantText)}
              >
                Run Agent
              </button>
              <button
                type="button"
                className="border border-border bg-white text-foreground text-sm rounded-lg py-2 px-4 cursor-pointer transition-colors hover:border-[#efbe91] hover:bg-[#fff8f2] focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2"
                onClick={onEdit}
              >
                Edit
              </button>
              <button
                type="button"
                className="border border-border bg-white text-muted-foreground text-sm rounded-lg py-2 px-4 cursor-pointer transition-colors hover:border-[#efbe91] hover:bg-[#fff8f2] focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2"
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div ref={transcriptEndRef} aria-hidden="true" />
      </div>

      {/* Composer */}
      <footer className="border-t border-border py-3 px-4 pb-4">
        <label htmlFor="refinement-composer" className="sr-only">
          Follow-up message
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="refinement-composer"
            ref={inputRef}
            value={composer}
            className="flex-1 resize-none min-h-0 max-h-[120px] rounded-lg border border-border py-2.5 px-3 font-inherit text-[0.9375rem] leading-snug bg-white overflow-y-auto transition-colors focus:outline-none focus:border-[#efbe91] focus:ring-2 focus:ring-[#efbe91]/50 focus:ring-offset-2"
            placeholder={
              showActionButtons
                ? "Or type a follow-up to edit the description…"
                : "Ask a follow-up or provide more detail…"
            }
            rows={1}
            disabled={isLoading}
            onChange={(e) => setComposer(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="shrink-0 border border-primary rounded-lg bg-primary text-primary-foreground font-bold text-sm py-2.5 px-4 cursor-pointer transition-colors hover:bg-[#b84a1c] hover:border-[#b84a1c] disabled:opacity-45 disabled:cursor-not-allowed"
            disabled={!composer.trim() || isSending || isLoading}
            onClick={handleSend}
          >
            {isSending ? (
              <span
                className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin align-middle"
                aria-label="Sending"
              />
            ) : (
              "Send"
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
