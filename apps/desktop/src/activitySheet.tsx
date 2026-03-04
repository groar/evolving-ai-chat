"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { railBtn } from "@/lib/ui-classes";
import type { PatchEntry } from "./PatchNotification";
import type { ChangelogEntry } from "./settingsPanel";
import { runtimeBase } from "./hooks/useRuntime";

type ActivitySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patches: PatchEntry[];
  changelog: ChangelogEntry[];
  isBusy: boolean;
  onRollbackPatch: (patchId: string) => void;
};

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatRelativeTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getDateGroupLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

type DateGroup<T> = { label: string; items: T[] };

function groupPatchesByDate(patches: PatchEntry[]): DateGroup<PatchEntry>[] {
  const byLabel = new Map<string, PatchEntry[]>();
  for (const p of patches) {
    const d = new Date(p.created_at);
    const label = getDateGroupLabel(d);
    const list = byLabel.get(label) ?? [];
    list.push(p);
    byLabel.set(label, list);
  }
  const order = ["Today", "Yesterday"];
  const groups: DateGroup<PatchEntry>[] = [];
  for (const label of order) {
    const items = byLabel.get(label);
    if (items?.length) groups.push({ label, items });
  }
  const rest = Array.from(byLabel.entries())
    .filter(([label]) => !order.includes(label))
    .sort((a, b) => {
      const a0 = a[1][0];
      const b0 = b[1][0];
      return new Date(b0.created_at).getTime() - new Date(a0.created_at).getTime();
    });
  for (const [label, items] of rest) groups.push({ label, items });
  return groups;
}

function groupChangelogByDate(entries: ChangelogEntry[]): DateGroup<ChangelogEntry>[] {
  const byLabel = new Map<string, ChangelogEntry[]>();
  for (const e of entries) {
    const d = new Date(e.created_at);
    const label = getDateGroupLabel(d);
    const list = byLabel.get(label) ?? [];
    list.push(e);
    byLabel.set(label, list);
  }
  const order = ["Today", "Yesterday"];
  const groups: DateGroup<ChangelogEntry>[] = [];
  for (const label of order) {
    const items = byLabel.get(label);
    if (items?.length) groups.push({ label, items });
  }
  const rest = Array.from(byLabel.entries())
    .filter(([label]) => !order.includes(label))
    .sort((a, b) => {
      const a0 = a[1][0];
      const b0 = b[1][0];
      return new Date(b0.created_at).getTime() - new Date(a0.created_at).getTime();
    });
  for (const [label, items] of rest) groups.push({ label, items });
  return groups;
}

const PATCH_STATUS_LABEL: Record<string, string> = {
  pending_apply: "Pending",
  pending: "Pending",
  applying: "Applying…",
  applied: "Applied",
  apply_failed: "Failed",
  scope_blocked: "Blocked",
  validation_failed: "Failed",
  reverting: "Undoing…",
  reverted: "Undone",
  rollback_conflict: "Conflict",
  rollback_unavailable: "Unavailable"
};

