import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Receipt,
  TrendingUp,
  Wallet,
  RefreshCw,
  Activity,
  LucideIcon,
} from "lucide-react";
import { LogoMark, Wordmark } from "@/components/Logo";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        {/* Left: brand statement */}
        <section className="relative flex flex-1 flex-col justify-between overflow-hidden border-b border-border px-6 py-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
          <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

          <div className="relative">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-9 w-9" />
              <Wordmark className="text-base text-ink" />
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="h-px w-8 bg-accent/40" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">
                One for all
              </span>
            </div>

            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              Billing &amp; proof-of-value layer for AI agents
            </p>
            <h1 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Prove your AI is worth{" "}
              <span className="text-accent">paying for.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted">
              AgentPayd tracks AI-agent work, calculates delivery costs, proves
              client value, generates invoices, and helps both vendors and
              clients trust the numbers.
            </p>
            <p className="mt-4 max-w-md rounded-xl border border-accent/20 bg-accentSoft/40 p-3 text-sm text-ink">
              AgentPayd is the monetization and proof-of-value layer between
              AI-agent companies and the businesses that pay them.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
              >
                Start your pilot
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent/40 hover:text-accent"
              >
                Enter demo
              </Link>
            </div>
          </div>

          <div className="relative mt-12 max-w-md rounded-xl border border-border bg-surface/60 p-4 text-sm text-muted">
            AI vendors use AgentPayd to prove value and get paid. Businesses use
            AgentPayd to verify that AI vendors actually delivered results — one
            neutral platform both sides can trust.
          </div>
        </section>

        {/* Right: the core loop */}
        <section className="flex flex-1 flex-col justify-center px-6 py-10 lg:px-12 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            The core loop
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Activity in. Revenue, margin &amp; proof out.
          </h2>

          <div className="mt-8 space-y-3">
            <Loop
              icon={Activity}
              title="AI agent does the work"
              desc="Calls answered, appointments booked, triage completed."
            />
            <Loop
              icon={ShieldCheck}
              title="AgentPayd verifies the outcome"
              desc="Only verified outcomes count toward value and ROI."
            />
            <Loop
              icon={Wallet}
              title="Cost &amp; value are calculated"
              desc="LLM, voice and telephony cost vs. business value delivered."
            />
            <Loop
              icon={Receipt}
              title="Invoices are generated"
              desc="Verified billable outcomes become client invoices."
            />
            <Loop
              icon={RefreshCw}
              title="Renewal proof is created"
              desc="Client-ready ROI receipts justify the next renewal."
            />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <Who label="AI agencies" />
            <Who label="Voice-agent vendors" />
            <Who label="Automation builders" />
          </div>
        </section>
      </div>
    </main>
  );
}

function Loop({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accentSoft text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-muted">{desc}</p>
      </div>
    </div>
  );
}

function Who({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-border bg-bg px-2 py-3 text-center text-xs font-medium text-muted">
      <span className="inline-flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-accent" />
        {label}
      </span>
    </div>
  );
}
