"use client";

import { useEffect, useState } from "react";
import { Radio, Bot, ShieldCheck } from "lucide-react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/ui/EmptyState";
import { EventStatusBadge } from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/store";
import { getClient, getAgent } from "@/lib/selectors";
import { formatJPY } from "@/lib/format";
import { USAGE_EVENT_LABELS } from "@/lib/types";

// Compact relative time so the stream reads "live".
function ago(iso: string, now: number): string {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function LiveEventsPage() {
  const { state } = useStore();
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");

  // Tick so relative timestamps stay current.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const events = state.usageEvents
    .filter((e) => e.vendorId === state.currentVendorId)
    .filter((e) => filter === "all" || e.status === filter)
    .slice()
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  const todayCount = state.usageEvents.filter(
    (e) =>
      e.vendorId === state.currentVendorId &&
      new Date(e.timestamp).toDateString() === new Date().toDateString()
  ).length;

  const FILTERS = ["all", "pending", "verified", "rejected"] as const;

  return (
    <div>
      <Topbar
        title="Live Events"
        description="Every signal your agents emit — value, status, and margin impact in one stream"
        action={
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-xs font-medium text-muted">
              {todayCount} today
            </span>
          </div>
        }
      />

      <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "border-accent bg-accentSoft text-accent"
                  : "border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No signals yet"
            description="Signals from manual entry, CSV, the API, or LINE appear here in real time."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Signal</th>
                    <th className="px-4 py-3 font-medium">Client · Agent</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Value</th>
                    <th className="px-4 py-3 text-right font-medium">Margin impact</th>
                    <th className="px-4 py-3 text-right font-medium">Conf.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((e) => {
                    const client = getClient(state, e.clientId);
                    const agent = getAgent(state, e.agentId);
                    // Margin impact = revenue this signal adds to an invoice
                    // (only verified + billable counts).
                    const marginImpact =
                      e.status === "verified" && e.billableAmount > 0
                        ? e.billableAmount
                        : 0;
                    return (
                      <tr key={e.id} className="hover:bg-surface2">
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                          {ago(e.timestamp, now)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-ink">
                            {USAGE_EVENT_LABELS[e.eventType] ?? e.eventType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {client?.name ?? "—"} · {agent?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md border border-border bg-bg px-2 py-0.5 text-[11px] text-muted">
                            {e.source}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <EventStatusBadge status={e.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-ink">
                          {formatJPY(e.estimatedValue)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {marginImpact > 0 ? (
                            <span className="text-success">
                              +{formatJPY(marginImpact)}
                            </span>
                          ) : (
                            <span className="text-subtle">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {typeof e.confidenceScore === "number" ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs ${
                                e.confidenceScore >= 80
                                  ? "text-success"
                                  : e.confidenceScore >= 50
                                  ? "text-warning"
                                  : "text-danger"
                              }`}
                            >
                              {e.autoVerified ? (
                                <ShieldCheck className="h-3 w-3" />
                              ) : (
                                <Bot className="h-3 w-3" />
                              )}
                              {e.confidenceScore}
                            </span>
                          ) : (
                            <span className="text-subtle">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
