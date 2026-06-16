"use client";

import { Bot, User, CheckCircle2, XCircle, Eye, AlertTriangle, ScrollText } from "lucide-react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import { getClient } from "@/lib/selectors";
import { formatDateTime } from "@/lib/format";
import {
  DECISION_LABELS,
  PROOF_SOURCE_LABELS,
  ProofSource,
  VerificationDecision,
} from "@/lib/types";

const ACTION_UI: Record<
  string,
  { icon: typeof Bot; cls: string; label: string }
> = {
  auto_verified: { icon: CheckCircle2, cls: "text-success", label: "Auto-verified" },
  verified: { icon: CheckCircle2, cls: "text-success", label: "Verified" },
  needs_review: { icon: Eye, cls: "text-warning", label: "Needs review" },
  flagged: { icon: AlertTriangle, cls: "text-danger", label: "Flagged" },
  manual: { icon: Eye, cls: "text-muted", label: "Manual" },
  rejected: { icon: XCircle, cls: "text-danger", label: "Rejected" },
};

export default function AuditLogPage() {
  const { state } = useStore();
  const clientIds = new Set(
    state.clients.filter((c) => c.vendorId === state.currentVendorId).map((c) => c.id)
  );
  const entries = state.auditLog.filter((e) => clientIds.has(e.clientId));

  return (
    <div>
      <Topbar
        title="Audit Log"
        description="Every verification decision — who, what, why, and its impact"
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {entries.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No verification activity yet"
            description="Verify an event manually, or run Autopilot from the Automation page, to see decisions logged here."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">By</th>
                    <th className="px-4 py-3 font-medium">Decision</th>
                    <th className="px-4 py-3 font-medium">Conf.</th>
                    <th className="px-4 py-3 font-medium">Proof</th>
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">ROI</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((e) => {
                    const ui = ACTION_UI[e.action] ?? ACTION_UI.manual;
                    const Icon = ui.icon;
                    const client = getClient(state, e.clientId);
                    return (
                      <tr key={e.id} className="align-top hover:bg-surface2">
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                          {formatDateTime(e.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-ink">{e.eventLabel}</td>
                        <td className="px-4 py-3 text-muted">
                          {client?.name ?? e.clientId}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-muted">
                            {e.by === "system" ? (
                              <Bot className="h-3.5 w-3.5" />
                            ) : (
                              <User className="h-3.5 w-3.5" />
                            )}
                            {e.by === "system" ? "Automatic" : "Human"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${ui.cls}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {DECISION_LABELS[e.action as VerificationDecision] ?? ui.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink">
                          {e.confidenceScore ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {(e.proofSources ?? [])
                            .filter((p) => p !== "ai_agent_event")
                            .map((p) => PROOF_SOURCE_LABELS[p as ProofSource])
                            .join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {e.invoiceImpact ? (
                            <span className="text-success">Yes</span>
                          ) : (
                            <span className="text-muted">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {e.roiImpact ? (
                            <span className="text-success">Yes</span>
                          ) : (
                            <span className="text-muted">No</span>
                          )}
                        </td>
                        <td className="max-w-xs px-4 py-3 text-xs text-muted">
                          {e.reason}
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
