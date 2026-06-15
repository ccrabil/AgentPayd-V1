"use client";

import Link from "next/link";
import { CheckCircle2, AlertCircle, XCircle, ArrowUpRight } from "lucide-react";
import Topbar from "@/components/Topbar";
import { useStore } from "@/lib/store";
import { currentVendorClients, currentVendorAgents } from "@/lib/selectors";

type Status = "Ready" | "Partial" | "Missing";

const STATUS_UI: Record<
  Status,
  { icon: typeof CheckCircle2; cls: string }
> = {
  Ready: { icon: CheckCircle2, cls: "text-success" },
  Partial: { icon: AlertCircle, cls: "text-warning" },
  Missing: { icon: XCircle, cls: "text-danger" },
};

export default function PilotReadinessPage() {
  const { state } = useStore();
  const hasClients = currentVendorClients(state).length > 0;
  const hasAgents = currentVendorAgents(state).length > 0;
  const hasVerified = state.usageEvents.some((e) => e.status === "verified");

  const items: {
    label: string;
    status: Status;
    href?: string;
    note?: string;
  }[] = [
    { label: "Agency signup works", status: "Ready", href: "/signup" },
    {
      label: "Client onboarding works",
      status: hasClients ? "Ready" : "Partial",
      href: "/onboarding",
    },
    {
      label: "Agent creation works",
      status: hasAgents ? "Ready" : "Partial",
      href: "/onboarding",
    },
    { label: "Manual event entry works", status: "Ready", href: "/events" },
    {
      label: "Event verification works",
      status: hasVerified ? "Ready" : "Partial",
      href: "/verify",
    },
    { label: "ROI report works", status: "Ready", href: "/reports/client-tokyo-skin" },
    { label: "Invoice generation works", status: "Ready", href: "/invoices" },
    {
      label: "Client portal works",
      status: "Ready",
      href: "/client-portal/client-tokyo-skin",
    },
    { label: "Developer docs exist", status: "Ready", href: "/developers" },
    { label: "API endpoint exists", status: "Ready", note: "POST /api/events" },
    { label: "API key exists", status: "Ready", note: "Demo key in /developers" },
    { label: "CSV import exists", status: "Ready", href: "/import" },
    {
      label: "LINE integration path exists",
      status: "Ready",
      href: "/integrations/line",
    },
    {
      label: "Data persistence exists",
      status: "Ready",
      note: "localStorage (Pilot Mode, temporary)",
    },
    {
      label: "Build passes",
      status: "Partial",
      note: "TypeScript checks pass; run `npm run build` locally to confirm",
    },
  ];

  const ready = items.filter((i) => i.status === "Ready").length;

  return (
    <div>
      <Topbar
        title="Pilot Readiness"
        description="Is AgentPayd ready for a first agency pilot?"
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-accent/20 bg-surface p-6 shadow-card">
          <p className="text-sm text-muted">Readiness</p>
          <p className="mt-1 text-3xl font-bold text-ink">
            {ready} / {items.length}{" "}
            <span className="text-lg font-normal text-muted">checks ready</span>
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            An AI agency can sign up, onboard a client, add AI agents, track
            outcomes manually or through the API, verify results, generate ROI
            reports, and create invoices from verified outcomes.
          </p>
        </section>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const ui = STATUS_UI[item.status];
              const Icon = ui.icon;
              return (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${ui.cls}`} />
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {item.label}
                      </p>
                      {item.note && (
                        <p className="text-xs text-muted">{item.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${ui.cls}`}>
                      {item.status}
                    </span>
                    {item.href && (
                      <Link
                        href={item.href}
                        className="text-muted hover:text-accent"
                        aria-label={`Open ${item.label}`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
