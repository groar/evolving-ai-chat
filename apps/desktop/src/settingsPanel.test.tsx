/**
 * @vitest-environment happy-dom
 */
import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SettingsPanel, type ChangelogEntry, type RuntimeSettings } from "./settingsPanel";

function makeSettings(overrides: Partial<RuntimeSettings> = {}): RuntimeSettings {
  return {
    channel: "experimental",
    experimental_flags: { show_runtime_diagnostics: true },
    active_flags: { show_runtime_diagnostics: true },
    ...overrides
  };
}

function renderPanel(overrides: Partial<ComponentProps<typeof SettingsPanel>> = {}) {
  return (
    <SettingsPanel
      settings={makeSettings()}
      changelog={[]}
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
  });

  it("renders changelog empty state", () => {
    const emptyMarkup = renderToStaticMarkup(renderPanel());
    expect(emptyMarkup).toContain("No changes yet.");
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
  });

  it("explains Updates and Early Access clearly (T-0065)", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("Choose which version of the app you get");
    expect(markup).toContain("Stable = recommended");
    expect(markup).toContain("Beta = early access to new features");
    expect(markup).toContain("Early Access (optional beta features when on Beta channel)");
    expect(markup).toContain("Only available when you choose the Beta channel above");
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
