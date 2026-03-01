# M1 First Improvement Loop Spec

## Purpose
Define the first shippable "observe -> propose -> validate -> release" loop so implementation tickets can execute without inventing artifact fields, state transitions, or evidence requirements.

## Scope
### In scope (v1)
- One proposal at a time.
- Local-only artifacts (filesystem/SQLite as implemented by follow-up tickets).
- One improvement class: trust-surface microcopy updates in Settings (`Changelog + Experiments` copy only).

### Out of scope (v1)
- Autonomous self-shipping without explicit user approval.
- Concurrent proposals.
- Multi-user review/approval flows.
- Non-copy behavior changes (new tools, permissions, data migration).

## Loop Phases And State Transitions
### Canonical phase order
1. `feedback_item` captured.
2. `proposal` drafted from one or more feedback items.
3. `validation_run` executed against proposal gates.
4. `release_decision` recorded (`accept` or `reject`).
5. `changelog_entry` created only if decision is `accept`.

### State machine
| State | Entry condition | Exit condition | Next state |
| --- | --- | --- | --- |
| `feedback_captured` | Feedback saved with required fields | Proposal created and linked | `proposal_drafted` |
| `proposal_drafted` | Proposal has diff summary + risk notes | Validation run completes | `validated_pass` or `validated_fail` |
| `validated_fail` | Any required gate failed | User edits/retries proposal or rejects | `proposal_drafted` or `rejected` |
| `validated_pass` | All required gates passed | User decision submitted | `accepted` or `rejected` |
| `accepted` | User explicitly approves release | Changelog entry persisted | `released` |
| `rejected` | User explicitly rejects proposal | Rejection rationale persisted | terminal |
| `released` | Accepted proposal logged in changelog | n/a | terminal |

## Required Artifacts
All artifacts require:
- Stable ID.
- Timestamp (ISO 8601 UTC).
- Human-readable summary.
- Linkage fields (`feedback_ids`, `ticket_id`) where available.

### `feedback_item`
Required fields:
- `id`
- `created_at`
- `source` (`in_app` or `imported`)
- `title`
- `summary`
- `area`
- `severity`
- `status` (`open`, `triaged`, `closed`)

### `proposal`
Required fields:
- `id`
- `created_at`
- `feedback_ids` (can be empty only when `title` + `summary` exist)
- `ticket_id` (optional)
- `title`
- `summary`
- `improvement_class` (must be `settings-trust-microcopy-v1` for M1)
- `bounded_change` (files/surfaces affected)
- `risk_notes`
- `status` (`draft`, `ready_for_validation`, `blocked_validation`, `ready_for_decision`, `accepted`, `rejected`)

### `validation_run`
Required fields:
- `id`
- `proposal_id`
- `started_at`
- `finished_at`
- `summary`
- `gates` (array with `name`, `status`, `evidence_ref`)
- `overall_status` (`pass`, `fail`)

### `release_decision`
Required fields:
- `id`
- `proposal_id`
- `decided_at`
- `decision` (`accept`, `reject`)
- `summary`
- `rationale`
- `decider`

### `changelog_entry` (accept only)
Required fields:
- `id`
- `proposal_id`
- `created_at`
- `title`
- `summary`
- `release_channel`

Rule: a `changelog_entry` must not be created when `release_decision.decision = reject`.

## Example Artifacts
### Example `feedback_item`
```json
{
  "id": "FB-20260227-001",
  "created_at": "2026-02-27T20:11:03Z",
  "source": "in_app",
  "title": "Settings labels are unclear",
  "summary": "I cannot tell if Switch to Stable changes data or only feature behavior.",
  "area": "settings.trust_surface",
  "severity": "medium",
  "status": "open"
}
```

### Example `proposal`
```json
{
  "id": "PR-20260227-001",
  "created_at": "2026-02-27T20:18:21Z",
  "feedback_ids": ["FB-20260227-001"],
  "ticket_id": "T-0013",
  "title": "Clarify stable/experiments microcopy",
  "summary": "Replace ambiguous Settings copy with bounded, non-promissory wording.",
  "improvement_class": "settings-trust-microcopy-v1",
  "bounded_change": [
    "apps/desktop/src/features/settings/ReleaseControls.tsx"
  ],
  "risk_notes": "Copy-only change; must not imply autonomous shipping or data deletion.",
  "status": "ready_for_validation"
}
```

### Example `validation_run`
```json
{
  "id": "VR-20260227-001",
  "proposal_id": "PR-20260227-001",
  "started_at": "2026-02-27T20:22:10Z",
  "finished_at": "2026-02-27T20:23:04Z",
  "summary": "All required gates passed for copy-only proposal.",
  "gates": [
    {
      "name": "copy-constraint-check",
      "status": "pass",
      "evidence_ref": "tickets/meta/qa/artifacts/validate/2026-02-27-copy-check.md"
    },
    {
      "name": "settings-smoke-flow",
      "status": "pass",
      "evidence_ref": "tickets/meta/qa/artifacts/validate/2026-02-27-settings-smoke.log"
    }
  ],
  "overall_status": "pass"
}
```

## UI Surfaces And User Feedback Plan
Primary UI surfaces:
- In-app feedback capture entry point in chat/workbench.
- Proposal status and decision panel in Settings (`Changelog + Experiments`).

Required empty states:
- No feedback yet: "No feedback captured yet."
- No proposal yet: "No proposal drafted from feedback."
- No validation run yet: "Validation has not run."

