"use client";

import { useState } from "react";
import { Receipt, Link2, Send, Check, Plus } from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { InvoiceStatusBadge } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import {
  billableEventsForClient,
  buildInvoicePreview,
  getClient,
  getPlan,
} from "@/lib/selectors";
import { formatJPY, formatDate } from "@/lib/format";
import { USAGE_EVENT_LABELS, Invoice } from "@/lib/types";

export default function InvoicesPage() {
  const { state, dispatch } = useStore();
  const vendorClients = state.clients.filter(
    (c) => c.vendorId === state.currentVendorId
  );
  const [clientId, setClientId] = useState(vendorClients[0]?.id ?? "");

  const billable = billableEventsForClient(state, clientId);
  const billableIds = billable.map((e) => e.id).join(",");

  // Selected billable events. Reset selection whenever the client or the set
  // of billable events changes (render-time derived-state pattern — no effect).
  const [selected, setSelected] = useState<string[]>(
    billable.map((e) => e.id)
  );
  const [selKey, setSelKey] = useState(`${clientId}|${billableIds}`);
  const currentKey = `${clientId}|${billableIds}`;
  if (selKey !== currentKey) {
    setSelKey(currentKey);
    setSelected(billable.map((e) => e.id));
  }

  const preview = buildInvoicePreview(state, clientId, selected);
  const client = getClient(state, clientId);
  const plan = client ? getPlan(state, client.pricingPlanId) : undefined;

  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  }

  function generateDraft() {
    const invoice: Invoice = {
      id: `INV-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      vendorId: state.currentVendorId,
      clientId,
      periodLabel: preview.periodLabel,
      baseFee: preview.baseFee,
      usageAmount: preview.usageAmount,
      bookingAmount: preview.bookingAmount,
      aiCost: preview.aiCost,
      amount: preview.total,
      status: "Draft",
      issuedDate: new Date().toISOString(),
      eventIds: selected,
      paymentLink: null,
    };
    dispatch({ type: "ADD_INVOICE", invoice });
    dispatch({ type: "TOAST", message: "Draft invoice generated" });
  }

  return (
    <div>
      <Topbar
        title="Invoices"
        description="Generate invoices from verified, billable usage events"
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Builder */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  Build invoice
                </h2>
                <span className="text-xs text-muted">
                  Plan: {plan?.name ?? "—"}
                </span>
              </div>

              <Field label="Client">
                <Select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  {vendorClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <p className="mb-2 mt-5 text-sm font-medium text-ink">
                Verified billable outcomes
              </p>
              {billable.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-bg/40 px-4 py-6 text-center text-sm text-muted">
                  No verified billable events for this client yet. Verify some
                  outcomes first.
                </p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {billable.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 bg-bg/40 px-4 py-3"
                    >
                      <label className="flex flex-1 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(e.id)}
                          onChange={() => toggle(e.id)}
                          className="h-4 w-4 accent-accent"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-ink">
                            {e.description}
                          </span>
                          <span className="text-xs text-muted">
                            {USAGE_EVENT_LABELS[e.eventType]} ·{" "}
                            {formatDate(e.timestamp)}
                          </span>
                        </span>
                      </label>
                      <span className="text-sm font-semibold text-ink">
                        {formatJPY(e.billableAmount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-accent/20 bg-surface p-5 shadow-card">
              <h3 className="text-sm font-medium text-muted">
                Invoice preview
              </h3>
              <p className="mt-1 text-xs text-muted">
                {client?.name} · {preview.periodLabel}
              </p>

              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label={`Base fee (${plan?.name ?? "—"})`} value={preview.baseFee} />
                <Row label="Usage events" value={preview.usageAmount} />
                <Row label="Successful bookings" value={preview.bookingAmount} />
                <div className="border-t border-border pt-2.5">
                  <Row label="Subtotal" value={preview.total} />
                </div>
                <Row
                  label="Consumption tax (10%, placeholder)"
                  value={Math.round(preview.total * 0.1)}
                  muted
                />
                <div className="border-t border-border pt-2.5">
                  <Row
                    label="Total (tax incl.)"
                    value={Math.round(preview.total * 1.1)}
                    bold
                  />
                </div>
                <Row label="AI delivery cost" value={preview.aiCost} muted />
                <Row label="Gross margin" value={preview.margin} accent />
              </dl>

              <Button onClick={generateDraft} className="mt-5 w-full">
                <Plus className="h-4 w-4" />
                Generate draft invoice
              </Button>
              <p className="mt-3 text-center text-[11px] text-subtle">
                Preview only — no real payment is processed.
              </p>
            </div>
          </div>
        </section>

        {/* Existing invoices */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">All invoices</h2>
          {state.invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices yet"
              description="Generate a draft invoice from verified billable outcomes above."
            />
          ) : (
            <div className="space-y-3">
              {state.invoices.map((inv) => (
                <InvoiceRow key={inv.id} invoiceId={inv.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  accent,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`${
          accent
            ? "text-accent"
            : muted
            ? "text-muted"
            : "text-ink"
        } ${bold ? "text-base font-bold" : "font-semibold"}`}
      >
        {formatJPY(value)}
      </dd>
    </div>
  );
}

function InvoiceRow({ invoiceId }: { invoiceId: string }) {
  const { state, dispatch } = useStore();
  const inv = state.invoices.find((i) => i.id === invoiceId)!;
  const client = getClient(state, inv.clientId);
  const [link, setLink] = useState(inv.paymentLink ?? "");

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted">{inv.id}</span>
            <InvoiceStatusBadge status={inv.status} />
          </div>
          <p className="mt-1.5 text-sm font-medium text-ink">
            {client?.name} · {inv.periodLabel}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Base {formatJPY(inv.baseFee)} · Usage {formatJPY(inv.usageAmount)} ·
            Bookings {formatJPY(inv.bookingAmount)} · Margin{" "}
            {formatJPY(inv.amount - inv.aiCost)}
          </p>
        </div>
        <p className="text-xl font-bold text-ink">{formatJPY(inv.amount)}</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <TextInput
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste manual payment link (PayPay / bank / Stripe)…"
          />
          <Button
            variant="secondary"
            onClick={() => {
              dispatch({
                type: "SET_INVOICE_PAYMENT_LINK",
                id: inv.id,
                link: link || "https://pay.example.jp/demo-link",
              });
              dispatch({ type: "TOAST", message: "Payment link attached (demo)" });
            }}
          >
            <Link2 className="h-4 w-4" />
            Create link
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={inv.status === "Paid"}
            onClick={() => {
              dispatch({
                type: "SET_INVOICE_STATUS",
                id: inv.id,
                status: "Sent",
              });
              dispatch({ type: "TOAST", message: "Invoice marked as sent (demo)" });
            }}
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
          <Button
            disabled={inv.status === "Paid"}
            onClick={() => {
              dispatch({
                type: "SET_INVOICE_STATUS",
                id: inv.id,
                status: "Paid",
              });
              dispatch({ type: "TOAST", message: "Invoice marked as paid" });
            }}
          >
            <Check className="h-4 w-4" />
            Mark paid
          </Button>
        </div>
      </div>
    </div>
  );
}
