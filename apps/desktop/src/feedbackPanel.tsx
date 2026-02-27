import {
  feedbackTagOptions,
  type FeedbackItem,
  type FeedbackStatus,
  type FeedbackTag
} from "./feedbackStore";

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
    <section className="feedback-panel" aria-label="Local feedback capture">
      <div className="feedback-panel-header">
        <p className="settings-title">Feedback Inbox</p>
        <button type="button" className="rail-btn" onClick={onToggleOpen}>
          {isOpen ? "Hide Feedback" : "Capture Feedback"}
        </button>
      </div>

      <p className="feedback-copy">Feedback stays local on this device. Nothing is sent anywhere.</p>

      {isOpen && (
        <form
          className="feedback-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitFeedback();
          }}
        >
          <label htmlFor="feedback-input" className="feedback-label">
            What felt confusing or what should change?
          </label>
          <textarea
            id="feedback-input"
            className="feedback-textarea"
            value={draftText}
            rows={3}
            placeholder="Example: The experiment controls were hard to find."
            onChange={(event) => onChangeDraftText(event.target.value)}
          />

          <div className="feedback-tags" aria-label="Feedback tags">
            {feedbackTagOptions.map((option) => (
              <label key={option.value} className="flag-control">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(option.value)}
                  onChange={() => onToggleTag(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>

          {contextPointer && <p className="feedback-context">Context: conversation {contextPointer}</p>}

          <button type="submit" className="rail-btn" disabled={!canSubmit}>
            Save Feedback
          </button>
        </form>
      )}

      {notice && (
        <p role="status" className="settings-notice">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="settings-error">
          {error}
        </p>
      )}

      <div className="feedback-list-wrap">
        <p className="settings-title">Captured Items</p>
        {items.length === 0 ? (
          <p className="flag-note">No feedback captured yet.</p>
        ) : (
          <ul className="feedback-list">
            {items.map((item) => (
              <li key={item.id} className="feedback-item">
                <div className="feedback-item-header">
                  <p className="feedback-item-status">{formatStatusLabel(item.status)}</p>
                  <p className="feedback-item-meta">{formatTimestamp(item.timestamp)}</p>
                </div>
                <p className="feedback-item-text">{item.text}</p>
                <p className="feedback-item-meta">
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
