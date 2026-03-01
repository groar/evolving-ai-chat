/**
 * Heuristic proposal generator for settings-trust-microcopy-v1.
 * Produces concrete title and rationale from feedback per docs/m7-improvement-classes.md.
 */

import { isConcreteProposal } from "./proposalQualityGuard";

export type GenerateResult =
  | { ok: true; title: string; rationale: string }
  | { ok: false; message: string };

const COPY_ONLY_RISK_NOTES = "Copy-only change; must not imply autonomous shipping or data deletion.";
const SETTINGS_TARGET = "apps/desktop/src/settingsPanel.tsx";

/** Known mappings for common feedback patterns (first-instance style). */
const KNOWN_MAPPINGS: Array<{
  pattern: RegExp;
  title: string;
  rationale: string;
  diffSummary: string;
}> = [
  {
    pattern: /improvements?\s*section|change\s*drafts?|draft\s*an?\s*improvement|suggested?\s*improvements?/i,
    title: "Clarify Improvements section labels in Settings",
    rationale: "User reported confusion about the Improvements section labels. Rename 'Change Drafts' to 'Suggested improvements' and 'Draft an Improvement' to 'Suggest an improvement'.",
    diffSummary: "Rename 'Change Drafts' → 'Suggested improvements'; 'Draft an Improvement' → 'Suggest an improvement'; 'No change drafts yet' → 'No suggestions yet.'"
  },
  {
    pattern: /safe\s*offline|offline|works\s*without\s*internet/i,
    title: "Rename 'Safe Offline' label to 'Works without internet'",
    rationale: "User reported the 'Safe Offline' label is unclear. Replacing with 'Works without internet' clarifies that the app works locally when disconnected.",
    diffSummary: "Rename 'Safe Offline' → 'Works without internet' in Settings."
  },
  {
    pattern: /channel|stable|experimental|beta/i,
    title: "Clarify release channel labels in Settings",
    rationale: "User reported confusion about channel terminology. Improve labels to distinguish stable vs experimental behavior.",
    diffSummary: "Update channel section labels for clarity."
  },
  {
    pattern: /early\s*access|experiments?|toggle/i,
    title: "Clarify Early Access section labels in Settings",
    rationale: "User reported uncertainty about Early Access toggles. Improve copy to clarify what each toggle controls.",
    diffSummary: "Update Early Access section labels."
  },
  {
    pattern: /changelog|what\s*changed/i,
    title: "Clarify Changelog section labels in Settings",
    rationale: "User reported the Changelog section is unclear. Improve labels to explain what is shown.",
    diffSummary: "Update Changelog section labels."
  }
];

function tryStrategy(
  feedbackText: string,
  diffSummary: string
): { title: string; rationale: string } | null {
  const trimmed = feedbackText.trim();
  if (!trimmed) return null;

  for (const m of KNOWN_MAPPINGS) {
    if (m.pattern.test(trimmed)) {
      return { title: m.title, rationale: m.rationale };
    }
  }

  const lower = trimmed.toLowerCase();
  if (/\b(confus|unclear|don'?t know|hard to find)\b/.test(lower)) {
    return {
      title: "Clarify Settings labels based on user feedback",
      rationale: "User reported confusion or difficulty finding or understanding a Settings surface. Improve the relevant labels to make the purpose clearer."
    };
  }

  if (/\b(label|copy|text|wording)\b/.test(lower)) {
    return {
      title: "Improve Settings copy for clarity",
      rationale: "User feedback indicated labels or copy need improvement. Update the relevant Settings surface to address the concern."
    };
  }

  return {
    title: "Clarify Settings surface based on feedback",
    rationale: "User reported an issue with Settings. Update the relevant labels or copy to address the concern."
  };
}

const DEFAULT_DIFF_SUMMARY =
  "Rename 'Change Drafts' → 'Suggested improvements'; 'Draft an Improvement' → 'Suggest an improvement'; 'No change drafts yet' → 'No suggestions yet.'";

/**
 * Generate a concrete proposal from feedback for settings-trust-microcopy-v1.
 * Returns ok:false if no compliant proposal can be produced after retries.
 */
export function generateProposalFromFeedback(
  feedback: { id: string; text: string },
  maxRetries = 2
): GenerateResult & { diffSummary?: string; riskNotes?: string } {
  const feedbackText = feedback.text.trim();
  if (!feedbackText) {
    return {
      ok: false,
      message: "We couldn't generate a specific improvement for this feedback. Try describing the issue in more detail."
    };
  }

  const diffSummaries = [
    DEFAULT_DIFF_SUMMARY,
    "Update Settings labels for clarity.",
    "Improve copy in the relevant Settings section."
  ];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const diffSummary = diffSummaries[Math.min(attempt, diffSummaries.length - 1)];
    const result = tryStrategy(feedbackText, diffSummary);
    if (!result) continue;

    const passes = isConcreteProposal({
      title: result.title,
      rationale: result.rationale,
      diffSummary,
      feedbackText
    });

    if (passes) {
      return {
        ok: true,
        title: result.title,
        rationale: result.rationale,
        diffSummary,
        riskNotes: COPY_ONLY_RISK_NOTES
      };
    }
  }

  return {
    ok: false,
    message: "We couldn't generate a specific improvement for this feedback. Try describing the issue in more detail."
  };
}
