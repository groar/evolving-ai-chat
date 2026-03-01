/**
 * @vitest-environment happy-dom
 */
import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
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
      feedbackItems={[]}
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
      apiKeys={{ openai: false, anthropic: false }}
      onSaveApiKey={async () => undefined}
      onRemoveApiKey={async () => undefined}
      apiKeyError={null}
      isSavingApiKey={false}
      {...overrides}
    />
  );
}

describe("SettingsPanel", () => {
  it("renders a clearly labeled settings section", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("Settings");
    expect(markup).toContain("Updates");
    expect(markup).toContain("Improvements");
  });

  it("renders changelog and proposals empty states", () => {
    const emptyMarkup = renderToStaticMarkup(renderPanel());
    expect(emptyMarkup).toContain("No changes recorded yet.");
    expect(emptyMarkup).toContain("No suggestions yet.");
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
    expect(markup).toContain("conversations and history are never affected");
    expect(markup).toContain("No data is deleted");
  });

  it("renders a single stable-experimental channel control surface", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("channel-toggle");
    expect(markup).toContain(">Stable (recommended)<");
    expect(markup).toContain(">Beta (early access)<");
    expect(markup).not.toContain(">Switch to Stable<");
  });

  it("uses progressive disclosure for advanced concepts", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("Early Access");
    expect(markup).toContain("Improvements");
    expect(markup).toContain("Suggestion = local proposal you review.");
  });

  it("renders Works offline section with at least 2 concrete items", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("Works offline");
    expect(markup).toContain("Browse and search conversations");
    expect(markup).toContain("Change settings and early-access options");
  });

  it("shows offline error copy without implying settings are unavailable", () => {
    const markup = renderToStaticMarkup(renderPanel({ error: "Could not load updates and drafts. Check if the assistant is running." }));
    expect(markup).toContain("Could not load updates and drafts. Check if the assistant is running.");
    expect(markup).not.toContain("Could not load changelog, proposals, and settings.");
  });

  it("renders Connections subsection with Not configured when API keys not set", () => {
    const markup = renderToStaticMarkup(renderPanel({ apiKeys: { openai: false, anthropic: false } }));
    expect(markup).toContain("Connections");
    expect(markup).toContain("Not configured");
    expect(markup).toContain("Save");
    expect(markup).toContain("OpenAI");
    expect(markup).toContain("Anthropic");
  });

  it("renders Connections subsection with Set when API key is set", () => {
    const markup = renderToStaticMarkup(renderPanel({ apiKeys: { openai: true, anthropic: false } }));
    expect(markup).toContain("Connections");
    expect(markup).toContain("Set ✓");
    expect(markup).toContain("Remove");
  });

  it("renders Suggested improvements section header and Suggest an improvement button", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("Suggested improvements");
    expect(markup).toContain("Suggest an improvement");
  });

  it("proposal form shows purpose description and Save for review when opened", async () => {
    render(renderPanel());
    const openBtn = screen.getByRole("button", { name: /Suggest an improvement/i });
    await userEvent.click(openBtn);
    expect(screen.getByText(/Review this suggested improvement\. Edit if needed, then save/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Save for review/i })).toBeTruthy();
    expect(screen.getByText(/You can review or accept this later/)).toBeTruthy();
  });

  it("shows Generate from feedback dropdown when feedback exists", () => {
    const items = [{ id: "fb-1", text: "Improvements section is confusing" }];
    const markup = renderToStaticMarkup(renderPanel({ feedbackItems: items }));
    expect(markup).toContain("Generate from feedback");
    expect(markup).toContain("fb-1");
  });

  it("generate from feedback opens form and shows purpose, Title, Rationale, Advanced section", async () => {
    const onCreateProposal = vi.fn();
    const items = [{ id: "fb-20260301-abc", text: "Improvements section is confusing" }];
    const { container } = render(
      renderPanel({
        feedbackItems: items,
        onCreateProposal
      })
    );
    const improvementsDetails = container.querySelector('[name="settings-improvements"]');
    const improvementsSummary = within(improvementsDetails as HTMLElement).getByText("Improvements");
    await userEvent.click(improvementsSummary);
    const select = screen.getByLabelText(/Select feedback to generate proposal from/i);
    await userEvent.selectOptions(select, "fb-20260301-abc");
    expect(screen.getAllByText(/Review this suggested improvement\. Edit if needed, then save/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: /Save for review/i }).length).toBeGreaterThanOrEqual(1);
    const improvementsSection = container.querySelector('[name="settings-improvements"]');
    expect(within(improvementsSection as HTMLElement).getByLabelText("Title")).toBeTruthy();
    expect(within(improvementsSection as HTMLElement).getByLabelText("Rationale")).toBeTruthy();
    expect(within(improvementsSection as HTMLElement).getByText("Advanced")).toBeTruthy();
  });

  it("Beta → Stable transition: clicking Stable when on Beta opens confirm dialog, confirming calls onSelectChannel", async () => {
    const onSelectChannel = vi.fn();
    const { container } = render(
      renderPanel({
        settings: makeSettings({ channel: "experimental" }),
        onSelectChannel
      })
    );
    const settingsSection = container.querySelector('[aria-label="Settings"]');
    expect(settingsSection).toBeTruthy();
    const stableBtn = within(settingsSection as HTMLElement).getByRole("button", {
      name: /Stable \(recommended\)/
    });
    await userEvent.click(stableBtn);
    const confirmBtn = screen.getByRole("button", { name: /Switch to Stable/ });
    await userEvent.click(confirmBtn);
    expect(onSelectChannel).toHaveBeenCalledWith("stable");
  });
});
