"use client";

import Topbar from "@/components/Topbar";
import { Code2, KeyRound, ShieldAlert, Webhook, Upload } from "lucide-react";

const CURL = `curl -X POST https://your-app.vercel.app/api/events \\
  -H "Authorization: Bearer ap_demo_pilot_key_2026" \\
  -H "Content-Type: application/json" \\
  -d '{
    "idempotencyKey": "evt_8821",
    "clientId": "client-tokyo-skin",
    "agentId": "agent-voice",
    "eventType": "appointment_booked",
    "description": "AI agent booked an appointment",
    "estimatedValue": 30000,
    "billable": true,
    "billingRate": 3000,
    "source": "CRM",
    "customerReference": "customer_8821",
    "proofNote": "Booking confirmed in CRM"
  }'`;

const RESPONSE = `// 201 Created
{
  "event": {
    "id": "evt-api-1718...",
    "status": "pending_verification",
    "clientId": "client-tokyo-skin",
    "agentId": "agent-voice",
    "eventType": "appointment_booked",
    "estimatedValue": 30000,
    "billable": true,
    "billingRate": 3000
  },
  "note": "Pending verification — excluded from ROI/invoice until verified."
}`;

const RULES = [
  "Authorization: Bearer <API_KEY> is required — missing/invalid returns 401.",
  "Duplicate idempotencyKey returns the existing event, never a duplicate.",
  "Unknown eventType is rejected (400).",
  "Negative estimatedValue or billingRate is rejected (400).",
  "Missing clientId or agentId is rejected (400).",
  "An agent that doesn't belong to the client is rejected (400).",
  "API events default to pending_verification — excluded from ROI until verified, and from invoices until verified AND billable.",
  "Never expose API keys in client-side code.",
];

export default function DevelopersPage() {
  return (
    <div>
      <Topbar
        title="Developers"
        description="Send AI-agent outcome events to AgentPayd from your stack"
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* API key */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentSoft text-accent">
              <KeyRound className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-ink">Authentication</h2>
          </div>
          <p className="mt-3 text-sm text-muted">
            Every request needs a bearer API key scoped to your agency. In Pilot
            Mode use the demo key below; in production, generate per-agency keys
            (stored hashed in the <code className="font-mono">api_keys</code>{" "}
            table) and rotate freely.
          </p>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-bg px-4 py-3">
            <code className="font-mono text-sm text-ink">
              ap_demo_pilot_key_2026
            </code>
            <span className="rounded-full border border-warning/20 bg-warningSoft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-warning">
              Demo key
            </span>
          </div>
        </section>

        {/* Endpoint + rules */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">
            POST /api/events
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CodeBlock title="curl" code={CURL} />
            <CodeBlock title="response" code={RESPONSE} />
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold text-ink">Validation rules</h3>
            <ul className="mt-3 space-y-2">
              {RULES.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* idempotency */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h3 className="text-sm font-semibold text-ink">idempotencyKey</h3>
          <p className="mt-2 text-sm text-muted">
            Send a unique <code className="font-mono">idempotencyKey</code> per
            real-world outcome (e.g. your CRM&apos;s booking ID). If the same key
            arrives twice — retries, at-least-once delivery — AgentPayd returns
            the original event instead of creating a duplicate, so your ROI and
            invoices never double-count.
          </p>
        </section>

        {/* security warning */}
        <section className="rounded-2xl border border-danger/20 bg-dangerSoft px-5 py-4">
          <div className="flex items-start gap-2.5 text-sm text-danger">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">Do not send sensitive personal
              data.</span>{" "}
              Send a <code className="font-mono">customerReference</code> (an
              opaque ID), not names, phone numbers, medical, legal, or financial
              details. AgentPayd stores proof of outcomes, not customer records.
            </p>
          </div>
        </section>

        {/* other paths */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PathCard
            icon={Upload}
            title="CSV import"
            desc="Bulk-import historical or batch outcomes from a spreadsheet. Rows become pending events."
            href="/import"
          />
          <PathCard
            icon={Webhook}
            title="LINE integration"
            desc="Map LINE messages, postbacks, and follow events into pending AgentPayd events."
            href="/integrations/line"
          />
        </section>

        {/* supported types */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h3 className="text-sm font-semibold text-ink">
            Supported event types
          </h3>
          <p className="mt-2 text-sm text-muted">
            Healthcare, SaaS, real estate, legal, ecommerce, recruiting,
            hospitality, logistics, plus cross-channel types like{" "}
            <code className="font-mono">appointment_requested</code>,{" "}
            <code className="font-mono">payment_collected</code>,{" "}
            <code className="font-mono">booking_recovered</code>, and{" "}
            <code className="font-mono">no_show_prevented</code>. Unknown types
            are rejected.
          </p>
        </section>
      </div>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#0c0f14] shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Code2 className="h-4 w-4 text-muted" />
        <span className="font-mono text-xs text-muted">{title}</span>
      </div>
      <pre className="overflow-x-auto px-5 py-4 text-xs leading-relaxed text-ink">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

function PathCard({
  icon: Icon,
  title,
  desc,
  href,
}: {
  icon: typeof Code2;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-colors hover:border-accent/40"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accentSoft text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-muted">{desc}</p>
    </a>
  );
}
