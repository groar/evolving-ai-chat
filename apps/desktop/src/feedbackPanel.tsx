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
  /** When provided, show "Generate suggestion" button per item to create a proposal from feedback */
  onGenerateFromFeedback?: (feedbackId: string) => void;
  /** When provided, show "Fix with AI" button per item to trigger an M8 code patch */
  onRequestCodePatch?: (feedbackId: string, feedbackTitle: string, feedbackSummary: string) => void;
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
    onSubmitFeedback,
    onGenerateFromFeedback,
    onRequestCodePatch
  } = props;

  const canSubmit = draftText.trim().length > 0 && !isBusy;

  return (
    <section className="grid gap-2.5" aria-label="Help improve this software">
      <div className="flex justify-between items-center gap-2">
        <p className="m-0 text-sm font-semibold text-foreground">Help improve this software</p>
        <button type="button" className={railBtn} onClick={onToggleOpen}>
          {isOpen ? "Close" : "New improvement"}
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
                  What should this software do differently?
                </p>
                {!contextPointer && (
                  <p className="m-0 text-xs text-muted-foreground">
                    Tip: Use the &quot;Improve&quot; link on any assistant message to help improve that response.
                  </p>
                )}
                <label htmlFor="feedback-input" className="text-sm font-medium">
                  What should this software do differently?
                </label>
                <textarea
                  id="feedback-input"
                  className="w-full resize-y min-h-[72px] rounded-lg border border-border py-2.5 px-2.5 font-inherit bg-white focus:outline-none focus:border-[#efbe91] focus:ring-2 focus:ring-[#efbe91]/50 focus:ring-offset-2"
                  value={draftText}
                  rows={3}
                  placeholder={
                    isMessageScoped
                      ? "Example: Make responses more concise, or clarify this label."
                      : "Example: Settings were hard to find, or a specific response needs improvement."
                  }
                  onChange={(event) => onChangeDraftText(event.target.value)}
                />

                <div className="grid gap-1" aria-label="Improvement categories">
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
            Submit Improvement
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
          <p className="m-0 text-xs text-muted-foreground">No improvements captured yet.</p>
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
                <div className="flex flex-wrap gap-2 mt-1">
  <label htmlFor="model-select" className="text-xs text-muted-foreground">Select AI Model:</label>
  <select id="model-select" className="text-xs border rounded py-1 px-2">
    <option value="default">Default Model</option>
    <option value="model1">Model 1</option>
    <option value="model2">Model 2</option>
  </select>
  <button
    type="button"
    className="text-xs font-medium border border-[#0073e6] bg-[#e6f4ff] text-[#0073e6] rounded-lg py-1 px-2 cursor-pointer transition-colors hover:bg-[#cce6ff] focus:outline-none focus:ring-2 focus:ring-[#0073e6] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
    onClick={() => alert('Replaying response with selected model')}
  >
    Replay with selected model
  </button>
                  {onGenerateFromFeedback && (
                    <button
                      type="button"
                      className="text-xs underline text-primary hover:text-primary/80 w-fit"
                      onClick={() => onGenerateFromFeedback(item.id)}
                    >
                      Generate suggestion from this
                    </button>
                  )}
                  {onRequestCodePatch && (
                    <button
                      type="button"
                      className="text-xs font-medium border border-[#d25722] bg-[#fff7f3] text-[#d25722] rounded-lg py-1 px-2 cursor-pointer transition-colors hover:bg-[#ffe8de] focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() =>
                        onRequestCodePatch(
                          item.id,
                          item.text.trim().slice(0, 240) || "(no title)",
                          item.text || "",
                        )
                      }
                      disabled={!item.text.trim()}
                    >
                      Fix with AI →
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
