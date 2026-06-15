"use client";


import Link from "next/link";
import {
  Bot,
  ShieldCheck,
  TrendingUp,
  Receipt,
  FileText,
  ArrowLeft,
  Clock,
  Lock,
} from "lucide-react";
import { LogoMark, Wordmark } from "@/components/Logo";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import PilotBadge from "@/components/ui/PilotBadge";
import {
  EventStatusBadge,
  InvoiceStatusBadge,
  RenewalBadge,
} from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import {
  clientMetrics,
  agentsForClient,
  eventsForClient,
  invoicesForClient,
  getClient,
} from "@/lib/selectors";
import {
  formatJPY,
  formatNumber,
  formatRoi,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import { USAGE_EVENT_LABELS } from "@/lib/types";

export default function ClientPortalPage({
  params,
}: {
  params: { clientId: string };
}) {
  const { clientId } = params;
  const { state, vendor } = useStore();

  const client = getClient(state, clientId);

  // --- client scoping / access guard ---
  // A Client User may only view their OWN client portal. If the mock-auth
  // role is business_client and the scoped client doesn't match the URL, deny.
  // (With real auth this check moves into middleware using the session.)
  const scopeViolation =
    state.role === "business_client" && state.currentClientId !== clientId;

  if (!client) {
    return (
      <Shell vendorName={vendor.name}>
        <EmptyState
          icon={Lock}
          title="Client not found"
          description="This client portal doesn't exist."
        />
      </Shell>
    );
  }

  if (scopeViolation) {
    return (
      <Shell vendorName={vendor.name}>
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="As a Business Client you can only view your own portal. Switch to AI Vendor to view other clients."
        />
      </Shell>
    );
  }

  const m = clientMetrics(state, clientId);
  const agents = agentsForClient(state, clientId);
  const events = eventsForClient(state, clientId);
  const verifiedEvents = events.filter((e) => e.status === "verified");
  const invoices = invoicesForClient(state, clientId);

  return (
    <Shell vendorName={vendor.name}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accentSoft text-sm font-semibold text-accent">
              {client.logoInitial}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {client.name}
              </h1>
              <p className="text-sm text-muted">
                {client.industry} · portal for June 2026
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RenewalBadge status={m.renewal} />
          <Link href={`/reports/${clientId}`}>
            <Button variant="secondary">
              <FileText className="h-4 w-4" />
              View ROI Report
            </Button>
          </Link>
          <Link href="/invoices">
            <Button>
              <Receipt className="h-4 w-4" />
              View Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero value statement — answers: did the vendor deliver enough value to justify payment? */}
      <div className="mb-6 rounded-2xl border border-accent/20 bg-surface p-6 shadow-card">
        <p className="text-sm text-muted">Your AI agents delivered</p>
        <p className="mt-1 text-3xl font-bold text-ink">
          {formatJPY(m.verifiedValue)}{" "}
          <span className="text-lg font-normal text-muted">
            in value this month
          </span>
        </p>
        <p className="mt-3 rounded-xl border border-border bg-bg/40 p-4 text-sm text-muted">
          Your AI vendor is charging{" "}
          <span className="font-semibold text-ink">{formatJPY(m.revenue)}</span>{" "}
          this month. AgentPayd tracked{" "}
          <span className="font-semibold text-ink">
            {formatJPY(m.verifiedValue)}
          </span>{" "}
          in estimated value delivered, meaning the AI generated approximately{" "}
          <span className="font-semibold text-accent">{formatRoi(m.roi)}</span>{" "}
          ROI.
          {client.visibility.showAiCost && (
            <>
              {" "}
              AI delivery cost was {formatJPY(m.aiCost)}.
            </>
          )}
        </p>
      </div>

      {/* Vendor-only visibility control (clients never see this panel) */}
      {state.role !== "business_client" && (
        <div className="mb-6 rounded-2xl border border-dashed border-border bg-surface/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Client visibility (vendor controls)
          </p>
          <p className="mt-1 text-xs text-subtle">
            Choose what {client.name} can see. Margin is hidden by default.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <VisibilityToggle
              clientId={clientId}
              field="showAiCost"
              label="Show AI delivery cost"
              active={client.visibility.showAiCost}
            />
            <VisibilityToggle
              clientId={clientId}
              field="showVendorMargin"
              label="Show vendor margin"
              active={client.visibility.showVendorMargin}
            />
          </div>
        </div>
      )}

      {/* Key stats — simple, non-technical labels */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Work tracked"
          value={formatNumber(m.verifiedEvents)}
          sublabel="Verified AI actions"
          icon={Bot}
        />
        <StatCard
          label="Value proven"
          value={formatJPY(m.verifiedValue)}
          icon={ShieldCheck}
          accent
        />
        <StatCard
          label="Time saved"
          value={`${(m.staffMinutesSaved / 60).toFixed(1)} hrs`}
          sublabel="Staff time saved"
          icon={Clock}
        />
        <StatCard
          label="Invoice amount"
          value={formatJPY(m.revenue)}
          icon={Receipt}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="ROI" value={formatRoi(m.roi)} icon={TrendingUp} accent />
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Vendor performance
          </p>
          <p className="mt-2 text-lg font-semibold text-ink">
            {m.renewal === "strong"
              ? "Delivering strong value"
              : m.renewal === "needs_attention"
              ? "Delivering moderate value"
              : "Underdelivering"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {vendor.name}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Renewal recommendation
          </p>
          <div className="mt-2">
            <RenewalBadge status={m.renewal} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {m.renewal === "strong"
              ? "The numbers support renewing this vendor."
              : m.renewal === "needs_attention"
              ? "Review value vs. cost before renewing."
              : "Value delivered is low relative to the invoice."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Proof log */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-ink">
            Verified outcomes & proof log
          </h2>
          {verifiedEvents.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No verified outcomes yet"
              description="Once your AI vendor verifies agent work, it appears here as proof."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Outcome</th>
                      <th className="px-5 py-3 font-medium">Value</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {verifiedEvents.map((e) => (
                      <tr key={e.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 whitespace-nowrap text-muted">
                          {formatDate(e.timestamp)}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-ink">{e.description}</p>
                          <p className="text-xs text-muted">
                            {USAGE_EVENT_LABELS[e.eventType]}
                            {e.proofNote ? ` · ${e.proofNote}` : ""}
                          </p>
                        </td>
                        <td className="px-5 py-3 font-semibold text-ink">
                          {formatJPY(e.estimatedValue)}
                        </td>
                        <td className="px-5 py-3">
                          <EventStatusBadge status={e.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Agents + invoices */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink">
              Active AI agents
            </h2>
            <div className="space-y-2">
              {agents.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{a.name}</p>
                    <p className="text-xs text-muted">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink">
              Invoice summary
            </h2>
            {invoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/40 px-4 py-6 text-center text-sm text-muted">
                No invoices issued yet.
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted">
                        {inv.id}
                      </span>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-muted">
                        {inv.periodLabel}
                      </span>
                      <span className="text-lg font-bold text-ink">
                        {formatJPY(inv.amount)}
                      </span>
                    </div>
                    {inv.paymentLink && (
                      <a
                        href={inv.paymentLink}
                        className="mt-2 block truncate text-xs text-accent hover:underline"
                      >
                        Payment link: {inv.paymentLink}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function VisibilityToggle({
  clientId,
  field,
  label,
  active,
}: {
  clientId: string;
  field: "showAiCost" | "showVendorMargin";
  label: string;
  active: boolean;
}) {
  const { dispatch } = useStore();
  return (
    <button
      type="button"
      onClick={() =>
        dispatch({
          type: "SET_CLIENT_VISIBILITY",
          clientId,
          visibility: { [field]: !active },
        })
      }
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-accent/40 bg-accentSoft text-accent"
          : "border-border bg-bg text-muted hover:text-ink"
      }`}
    >
      {active ? "✓ " : ""}
      {label}
    </button>
  );
}

function Shell({
  children,
  vendorName,
}: {
  children: React.ReactNode;
  vendorName: string;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <Wordmark className="text-sm text-ink" />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:block">
              Powered by {vendorName}
            </span>
            <PilotBadge />
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Vendor view</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
