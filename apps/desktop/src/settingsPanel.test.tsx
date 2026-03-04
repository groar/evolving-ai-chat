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
  it("renders clearly labeled primary sections: Connections, Updates, Activity", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("Connections");
    expect(markup).toContain("Updates");
    expect(markup).toContain("Activity");
  });

  it("does not render Works offline section (removed in T-0068)", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).not.toContain("Works offline");
    expect(markup).not.toContain("Browse and search conversations");
    expect(markup).not.toContain("Change settings and early-access options");
  });

  it("renders activity compact summary when no patches", () => {
    const emptyMarkup = renderToStaticMarkup(renderPanel());
    expect(emptyMarkup).toContain("No changes yet.");
    expect(emptyMarkup).toContain("View activity →");
    expect(emptyMarkup).toContain("Activity");
  });

  it("renders activity compact summary with patch count when patches exist", () => {
    const patches = [
      {
        id: "p1",
        status: "applied" as const,
        title: "Fix button",
        description: "Updated label",
        unified_diff: "",
        created_at: "2026-03-01T12:00:00.000Z"
      }
    ];
    const markup = renderToStaticMarkup(renderPanel({ patches }));
    expect(markup).toContain("1 change applied.");
    expect(markup).toContain("View activity →");
  });

  it("does not render changelog wall (full history lives in Activity sheet)", () => {
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
    const markup = renderToStaticMarkup(renderPanel({ changelog }));
    expect(markup).toContain("View activity →");
    expect(markup).not.toContain("Experiments reset");
    expect(markup).not.toContain("Disabled all experimental feature toggles.");
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

  it("uses progressive disclosure: Advanced section is collapsed by default", () => {
    const { container } = render(renderPanel());
    const advancedDetails = Array.from(container.querySelectorAll("details")).find(
      (el) => el.textContent?.includes("Advanced")
    );
    expect(advancedDetails).toBeTruthy();
    expect(advancedDetails?.hasAttribute("open")).toBe(false);
  });

  it("Danger Zone section is inside SettingsPanel and collapsed by default", () => {
    const { container } = render(renderPanel());
    const dangerDetails = Array.from(container.querySelectorAll("details")).find(
      (el) => el.textContent?.includes("Danger Zone")
    );
    expect(dangerDetails).toBeTruthy();
    expect(dangerDetails?.hasAttribute("open")).toBe(false);
  });

  it("Danger Zone Delete Local Data button calls onDeleteLocalData when clicked (after expanding)", async () => {
    const onDeleteLocalData = vi.fn();
    const { container } = render(renderPanel({ onDeleteLocalData }));
    const dangerDetails = Array.from(container.querySelectorAll("details")).find(
      (el) => el.textContent?.includes("Danger Zone")
    ) as HTMLDetailsElement;
    // Programmatically open the details so the button is accessible
    dangerDetails.open = true;
    const deleteBtn = within(dangerDetails).getByRole("button", { name: /Delete Local Data/i });
    await userEvent.click(deleteBtn);
    expect(onDeleteLocalData).toHaveBeenCalledTimes(1);
  });

  it("Danger Zone shows Resetting... label when isResetting is true", () => {
    const { container } = render(renderPanel({ isResetting: true, isBusy: true }));
    const dangerDetails = Array.from(container.querySelectorAll("details")).find(
      (el) => el.textContent?.includes("Danger Zone")
    ) as HTMLDetailsElement;
    dangerDetails.open = true;
    expect(dangerDetails.textContent).toContain("Resetting...");
  });

  it("explains Updates and Advanced clearly (T-0065/T-0071 guardrails preserved)", () => {
    const markup = renderToStaticMarkup(renderPanel());
    expect(markup).toContain("Choose which version of the app you get");
    expect(markup).toContain("Stable = recommended");
    expect(markup).toContain("Beta = early access to new features");
    expect(markup).toContain("On Beta you can turn on optional features in Advanced");
    expect(markup).toContain("Only available when you choose the Beta channel above");
    expect(markup).toContain("shows a small card in the chat area with conversation and message counts");
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

  it("notice renders above the first section when present", () => {
    const markup = renderToStaticMarkup(renderPanel({ notice: "Test notice" }));
    const noticePos = markup.indexOf("Test notice");
    const connectionsPos = markup.indexOf("Connections");
    expect(noticePos).toBeGreaterThan(-1);
    expect(noticePos).toBeLessThan(connectionsPos);
  });

  it("error renders above the first section when present", () => {
    const markup = renderToStaticMarkup(renderPanel({ error: "Test error" }));
    const errorPos = markup.indexOf("Test error");
    const connectionsPos = markup.indexOf("Connections");
    expect(errorPos).toBeGreaterThan(-1);
    expect(errorPos).toBeLessThan(connectionsPos);
  });

  it("View activity button calls onOpenActivity when clicked", async () => {
    const onOpenActivity = vi.fn();
    const { container } = render(renderPanel({ onOpenActivity }));
    const viewActivity = within(container).getByTestId("settings-view-activity");
    await userEvent.click(viewActivity);
    expect(onOpenActivity).toHaveBeenCalledTimes(1);
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
