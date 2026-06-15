"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  CalendarCheck,
  Wallet,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { useStore } from "@/lib/store";
import { clientMetrics } from "@/lib/selectors";
import { formatJPY, formatRoi } from "@/lib/format";
import { UsageEvent, CostEvent } from "@/lib/types";

// The demo always runs against Tokyo Skin Clinic + its Voice Agent.
const DEMO_CLIENT = "client-tokyo-skin";
const DEMO_AGENT = "agent-voice";

export default function HealthcareDemoPage() {
  const { state, dispatch } = useStore();
  const [calls, setCalls] = useState(0);
  const metrics = clientMetrics(state, DEMO_CLIENT);

  function simulateCall() {
    const now = Date.now();
    const ts = new Date().toISOString();

    const callEvent: UsageEvent = {
      id: `evt-call-${now}`,
      vendorId: "vendor-cabot",
      clientId: DEMO_CLIENT,
      agentId: DEMO_AGENT,
      timestamp: ts,
      eventType: "call_answered",
      quantity: 1,
      description: "Inbound patient call answered by AI voice agent",
      estimatedValue: 1_200,
      billableAmount: 120,
      staffMinutesSaved: 4,
      source: "LINE",
      status: "verified",
      proofNote: "Simulated call (healthcare demo)",
    };

    const bookingEvent: UsageEvent = {
      id: `evt-book-${now}`,
      vendorId: "vendor-cabot",
      clientId: DEMO_CLIENT,
      agentId: DEMO_AGENT,
      timestamp: ts,
      eventType: "appointment_booked",
      quantity: 1,
      description: "Appointment booked during the call",
      estimatedValue: 2_400,
      billableAmount: 300,
      staffMinutesSaved: 4,
      source: "Booking System",
      status: "verified",
      proofNote: "Simulated booking (healthcare demo)",
    };

    const costEvent: CostEvent = {
      id: `cost-call-${now}`,
      vendorId: "vendor-cabot",
      clientId: DEMO_CLIENT,
      agentId: DEMO_AGENT,
      timestamp: ts,
      costType: "voice_processing",
      provider: "Demo Voice Stack",
      amountJpy: 42,
      metadata: { simulated: 1 },
    };

    dispatch({
      type: "SIMULATE_WORK",
      payload: { usageEvents: [callEvent, bookingEvent], costEvent },
    });
    setCalls((c) => c + 1);
    dispatch({
      type: "TOAST",
      message: "Patient call simulated — dashboard, invoices & ROI updated",
    });
  }

  return (
    <div>
      <Topbar
        title="Healthcare Demo"
        description="Cabot-style AI voice agent → bills Tokyo Skin Clinic on work completed and value delivered"
      />

      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Flow explainer */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink">How the loop works</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "AI voice agent answers a patient call",
              "AgentPayd tracks the event + AI cost",
              "Estimated value delivered is calculated",
              "Invoice & ROI receipt update instantly",
            ].map((s, i) => (
              <div
                key={s}
                className="rounded-xl border border-border bg-bg/40 p-4"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accentSoft text-xs font-semibold text-accent">
                  {i + 1}
                </div>
                <p className="mt-2 text-sm text-ink">{s}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-subtle">
            Privacy: no patient names, symptoms, diagnoses, phone numbers, or
            medical records are stored. Events are metered as anonymous work
            units.
          </p>
        </section>

        {/* Simulate button + live impact */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-accent/20 bg-surface p-6 text-center shadow-card">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accentSoft text-accent">
              <Phone className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm text-muted">
              Each click logs 1 call answered, 1 appointment booked, a cost
              event, +8 staff minutes saved and ~¥3,600 estimated value.
            </p>
            <Button onClick={simulateCall} className="mt-5 w-full">
              <Phone className="h-4 w-4" />
              Simulate patient call
            </Button>
            <p className="mt-3 text-xs text-subtle">
              {calls} call{calls === 1 ? "" : "s"} simulated this session
            </p>
          </div>

          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-medium text-ink">
              Tokyo Skin Clinic — live impact
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Mini
                icon={CalendarCheck}
                label="Verified events"
                value={String(metrics.verifiedEvents)}
              />
              <Mini
                icon={Clock}
                label="Staff mins saved"
                value={String(metrics.staffMinutesSaved)}
              />
              <Mini
                icon={Wallet}
                label="Revenue"
                value={formatJPY(metrics.revenue)}
              />
              <Mini
                icon={TrendingUp}
                label="ROI"
                value={formatRoi(metrics.roi)}
                accent
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/client-portal/${DEMO_CLIENT}`}>
                <Button variant="secondary">
                  View client portal <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/reports/${DEMO_CLIENT}`}>
                <Button variant="secondary">
                  View ROI report <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/invoices">
                <Button variant="secondary">
                  Generate invoice <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <Icon className={`h-4 w-4 ${accent ? "text-accent" : "text-muted"}`} />
      <p
        className={`mt-2 text-lg font-bold ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
