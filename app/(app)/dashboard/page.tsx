"use client";

import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Users,
  Bot,
  Activity,
  CalendarCheck,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import { RenewalBadge } from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/store";
import {
  vendorTotals,
  allClientMetrics,
  topClientByMargin,
  topAgentByMargin,
  getClient,
  getAgent,
} from "@/lib/selectors";
import {
  formatJPY,
  formatNumber,
  formatRoi,
  formatPct,
  formatDateTime,
} from "@/lib/format";
import { USAGE_EVENT_LABELS } from "@/lib/types";

export default function DashboardPage() {
  const { state, vendor } = useStore();
  const t = vendorTotals(state);
  const clients = allClientMetrics(state);
  const topClient = topClientByMargin(state);
  const topAgent = topAgentByMargin(state);
  const recentWork = [...state.usageEvents]
    .filter((e) => e.vendorId === state.currentVendorId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 6);

  return (
    <div>
      <Topbar
        title="Dashboard"
        description={`${vendor.name} · vendor overview for June 2026`}
        action={
          <Link href="/onboarding">
            <Button>
              <Sparkles className="h-4 w-4" />
              Onboard client
            </Button>
          </Link>
        }
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Positioning headline */}
        <section className="relative overflow-hidden rounded-2xl border border-accent/20 bg-surface p-6 shadow-card sm:p-8">
          <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(circle_at_top_left,black,transparent_70%)]" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Prove your AI is worth paying for.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              AgentPayd is the monetization and proof-of-value layer between
              AI-agent companies and the businesses that pay them. AI vendors
              use it to prove value and get paid; businesses use it to verify
              that vendors actually delivered results.
            </p>
          </div>
        </section>

        {/* Money row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total revenue"
            value={formatJPY(t.totalRevenue)}
            sublabel="Billable to clients, this month"
            icon={TrendingUp}
            accent
          />
          <StatCard
            label="AI delivery cost"
            value={formatJPY(t.totalAiCost)}
            sublabel="LLM, voice, telephony, compute"
            icon={Wallet}
          />
          <StatCard
            label="Gross margin"
            value={formatJPY(t.grossMargin)}
            sublabel={`${formatPct(t.grossMarginPct)} margin`}
            icon={PiggyBank}
          />
          <StatCard
            label="Value proven to clients"
            value={formatJPY(t.verifiedValue)}
            sublabel="Verified business value delivered"
            icon={ShieldCheck}
          />
        </div>

        {/* Operations row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard label="Active clients" value={t.activeClients} icon={Users} />
          <StatCard label="Active agents" value={t.activeAgents} icon={Bot} />
          <StatCard
            label="Usage events"
            value={formatNumber(t.totalUsageEvents)}
            icon={Activity}
          />
          <StatCard
            label="Bookings"
            value={formatNumber(t.bookingsCreated)}
            icon={CalendarCheck}
          />
          <StatCard
            label="Staff hours saved"
            value={t.staffHoursSaved.toFixed(1)}
            icon={Clock}
          />
          <StatCard
            label="Avg ROI"
            value={formatRoi(t.avgRoi)}
            icon={TrendingUp}
          />
        </div>

        {/* Risk strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Invoices ready"
            value={t.invoicesGenerated}
            sublabel={`${t.paidInvoices} paid · ${t.pendingInvoices} pending`}
            icon={Receipt}
          />
          <StatCard
            label="Renewal risk"
            value={t.renewalRisk}
            sublabel="Clients not yet renewal-ready"
            icon={AlertTriangle}
          />
          <StatCard
            label="Clients losing money"
            value={t.clientsLosingMoney}
            sublabel="Negative gross margin"
            icon={AlertTriangle}
          />
        </div>

        {/* Client profitability */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Client profitability
              </h2>
              <p className="text-sm text-muted">
                Which clients are profitable, and which may churn
              </p>
            </div>
            <Link
              href="/clients"
              className="hidden items-center gap-1.5 text-sm font-medium text-accent hover:underline sm:flex"
            >
              All clients <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Revenue</th>
                    <th className="px-5 py-3 font-medium">AI cost</th>
                    <th className="px-5 py-3 font-medium">Margin</th>
                    <th className="px-5 py-3 font-medium">ROI</th>
                    <th className="px-5 py-3 font-medium">Renewal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((m) => (
                    <tr key={m.client.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <Link
                          href={`/client-portal/${m.client.id}`}
                          className="font-medium text-ink hover:text-accent"
                        >
                          {m.client.name}
                        </Link>
                        <p className="text-xs text-muted">{m.client.industry}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {formatJPY(m.revenue)}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {formatJPY(m.aiCost)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {formatJPY(m.margin)}
                        <span className="ml-1 text-xs text-muted">
                          ({formatPct(m.marginPct)})
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-accent">
                        {formatRoi(m.roi)}
                      </td>
                      <td className="px-5 py-4">
                        <RenewalBadge status={m.renewal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recent work */}
        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
            Recent work
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Agent</th>
                    <th className="px-5 py-3 font-medium">Event</th>
                    <th className="px-5 py-3 font-medium">Value</th>
                    <th className="px-5 py-3 font-medium">Invoice impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentWork.map((e) => (
                    <tr key={e.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 whitespace-nowrap text-muted">
                        {formatDateTime(e.timestamp)}
                      </td>
                      <td className="px-5 py-3 text-ink">
                        {getClient(state, e.clientId)?.name}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {getAgent(state, e.agentId)?.name}
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md border border-border bg-bg px-2 py-0.5 font-mono text-xs text-ink">
                          {USAGE_EVENT_LABELS[e.eventType]}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-ink">
                        {formatJPY(e.estimatedValue)}
                      </td>
                      <td className="px-5 py-3 text-accent">
                        {e.billableAmount > 0
                          ? `+${formatJPY(e.billableAmount)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Top performers + why */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {topClient && (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Most profitable client
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {topClient.client.name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatJPY(topClient.margin)} margin · {formatRoi(topClient.roi)} ROI
              </p>
            </div>
          )}
          {topAgent && (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Top performing agent
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {topAgent.agent.name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatJPY(topAgent.margin)} margin · {formatJPY(topAgent.revenue)} revenue
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Why AgentPayd exists
            </p>
            <p className="mt-2 text-sm text-muted">
              AI vendors can build powerful agents but often can&apos;t answer
              what to charge, how to prove value, what each client costs to
              serve, or why a client should renew. AgentPayd connects agent
              activity, cost, pricing, invoices, and ROI proof in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