Required error states:
- Validation failed: show failed gate name + evidence reference + retry action.
- Decision blocked due to failed validation: "Fix failed gates before acceptance."
- Missing feedback linkage: allow continue only when proposal `title` and `summary` are present.

Copy constraints:
- Must not claim the system can self-ship.
- Must not imply accepted proposals bypass user approval.

## Acceptance And Rejection Rules
- `accept` is allowed only when latest `validation_run.overall_status = pass`.
- `accept` must create exactly one `changelog_entry` linked to `proposal_id`.
- `reject` must store rationale and create no changelog entry.
- Any new validation failure after a pass returns proposal to `blocked_validation`.

## Validation Evidence Requirements For Implementing Tickets
Each implementing ticket for this loop must include in `Evidence (Verification)`:
- Commands/tests run and pass/fail status.
- At least one artifact reference proving each executed phase.
- Screenshot or log for user-visible proposal state.
- Decision record showing accept/reject path and rationale.

## How To QA This Milestone
- Observe: create one feedback item and confirm required fields + ID/timestamp.
- Propose: create one proposal linked to that feedback and confirm bounded change scope.
- Validate: run required gates; verify pass/fail updates proposal status correctly.
- Release (accept path): accept a passed proposal and verify changelog entry exists.
- Release (reject path): reject a proposal and verify rationale exists and no changelog entry is created.

## Tier-2 Micro-Validation Plan
Audience: internal/project sponsor.

Prompts (1-2 sentence responses):
1. "What do you think accepting this proposal will do?"
2. "What do you think rejecting this proposal will do?"
3. "Is anything in the proposal status unclear or risky?"

Recording location:
- Primary: implementing ticket `Evidence (Verification)` section.
- Alternate: dated PM checkpoint in `tickets/meta/feedback/` with a backlink to the ticket.

---

## M6 Addendum: First Agent-Proposed Change from Real Usage

*Added 2026-03-01. Defines scope for E-0007 (M6): first real change driven by usage signal.*

### Improvement Class
- **Class**: `settings-trust-microcopy-v1` (unchanged from M1).
- **Scope**: Trust-surface microcopy in Settings only. Bounded surfaces:
  - Updates & Safety section (channel labels, helper copy)
  - Early Access section (labels, toggle copy, reset button)
  - Improvements section (Change Drafts, proposal lifecycle labels)
  - Changelog section (labels, empty states)
- **Files affected**: `apps/desktop/src/settingsPanel.tsx` (primary) and any copy constants it uses.
- **Constraints**: Copy-only changes; must not imply autonomous shipping, data deletion, or unsupported behavior.

### Trigger
- **Primary trigger**: Explicit in-app feedback captured via the existing feedback form.
- **Routing rule**: Feedback with `area` matching `settings.trust_surface` (or `area` that the runtime maps to this improvement class) is eligible for proposal generation. For M6, any in-app feedback can trigger if the user explicitly requests "generate proposal from this feedback" — the improvement class is fixed to `settings-trust-microcopy-v1`.
- **No implicit triggers for M6**: Repeated friction patterns, analytics-derived signals, or auto-generation from usage logs are out of scope.

### Proposal Generation (M6 First Instance)
- **Input**: One feedback item ID (from in-app capture).
- **Output**: A proposal artifact with required M1 fields, populated by the runtime.
- **Generation logic (v1)**: Rule-based. Given feedback F:
  - `title`: `"Clarify: " + F.title` (or F.title if it is already descriptive)
  - `summary`: F.summary
  - `feedback_ids`: [F.id]
  - `improvement_class`: `settings-trust-microcopy-v1`
  - `bounded_change`: `["apps/desktop/src/settingsPanel.tsx"]`
  - `risk_notes`: `"Copy-only change; must not imply autonomous shipping or data deletion."`
  - `diff_summary`: Human-editable; for the first instance, a predefined mapping (see First Example) may be used.
- **Implementation note**: Feedback is stored in frontend localStorage; the runtime does not have feedback data. Generation can be frontend-driven: when the user selects "Generate from feedback" with one feedback ID, the frontend populates the proposal form from that feedback (title, summary, feedback_ids, default diff_summary/risk_notes) and submits via existing `POST /proposals`. No new runtime endpoint required for M6.
- **User flow**: User captures feedback → opens Improvements → selects "Generate from feedback" (or similar) with one feedback ID → frontend populates draft → user submits → user adds validation run, accepts/rejects. The pipeline (observe → propose → validate → release) is exercised end-to-end.

### First Concrete Example
| Phase | Artifact | Example |
| --- | --- | --- |
| **Signal** | feedback_item | User submits: title "Improvements section is confusing", summary "I don't know what 'Change Drafts' means or what 'Draft an Improvement' does.", area `settings.trust_surface` |
| **Proposal** | proposal | Generated: title "Clarify Improvements section labels", summary from feedback, improvement_class `settings-trust-microcopy-v1`, bounded_change `[settingsPanel.tsx]`, risk_notes as above. diff_summary: "Rename 'Change Drafts' → 'Suggested improvements'; 'Draft an Improvement' → 'Suggest an improvement'; 'No change drafts yet' → 'No suggestions yet.'" |
| **Validation** | validation_run | Gates: copy-constraint-check, settings-smoke-flow. Both pass. |
| **Decision** | release_decision | User accepts. |
| **Release** | changelog_entry | Created with proposal_id, title, summary, channel. User sees the change in Settings. |

### Implementation Ticket(s)
- T-0046: Wire proposal-from-feedback generation + first instance (improvement class, trigger, generation endpoint, UI affordance, smoke test).
