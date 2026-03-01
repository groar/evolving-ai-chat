# PM Checkpoint — 2026-03-01 (#30): F-20260301-007 intake — feedback-button mental model concern

## Summary
New sponsor feedback captured: the "Feedback" button on assistant messages implies rating the AI model rather than evolving the chat software. This is a direction-level concern. Triaged as context for T-0051 (the pending comprehension re-probe); feeds M7 scoping if the probe surfaces the same mental model mismatch.

---

## Step 1: Feedback Intake

### New items
| ID | Title | Source | Severity |
|----|-------|--------|----------|
| F-20260301-007 | Feedback button implies AI rating, not software evolution | sponsor-review | S2 |

**F-20260301-007 summary:** The project sponsor questioned whether the loop is working on the right thing. The "Feedback" button on each AI message looks and reads like "rate this AI response" — the well-known ChatGPT thumbs-up pattern. But the product thesis is to evolve the *chat software*, not retrain the AI models (which we can't do). The sponsor is worried the loop may be communicating the wrong intent entirely, and that this could explain why E-0007's comprehension probes all failed.

---

## Step 2: Review Recent Delivery
No tickets moved since checkpoint-29. Board unchanged.

---

## Step 3: User Testing (Validation Ladder)
T-0051 (E-0008 tier-2 comprehension re-probe) is already queued at rank 1 in ORDER.md. That probe is specifically designed to surface the mental model question:

> "You see a feedback button next to an AI answer. What do you think clicking it does? And once you're in the suggestions area, what do you think happens next?"

If the answer reveals the sponsor still reads it as "AI rating," F-20260301-007 becomes an M7 P1 input for a dedicated entry-point identity redesign. No additional validation ask beyond T-0051 is warranted at this time.

---

## Step 4: Feedback Sanitization
F-20260301-007 sanitized. The raw quote is direct sponsor language — no PII, no sensitive data.

---

## Step 5: Feedback → Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| F-20260301-007 | Triaged → context for T-0051; M7 input if probe fails on mental-model dimension | T-0051's probe directly tests the AI-rating vs software-evolution mental model. Running it first is the cheapest way to validate or refute the concern before any redesign work. Creating a redesign ticket now would be premature — we don't yet know if E-0008's fixes (navigation, form simplification) were sufficient to shift the mental model. |

The concern also surfaces a second-order issue: even if the navigation and form UX is now legible, the *entry point* (per-message "Feedback" button) may inherently anchor users on AI quality rather than software improvement. If true, this is an M7-scope problem — not a T-0051-blocking problem.

---

## Step 6: Design Spec Pass
No implementation tickets involved. No design spec required.

---

## Step 7: Ticket Quality Pass
No ticket changes. T-0051 already in `ready/` at rank 1; metadata current.

---

## Step 8: Epic Management
No epic changes. E-0008 remains active; DoD gate is T-0051.

Note for M7 scoping: if T-0051 fails on the mental-model dimension, M7's first task should address the entry-point identity problem raised by F-20260301-007. The improvement pipeline will need either:
- A distinct "Improve the app" affordance separate from per-message feedback buttons, or
- Clear framing at the feedback entry point that the feedback drives software changes, not AI model changes.

---

## Step 9: Process Improvement Proposal
**Proposal:** When a comprehension probe fails (as in E-0007), the PM triage should distinguish between *mechanics* failures (UX friction: navigation, duplicates, form complexity — addressed by E-0008) and *mental model* failures (the user's frame for what the mechanism does — raised by F-20260301-007). Future comprehension-fail triage should explicitly check both dimensions and create separate tickets for each.

**Adoption decision:** Adopt. When a tier-2 comprehension probe fails, the PM run that triages the failure should ask: "Is this a mechanics failure, a mental model failure, or both?" and create distinct tickets for each type.

---

## Feedback Items Touched
| ID | Prior Status | New Status |
|----|-------------|------------|
| F-20260301-007 | new | triaged |

---

## Ticket/Epic Updates
| File | Change |
|------|--------|
| `tickets/meta/feedback/inbox/F-20260301-007-...` | Created |
| `tickets/meta/feedback/INDEX.md` | F-20260301-007 row added |

---

**Suggested commit message:** `PM checkpoint-30: capture F-20260301-007 (feedback button mental model concern); triage as T-0051 context and M7 input`

**Next step:** Run T-0051 — ask the E-0008 comprehension re-probe and record the result. The answer will either close E-0008 and unblock M7 scoping, or confirm F-20260301-007 as a root cause requiring a dedicated M7 entry-point-redesign ticket.
