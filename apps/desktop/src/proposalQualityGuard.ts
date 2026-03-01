/**
 * Proposal quality rules per docs/m7-improvement-classes.md §4.
 * A proposal is concrete if and only if it satisfies all four rules.
 */

export type ProposalQualityInput = {
  title: string;
  rationale: string;
  diffSummary: string;
  feedbackText: string;
};

/**
 * Rule 1 — Named target: The proposal states exactly what is being changed
 * (e.g. "the active system prompt" or "the Settings › Trust label").
 */
function hasNamedTarget(title: string, rationale: string, diffSummary: string): boolean {
  const combined = [title, rationale, diffSummary].join(" ").toLowerCase();
  const targetPatterns = [
    /\b(settings|trust|label|copy|section|improvements|changelog)\b/,
    /\b(rename|clarify|update|add|replace)\s+['"`]?\w/,
    /\bsystem prompt\b/,
    /\bbefore\s*[→\->]\s*after\b/,
    /\d+\s*(files?|surfaces?)\b/
  ];
  return targetPatterns.some((p) => p.test(combined));
}

/**
 * Rule 2 — Described change: The proposal states what the new value or behaviour will be.
 */
function hasDescribedChange(title: string, rationale: string, diffSummary: string): boolean {
  const combined = [title, rationale, diffSummary].join(" ").toLowerCase();
  const changePatterns = [
    /\b(rename|clarify|update|add|replace|improve)\b/,
    /→|->|to\s+['"`]/,
    /\b(from|before)\s+['"`].*?(to|after)\s+['"`]/,
    /\bwill\b/,
    /\b(add|append)\s+['"`].*?['"`]\s+(to|in)\b/
  ];
  return changePatterns.some((p) => p.test(combined));
}

/**
 * Rule 3 — Linked rationale: One sentence connects the proposed change to the feedback signal.
 */
function hasLinkedRationale(rationale: string, feedbackText: string): boolean {
  if (rationale.trim().length < 10) return false;
  const rationaleLower = rationale.toLowerCase();
  const feedbackLower = feedbackText.trim().toLowerCase();
  const linkPatterns = [
    /\buser\b/i,
    /\bfeedback\b/i,
    /\breported\b/i,
    /\bconfusion\b/i,
    /\brequested\b/i,
    /\bbased on\b/i,
    /\baddress\b/i
  ];
  if (!linkPatterns.some((p) => p.test(rationaleLower))) return false;
  // Rationale must not be a verbatim copy of feedback (Rule 4 handles detailed echo; here we reject obvious copy)
  if (rationaleLower === feedbackLower) return false;
  const feedbackWords = new Set(feedbackLower.split(/\s+/).filter((w) => w.length > 2));
  const rationaleWords = rationaleLower.split(/\s+/).filter((w) => w.length > 2);
  const overlap = rationaleWords.filter((w) => feedbackWords.has(w)).length;
  return overlap / Math.max(rationaleWords.length, 1) < 0.9;
}

/**
 * Rule 4 — Not a re-statement: The title and rationale must not simply repeat
 * the user's raw feedback text verbatim.
 */
function isNotRestatement(title: string, rationale: string, feedbackText: string): boolean {
  const feedback = feedbackText.trim().toLowerCase();
  if (feedback.length === 0) return true;

  const titleLower = title.trim().toLowerCase();
  const rationaleLower = rationale.trim().toLowerCase();

  // "Clarify: " + feedback or "Improve: " + feedback is echo
  const echoPrefixes = ["clarify:", "improve:", "update:", "fix:"];
  for (const prefix of echoPrefixes) {
    if (titleLower.startsWith(prefix)) {
      const rest = titleLower.slice(prefix.length).trim();
      if (rest && feedback.includes(rest)) return false;
      if (rest.length > 5 && feedback.length > 10) {
        const similarity = wordOverlap(rest, feedback);
        if (similarity > 0.85) return false;
      }
    }
  }

  const titleWords = new Set(titleLower.split(/\s+/).filter((w) => w.length > 2));
  const feedbackWords = new Set(feedback.split(/\s+/).filter((w) => w.length > 2));
  const titleOverlap = [...titleWords].filter((w) => feedbackWords.has(w)).length;
  const titleRatio = titleOverlap / Math.max(titleWords.size, 1);
  if (titleRatio >= 0.9 && titleWords.size >= 3) return false;

  const rationaleOverlap = rationaleLower.split(/\s+/).filter((w) => feedbackWords.has(w) && w.length > 2).length;
  const rationaleTotal = rationaleLower.split(/\s+/).filter((w) => w.length > 2).length;
  if (rationaleTotal >= 5 && rationaleOverlap / rationaleTotal >= 0.9) return false;

  return true;
}

function wordOverlap(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/).filter((w) => w.length > 1));
  const setB = new Set(b.split(/\s+/).filter((w) => w.length > 1));
  let match = 0;
  for (const w of setA) {
    if (setB.has(w)) match++;
  }
  return match / Math.max(setA.size, 1);
}

/**
 * Returns true if the proposal satisfies all four quality rules.
 */
export function isConcreteProposal(input: ProposalQualityInput): boolean {
  const { title, rationale, diffSummary, feedbackText } = input;
  if (!title.trim() || !rationale.trim()) return false;
  return (
    hasNamedTarget(title, rationale, diffSummary) &&
    hasDescribedChange(title, rationale, diffSummary) &&
    hasLinkedRationale(rationale, feedbackText) &&
    isNotRestatement(title, rationale, feedbackText)
  );
}
