"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { RenewalBadge } from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/store";
import { allClientMetrics, getPlan } from "@/lib/selectors";
import { formatJPY, formatNumber, formatRoi, formatPct } from "@/lib/format";

export default function ClientsPage() {
  const { state } = useStore();
  const metrics = allClientMetrics(state);

  return (
    <div>
      <Topbar
        title="Clients"
        description="Your AI vendor's customers — usage, revenue, cost and margin per client"
        action={
          <Link href="/onboarding">
            <Button>
              <Sparkles className="h-4 w-4" />
              Onboard client
            </Button>
          </Link>
        }
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Agents</th>
                  <th className="px-5 py-3 font-medium">Events</th>
                  <th className="px-5 py-3 font-medium">Revenue</th>
                  <th className="px-5 py-3 font-medium">AI cost</th>
                  <th className="px-5 py-3 font-medium">Margin</th>
                  <th className="px-5 py-3 font-medium">ROI</th>
                  <th className="px-5 py-3 font-medium">Renewal</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.map((m) => {
                  const plan = getPlan(state, m.client.pricingPlanId);
                  return (
                    <tr key={m.client.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accentSoft text-xs font-semibold text-accent">
                            {m.client.logoInitial}
                          </div>
                          <div>
                            <p className="font-medium text-ink">
                              {m.client.name}
                            </p>
                            <p className="text-xs text-muted">
                              {m.client.industry}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted">{plan?.name ?? "—"}</td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {m.agentCount}
                      </td>
                      <td className="px-5 py-4 text-ink">
                        {formatNumber(m.monthlyEvents)}
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
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/client-portal/${m.client.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                        >
                          Portal <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
