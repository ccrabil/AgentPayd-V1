"use client";

import { useState } from "react";
import {
  Building2,
  Receipt,
  CreditCard,
  MessageCircle,
  Landmark,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const { state, vendor, dispatch } = useStore();

  const [agencyName, setAgencyName] = useState(vendor.name);
  const [agencyEmail, setAgencyEmail] = useState("billing@cabot-ai.example.jp");
  const [regNo, setRegNo] = useState(vendor.invoiceRegNo);
  const [invoicePrefix, setInvoicePrefix] = useState("INV-2026-");

  function save() {
    dispatch({ type: "TOAST", message: "Settings saved (demo)" });
  }

  return (
    <div>
      <Topbar
        title="Settings"
        description="Agency profile, invoicing, and payment providers"
      />

      <div className="max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Agency profile */}
        <Card icon={Building2} title="Agency profile">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Agency name">
              <TextInput
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
              />
            </Field>
            <Field label="Billing email">
              <TextInput
                type="email"
                value={agencyEmail}
                onChange={(e) => setAgencyEmail(e.target.value)}
              />
            </Field>
          </div>
        </Card>

        {/* Invoice settings */}
        <Card icon={Receipt} title="Invoice settings">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Japanese invoice registration no."
              hint="Qualified invoice issuer number (適格請求書発行事業者番号)"
            >
              <TextInput
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="font-mono"
              />
            </Field>
            <Field label="Invoice number prefix">
              <TextInput
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="font-mono"
              />
            </Field>
          </div>
        </Card>

        {/* Payment providers */}
        <Card icon={CreditCard} title="Payment providers">
          <p className="mb-4 text-sm text-muted">
            Connect a provider to attach real payment links to invoices. In
            Pilot Mode these are placeholders — links are entered manually.
          </p>
          <div className="space-y-3">
            <Provider
              icon={MessageCircle}
              name="LINE notifications"
              desc="Notify clients of new invoices via LINE"
            />
            <Provider
              icon={CreditCard}
              name="PayPay"
              desc="Accept PayPay payments on invoices"
            />
            <Provider
              icon={CreditCard}
              name="Stripe"
              desc="Card payments and hosted invoice links"
            />
            <Provider
              icon={Landmark}
              name="Bank transfer"
              desc="Furikomi / direct bank transfer details"
            />
          </div>
        </Card>

        <Card icon={CreditCard} title="Pilot Mode data">
          <p className="mb-4 text-sm text-muted">
            Your pilot input (clients, agents, events, invoices) is saved in this
            browser via localStorage so it survives a refresh. This is temporary
            Pilot Mode storage — the production path is Supabase
            (see <code className="font-mono">supabase/schema.sql</code>).
          </p>
          <Button
            variant="danger"
            onClick={() => {
              dispatch({ type: "RESET_DEMO" });
              dispatch({
                type: "TOAST",
                message: "Reset to fresh demo data",
              });
            }}
          >
            Reset to demo data
          </Button>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save}>Save settings</Button>
        </div>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentSoft text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Provider({
  icon: Icon,
  name,
  desc,
}: {
  icon: typeof Building2;
  name: string;
  desc: string;
}) {
  const [connected, setConnected] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-bg/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{name}</p>
          <p className="text-xs text-muted">{desc}</p>
        </div>
      </div>
      <Button
        variant={connected ? "secondary" : "ghost"}
        onClick={() => setConnected((c) => !c)}
      >
        {connected ? "Connected" : "Connect"}
      </Button>
    </div>
  );
}
