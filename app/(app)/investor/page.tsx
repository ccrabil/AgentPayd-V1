"use client";

import Topbar from "@/components/Topbar";
import StatCard from "@/components/ui/StatCard";
import PilotBadge from "@/components/ui/PilotBadge";
import { RenewalBadge } from "@/components/ui/StatusBadge";
import {
  Users,
  Bot,
  TrendingUp,
  Receipt,
  PiggyBank,
  Wallet,
  CheckCircle2,
  Clock,
  LineChart,
  Layers,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  vendorTotals,
  allClientMetrics,
  topClientByMargin,
  topAgentByMargin,
  mostExpensiveAgent,
} from "@/lib/selectors";
import { formatJPY, formatNumber, formatRoi, formatPct } from "@/lib/format";

export default function InvestorPage() {
  const { state, vendor } = useStore();
  const t = vendorTotals(state);
  const clients = allClientMetrics(state);
  const topClient = topClientByMargin(state);
  const topAgent = topAgentByMargin(state);
  const costlyAgent = mostExpensiveAgent(state);

  return (
    <div>
      <Topbar
        title="Investor View"
        description={`${vendor.name} · pilot traction snapshot`}
        action={<PilotBadge />}
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Headline metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total verified value"
            value={formatJPY(t.verifiedValue)}
            sublabel="Proven to clients this month"
            icon={TrendingUp}
            accent
          />
          <StatCard
            label="Total revenue"
            value={formatJPY(t.totalRevenue)}
            sublabel="Billable to clients"
            icon={Receipt}
          />
          <StatCard
            label="Gross margin"
            value={formatJPY(t.grossMargin)}
            sublabel={`${formatPct(t.grossMarginPct)} after AI cost`}
            icon={PiggyBank}
          />
          <StatCard
            label="Average ROI"
            value={formatRoi(t.avgRoi)}
            sublabel="Across pilot clients"
            icon={LineChart}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard label="Pilot clients" value={t.activeClients} icon={Users} />
          <StatCard label="Active agents" value={t.activeAgents} icon={Bot} />
          <StatCard
            label="Usage events"
            value={formatNumber(t.totalUsageEvents)}
            icon={Layers}
          />
          <StatCard
            label="Invoices"
            value={t.invoicesGenerated}
            icon={Receipt}
          />
          <StatCard
            label="Paid"
            value={t.paidInvoices}
            icon={CheckCircle2}
          />
          <StatCard label="Pending" value={t.pendingInvoices} icon={Clock} />
        </div>

        {/* Placeholders + AI cost */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="MRR (placeholder)"
            value={formatJPY(t.mrr)}
            sublabel="Sum of active plan base fees"
            icon={TrendingUp}
          />
          <StatCard
            label="Pipeline (placeholder)"
            value={formatJPY(2_400_000)}
            sublabel="Demo figure for investor view"
            icon={LineChart}
          />
          <StatCard
            label="AI delivery cost"
            value={formatJPY(t.totalAiCost)}
            sublabel="Cost to serve, all clients"
            icon={Wallet}
          />
        </div>

        {/* Top performers */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <HighlightCard
            label="Top performing client"
            primary={topClient?.client.name ?? "—"}
            secondary={
              topClient
                ? `${formatJPY(topClient.margin)} margin · ${formatRoi(
                    topClient.roi
                  )} ROI`
                : ""
            }
          />
          <HighlightCard
            label="Most profitable agent"
            primary={topAgent?.agent.name ?? "—"}
            secondary={
              topAgent ? `${formatJPY(topAgent.margin)} margin` : ""
            }
          />
          <HighlightCard
            label="Most expensive agent"
            primary={costlyAgent?.agent.name ?? "—"}
            secondary={
              costlyAgent ? `${formatJPY(costlyAgent.aiCost)} AI cost` : ""
            }
          />
        </div>

        {/* Client activation status */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">
            Client activation status
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Revenue</th>
                    <th className="px-5 py-3 font-medium">Margin</th>
                    <th className="px-5 py-3 font-medium">ROI</th>
                    <th className="px-5 py-3 font-medium">Renewal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((m) => (
                    <tr key={m.client.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-4 font-medium text-ink">
                        {m.client.name}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-successSoft px-2.5 py-1 text-xs font-medium text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          Activated
                        </span>
                      </td>
                      <td className="px-5 py-4 text-ink">
                        {formatJPY(m.revenue)}
                      </td>
                      <td className="px-5 py-4 text-ink">
                        {formatJPY(m.margin)}
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
      </div>
    </div>
  );
}

function HighlightCard({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-ink">{primary}</p>
      <p className="mt-1 text-sm text-muted">{secondary}</p>
    </div>
  );
}
