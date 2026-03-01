# M7 Improvement Classes — Schema, Trigger Rules, and Proposal Quality

*Authored: 2026-03-01. Gates T-0053 (proposal generation quality) and T-0055 (system prompt/persona tuning class).*

---

## 1. Purpose

Define how improvement classes are structured and registered in the self-evolution pipeline, specify trigger conditions for the M7 `system-prompt-persona-v1` class, and set the proposal quality contract that all proposal generators must satisfy.

See `docs/m1-first-improvement-loop.md` for the upstream artifact schema (feedback_item, proposal, validation_run, release_decision, changelog_entry) and loop phase definitions.

---

## 2. Improvement Class Schema

Each improvement class is a named entity with the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Unique identifier (e.g. `system-prompt-persona-v1`) |
| `label` | string | Human-readable name shown in the Proposals panel (e.g. `"AI Persona & Tone"`) |
| `trigger_tags` | string[] | Feedback category tags that route feedback to this class |
| `proposal_template` | string | Short instruction to the proposal generator describing what a concrete proposal for this class should contain (rule-based or LLM-guided) |
| `apply_target` | string | Where the accepted change lands: `"system_prompt"`, `"settings_label"`, or `"ui_copy"` |

### Registered Classes (M7 Scope)

#### `settings-trust-microcopy-v1` (existing — unchanged)

```json
{
  "id": "settings-trust-microcopy-v1",
  "label": "Settings Copy & Labels",
  "trigger_tags": ["settings", "labels", "copy", "trust_surface"],
  "proposal_template": "Propose a bounded copy change to the named Settings surface. Provide the exact before/after text strings. Changes must not imply autonomous shipping, data deletion, or unsupported behavior.",
  "apply_target": "ui_copy"
}
```

#### `system-prompt-persona-v1` (new — M7)

```json
{
  "id": "system-prompt-persona-v1",
  "label": "AI Persona & Tone",
  "trigger_tags": ["tone", "style", "verbosity", "persona", "length", "formality"],
  "proposal_template": "Propose a specific, named addition or replacement to the active system prompt. State the exact sentence to add (or replace), where it goes in the prompt, and why it addresses the feedback signal. Do not echo the feedback text verbatim.",
  "apply_target": "system_prompt"
}
```

---

## 3. Trigger Rules

### 3.1 How Routing Works

When the proposal generation step fires for a feedback item, the system evaluates each registered class in registration order and selects the first class whose trigger condition is satisfied. Only one class is selected per proposal.

### 3.2 `system-prompt-persona-v1` Trigger Condition

A feedback item routes to `system-prompt-persona-v1` if **either** of the following is true:

1. The feedback item has at least one tag matching: `["tone", "style", "verbosity", "persona", "length", "formality"]`.
2. The free-text `summary` or `title` contains a phrase describing **how** the AI communicates (e.g. "too long", "sounds formal", "responses are wordy") — not **what** it says.

### 3.3 `settings-trust-microcopy-v1` Trigger Condition (unchanged from M6)

A feedback item routes to `settings-trust-microcopy-v1` if the `area` field is `settings.trust_surface` or a tag matches `["settings", "labels", "copy"]`.

### 3.4 Fallback

If no class matches, the pipeline must **not** generate a generic proposal. Instead:
- Surface the state: `"No applicable improvement class for this feedback type."` in the Proposals panel.
- Store this outcome in the feedback item as `status: no_class_match`.
- Do not advance the feedback item to `proposal_drafted`.

---

## 4. Proposal Quality Rules

A proposal is **concrete** if and only if it satisfies **all four** of the following rules:

| Rule | Requirement |
| --- | --- |
| **1 — Named target** | The proposal states exactly what is being changed (e.g. "the active system prompt" or "the Settings › Trust label"). |
| **2 — Described change** | The proposal states what the new value or behaviour will be (e.g. "Add 'Keep responses concise and direct.' to the end of the system prompt"). |
| **3 — Linked rationale** | One sentence connects the proposed change to the feedback signal (e.g. "User reported responses feel too long and verbose"). |
| **4 — Not a re-statement** | The `title` and `description` fields must not simply repeat the user's raw feedback text verbatim. |

A proposal that fails **any** of rules 1–4:
- Must be **rejected** by the proposal generator before being shown to the user.
- Must be either regenerated with a corrected prompt, or flagged as `status: generation_failed` for manual review.
- Must never advance to `ready_for_validation`.

---

## 5. User-Facing Feedback Plan

### Proposals Panel
- Display the matched class `label` (e.g. "AI Persona & Tone") so users understand which system aspect is being changed.
- If no class matched, display: `"No applicable improvement for this feedback type."`.

### Proposal Form
- The `Title` field must be pre-populated with a concrete change description (e.g. "Shorten AI responses: add conciseness instruction to system prompt"), **not** the raw feedback text.
- The `Summary` field must include the rationale sentence linking the proposal to the feedback signal.

### Accepted System Prompt Changes
- Changes accepted via `system-prompt-persona-v1` must be visible in **Settings → AI Persona** (or equivalent) so users can inspect, edit, or revert what the loop applied.

---

## 6. Scope Bounds (M7)

- **Registered classes**: `settings-trust-microcopy-v1` (existing) and `system-prompt-persona-v1` (new). No other classes.
- **Trigger signals**: explicit user feedback form submissions only. No implicit triggers from usage logs or analytics.
- **System prompt changes**: persona/tone instruction additions only. No model routing, temperature, top-p, or tool-permission changes in this milestone.
- **System prompt cap**: maximum 3 persona sentences may be active at any time. If the cap is reached, the system must offer to replace the oldest sentence rather than appending a fourth.
- **Rejection handling (M7)**: no retry on user rejection. Rejection rationale is stored in the artifact; the user may re-submit feedback to trigger a fresh proposal.

---

## 7. Edge Cases and Failure Modes

| Scenario | Required behavior |
| --- | --- |
| Feedback matches no class | Show "No applicable improvement class" state; do not generate a proposal |
| Proposal fails quality rules 1–4 | Reject/regenerate before surfacing; never show a failing proposal to the user |
| System prompt cap reached (3 sentences) | Surface "Cap reached — replace oldest persona instruction?" prompt; do not append |
| User rejects proposal | Store rejection rationale in `release_decision`; no changelog entry; no auto-retry |
| Two feedback items match the same class | Route independently; generate separate proposals; user decides on each |

---

## 8. Validation Plan

### Tier 1 (deterministic — required before shipping T-0053/T-0055)
- Unit test for the proposal quality guard: feed proposals that fail each of rules 1–4 individually; assert each is rejected.
- Trigger routing test: for each class, provide at least 3 sample feedback items; assert correct class is selected (or `no_class_match` where expected).
- System prompt cap test: verify that a 4th addition triggers the replacement prompt rather than appending.

### Tier 2 (epic closure — T-0056)
- Included in E-0009 tier-2 comprehension re-probe and epic closure ticket T-0056.

---

*This document is the authoritative spec for M7 improvement classes. Implementation tickets T-0053 and T-0055 must not deviate without updating this document first.*