export function ActivitySheet(props: ActivitySheetProps) {
  const { open, onOpenChange, patches, changelog, isBusy, onRollbackPatch } = props;
  const [expandedPatchIds, setExpandedPatchIds] = useState<Set<string>>(new Set());
  const [expandedChangelogKeys, setExpandedChangelogKeys] = useState<Set<string>>(new Set());
  const [logStateByPatchId, setLogStateByPatchId] = useState<
    Record<
      string,
      {
        status: "idle" | "loading" | "loaded" | "error_missing" | "error_offline";
        text: string;
      }
    >
  >({});

  const patchGroups = useMemo(() => groupPatchesByDate(patches), [patches]);
  const changelogGroups = useMemo(() => groupChangelogByDate(changelog), [changelog]);

  const loadPatchLog = async (patchId: string) => {
    setLogStateByPatchId((prev) => ({
      ...prev,
      [patchId]: {
        status: "loading",
        text: prev[patchId]?.text ?? ""
      }
    }));
    try {
      const response = await fetch(`${runtimeBase}/patches/${patchId}/log`);
      if (!response.ok) {
        setLogStateByPatchId((prev) => ({
          ...prev,
          [patchId]: {
            status: "error_missing",
            text: ""
          }
        }));
        return;
      }
      const data = (await response.json()) as {
        patch_id: string;
        log_text: string;
        created_at: string;
      };
      setLogStateByPatchId((prev) => ({
        ...prev,
        [patchId]: {
          status: "loaded",
          text: data.log_text ?? ""
        }
      }));
    } catch {
      setLogStateByPatchId((prev) => ({
        ...prev,
        [patchId]: {
          status: "error_offline",
          text: ""
        }
      }));
    }
  };

  const togglePatch = (id: string) => {
    setExpandedPatchIds((prev) => {
      const next = new Set(prev);
      const willExpand = !next.has(id);
      if (willExpand) {
        void loadPatchLog(id);
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const changelogKey = (e: ChangelogEntry) => `${e.created_at}-${e.title}`;
  const toggleChangelog = (key: string) => {
    setExpandedChangelogKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isEmpty = patches.length === 0 && changelog.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(520px,92vw)] overflow-y-auto flex flex-col bg-panel border-l border-border p-0"
        data-testid="activity-sheet"
      >
        <SheetHeader className="px-5 pt-5 pb-2 shrink-0 border-b border-border">
          <SheetTitle>Activity</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-auto px-5 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground" data-testid="activity-empty-state">
              <p className="m-0 text-sm">No activity yet. Changes applied by AI will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {patchGroups.map((group) => (
                <section key={group.label} className="grid gap-3">
                  <h2 className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h2>
                  <ul className="list-none m-0 p-0 grid gap-3" aria-label={`Activity for ${group.label}`}>
                    {group.items.map((patch) => {
                      const isApplied = patch.status === "applied";
                      const isReverted = patch.status === "reverted";
                      const isError =
                        patch.status === "apply_failed" ||
                        patch.status === "scope_blocked" ||
                        patch.status === "validation_failed" ||
                        patch.status === "rollback_conflict" ||
                        patch.status === "rollback_unavailable";
                      const expanded = expandedPatchIds.has(patch.id);
                      const logState = logStateByPatchId[patch.id];
                      const hasDiff = Boolean(patch.unified_diff);
                      const cardBorder = isApplied
                        ? "border-[#9ebf97]"
                        : isReverted
                          ? "border-[#c8d3c1]"
                          : isError
                            ? "border-[#f4a58b] border-l-4"
                            : "border-border";
                      return (
                        <li
                          key={patch.id}
                          className={`border rounded-lg bg-card p-3 grid gap-2 ${cardBorder}`}
                          data-testid={`activity-patch-${patch.id}`}
                        >
                          <button
                            type="button"
                            className="w-full text-left grid gap-2 focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2 rounded"
                            onClick={() => togglePatch(patch.id)}
                            aria-expanded={expanded}
                          >
                            <div className="flex justify-between gap-2 items-start">
                              <p className="m-0 text-sm font-bold line-clamp-2 flex-1 min-w-0">{patch.title}</p>
                              <span className="border border-border rounded-full py-0.5 px-2 text-xs text-muted-foreground shrink-0">
                                {PATCH_STATUS_LABEL[patch.status] ?? patch.status}
                              </span>
                            </div>
                            <p className="m-0 text-xs text-muted-foreground">{formatRelativeTime(patch.created_at)}</p>
                          </button>
                          {expanded && (
                            <div className="grid gap-2 pt-1 border-t border-border">
                              {patch.description && (
                                <p className="m-0 text-sm text-foreground">{patch.description}</p>
                              )}
                              <p className="m-0 text-xs text-muted-foreground">
                                {formatTimestamp(patch.created_at)}
                                {patch.applied_at ? ` · Applied ${formatTimestamp(patch.applied_at)}` : ""}
                                {patch.reverted_at ? ` · Undone ${formatTimestamp(patch.reverted_at)}` : ""}
                              </p>
                              {(patch.status === "apply_failed" || patch.status === "scope_blocked" || patch.status === "validation_failed") &&
                                patch.failure_reason && (
                                  <p className="m-0 text-xs text-destructive" role="alert">
                                    {patch.failure_reason}
                                  </p>
                                )}
                              <div className="flex flex-wrap gap-2">
                                {isApplied && (
                                  <button
                                    type="button"
                                    className={`${railBtn} text-sm`}
                                    onClick={() => onRollbackPatch(patch.id)}
                                    disabled={isBusy}
                                    aria-label={`Undo: ${patch.title}`}
                                  >
                                    Undo
                                  </button>
                                )}
                              </div>
                              {hasDiff && (
                                <pre className="m-0 text-xs leading-relaxed overflow-auto max-h-80 bg-[#f4f5f0] border border-border rounded-lg p-2.5 font-mono whitespace-pre">
                                  <code>{patch.unified_diff}</code>
                                </pre>
                              )}
                              <details className="mt-1 text-xs text-muted-foreground">
                                <summary>Agent log {logState && logState.status === "loaded" ? "↑" : "↓"}</summary>
                                <div className="mt-1">
                                  {logState?.status === "loading" && (
                                    <p className="m-0 text-xs text-muted-foreground">Loading log…</p>
                                  )}
                                  {logState?.status === "loaded" && (
                                    <pre className="m-0 text-xs font-mono bg-panel overflow-auto max-h-60 border border-border rounded-lg p-2.5 whitespace-pre-wrap">
                                      {logState.text}
                                    </pre>
                                  )}
                                  {logState?.status === "error_offline" && (
                                    <p className="m-0 text-xs text-muted-foreground">
                                      Log not available (runtime offline).
                                    </p>
                                  )}
                                  {(!logState || logState.status === "error_missing") && (
                                    <p className="m-0 text-xs text-muted-foreground">
                                      Log not available for this change.
                                    </p>
                                  )}
                                </div>
                              </details>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              {changelog.length > 0 && (
                <section className="grid gap-3 border-t border-border pt-4">
                  <h2 className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Release notes
                  </h2>
                  <ul className="list-none m-0 p-0 grid gap-3" aria-label="Release notes">
                    {changelogGroups.flatMap((group) =>
                      group.items.map((entry) => {
                        const key = changelogKey(entry);
                        const expanded = expandedChangelogKeys.has(key);
                        return (
                          <li
                            key={key}
                            className="border border-border rounded-lg bg-card p-3 grid gap-2"
                          >
                            <button
                              type="button"
                              className="w-full text-left grid gap-1 focus:outline-none focus:ring-2 focus:ring-[#efbe91] focus:ring-offset-2 rounded"
                              onClick={() => toggleChangelog(key)}
                              aria-expanded={expanded}
                            >
                              <div className="flex justify-between gap-2 items-center">
                                <p className="m-0 text-sm font-bold">{entry.title}</p>
                                <span className="border border-border rounded-full py-0.5 px-2 text-xs text-muted-foreground">
                                  {entry.channel === "experimental" ? "Beta" : "Stable"}
                                </span>
                              </div>
                              <p className="m-0 text-xs text-muted-foreground">{formatRelativeTime(entry.created_at)}</p>
                            </button>
                            {expanded && (
                              <div className="pt-1 border-t border-border grid gap-1">
                                <p className="m-0 text-sm text-foreground">{entry.summary}</p>
                                <p className="m-0 text-xs text-muted-foreground">
                                  {formatTimestamp(entry.created_at)}
                                  {entry.ticket_id ? ` · ${entry.ticket_id}` : ""}
                                  {entry.proposal_id ? ` · ${entry.proposal_id}` : ""}
                                </p>
                              </div>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
