"use client";

import Link from "next/link";
import {
  Radio,
  ShieldCheck,
  Calculator,
  Wallet,
  Lock,
  Code2,
  MessageCircle,
  Upload,
  Check,
  ArrowRight,
} from "lucide-react";
import Topbar from "@/components/Topbar";

const API_SNIPPET = `curl -X POST https://your-app.vercel.app/api/events \\
  -H "Authorization: Bearer ap_demo_pilot_key_2026" \\
  -H "Content-Type: application/json" \\
  -d '{
    "idempotencyKey": "booking_8821",
    "clientId": "client-tokyo-skin",
    "agentId": "agent-voice",
    "eventType": "appointment_booked",
    "estimatedValue": 30000,
    "billable": true,
    "source": "line",
    "customerReference": "customer_8821"
  }'`;

export default function HowItWorksPage() {
  return (
    <div>
      <Topbar
        title="How AgentPayd works"
        description="Track what your AI does → verify it → prove the value → get paid"
      />

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6">
        {/* The 4 engines */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            The four steps
          </h2>
          <div className="mt-3 space-y-3">
            <Step
              n={1}
              icon={Radio}
              title="Track what your AI did"
              body="Your AI agent sends a signal every time it does something useful — booked an appointment, recovered a booking, collected a payment. You can send these by API, LINE, CSV upload, or by typing them in."
              where={[
                { label: "Add manually", href: "/events" },
                { label: "Live stream", href: "/live-events" },
              ]}
            />
            <Step
              n={2}
              icon={ShieldCheck}
              title="Verify it (the trust engine)"
              body="AgentPayd checks each signal for proof — a booking-system confirmation, a payment-provider receipt, a LINE confirmation — and gives it a confidence score. Strong proof auto-verifies; weak proof goes to a review queue. Nothing gets billed until it's verified."
              where={[
                { label: "Verification queue", href: "/verify" },
                { label: "Automation settings", href: "/automation" },
              ]}
            />
            <Step
              n={3}
              icon={Calculator}
              title="Prove the value (where you enter your numbers)"
              body="This is where ROI comes from. You enter your client's business numbers once — average appointment value, show-up rate, no-show loss — and AgentPayd turns verified outcomes into a value figure and ROI. Every number shows its formula, so it's never a black box."
              where={[{ label: "Enter Value & ROI numbers", href: "/economics", primary: true }]}
            />
            <Step
              n={4}
              icon={Wallet}
              title="Get paid"
              body="One screen freezes the month, applies your pricing, and produces an invoice plus a plain-English value receipt for your client. Only verified, billable outcomes are charged."
              where={[
                { label: "Get Paid", href: "/get-paid", primary: true },
                { label: "Billing cycles", href: "/billing-cycles" },
              ]}
            />
          </div>
        </section>

        {/* Why trust */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentSoft text-accent">
              <Lock className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-ink">
              Why the numbers can be trusted
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            <Trust
              title="No black box"
              body="Every value and ROI figure shows the exact formula behind it. The invoice is a deterministic calculation — same inputs, same result, every time."
            />
            <Trust
              title="Verified before billed"
              body="An outcome is only charged if it has a proof source. Your client can see the proof log. A vendor can't invent value out of thin air."
            />
            <Trust
              title="Built on the client's own numbers"
              body="Value is calculated from the assumptions your client provides — not numbers the agency makes up. AgentPayd is the neutral layer between the two."
            />
          </div>
        </section>

        {/* Connect */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentSoft text-accent">
              <Code2 className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-ink">
              Connect your AI agent
            </h2>
          </div>
          <p className="mt-3 text-sm text-muted">
            Your agent is already connected to your client&apos;s systems. You just
            add one call when it does billable work — AgentPayd doesn&apos;t need to
            touch every client system.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface2">
            <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted">
              one API call
            </div>
            <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed text-ink">
              <code className="font-mono">{API_SNIPPET}</code>
            </pre>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Channel icon={Code2} label="API" href="/developers" />
            <Channel icon={MessageCircle} label="LINE" href="/integrations/line" />
            <Channel icon={Upload} label="CSV upload" href="/import" />
          </div>
        </section>

        {/* Next steps */}
        <section className="rounded-2xl border border-accent/20 bg-accentSoft p-6">
          <h2 className="text-base font-semibold text-ink">Set up in 3 steps</h2>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <CTA href="/onboarding" label="1. Add a customer & agent" />
            <CTA href="/economics" label="2. Enter Value & ROI numbers" />
            <CTA href="/get-paid" label="3. Get paid" primary />
          </div>
        </section>
      </div>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
  where,
}: {
  n: number;
  icon: typeof Radio;
  title: string;
  body: string;
  where: { label: string; href: string; primary?: boolean }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
            {n}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {where.map((w) => (
              <Link
                key={w.href}
                href={w.href}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  w.primary
                    ? "border-accent bg-accent text-white hover:opacity-90"
                    : "border-border bg-bg text-ink hover:border-accent/40"
                }`}
              >
                {w.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Trust({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
        <Check className="h-3 w-3" />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-sm text-muted">{body}</p>
      </div>
    </div>
  );
}

function Channel({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Code2;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent/40 hover:text-accent"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function CTA({
  href,
  label,
  primary,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
        primary
          ? "bg-accent text-white shadow-glow"
          : "border border-border bg-surface text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
