import type { ComponentProps } from "react";
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
      onSelectChannel={() => undefined}
      onToggleDiagnostics={() => undefined}
      onResetExperiments={() => undefined}
      {...overrides}
    />
  );
}

function findButtonClickHandler(node: unknown, label: string): (() => void) | null {
  if (!node || typeof node !== "object") {
    return null;
  }

  const reactNode = node as { type?: unknown; props?: { children?: unknown; onClick?: () => void } };
  if (reactNode.type === "button" && reactNode.props) {
    const childText = flattenText(reactNode.props.children);
    if (childText === label && typeof reactNode.props.onClick === "function") {
      return reactNode.props.onClick;
    }
  }

  if (!reactNode.props || reactNode.props.children === undefined) {
    return null;
  }

  const children = Array.isArray(reactNode.props.children) ? reactNode.props.children : [reactNode.props.children];
  for (const child of children) {
    const maybeHandler = findButtonClickHandler(child, label);
    if (maybeHandler) {
      return maybeHandler;
    }
  }

  return null;
}

function flattenText(children: unknown): string {
  if (typeof children === "string") {
    return children.trim();
  }
  if (typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map((child) => flattenText(child)).join("").trim();
  }
  if (children && typeof children === "object") {
    const candidate = children as { props?: { children?: unknown } };
    if (candidate.props) {
      return flattenText(candidate.props.children);
    }
  }
  return "";
}

describe("SettingsPanel", () => {
  it("renders changelog empty and non-empty states", () => {
    const emptyMarkup = renderToStaticMarkup(renderPanel());
    expect(emptyMarkup).toContain("No changes recorded yet.");

    const changelog: ChangelogEntry[] = [
      {
        created_at: "2026-02-26T10:00:00.000Z",
        title: "Experiments reset",
        summary: "Disabled all experimental feature toggles.",
        channel: "experimental",
        ticket_id: "T-0008",
        flags_changed: ["show_runtime_diagnostics"]
      }
    ];
    const filledMarkup = renderToStaticMarkup(renderPanel({ changelog }));
    expect(filledMarkup).toContain("Experiments reset");
    expect(filledMarkup).toContain("Disabled all experimental feature toggles.");
  });

  it("requires confirmation for switching to stable", () => {
    const onSelectChannel = vi.fn();
    const confirmAction = vi.fn(() => false);
    const element = SettingsPanel({
      settings: makeSettings(),
      changelog: [],
      isBusy: false,
      canToggleFlags: true,
      configuredDiagnosticsFlag: true,
      notice: null,
      error: null,
      confirmAction,
      onSelectChannel,
      onToggleDiagnostics: () => undefined,
      onResetExperiments: () => undefined
    });
    const click = findButtonClickHandler(element, "Switch to Stable");
    expect(click).not.toBeNull();

    click?.();
    expect(confirmAction).toHaveBeenCalledOnce();
    expect(onSelectChannel).not.toHaveBeenCalled();
  });

  it("requires confirmation for resetting experiments", () => {
    const onResetExperiments = vi.fn();
    const confirmAction = vi.fn(() => false);
    const element = SettingsPanel({
      settings: makeSettings(),
      changelog: [],
      isBusy: false,
      canToggleFlags: true,
      configuredDiagnosticsFlag: true,
      notice: null,
      error: null,
      confirmAction,
      onSelectChannel: () => undefined,
      onToggleDiagnostics: () => undefined,
      onResetExperiments
    });
    const click = findButtonClickHandler(element, "Reset Experiments");
    expect(click).not.toBeNull();

    click?.();
    expect(confirmAction).toHaveBeenCalledOnce();
    expect(onResetExperiments).not.toHaveBeenCalled();
  });
});
