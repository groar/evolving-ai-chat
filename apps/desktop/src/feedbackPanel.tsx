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
        <p className="m-0 text-sm font-semibold text-foreground">Feedback Inbox</p>
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
          <label htmlFor="feedback-input" className="text-sm font-medium">
            What felt confusing or what should change?
          </label>
          <textarea
            id="feedback-input"
            className="w-full resize-y min-h-[72px] rounded-lg border border-border py-2.5 px-2.5 font-inherit bg-white focus:outline-none focus:border-[#efbe91] focus:ring-2 focus:ring-[#efbe91]/50 focus:ring-offset-2"
            value={draftText}
            rows={3}
            placeholder="Example: The experiment controls were hard to find."
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
            <p className="m-0 text-xs text-muted-foreground">Context: conversation {contextPointer}</p>
          )}

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
