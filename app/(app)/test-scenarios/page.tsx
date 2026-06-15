"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import Topbar from "@/components/Topbar";
import { Field } from "@/components/ui/Field";
import { formatJPY, formatRoi, formatPct } from "@/lib/format";

// Self-contained scenario calculator — same formulas as lib/value.ts, but
// driven by hand-entered counts so anyone can sanity-check the logic.
export default function TestScenariosPage() {
  const [appts, setAppts] = useState(52);
  const [recovered, setRecovered] = useState(23);
  const [noShows, setNoShows] = useState(11);
  const [apptValue, setApptValue] = useState(30000);
  const [showUp, setShowUp] = useState(85);
  const [noShowLoss, setNoShowLoss] = useState(30000);
  const [fee, setFee] = useState(450000);
  const [delivery, setDelivery] = useState(150000);

  const s = showUp / 100;
  const apptVal = appts * apptValue * s;
  const recoveredVal = recovered * apptValue * s;
  const noShowVal = noShows * noShowLoss;
  const totalValue = apptVal + recoveredVal + noShowVal;
  const roi = fee > 0 ? totalValue / fee : 0;
  const netValue = totalValue - fee;
  const margin = fee - delivery;
  const marginPct = fee > 0 ? margin / fee : 0;

  return (
    <div>
      <Topbar
        title="Test Scenario"
        description="Plug in agent results and see the verified-value math — fully transparent"
      />

      <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Inputs */}
        <section className="space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-ink">AI agent results</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Num label="Appointments" value={appts} onChange={setAppts} />
              <Num label="Recovered" value={recovered} onChange={setRecovered} />
              <Num label="No-shows prevented" value={noShows} onChange={setNoShows} />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-ink">
              Client assumptions
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Num label="Appt value ¥" value={apptValue} onChange={setApptValue} />
              <Num label="Show-up %" value={showUp} onChange={setShowUp} />
              <Num label="No-show loss ¥" value={noShowLoss} onChange={setNoShowLoss} />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-ink">Agency pricing</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Num label="Client fee ¥/mo" value={fee} onChange={setFee} />
              <Num label="Delivery cost ¥/mo" value={delivery} onChange={setDelivery} />
            </div>
          </div>
        </section>

        {/* Output */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-accent/20 bg-surface p-6 shadow-card">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-ink">
                Verified value calculation
              </h2>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <CalcRow
                label="Appointments booked"
                expr={`${appts} × ${formatJPY(apptValue)} × ${showUp}%`}
                value={apptVal}
              />
              <CalcRow
                label="Bookings recovered"
                expr={`${recovered} × ${formatJPY(apptValue)} × ${showUp}%`}
                value={recoveredVal}
              />
              <CalcRow
                label="No-shows prevented"
                expr={`${noShows} × ${formatJPY(noShowLoss)}`}
                value={noShowVal}
              />
              <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                <span className="text-ink">Total verified value</span>
                <span className="text-accent">{formatJPY(totalValue)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Result label="Client ROI" value={formatRoi(roi)} expr={`${formatJPY(totalValue)} ÷ ${formatJPY(fee)}`} tone="success" />
            <Result label="Net client value" value={formatJPY(netValue)} expr={`${formatJPY(totalValue)} − ${formatJPY(fee)}`} tone="ink" />
            <Result label="Agency gross margin" value={formatJPY(margin)} expr={`${formatJPY(fee)} − ${formatJPY(delivery)}`} tone="ink" />
            <Result label="Agency margin %" value={formatPct(marginPct)} expr={`${formatJPY(margin)} ÷ ${formatJPY(fee)}`} tone="accent" />
          </div>

          <p className="rounded-xl border border-border bg-bg px-4 py-3 text-xs text-muted">
            This is exactly how AgentPayd values real verified events. The agency
            never types a value — it comes from counted outcomes × the client&apos;s
            own assumptions.
          </p>
        </section>
      </div>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
      />
    </Field>
  );
}

function CalcRow({
  label,
  expr,
  value,
}: {
  label: string;
  expr: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-ink">{label}</p>
        <p className="font-mono text-xs text-muted">{expr}</p>
      </div>
      <span className="shrink-0 text-ink">{formatJPY(value)}</span>
    </div>
  );
}

function Result({
  label,
  value,
  expr,
  tone,
}: {
  label: string;
  value: string;
  expr: string;
  tone: "success" | "accent" | "ink";
}) {
  const cls = { success: "text-success", accent: "text-accent", ink: "text-ink" }[tone];
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${cls}`}>{value}</p>
      <p className="mt-1 font-mono text-[11px] text-subtle">{expr}</p>
    </div>
  );
}
