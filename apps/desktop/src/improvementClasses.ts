/**
 * Improvement class registry per docs/m7-improvement-classes.md §2.
 * Classes define trigger rules and labels for the proposals panel.
 */

export type ImprovementClassId =
  | "settings-trust-microcopy-v1"
  | "system-prompt-persona-v1";

export type ImprovementClass = {
  id: ImprovementClassId;
  label: string;
  trigger_tags: string[];
  apply_target: "system_prompt" | "settings_label" | "ui_copy";
};

export const IMPROVEMENT_CLASSES: ImprovementClass[] = [
  {
    id: "system-prompt-persona-v1",
    label: "AI Persona & Tone",
    trigger_tags: ["tone", "style", "verbosity", "persona", "length", "formality"],
    apply_target: "system_prompt"
  },
  {
    id: "settings-trust-microcopy-v1",
    label: "Settings Copy & Labels",
    trigger_tags: ["settings", "labels", "copy", "trust_surface"],
    apply_target: "ui_copy"
  }
];

/** Phrases that indicate feedback about HOW the AI communicates (not what it says). */
const PERSONA_TEXT_PHRASES = [
  /\btoo\s+long\b/i,
  /\btoo\s+short\b/i,
  /\btoo\s+wordy\b/i,
  /\btoo\s+verbose\b/i,
  /\btoo\s+formal\b/i,
  /\btoo\s+casual\b/i,
  /\bsounds\s+formal\b/i,
  /\bsounds\s+robotic\b/i,
  /\bresponses\s+are\s+wordy\b/i,
  /\bresponses\s+are\s+long\b/i,
  /\bresponses\s+feel\s+\w+\b/i,
  /\btone\s+of\s+(the\s+)?answer\b/i,
  /\bresponse\s+tone\b/i,
  /\bresponse\s+style\b/i,
  /\bconcise\b/i,
  /\bverbose\b/i,
  /\bwordy\b/i,
  /\brepetitive\b/i,
  /\bpadding\b/i
];

/**
 * Route feedback to an improvement class per docs/m7-improvement-classes.md §3.
 * Returns the first matching class id or null if no class matches.
 */
export function routeFeedbackToClass(feedback: {
  text: string;
  tags?: string[];
}): ImprovementClassId | null {
  const text = (feedback.text || "").trim();
  const tags = feedback.tags ?? [];

  for (const cls of IMPROVEMENT_CLASSES) {
    // Check tag match
    const tagMatch = tags.some(
      (t) =>
        cls.trigger_tags.includes(t.toLowerCase()) ||
        cls.trigger_tags.some((tt) => t.toLowerCase().includes(tt))
    );
    if (tagMatch) return cls.id;

    // For persona class only: check free-text phrases
    if (cls.id === "system-prompt-persona-v1") {
      const phraseMatch = PERSONA_TEXT_PHRASES.some((p) => p.test(text));
      if (phraseMatch) return cls.id;
    }

    // settings-trust-microcopy: text fallback when no tag matches
    if (
      cls.id === "settings-trust-microcopy-v1" &&
      /\b(settings|label|copy|changelog|improvements?|change\s*drafts?)\b/i.test(text)
    ) {
      return cls.id;
    }
  }

  return null;
}

export function getClassById(id: ImprovementClassId): ImprovementClass | null {
  return IMPROVEMENT_CLASSES.find((c) => c.id === id) ?? null;
}
