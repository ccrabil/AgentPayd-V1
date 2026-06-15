"use client";

import { Check } from "lucide-react";
import Topbar from "@/components/Topbar";
import { useStore } from "@/lib/store";
import { formatJPY } from "@/lib/format";

export default function PricingPlansPage() {
  const { state } = useStore();

  // count clients on each plan
  const counts = new Map<string, number>();
  state.clients.forEach((c) =>
    counts.set(c.pricingPlanId, (counts.get(c.pricingPlanId) ?? 0) + 1)
  );

  return (
    <div>
      <Topbar
        title="Pricing Plans"
        description="How your AI vendor packages and prices agent usage"
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {state.pricingPlans.map((plan) => {
            const featured = plan.id === "plan-growth";
            return (
              <div
                key={plan.id}
                className={`relative overflow-hidden rounded-2xl border bg-surface p-6 shadow-card ${
                  featured ? "border-accent/40" : "border-border"
                }`}
              >
                {featured && (
                  <span className="absolute right-4 top-4 rounded-full bg-accentSoft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                    Popular
                  </span>
                )}
                <p className="text-sm font-medium text-muted">{plan.name}</p>
                <p className="mt-3 text-3xl font-bold text-ink">
                  {plan.custom
                    ? "Custom"
                    : `${formatJPY(plan.baseFeeJpy ?? 0)}`}
                  {!plan.custom && (
                    <span className="text-sm font-normal text-muted">
                      {" "}
                      / month
                    </span>
                  )}
                </p>

                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-ink"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 border-t border-border pt-4 text-xs text-muted">
                  {counts.get(plan.id) ?? 0} client
                  {(counts.get(plan.id) ?? 0) === 1 ? "" : "s"} on this plan
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-sm text-muted">
          Pricing models supported per agent: fixed monthly fee, per verified
          outcome, hybrid (fixed + usage), and pure usage-based. This lets AI
          vendors move from flat SaaS subscriptions to usage- and
          outcome-based pricing with confidence.
        </p>
      </div>
    </div>
  );
}
