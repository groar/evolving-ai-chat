/**
 * Heuristic proposal generator for improvement classes per docs/m7-improvement-classes.md.
 * Supports settings-trust-microcopy-v1 and system-prompt-persona-v1.
 */

import type { ImprovementClassId } from "./improvementClasses";
import { isConcreteProposal } from "./proposalQualityGuard";

export type GenerateResult =
  | { ok: true; title: string; rationale: string; diffSummary?: string; riskNotes?: string }
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

/** Persona sentence templates keyed by feedback patterns. */
const PERSONA_MAPPINGS: Array<{
  pattern: RegExp;
  sentence: string;
  title: string;
  rationale: string;
}> = [
  {
    pattern: /too\s+long|too\s+wordy|too\s+verbose|wordy|verbose|padding|repetitive/i,
    sentence: "Keep responses concise and direct — avoid padding or repetition.",
    title: "Add conciseness instruction to AI persona",
    rationale: "User reported AI responses feel too long and verbose."
  },
  {
    pattern: /too\s+formal|sounds\s+formal|formal\s+tone/i,
    sentence: "Use a more casual, conversational tone.",
    title: "Add casual tone instruction to AI persona",
    rationale: "User reported responses sound too formal."
  },
  {
    pattern: /too\s+casual|sounds\s+casual|more\s+professional/i,
    sentence: "Maintain a professional yet approachable tone.",
    title: "Add professional tone instruction to AI persona",
    rationale: "User requested a more professional style."
  },
  {
    pattern: /too\s+short|needs\s+more\s+detail|more\s+elaborate/i,
    sentence: "Provide thorough explanations when the topic warrants detail.",
    title: "Add detail instruction to AI persona",
    rationale: "User reported responses are too brief."
  },
  {
    pattern: /robotic|stiff|mechanical/i,
    sentence: "Respond in a natural, human-like manner.",
    title: "Add natural style instruction to AI persona",
    rationale: "User reported responses feel robotic or stiff."
  }
];

function tryPersonaStrategy(feedbackText: string): { title: string; rationale: string; sentence: string } | null {
  const trimmed = feedbackText.trim();
  if (!trimmed) return null;

  for (const m of PERSONA_MAPPINGS) {
    if (m.pattern.test(trimmed)) {
      return { title: m.title, rationale: m.rationale, sentence: m.sentence };
    }
  }

  const lower = trimmed.toLowerCase();
  if (/\b(tone|style|verbosity|persona|length|formality)\b/.test(lower)) {
    return {
      title: "Adjust AI persona based on feedback",
      rationale: "User feedback indicated a desired change to response tone or style.",
      sentence: "Adapt response style to better match user preferences."
    };
  }

  return null;
}

function generatePersonaProposal(feedback: { id: string; text: string }): GenerateResult & {
  diffSummary?: string;
  riskNotes?: string;
  improvementClass?: ImprovementClassId;
} {
  const feedbackText = feedback.text.trim();
  if (!feedbackText) {
    return {
      ok: false,
      message: "We couldn't generate a specific improvement for this feedback. Try describing the issue in more detail."
    };
  }

  const result = tryPersonaStrategy(feedbackText);
  if (!result) {
    return {
      ok: false,
      message: "We couldn't match this feedback to an AI persona change. Try mentioning tone, style, or verbosity."
    };
  }

  const diffSummary = `Append "${result.sentence}" to the active system prompt.`;

  const passes = isConcreteProposal({
    title: result.title,
    rationale: result.rationale,
    diffSummary,
    feedbackText
  });

  if (!passes) {
    return {
      ok: false,
      message: "We couldn't generate a specific improvement for this feedback. Try describing the issue in more detail."
    };
  }

  return {
    ok: true,
    title: result.title,
    rationale: result.rationale,
    diffSummary,
    riskNotes: "Persona-only change; no model parameters or tool permissions affected.",
    improvementClass: "system-prompt-persona-v1"
  };
}

/**
 * Generate a concrete proposal from feedback for settings-trust-microcopy-v1.
 * Returns ok:false if no compliant proposal can be produced after retries.
 */
export function generateProposalFromFeedback(
  feedback: { id: string; text: string },
  maxRetries = 2,
  improvementClass?: ImprovementClassId | null
): GenerateResult & {
  diffSummary?: string;
  riskNotes?: string;
  improvementClass?: ImprovementClassId;
} {
  const feedbackText = feedback.text.trim();
  if (!feedbackText) {
    return {
      ok: false,
      message: "We couldn't generate a specific improvement for this feedback. Try describing the issue in more detail."
    };
  }

  if (improvementClass === "system-prompt-persona-v1") {
    return generatePersonaProposal(feedback);
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
        riskNotes: COPY_ONLY_RISK_NOTES,
        improvementClass: "settings-trust-microcopy-v1"
      };
    }
  }

  return {
    ok: false,
    message: "We couldn't generate a specific improvement for this feedback. Try describing the issue in more detail."
  };
}
