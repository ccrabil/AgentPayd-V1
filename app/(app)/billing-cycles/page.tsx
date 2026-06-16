"use client";

import { useState } from "react";
import { CalendarClock, Lock, ArrowRight } from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import { currentVendorClients, getClient, aiCostForClient } from "@/lib/selectors";
import { formatJPY, formatDate } from "@/lib/format";
import { USAGE_EVENT_LABELS, UsageEventType } from "@/lib/types";

const STATUS_TONE: Record<string, string> = {
  open: "bg-surface2 text-muted border-border",
  closed: "bg-accentSoft text-accent border-accent/20",
  invoiced: "bg-warningSoft text-warning border-warning/20",
  paid: "bg-successSoft text-success border-success/20",
};

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function BillingCyclesPage() {
  const { state, dispatch } = useStore();
  const clients = currentVendorClients(state);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");

  const clientIds = new Set(clients.map((c) => c.id));
  const cycles = state.billingCycles.filter((c) => clientIds.has(c.clientId));

  function closeCycle() {
    if (!clientId) return;
    const { start, end } = monthBounds();
    dispatch({
      type: "CLOSE_BILLING_CYCLE",
      clientId,
      periodStart: start,
      periodEnd: end,
      costForCycle: aiCostForClient(state, clientId),
    });
    dispatch({ type: "TOAST", message: "Billing cycle closed and frozen" });
  }

  return (
    <div>
      <Topbar
        title="Billing Cycles"
        description="Close a period to freeze its usage, value, and cost — invoices read the frozen snapshot"
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Close a cycle */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Close current month</h2>
          <p className="mt-1 text-xs text-muted">
            Freezes verified signals in the period. Once closed, new signals
            don&apos;t change this cycle — they roll into the next one.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px]">
              <Field label="Client">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Button onClick={closeCycle} disabled={!clientId}>
              <Lock className="h-4 w-4" />
              Close &amp; freeze cycle
            </Button>
          </div>
        </section>

        {/* Snapshots */}
        {cycles.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No billing cycles yet"
            description="Close a month above to create a frozen snapshot you can invoice from."
          />
        ) : (
          <div className="space-y-4">
            {cycles.map((c) => {
              const client = getClient(state, c.clientId);
              const margin = c.billableSnapshot - c.costSnapshot;
              const next =
                c.status === "closed"
                  ? "invoiced"
                  : c.status === "invoiced"
                  ? "paid"
                  : null;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{client?.name}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${STATUS_TONE[c.status]}`}
                        >
                          {c.status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-subtle">
                          <Lock className="h-3 w-3" /> frozen
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(c.periodStart)} – {formatDate(c.periodEnd)} ·{" "}
                        {c.signalIds.length} verified signals
                      </p>
                    </div>
                    {next && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          dispatch({
                            type: "SET_BILLING_CYCLE_STATUS",
                            id: c.id,
                            status: next as "invoiced" | "paid",
                          })
                        }
                      >
                        Mark {next}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Frozen label="Verified value" value={formatJPY(c.valueSnapshot)} />
                    <Frozen label="Billable" value={formatJPY(c.billableSnapshot)} />
                    <Frozen label="AI cost" value={formatJPY(c.costSnapshot)} />
                    <Frozen
                      label="Gross margin"
                      value={formatJPY(margin)}
                      accent
                    />
                  </div>

                  {Object.keys(c.usageSnapshot).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {Object.entries(c.usageSnapshot).map(([t, n]) => (
                        <span
                          key={t}
                          className="rounded-md border border-border bg-bg px-2 py-0.5 text-[11px] text-muted"
                        >
                          {USAGE_EVENT_LABELS[t as UsageEventType] ?? t}: {n}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Frozen({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-base font-bold ${accent ? "text-accent" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
