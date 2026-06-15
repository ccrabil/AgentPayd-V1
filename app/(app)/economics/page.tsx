"use client";

import { useState } from "react";
import { Calculator, Building2, Bot, TrendingUp, PiggyBank } from "lucide-react";
import Topbar from "@/components/Topbar";
import { Field } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import {
  currentVendorClients,
  eventsForClient,
  agentsForClient,
  revenueForClient,
} from "@/lib/selectors";
import { computeEconomics } from "@/lib/value";
import { formatJPY, formatRoi, formatPct } from "@/lib/format";
import {
  ClientAssumptions,
  DEFAULT_CLIENT_ASSUMPTIONS,
  Agent,
} from "@/lib/types";

// Editable numeric field bound to the store.
function NumField({
  label,
  value,
  onCommit,
  suffix,
  pct,
}: {
  label: string;
  value: number;
  onCommit: (n: number) => void;
  suffix?: string;
  pct?: boolean;
}) {
  const [v, setV] = useState(String(pct ? Math.round(value * 100) : value));
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => onCommit(pct ? Number(v) / 100 : Number(v) || 0)}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        {suffix && <span className="text-xs text-muted">{suffix}</span>}
      </div>
    </Field>
  );
}

export default function EconomicsPage() {
  const { state, dispatch } = useStore();
  const clients = currentVendorClients(state);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const client = clients.find((c) => c.id === clientId) ?? clients[0];

  if (!client) {
    return (
      <div>
        <Topbar title="Unit Economics" description="Transparent value, ROI, and margin" />
        <p className="px-6 py-10 text-sm text-muted">Add a client first.</p>
      </div>
    );
  }

  const assumptions = client.assumptions ?? DEFAULT_CLIENT_ASSUMPTIONS;
  const agents = agentsForClient(state, client.id);
  const events = eventsForClient(state, client.id);
  const invoiceAmount = revenueForClient(state, client.id);
  const econ = computeEconomics({ events, assumptions, agents, invoiceAmount });

  function setAssumption(key: keyof ClientAssumptions, n: number) {
    dispatch({
      type: "SET_CLIENT_ASSUMPTIONS",
      clientId: client!.id,
      assumptions: { ...assumptions, [key]: n },
    });
  }
  function setFinancial(agentId: string, key: keyof Agent, n: number) {
    dispatch({
      type: "SET_AGENT_FINANCIALS",
      agentId,
      financials: { [key]: n },
    });
  }

  return (
    <div>
      <Topbar
        title="Unit Economics"
        description="Client assumptions + agency costs + verified events — no black-box ROI"
        action={
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Headline results */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Verified value created" value={formatJPY(econ.verifiedValue)} tone="accent" icon={TrendingUp} />
          <Stat label="Client ROI" value={formatRoi(econ.clientRoi)} sub={`÷ ${formatJPY(econ.clientMonthlyFee)} fee`} tone="success" icon={TrendingUp} />
          <Stat label="Agency gross margin" value={formatJPY(econ.agencyGrossMargin)} sub={formatPct(econ.agencyMarginPercent)} tone="ink" icon={PiggyBank} />
          <Stat label="Net client value" value={formatJPY(econ.netClientValue)} tone="ink" icon={Calculator} />
        </section>

        {/* Value calculation — explainable */}
        <section className="rounded-2xl border border-accent/20 bg-surface p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink">
            How verified value was calculated
          </h2>
          <p className="mt-1 text-xs text-muted">
            Verified event counts × the client&apos;s own business assumptions.
            Nothing is made up.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="py-2 pr-4 font-medium">Outcome</th>
                  <th className="py-2 pr-4 font-medium">Calculation</th>
                  <th className="py-2 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {econ.valueBreakdown.lines.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-muted">
                      No verified outcomes yet for this client.
                    </td>
                  </tr>
                ) : (
                  econ.valueBreakdown.lines.map((l) => (
                    <tr key={l.label}>
                      <td className="py-2.5 pr-4 text-ink">{l.label}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted">
                        {l.formula}
                      </td>
                      <td className="py-2.5 text-right text-ink">
                        {formatJPY(l.value)}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="border-t border-border">
                  <td className="py-2.5 pr-4 font-semibold text-ink" colSpan={2}>
                    Total verified value
                  </td>
                  <td className="py-2.5 text-right font-bold text-accent">
                    {formatJPY(econ.verifiedValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-border bg-bg p-4 text-sm sm:grid-cols-2">
            <Formula label="Client ROI" expr={`${formatJPY(econ.verifiedValue)} ÷ ${formatJPY(econ.clientMonthlyFee)} = ${formatRoi(econ.clientRoi)}`} />
            <Formula label="Net client value" expr={`${formatJPY(econ.verifiedValue)} − ${formatJPY(econ.clientMonthlyFee)} = ${formatJPY(econ.netClientValue)}`} />
            <Formula label="Agency gross margin" expr={`${formatJPY(econ.invoiceAmount)} − ${formatJPY(econ.deliveryCost.total)} = ${formatJPY(econ.agencyGrossMargin)}`} />
            <Formula label="Agency margin %" expr={`${formatJPY(econ.agencyGrossMargin)} ÷ ${formatJPY(econ.invoiceAmount)} = ${formatPct(econ.agencyMarginPercent)}`} />
          </div>
        </section>

        {/* Two-sided inputs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Client side */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentSoft text-accent">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Client business assumptions
                </h2>
                <p className="text-xs text-muted">Provided by {client.name}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <NumField label="Avg appointment value" value={assumptions.averageAppointmentValue} onCommit={(n) => setAssumption("averageAppointmentValue", n)} suffix="¥" />
              <NumField label="Avg order value" value={assumptions.averageOrderValue} onCommit={(n) => setAssumption("averageOrderValue", n)} suffix="¥" />
              <NumField label="Show-up rate" value={assumptions.showUpRate} onCommit={(n) => setAssumption("showUpRate", n)} pct suffix="%" />
              <NumField label="No-show rate" value={assumptions.noShowRate} onCommit={(n) => setAssumption("noShowRate", n)} pct suffix="%" />
              <NumField label="Avg no-show loss" value={assumptions.averageNoShowLoss} onCommit={(n) => setAssumption("averageNoShowLoss", n)} suffix="¥" />
              <NumField label="Conversion rate" value={assumptions.conversionRate} onCommit={(n) => setAssumption("conversionRate", n)} pct suffix="%" />
              <NumField label="Avg lead value" value={assumptions.averageLeadValue} onCommit={(n) => setAssumption("averageLeadValue", n)} suffix="¥" />
              <NumField label="Customer LTV" value={assumptions.averageCustomerLifetimeValue} onCommit={(n) => setAssumption("averageCustomerLifetimeValue", n)} suffix="¥" />
              <NumField label="Human hourly cost" value={assumptions.humanHourlyCost} onCommit={(n) => setAssumption("humanHourlyCost", n)} suffix="¥" />
              <NumField label="Baseline bookings/mo" value={assumptions.baselineMonthlyBookings} onCommit={(n) => setAssumption("baselineMonthlyBookings", n)} />
            </div>
          </section>

          {/* Agency side */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentSoft text-accent">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Agency cost &amp; pricing
                </h2>
                <p className="text-xs text-muted">
                  Delivery cost: {formatJPY(econ.deliveryCost.total)} / mo
                </p>
              </div>
            </div>
            {agents.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No agents for this client.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {agents.map((ag) => (
                  <div key={ag.id} className="rounded-xl border border-border bg-bg p-4">
                    <p className="text-sm font-medium text-ink">{ag.name}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <NumField label="Client monthly fee" value={ag.clientMonthlyFee ?? 0} onCommit={(n) => setFinancial(ag.id, "clientMonthlyFee", n)} suffix="¥" />
                      <NumField label="AI / model cost" value={ag.aiModelCost ?? 0} onCommit={(n) => setFinancial(ag.id, "aiModelCost", n)} suffix="¥" />
                      <NumField label="Tool / LINE cost" value={ag.toolCost ?? 0} onCommit={(n) => setFinancial(ag.id, "toolCost", n)} suffix="¥" />
                      <NumField label="Human support cost" value={ag.humanSupportCost ?? 0} onCommit={(n) => setFinancial(ag.id, "humanSupportCost", n)} suffix="¥" />
                      <NumField label="Maintenance cost" value={ag.maintenanceCost ?? 0} onCommit={(n) => setFinancial(ag.id, "maintenanceCost", n)} suffix="¥" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "accent" | "success" | "ink";
  icon: typeof Calculator;
}) {
  const cls = { accent: "text-accent", success: "text-success", ink: "text-ink" }[tone];
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <Icon className={`h-4 w-4 ${cls}`} />
      <p className={`mt-2 text-xl font-bold ${cls}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
      {sub && <p className="text-[11px] text-subtle">{sub}</p>}
    </div>
  );
}

function Formula({ label, expr }: { label: string; expr: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="font-mono text-xs text-ink">{expr}</p>
    </div>
  );
}
