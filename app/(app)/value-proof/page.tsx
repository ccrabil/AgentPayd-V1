"use client";

import {
  Bot,
  TrendingUp,
  Receipt,
  PiggyBank,
  RefreshCw,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import { useStore } from "@/lib/store";
import { vendorTotals, allClientMetrics } from "@/lib/selectors";
import { formatJPY, formatNumber, formatRoi, formatPct } from "@/lib/format";
import { RenewalBadge } from "@/components/ui/StatusBadge";

export default function ValueProofPage() {
  const { state, vendor } = useStore();
  const t = vendorTotals(state);
  const clients = allClientMetrics(state);
  const renewalReady = clients.filter((c) => c.renewal === "strong");

  const cards = [
    {
      icon: Bot,
      label: "AI work completed",
      value: formatNumber(t.verifiedEvents),
      sub: "Verified usage events this month",
    },
    {
      icon: TrendingUp,
      label: "Business value delivered",
      value: formatJPY(t.verifiedValue),
      sub: "Estimated value created for clients",
    },
    {
      icon: Receipt,
      label: "Invoice justified",
      value: formatJPY(t.totalRevenue),
      sub: "Revenue backed by verified outcomes",
    },
    {
      icon: PiggyBank,
      label: "Margin protected",
      value: formatJPY(t.grossMargin),
      sub: `${formatPct(t.grossMarginPct)} gross margin after AI cost`,
    },
    {
      icon: RefreshCw,
      label: "Renewal proof created",
      value: `${renewalReady.length} / ${clients.length}`,
      sub: "Clients with renewal-ready ROI",
    },
  ];

  return (
    <div>
      <Topbar
        title="Value Proof"
        description="Can this AI vendor prove its AI is worth paying for?"
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-accent/20 bg-surface p-6 shadow-card">
          <h2 className="text-xl font-semibold text-ink">
            {vendor.name} proved {formatJPY(t.verifiedValue)} in client value
            this month.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            That value was delivered for {formatJPY(t.totalAiCost)} in AI cost
            and converted into {formatJPY(t.totalRevenue)} of justified invoices
            — a {formatPct(t.grossMarginPct)} gross margin.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="rounded-2xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accentSoft text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted">
                  {c.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-ink">{c.value}</p>
                <p className="mt-1 text-xs text-muted">{c.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Renewal justification per client */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">
            Renewal justification
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {clients.map((m) => (
              <div
                key={m.client.id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">{m.client.name}</p>
                  <RenewalBadge status={m.renewal} />
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <Line label="Monthly invoice" value={formatJPY(m.revenue)} />
                  <Line
                    label="Value delivered"
                    value={formatJPY(m.verifiedValue)}
                  />
                  <Line label="Estimated ROI" value={formatRoi(m.roi)} accent />
                  <Line
                    label="Staff hours saved"
                    value={(m.staffMinutesSaved / 60).toFixed(1)}
                  />
                </dl>
                {m.renewal !== "strong" && (
                  <p className="mt-3 rounded-lg border border-warning/20 bg-warningSoft px-3 py-2 text-xs text-warning">
                    Reason: high AI cost relative to value delivered, or low
                    conversion. Review pricing or agent performance.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={accent ? "font-bold text-accent" : "font-semibold text-ink"}>
        {value}
      </dd>
    </div>
  );
}
