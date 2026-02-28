import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SettingsPanel, type ChangeProposal, type ChangelogEntry, type RuntimeSettings } from "./settingsPanel";

function makeSettings(overrides: Partial<RuntimeSettings> = {}): RuntimeSettings {
  return {
    channel: "experimental",
    experimental_flags: { show_runtime_diagnostics: true },
    active_flags: { show_runtime_diagnostics: true },
    ...overrides
  };
}

function makeProposal(overrides: Partial<ChangeProposal> = {}): ChangeProposal {
  return {
    proposal_id: "proposal-1",
    created_at: "2026-02-27T10:00:00.000Z",
    title: "Improve settings trust copy",
    rationale: "Users need clearer rollback wording.",
    source_feedback_ids: ["F-20260226-001"],
    diff_summary: "",
    risk_notes: "",
    validation_runs: [],
    decision: { status: "pending", decided_at: null, notes: null },
    ...overrides
  };
}

function renderPanel(overrides: Partial<ComponentProps<typeof SettingsPanel>> = {}) {
  return (
    <SettingsPanel
      settings={makeSettings()}
      changelog={[]}
      proposals={[]}
      feedbackIds={[]}
      isBusy={false}
      canToggleFlags={true}
      configuredDiagnosticsFlag={true}
      notice={null}
      error={null}
      confirmAction={() => true}
      onRefresh={() => undefined}
      onSelectChannel={() => undefined}
      onToggleDiagnostics={() => undefined}
      onResetExperiments={() => undefined}
      onCreateProposal={() => undefined}
      onAddValidationRun={() => undefined}
      onUpdateProposalDecision={() => undefined}
      {...overrides}
    />
  );
}

describe("SettingsPanel", () => {
  it("renders a clearly labeled settings section", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("Settings");
    expect(markup).toContain("Release Channel");
    expect(markup).toContain("Improvements (advanced)");
  });

  it("renders changelog and proposals empty states", () => {
    const emptyMarkup = renderToStaticMarkup(renderPanel());
    expect(emptyMarkup).toContain("No changes recorded yet.");
    expect(emptyMarkup).toContain("No change drafts yet.");
  });

  it("disables accept when no validation run exists", () => {
    const markup = renderToStaticMarkup(renderPanel({ proposals: [makeProposal()] }));
    expect(markup).toContain("Accept disabled: run validation first.");
  });

  it("disables accept when latest validation is failing", () => {
    const proposal = makeProposal({
      validation_runs: [
        {
          validation_run_id: "run-1",
          status: "failing",
          summary: "Gate failed",
          artifact_refs: ["tickets/meta/qa/artifacts/validate/fail.log"],
          created_at: "2026-02-27T10:03:00.000Z"
        }
      ]
    });
    const markup = renderToStaticMarkup(renderPanel({ proposals: [proposal] }));
    expect(markup).toContain("Accept disabled: latest validation is failing.");
  });

  it("renders changelog rows with proposal linkage", () => {
    const changelog: ChangelogEntry[] = [
      {
        created_at: "2026-02-26T10:00:00.000Z",
        title: "Experiments reset",
        summary: "Disabled all experimental feature toggles.",
        channel: "experimental",
        ticket_id: "T-0008",
        proposal_id: "proposal-123",
        flags_changed: ["show_runtime_diagnostics"]
      }
    ];
    const filledMarkup = renderToStaticMarkup(renderPanel({ changelog }));
    expect(filledMarkup).toContain("Experiments reset");
    expect(filledMarkup).toContain("Disabled all experimental feature toggles.");
    expect(filledMarkup).toContain("proposal-123");
  });

  it("renders rollback guardrail copy", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("does not delete conversations/history");
    expect(markup).toContain("does not roll back code");
  });

  it("renders a single stable-experimental channel control surface", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain('class="channel-toggle"');
    expect(markup).toContain(">Stable (recommended)<");
    expect(markup).toContain(">Beta (early access)<");
    expect(markup).not.toContain(">Switch to Stable<");
  });

  it("uses progressive disclosure for advanced concepts", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("Early-Access Features (advanced)");
    expect(markup).toContain("Improvements (advanced)");
    expect(markup).toContain("A change draft is a suggested improvement you review locally.");
  });

  it("shows runtime-offline error copy without implying settings are unavailable", () => {
    const markup = renderToStaticMarkup(renderPanel({ error: "Could not load changelog and proposals (runtime offline)." }));
    expect(markup).toContain("Could not load changelog and proposals (runtime offline).");
    expect(markup).not.toContain("Could not load changelog, proposals, and settings.");
  });
});
