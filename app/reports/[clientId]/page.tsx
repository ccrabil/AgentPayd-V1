"use client";


import Link from "next/link";
import {
  Phone,
  CalendarCheck,
  Stethoscope,
  Clock,
  TrendingUp,
  Wallet,
  Receipt,
  Download,
  ArrowLeft,
} from "lucide-react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { InvoiceStatusBadge, RenewalBadge } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import {
  clientMetrics,
  eventsForClient,
  invoicesForClient,
  countEventType,
  getClient,
  agentsForClient,
} from "@/lib/selectors";
import { formatJPY, formatRoi, formatDate, formatPct } from "@/lib/format";
import {
  AgentRole,
  AGENT_ROLE_LABELS,
  USAGE_EVENT_LABELS,
} from "@/lib/types";

export default function ReportPage({
  params,
}: {
  params: { clientId: string };
}) {
  const { clientId } = params;
  const { state, vendor } = useStore();
  const client = getClient(state, clientId);

  if (!client) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          icon={Receipt}
          title="Report unavailable"
          description="This client doesn't exist."
        />
      </div>
    );
  }

  const m = clientMetrics(state, clientId);
  const events = eventsForClient(state, clientId).filter(
    (e) => e.status === "verified"
  );
  const invoices = invoicesForClient(state, clientId);
  const latestInvoice = invoices[0];

  const callsHandled = countEventType(state, "call_answered", clientId);
  const appointments = countEventType(state, "appointment_booked", clientId);
  const triage = countEventType(state, "triage_completed", clientId);
  const staffHours = (m.staffMinutesSaved / 60).toFixed(1);
  const clientAgents = agentsForClient(state, clientId);
  const roles = Array.from(
    new Set(clientAgents.map((a) => a.role).filter(Boolean))
  );
  const agentNoun =
    roles.length === 1
      ? AGENT_ROLE_LABELS[roles[0] as AgentRole].toLowerCase() + " agent"
      : "agents";

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar (hidden in print) */}
      <header className="border-b border-border bg-surface/60 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <Wordmark className="text-sm text-ink" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-ink hover:border-accent/40 hover:text-accent"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
            <Link
              href={`/client-portal/${clientId}`}
              className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Portal</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              ROI & Value Report
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
              {client.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              June 2026 · Prepared by {vendor.name}
            </p>
          </div>
          <RenewalBadge status={m.renewal} />
        </div>

        {/* 1. Executive summary */}
        <Section title="Executive Summary">
          <p className="text-lg leading-relaxed text-ink">
            Your AI agents created{" "}
            <span className="font-bold text-accent">
              {formatJPY(m.verifiedValue)}
            </span>{" "}
            in verified value this month, delivered for {formatJPY(m.aiCost)} in
            AI cost. That&apos;s an estimated{" "}
            <span className="font-bold text-accent">{formatRoi(m.roi)}</span>{" "}
            return on your investment, across {events.length} verified outcomes
            and {staffHours} staff hours saved.
          </p>
        </Section>

        {/* Value Receipt — plain-language proof of why the invoice exists */}
        <Section title="Value Receipt">
          <div className="rounded-2xl border border-accent/20 bg-surface p-5">
            <p className="text-base leading-relaxed text-ink">
              Your AI {agentNoun} completed{" "}
              <span className="font-semibold">{events.length}</span> verified
              outcomes this month
              {appointments > 0 && (
                <> — including {appointments} bookings</>
              )}
              {triage > 0 && <>, {triage} triage workflows</>}
              {callsHandled > 0 && <>, {callsHandled} calls handled</>}. Verified
              value created:{" "}
              <span className="font-bold text-accent">
                {formatJPY(m.verifiedValue)}
              </span>
              . Invoice amount:{" "}
              <span className="font-bold text-ink">{formatJPY(m.revenue)}</span>.
            </p>
            <p className="mt-2 text-sm text-muted">
              This invoice exists because AgentPayd verified the work above and
              calculated the value it created — an estimated {formatRoi(m.roi)}{" "}
              return for every ¥1 invoiced.
            </p>
          </div>
        </Section>

        {/* 2. Key metrics */}
        <Section title="Key Metrics">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric icon={Phone} label="Calls handled" value={String(callsHandled)} />
            <Metric
              icon={CalendarCheck}
              label="Appointments booked"
              value={String(appointments)}
            />
            <Metric
              icon={Stethoscope}
              label="Triage completed"
              value={String(triage)}
            />
            <Metric icon={Clock} label="Staff hours saved" value={staffHours} />
          </div>
        </Section>

        {/* 3. Financial impact */}
        <Section title="Financial Impact">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <dl className="divide-y divide-border">
              <FinRow
                icon={TrendingUp}
                label="Estimated operational value"
                value={formatJPY(m.verifiedValue)}
              />
              <FinRow
                icon={Wallet}
                label="AI delivery cost"
                value={formatJPY(m.aiCost)}
              />
              <FinRow
                icon={Receipt}
                label="Invoice amount"
                value={formatJPY(m.revenue)}
              />
              <FinRow
                icon={TrendingUp}
                label="Estimated ROI"
                value={formatRoi(m.roi)}
                accent
              />
            </dl>
          </div>
          <p className="mt-3 text-sm text-muted">
            For every ¥1 invoiced, your AI agents returned an estimated{" "}
            {m.revenue > 0
              ? (m.verifiedValue / m.revenue).toFixed(1)
              : "0"}{" "}
            in operational value
            {client.visibility.showVendorMargin && (
              <>
                {" "}
                · {formatPct(m.marginPct)} of revenue retained as margin by your
                provider
              </>
            )}
            .
          </p>
        </Section>

        {/* 4. Verified outcomes */}
        <Section title="Verified Outcomes">
          {events.length === 0 ? (
            <p className="text-sm text-muted">No verified outcomes this period.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 font-medium">Outcome</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className="px-5 py-3 text-ink">{e.description}</td>
                      <td className="px-5 py-3 text-muted">
                        {USAGE_EVENT_LABELS[e.eventType]}
                      </td>
                      <td className="px-5 py-3 font-semibold text-ink">
                        {formatJPY(e.estimatedValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* 5. Proof log */}
        <Section title="Proof Log">
          <ul className="space-y-2">
            {events
              .filter((e) => e.proofNote)
              .map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3 text-sm"
                >
                  <span className="mt-0.5 text-muted">{formatDate(e.timestamp)}</span>
                  <span className="text-ink">
                    {e.description} — <span className="text-muted">{e.proofNote}</span>
                  </span>
                </li>
              ))}
            {events.filter((e) => e.proofNote).length === 0 && (
              <li className="text-sm text-muted">
                Proof notes attached at verification will appear here.
              </li>
            )}
          </ul>
        </Section>

        {/* 6. Invoice summary */}
        <Section title="Invoice Summary">
          {latestInvoice ? (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-muted">
                    {latestInvoice.id}
                  </span>
                  <p className="mt-1 text-sm text-muted">
                    {latestInvoice.periodLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-ink">
                    {formatJPY(latestInvoice.amount)}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <InvoiceStatusBadge status={latestInvoice.status} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No invoice issued yet.</p>
          )}
        </Section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-subtle">
          Generated by AgentPayd · Pilot Mode · Figures are estimates based on
          verified agent activity. No patient data is stored.
        </footer>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function FinRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <dt className="flex items-center gap-2.5 text-sm text-muted">
        <Icon className="h-4 w-4" />
        {label}
      </dt>
      <dd
        className={`text-lg font-bold ${accent ? "text-accent" : "text-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}
