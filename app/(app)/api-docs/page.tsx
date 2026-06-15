"use client";

import Topbar from "@/components/Topbar";
import { Code2, Lock, Webhook, Upload, KeyRound } from "lucide-react";

const ENDPOINTS = [
  { method: "POST", path: "/api/events", desc: "Track work completed by an AI agent." },
  { method: "POST", path: "/api/costs", desc: "Track the delivery cost of that AI work." },
  { method: "POST", path: "/api/outcomes", desc: "Track business outcomes created by the agent." },
  { method: "POST", path: "/api/invoices/generate", desc: "Generate an invoice from usage, pricing & outcomes." },
  { method: "GET", path: "/api/vendors/:vendorId/dashboard", desc: "Return the AI Vendor dashboard." },
  { method: "GET", path: "/api/clients/:clientId/value-receipt", desc: "Return the Business Client value report." },
  { method: "GET", path: "/api/clients/:clientId/invoice", desc: "Return the client-facing invoice." },
  { method: "POST", path: "/api/client-invitations", desc: "Business Client requires/invites a vendor to connect." },
  { method: "POST", path: "/api/vendor-invitations", desc: "AI Vendor invites a client to view value reports." },
];

const METHOD_TONE: Record<string, string> = {
  POST: "bg-accentSoft text-accent border-accent/20",
  GET: "bg-successSoft text-success border-success/20",
};

const EVENT_SAMPLE = `// POST /api/events — track work completed
await fetch("https://api.agentpayd.com/api/events", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer \${AGENTPAYD_API_KEY}",
  },
  body: JSON.stringify({
    vendorId: "vendor_cabot_demo",
    clientId: "client_tokyo_skin_clinic",
    agentId: "agent_healthcare_voice",
    eventType: "appointment_booked",
    quantity: 1,
    currency: "JPY",
    estimatedValue: 2400,
    metadata: {
      industry: "healthcare",
      humanTimeSavedMinutes: 8,
      source: "voice_agent",
      language: "ja-JP",
    },
  }),
});`;

const COST_SAMPLE = `// POST /api/costs — track AI delivery cost
{
  "vendorId": "vendor_cabot_demo",
  "clientId": "client_tokyo_skin_clinic",
  "agentId": "agent_healthcare_voice",
  "costType": "voice_processing",
  "amount": 42,
  "currency": "JPY",
  "provider": "openai",
  "metadata": { "voiceMinutes": 5.2, "tokens": 1840 }
}`;

const OUTCOME_SAMPLE = `// POST /api/outcomes — track a business outcome
{
  "vendorId": "vendor_cabot_demo",
  "clientId": "client_tokyo_skin_clinic",
  "agentId": "agent_healthcare_voice",
  "outcomeType": "appointment_booked",
  "estimatedValue": 2400,
  "currency": "JPY",
  "metadata": { "department": "dermatology", "humanTimeSavedMinutes": 8 }
}`;

export default function ApiDocsPage() {
  return (
    <div>
      <Topbar
        title="API & Integration"
        description="How your AI agent connects: send work, cost, and outcome events to AgentPayd"
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-warning/20 bg-warningSoft px-4 py-3 text-sm text-warning">
          <span className="inline-flex items-center gap-2 font-medium">
            <Lock className="h-4 w-4" />
            Pilot Mode: endpoints are documented for integration planning. The
            live demo uses in-app simulated data, not a live API.
          </span>
        </div>

        {/* Connection flow */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink">How it connects</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Your AI agent already connects to the client&apos;s systems (CRM,
            booking, calendar, support desk, ecommerce, phone). AgentPayd sits
            behind your agent — you send it work, cost, and outcome events, and
            it calculates invoice, value, margin, and ROI. AgentPayd does not
            need to connect to every client system directly.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            {[
              "Client systems",
              "AI Vendor's agent",
              "AgentPayd API",
              "Invoice · Value · Margin · ROI",
              "Vendor dashboard + Client portal",
            ].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className="rounded-md border border-border bg-bg px-2 py-1 text-ink">
                  {s}
                </span>
                {i < arr.length - 1 && <span className="text-accent">→</span>}
              </span>
            ))}
          </div>
        </section>

        {/* Integration methods */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Method icon={Code2} title="API" desc="Send events directly from your agent backend." live />
          <Method icon={Webhook} title="Webhooks" desc="Push completed actions into AgentPayd." live />
          <Method icon={KeyRound} title="Manual entry" desc="Add events by hand for demos & first pilots." live />
          <Method icon={Upload} title="CSV import" desc="Bulk-import events (placeholder)." />
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">Endpoints</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <ul className="divide-y divide-border">
              {ENDPOINTS.map((e) => (
                <li
                  key={e.path}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <span
                    className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 font-mono text-xs font-semibold ${METHOD_TONE[e.method]}`}
                  >
                    {e.method}
                  </span>
                  <code className="font-mono text-sm text-ink">{e.path}</code>
                  <span className="text-sm text-muted sm:ml-auto sm:text-right">
                    {e.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Examples */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <CodeBlock title="send-event.js" code={EVENT_SAMPLE} />
          <CodeBlock title="cost.json" code={COST_SAMPLE} />
          <CodeBlock title="outcome.json" code={OUTCOME_SAMPLE} />
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Later integrations</h2>
          <p className="mt-2 text-sm text-muted">
            SDKs, Zapier, Make, CRM / booking / support-ticket integrations, and
            Stripe / payment-provider connections are on the roadmap. None are
            required to start — API, webhooks, manual entry, or CSV are enough.
          </p>
        </section>
      </div>
    </div>
  );
}

function Method({
  icon: Icon,
  title,
  desc,
  live,
}: {
  icon: typeof Code2;
  title: string;
  desc: string;
  live?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accentSoft text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            live
              ? "border-success/20 bg-successSoft text-success"
              : "border-white/10 bg-white/5 text-muted"
          }`}
        >
          {live ? "Available" : "Planned"}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-muted">{desc}</p>
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
