"use client";

import { useState } from "react";
import {
  Stethoscope,
  Headphones,
  Home,
  Scale,
  ShoppingBag,
  UserCheck,
  UtensilsCrossed,
  Truck,
  Play,
  TrendingUp,
  Wallet,
  Clock,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { useStore } from "@/lib/store";
import { formatJPY } from "@/lib/format";
import {
  CostEvent,
  Industry,
  UsageEvent,
  UsageEventType,
} from "@/lib/types";

// Each simulation maps an industry to a primary event (+ optional outcome
// event), a cost, an estimated value, time saved, and an invoice impact.
interface SimSpec {
  label: string;
  industry: Industry;
  icon: typeof Stethoscope;
  primary: { type: UsageEventType; description: string };
  outcome?: { type: UsageEventType; description: string };
  costJpy: number;
  costType: CostEvent["costType"];
  estimatedValue: number;
  minutesSaved: number;
  invoiceImpact: number;
}

const SIMS: SimSpec[] = [
  {
    label: "Healthcare Call",
    industry: "Healthcare",
    icon: Stethoscope,
    primary: { type: "call_answered", description: "Patient call answered by AI voice agent" },
    outcome: { type: "appointment_booked", description: "Appointment booked during the call" },
    costJpy: 42,
    costType: "voice_processing",
    estimatedValue: 3_600,
    minutesSaved: 8,
    invoiceImpact: 420,
  },
  {
    label: "SaaS Support Ticket",
    industry: "SaaS",
    icon: Headphones,
    primary: { type: "support_ticket_resolved", description: "Resolved a customer support ticket" },
    costJpy: 24,
    costType: "llm_cost",
    estimatedValue: 1_500,
    minutesSaved: 10,
    invoiceImpact: 300,
  },
  {
    label: "Real Estate Lead",
    industry: "Real Estate",
    icon: Home,
    primary: { type: "lead_qualified", description: "Qualified an inbound buyer lead" },
    outcome: { type: "viewing_booked", description: "Booked a property viewing" },
    costJpy: 52,
    costType: "llm_cost",
    estimatedValue: 15_000,
    minutesSaved: 18,
    invoiceImpact: 1_000,
  },
  {
    label: "Legal Intake",
    industry: "Legal",
    icon: Scale,
    primary: { type: "intake_completed", description: "Completed new-client intake" },
    outcome: { type: "consultation_booked", description: "Booked a paid consultation" },
    costJpy: 68,
    costType: "llm_cost",
    estimatedValue: 20_000,
    minutesSaved: 25,
    invoiceImpact: 2_000,
  },
  {
    label: "Ecommerce Support Ticket",
    industry: "Ecommerce",
    icon: ShoppingBag,
    primary: { type: "ticket_resolved", description: "Resolved an order-status ticket" },
    costJpy: 22,
    costType: "llm_cost",
    estimatedValue: 1_400,
    minutesSaved: 9,
    invoiceImpact: 120,
  },
  {
    label: "Recruiting Screening",
    industry: "Recruiting",
    icon: UserCheck,
    primary: { type: "candidate_screened", description: "Screened a candidate against the role" },
    outcome: { type: "interview_booked", description: "Booked a first-round interview" },
    costJpy: 44,
    costType: "llm_cost",
    estimatedValue: 18_000,
    minutesSaved: 22,
    invoiceImpact: 800,
  },
  {
    label: "Restaurant Reservation",
    industry: "Hospitality",
    icon: UtensilsCrossed,
    primary: { type: "reservation_created", description: "Created a dinner reservation" },
    costJpy: 12,
    costType: "telephony",
    estimatedValue: 4_000,
    minutesSaved: 5,
    invoiceImpact: 150,
  },
  {
    label: "Logistics Dispatch",
    industry: "Logistics",
    icon: Truck,
    primary: { type: "dispatch_created", description: "Created a same-day delivery dispatch" },
    costJpy: 30,
    costType: "cloud_compute",
    estimatedValue: 5_500,
    minutesSaved: 14,
    invoiceImpact: 180,
  },
];

export default function DemoSimulatorPage() {
  const { state, dispatch } = useStore();
  const [log, setLog] = useState<string[]>([]);

  function findTarget(industry: Industry) {
    const vendor = state.vendors.find((v) => v.industryFocus === industry);
    if (!vendor) return null;
    const client = state.clients.find((c) => c.vendorId === vendor.id);
    if (!client) return null;
    const agent = state.agents.find((a) => a.clientId === client.id);
    if (!agent) return null;
    return { vendor, client, agent };
  }

  function run(spec: SimSpec) {
    const target = findTarget(spec.industry);
    if (!target) {
      dispatch({
        type: "TOAST",
        message: `No ${spec.industry} vendor configured`,
      });
      return;
    }
    const { vendor, client, agent } = target;
    const now = Date.now();
    const ts = new Date().toISOString();

    const events: UsageEvent[] = [];
    events.push({
      id: `evt-sim-${now}-a`,
      vendorId: vendor.id,
      clientId: client.id,
      agentId: agent.id,
      timestamp: ts,
      eventType: spec.primary.type,
      quantity: 1,
      description: spec.primary.description,
      estimatedValue: spec.outcome
        ? Math.round(spec.estimatedValue * 0.3)
        : spec.estimatedValue,
      billableAmount: spec.outcome
        ? Math.round(spec.invoiceImpact * 0.2)
        : spec.invoiceImpact,
      staffMinutesSaved: spec.outcome
        ? Math.round(spec.minutesSaved / 2)
        : spec.minutesSaved,
      source: "API",
      status: "verified",
      proofNote: "Demo Simulator",
    });
    if (spec.outcome) {
      events.push({
        id: `evt-sim-${now}-b`,
        vendorId: vendor.id,
        clientId: client.id,
        agentId: agent.id,
        timestamp: ts,
        eventType: spec.outcome.type,
        quantity: 1,
        description: spec.outcome.description,
        estimatedValue: Math.round(spec.estimatedValue * 0.7),
        billableAmount: Math.round(spec.invoiceImpact * 0.8),
        staffMinutesSaved: Math.round(spec.minutesSaved / 2),
        source: "API",
        status: "verified",
        proofNote: "Demo Simulator (outcome)",
      });
    }

    const costEvent: CostEvent = {
      id: `cost-sim-${now}`,
      vendorId: vendor.id,
      clientId: client.id,
      agentId: agent.id,
      timestamp: ts,
      costType: spec.costType,
      provider: "Demo Stack",
      amountJpy: spec.costJpy,
      metadata: { simulated: 1 },
    };

    dispatch({ type: "SIMULATE_WORK", payload: { usageEvents: events, costEvent } });
    dispatch({
      type: "TOAST",
      message: `${spec.label}: +${formatJPY(spec.estimatedValue)} value, +${formatJPY(spec.invoiceImpact)} invoice`,
    });
    setLog((l) => [
      `${spec.label} → ${client.name}: +${formatJPY(spec.estimatedValue)} value · ${formatJPY(spec.costJpy)} cost · +${spec.minutesSaved}min saved · +${formatJPY(spec.invoiceImpact)} invoice`,
      ...l,
    ]);
  }

  return (
    <div>
      <Topbar
        title="Demo Simulator"
        description="See the loop work across every industry — each click tracks work, cost, value, and invoice impact"
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-accent/20 bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink">
            How does AgentPayd work?
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Click any button to simulate an AI agent doing real work. AgentPayd
            tracks the event, records the AI delivery cost, calculates the
            business value, updates the vendor dashboard and client portal, and
            adds it to the invoice — instantly. Each button targets the matching
            industry vendor.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SIMS.map((spec) => {
            const Icon = spec.icon;
            return (
              <div
                key={spec.label}
                className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accentSoft text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">
                  {spec.label}
                </p>
                <p className="text-xs text-muted">{spec.industry}</p>
                <dl className="mt-3 space-y-1 text-xs text-muted">
                  <div className="flex items-center justify-between">
                    <dt>Value</dt>
                    <dd className="text-ink">{formatJPY(spec.estimatedValue)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>AI cost</dt>
                    <dd>{formatJPY(spec.costJpy)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Invoice impact</dt>
                    <dd className="text-accent">+{formatJPY(spec.invoiceImpact)}</dd>
                  </div>
                </dl>
                <Button onClick={() => run(spec)} className="mt-4 w-full">
                  <Play className="h-4 w-4" />
                  Simulate
                </Button>
              </div>
            );
          })}
        </div>

        {log.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink">
              Simulation log
            </h2>
            <div className="space-y-2">
              {log.map((line, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-muted"
                >
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {line}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
