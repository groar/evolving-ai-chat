import {
  feedbackTagOptions,
  type FeedbackItem,
  type FeedbackStatus,
  type FeedbackTag
} from "./feedbackStore";
import { railBtn } from "@/lib/ui-classes";

type FeedbackPanelProps = {
  isOpen: boolean;
  isBusy: boolean;
  draftText: string;
  selectedTags: FeedbackTag[];
  contextPointer: string | null;
  items: FeedbackItem[];
  notice: string | null;
  error: string | null;
  onToggleOpen: () => void;
  onChangeDraftText: (value: string) => void;
  onToggleTag: (tag: FeedbackTag) => void;
  onSubmitFeedback: () => void;
};

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function formatStatusLabel(status: FeedbackStatus): string {
  if (status === "new") {
    return "New";
  }
  if (status === "triaged") {
    return "Triaged";
  }
  if (status === "converted") {
    return "Converted";
  }
  return "Closed";
}

export function FeedbackPanel(props: FeedbackPanelProps) {
  const {
    isOpen,
    isBusy,
    draftText,
    selectedTags,
    contextPointer,
    items,
    notice,
    error,
    onToggleOpen,
    onChangeDraftText,
    onToggleTag,
    onSubmitFeedback
  } = props;

  const canSubmit = draftText.trim().length > 0 && !isBusy;

  return (
    <section className="grid gap-2.5" aria-label="Local feedback capture">
      <div className="flex justify-between items-center gap-2">
        <p className="m-0 text-sm font-semibold text-foreground">Feedback</p>
        <button type="button" className={railBtn} onClick={onToggleOpen}>
          {isOpen ? "Close" : "New feedback"}
        </button>
      </div>

      <p className="m-0 text-sm text-muted-foreground">Stored locally on this device only.</p>

      {isOpen && (
        <form
          className="border-t border-dashed border-border pt-2.5 grid gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitFeedback();
          }}
        >
          {(() => {
            const isMessageScoped = contextPointer?.includes(":");
            const convPart = contextPointer?.split(":")[0];
            return (
              <>
                <p className="m-0 text-xs text-muted-foreground">
                  {isMessageScoped
                    ? "Feedback about this response"
                    : contextPointer
                      ? "Feedback about this conversation"
                      : "Feedback about the app or a specific response"}
                </p>
                {!contextPointer && (
                  <p className="m-0 text-xs text-muted-foreground">
                    Tip: Use the "Feedback" link on any assistant message to give feedback about that response.
                  </p>
                )}
                <label htmlFor="feedback-input" className="text-sm font-medium">
                  {isMessageScoped ? "What felt confusing or what should change about this response?" : "What felt confusing or what should change?"}
                </label>
                <textarea
                  id="feedback-input"
                  className="w-full resize-y min-h-[72px] rounded-lg border border-border py-2.5 px-2.5 font-inherit bg-white focus:outline-none focus:border-[#efbe91] focus:ring-2 focus:ring-[#efbe91]/50 focus:ring-offset-2"
                  value={draftText}
                  rows={3}
                  placeholder={
                    isMessageScoped
                      ? "Example: The tone felt off, or the answer was incomplete."
                      : "Example: The settings were hard to find, or about a specific response."
                  }
                  onChange={(event) => onChangeDraftText(event.target.value)}
                />

                <div className="grid gap-1" aria-label="Feedback tags">
                  {feedbackTagOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(option.value)}
                        onChange={() => onToggleTag(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>

                {contextPointer && (
                  <p className="m-0 text-xs text-muted-foreground">
                    Context: {isMessageScoped ? `response in conversation ${convPart}` : `conversation ${contextPointer}`}
                  </p>
                )}
              </>
            );
          })()}

          <button type="submit" className={railBtn} disabled={!canSubmit}>
            Save Feedback
          </button>
        </form>
      )}

      {notice && (
        <p role="status" className="m-0 border border-[#9ebf97] rounded-lg bg-[#effbe8] text-[#2e5a2b] text-xs py-2 px-2.5">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="m-0 border border-[#f4a58b] rounded-lg bg-[#fff0ea] text-destructive text-xs py-2 px-2.5">
          {error}
        </p>
      )}

      <div className="border-t border-dashed border-border pt-2.5 grid gap-2.5">
        <p className="m-0 text-sm font-semibold text-foreground">Captured Items</p>
        {items.length === 0 ? (
          <p className="m-0 text-xs text-muted-foreground">No feedback captured yet.</p>
        ) : (
          <ul className="list-none m-0 p-0 grid gap-2">
            {items.map((item) => (
              <li key={item.id} className="border border-border rounded-lg bg-white p-2.5 grid gap-1">
                <div className="flex justify-between items-center gap-2">
                  <p className="m-0 border border-border rounded-full py-0.5 px-2 text-xs text-muted-foreground">
                    {formatStatusLabel(item.status)}
                  </p>
                  <p className="m-0 text-xs text-muted-foreground">{formatTimestamp(item.timestamp)}</p>
                </div>
                <p className="m-0 text-sm whitespace-pre-wrap">{item.text}</p>
                <p className="m-0 text-xs text-muted-foreground">
                  {item.tags.length > 0 ? item.tags.join(", ") : "untagged"}
                  {item.context_pointer ? ` · ${item.context_pointer}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
