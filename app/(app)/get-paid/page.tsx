"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Check,
  ArrowRight,
  Sparkles,
  Receipt,
  FileText,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { useStore } from "@/lib/store";
import {
  currentVendorClients,
  agentsForClient,
  eventsForClient,
  aiCostForClient,
} from "@/lib/selectors";
import { computeInvoice, PricingPackageV2 } from "@/lib/pricing";
import { computeVerifiedValue } from "@/lib/value";
import { formatJPY, formatRoi } from "@/lib/format";
import {
  DEFAULT_CLIENT_ASSUMPTIONS,
  Invoice,
  UsageEvent,
  USAGE_EVENT_LABELS,
} from "@/lib/types";

type Method = "fixed" | "per_outcome" | "both";

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const label = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return { start: start.toISOString(), end: end.toISOString(), label };
}

export default function GetPaidPage() {
  const { state, dispatch } = useStore();
  const clients = currentVendorClients(state);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [method, setMethod] = useState<Method>("both");
  const [monthlyFee, setMonthlyFee] = useState<number | null>(null);
  const [outcomeRate, setOutcomeRate] = useState(3000);
  const [done, setDone] = useState<null | { invoice: Invoice; receipt: string }>(null);

  const client = clients.find((c) => c.id === clientId);
  const agents = client ? agentsForClient(state, client.id) : [];
  const { start, end, label } = monthBounds();

  // Verified outcomes this month (only verified count).
  const verified = useMemo(() => {
    if (!client) return [] as UsageEvent[];
    return eventsForClient(state, client.id).filter(
      (e) =>
        e.status === "verified" &&
        e.timestamp >= start &&
        e.timestamp <= end
    );
  }, [state, client, start, end]);

  const billable = verified.filter((e) => e.billableAmount > 0);
  const defaultFee =
    monthlyFee ??
    (agents.reduce((s, a) => s + (a.clientMonthlyFee ?? 0), 0) || 0);

  // Plain-English outcome summary.
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    verified.forEach((e) => (m[e.eventType] = (m[e.eventType] ?? 0) + e.quantity));
    return m;
  }, [verified]);

  // Build the invoice with the pricing engine.
  const outcomeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    billable.forEach((e) => (m[e.eventType] = (m[e.eventType] ?? 0) + e.quantity));
    return m;
  }, [billable]);

  const pkg: PricingPackageV2 = {
    pricingModel: "hybrid",
    currency: "JPY",
    setupFee: 0,
    platformFeeMonthly: method === "per_outcome" ? 0 : defaultFee,
    seatFee: 0,
    includedSeats: 0,
    includedSignals: 0,
    baseFee: 0,
    overageRate: 0,
    activityRates: {},
    outcomeRates:
      method === "fixed"
        ? {}
        : Object.fromEntries(
            Object.keys(outcomeCounts).map((t) => [t, outcomeRate])
          ),
    workflowRates: {},
    usageRates: {},
  };

  const invoice = computeInvoice({
    pkg,
    isFirstCycle: false,
    seats: 0,
    activityCounts: {},
    outcomeCounts,
    workflowCounts: {},
    usageAmounts: {},
    totalSignals: verified.length,
    taxRatePercent: 10,
  });

  const assumptions = client?.assumptions ?? DEFAULT_CLIENT_ASSUMPTIONS;
  const value = computeVerifiedValue(verified, assumptions);
  const aiCost = client ? aiCostForClient(state, client.id) : 0;
  const roi = invoice.subtotal > 0 ? value.total / invoice.subtotal : 0;
  const margin = invoice.subtotal - aiCost;

  function createInvoice() {
    if (!client) return;
    // 1. Freeze the billing cycle (ledger snapshot).
    dispatch({
      type: "CLOSE_BILLING_CYCLE",
      clientId: client.id,
      periodStart: start,
      periodEnd: end,
      costForCycle: aiCost,
    });
    // 2. Create the real invoice from verified billable signals.
    const inv: Invoice = {
      id: `INV-${Date.now()}`,
      vendorId: state.currentVendorId,
      clientId: client.id,
      periodLabel: label,
      baseFee: method === "per_outcome" ? 0 : defaultFee,
      usageAmount: 0,
      bookingAmount: invoice.subtotal - (method === "per_outcome" ? 0 : defaultFee),
      aiCost,
      amount: invoice.total,
      status: "Draft",
      issuedDate: new Date().toISOString(),
      eventIds: billable.map((e) => e.id),
      paymentLink: null,
    };
    dispatch({ type: "ADD_INVOICE", invoice: inv });

    // 3. Plain-English value receipt.
    const parts = value.lines.map((l) => `${l.count} ${l.label.toLowerCase()}`);
    const receipt = `Your AI created ${formatJPY(value.total)} in verified value this month${
      parts.length ? ` by handling ${parts.join(", ")}` : ""
    }. ${client.name} pays ${formatJPY(invoice.total)}. That's a ${formatRoi(
      roi
    )} return.`;

    dispatch({ type: "TOAST", message: "Invoice and value receipt created" });
    setDone({ invoice: inv, receipt });
  }

  if (!client) {
    return (
      <div>
        <Topbar title="Get Paid" description="Turn verified outcomes into an invoice" />
        <p className="px-6 py-10 text-sm text-muted">Add a customer first.</p>
      </div>
    );
  }

  // ---- Success state ----
  if (done) {
    return (
      <div>
        <Topbar title="Get Paid" description="Invoice ready to send" />
        <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6">
          <div className="rounded-2xl border border-success/20 bg-successSoft p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-lg font-semibold text-ink">
              Invoice {done.invoice.id} created
            </h2>
            <p className="mt-1 text-2xl font-bold text-ink">
              {formatJPY(done.invoice.amount)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-ink">
                Value receipt for {client.name}
              </h3>
            </div>
            <p className="mt-3 text-base leading-relaxed text-ink">{done.receipt}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/invoices">
              <Button>
                <Receipt className="h-4 w-4" />
                Open in Invoices
              </Button>
            </Link>
            <Link href={`/reports/${client.id}`}>
              <Button variant="secondary">
                <FileText className="h-4 w-4" />
                View ROI report
              </Button>
            </Link>
            <Button variant="ghost" onClick={() => setDone(null)}>
              Bill another customer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Guided flow ----
  return (
    <div>
      <Topbar
        title="Get Paid"
        description="Turn this month's verified outcomes into an invoice — in three steps"
      />

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        {/* Step 1 */}
        <Card step={1} title="Choose your customer">
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setMonthlyFee(null);
            }}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Card>

        {/* Step 2 — what the AI did */}
        <Card step={2} title="What your AI did this month">
          {verified.length === 0 ? (
            <p className="text-sm text-muted">
              No verified outcomes yet for {label}. Verify some events first, then
              come back — only verified work can be billed.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink">
                {verified.length} verified outcomes, worth{" "}
                <span className="font-semibold text-accent">
                  {formatJPY(value.total)}
                </span>{" "}
                in value to {client.name}.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(counts).map(([t, n]) => (
                  <span
                    key={t}
                    className="rounded-md border border-border bg-bg px-2 py-0.5 text-xs text-muted"
                  >
                    {USAGE_EVENT_LABELS[t as keyof typeof USAGE_EVENT_LABELS] ?? t}: {n}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Step 3 — how to charge */}
        <Card step={3} title="How do you charge them?">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                ["fixed", "Flat monthly fee"],
                ["per_outcome", "Per outcome"],
                ["both", "Both"],
              ] as [Method, string][]
            ).map(([m, lbl]) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                  method === m
                    ? "border-accent bg-accentSoft text-accent"
                    : "border-border bg-bg text-ink hover:border-accent/40"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {method !== "per_outcome" && (
              <label className="block">
                <span className="text-xs font-medium text-muted">
                  Monthly fee (¥)
                </span>
                <input
                  type="number"
                  value={defaultFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </label>
            )}
            {method !== "fixed" && (
              <label className="block">
                <span className="text-xs font-medium text-muted">
                  Per verified outcome (¥)
                </span>
                <input
                  type="number"
                  value={outcomeRate}
                  onChange={(e) => setOutcomeRate(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </label>
            )}
          </div>
        </Card>

        {/* Result preview */}
        <div className="rounded-2xl border border-accent/20 bg-surface p-6 shadow-card">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Preview label="You invoice" value={formatJPY(invoice.total)} accent />
            <Preview label="Customer ROI" value={formatRoi(roi)} />
            <Preview label="Your margin" value={formatJPY(margin)} />
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            Only verified, billable outcomes are counted. Tax shown is a 10%
            placeholder.
          </p>
          <Button
            onClick={createInvoice}
            disabled={billable.length === 0 && method !== "fixed"}
            className="mt-4 w-full justify-center"
          >
            <Wallet className="h-4 w-4" />
            Create invoice &amp; value receipt
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Card({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
          {step}
        </span>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Preview({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? "text-accent" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
