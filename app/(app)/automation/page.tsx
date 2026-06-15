"use client";

import { useMemo } from "react";
import {
  Bot,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Play,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import { currentVendorClients, currentVendorAgents } from "@/lib/selectors";
import { assessEvent } from "@/lib/automation";
import {
  AuditEntry,
  CostEvent,
  UsageEvent,
  USAGE_EVENT_LABELS,
  VERIFICATION_MODE_LABELS,
  VerificationMode,
} from "@/lib/types";

const MODES: VerificationMode[] = ["manual", "assisted", "autopilot"];

const MODE_DESC: Record<VerificationMode, string> = {
  manual: "Every event is reviewed by a human. Safest — best for first clients.",
  assisted:
    "AgentPayd scores every event and recommends approvals. Humans confirm, and can bulk-approve.",
  autopilot:
    "High-confidence events auto-verify. Only risky events reach a human.",
};

export default function AutomationPage() {
  const { state, dispatch } = useStore();
  const a = state.automation;

  // Live preview: how the current pending events would be classified now.
  const summary = useMemo(() => {
    const pending = state.usageEvents.filter(
      (e) => e.status === "pending" && e.vendorId === state.currentVendorId
    );
    let auto = 0;
    let review = 0;
    let flagged = 0;
    pending.forEach((e) => {
      const r = assessEvent(e, {
        mode: a.verificationMode,
        threshold: a.confidenceThreshold,
        maxNormalValue: a.maxNormalValue,
        isDuplicate: e.duplicateCheckStatus === "duplicate",
      });
      if (r.decision === "auto_verified") auto++;
      else if (r.decision === "flagged") flagged++;
      else review++;
    });
    return { auto, review, flagged, total: pending.length };
  }, [state.usageEvents, state.currentVendorId, a]);

  function set<K extends keyof typeof a>(key: K, value: (typeof a)[K]) {
    dispatch({ type: "SET_AUTOMATION_SETTINGS", settings: { [key]: value } });
  }

  function runAutopilot() {
    dispatch({ type: "RUN_AUTOPILOT" });
    dispatch({
      type: "TOAST",
      message: "Autopilot ran — high-confidence events auto-verified",
    });
  }

  // ---- Receptionist demo (strong + weak appointment_booked) ----
  function runDemo(strong: boolean) {
    const client = currentVendorClients(state)[0];
    const agent = currentVendorAgents(state).find(
      (ag) => ag.clientId === client?.id
    );
    if (!client || !agent) {
      dispatch({ type: "TOAST", message: "Add a client and agent first" });
      return;
    }
    const id = `evt-demo-${Date.now()}`;
    const base: UsageEvent = {
      id,
      vendorId: state.currentVendorId,
      clientId: client.id,
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      eventType: "appointment_booked",
      quantity: 1,
      description: strong
        ? "AI receptionist booked an appointment (booking system + LINE confirmed)"
        : "AI receptionist reported an appointment (no booking ID / no proof)",
      estimatedValue: 30000,
      billableAmount: 3000,
      staffMinutesSaved: 15,
      source: strong ? "LINE" : "Manual",
      status: "pending",
      verificationMode: "autopilot",
      idempotencyKey: id,
      apiKeyValid: strong ? true : undefined,
      bookingId: strong ? `BK-${Date.now()}` : undefined,
      customerReference: strong ? `cust_${Date.now()}` : undefined,
      proofSources: strong
        ? ["booking_system_confirmation", "line_confirmation"]
        : [],
    };

    const assessment = assessEvent(base, {
      mode: "autopilot",
      threshold: a.confidenceThreshold,
      maxNormalValue: a.maxNormalValue,
      isDuplicate: false,
    });

    const event: UsageEvent = {
      ...base,
      confidenceScore: assessment.confidenceScore,
      proofSources: assessment.proofSources,
      riskFlags: assessment.riskFlags,
      autoVerified: assessment.autoVerified,
      requiresHumanReview: assessment.requiresHumanReview,
      duplicateCheckStatus: assessment.duplicateCheckStatus,
      sourceTrustLevel: assessment.sourceTrustLevel,
      status: assessment.autoVerified ? "verified" : "pending",
    };

    const costEvent: CostEvent = {
      id: `cost-demo-${Date.now()}`,
      vendorId: state.currentVendorId,
      clientId: client.id,
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      costType: "llm_cost",
      provider: "OpenAI",
      amountJpy: 40,
    };

    const auditEntries: AuditEntry[] = assessment.autoVerified
      ? [
          {
            id: `audit-${id}`,
            timestamp: new Date().toISOString(),
            eventId: id,
            eventLabel: USAGE_EVENT_LABELS.appointment_booked,
            clientId: client.id,
            action: "auto_verified",
            by: "system",
            confidenceScore: assessment.confidenceScore,
            proofSources: assessment.proofSources,
            riskFlags: assessment.riskFlags,
            invoiceImpact: true,
            roiImpact: true,
            reason: assessment.reason,
          },
        ]
      : [
          {
            id: `audit-${id}`,
            timestamp: new Date().toISOString(),
            eventId: id,
            eventLabel: USAGE_EVENT_LABELS.appointment_booked,
            clientId: client.id,
            action: assessment.decision,
            by: "system",
            confidenceScore: assessment.confidenceScore,
            proofSources: assessment.proofSources,
            riskFlags: assessment.riskFlags,
            invoiceImpact: false,
            roiImpact: false,
            reason: assessment.reason,
          },
        ];

    dispatch({
      type: "SET_AUTOMATION_SETTINGS",
      settings: { verificationMode: "autopilot" },
    });
    dispatch({ type: "ADD_AUTOMATED_EVENTS", events: [event], costEvent, auditEntries });
    dispatch({
      type: "TOAST",
      message: strong
        ? `Strong event auto-verified at confidence ${assessment.confidenceScore}`
        : `Weak event sent to review (confidence ${assessment.confidenceScore})`,
    });
  }

  return (
    <div>
      <Topbar
        title="Automation"
        description="Automatic where proof is strong, careful where money is involved"
        action={
          <Button onClick={runAutopilot}>
            <Play className="h-4 w-4" />
            Run Autopilot now
          </Button>
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Mode selector */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Verification mode</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MODES.map((m) => {
              const active = a.verificationMode === m;
              return (
                <button
                  key={m}
                  onClick={() => set("verificationMode", m)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-accent bg-accentSoft"
                      : "border-border bg-bg hover:border-accent/40"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      active ? "text-accent" : "text-ink"
                    }`}
                  >
                    {VERIFICATION_MODE_LABELS[m]}
                  </p>
                  <p className="mt-1 text-xs text-muted">{MODE_DESC[m]}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live preview */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Pending" value={summary.total} icon={Eye} tone="muted" />
          <SummaryCard
            label="Would auto-verify"
            value={summary.auto}
            icon={ShieldCheck}
            tone="success"
          />
          <SummaryCard
            label="Needs review"
            value={summary.review}
            icon={Eye}
            tone="warning"
          />
          <SummaryCard
            label="Flagged"
            value={summary.flagged}
            icon={AlertTriangle}
            tone="danger"
          />
        </section>
        <p className="-mt-2 text-xs text-muted">
          Preview under current settings ({VERIFICATION_MODE_LABELS[a.verificationMode]},
          threshold {a.confidenceThreshold}). Use{" "}
          <span className="font-medium text-ink">Run Autopilot now</span> to apply,
          then open the{" "}
          <Link href="/verify" className="text-accent hover:underline">
            verification queue
          </Link>
          .
        </p>

        {/* Thresholds */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <Field
              label={`Confidence threshold for auto-verification: ${a.confidenceThreshold}`}
            >
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={a.confidenceThreshold}
                onChange={(e) =>
                  set("confidenceThreshold", Number(e.target.value))
                }
                className="w-full accent-accent"
              />
            </Field>
            <p className="mt-1 text-xs text-muted">
              Events at or above this score auto-verify in Autopilot Mode.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <Field label="Maximum auto-billable value per event (JPY)">
              <input
                type="number"
                value={a.maxAutoBillableValue}
                onChange={(e) =>
                  set("maxAutoBillableValue", Number(e.target.value))
                }
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </Field>
            <p className="mt-1 text-xs text-muted">
              Above this amount, an event never auto-invoices — a human confirms.
            </p>
          </div>
        </section>

        {/* Toggles */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Require proof for auto-invoice"
            desc="Auto-verified events need an external proof source before billing."
            on={a.requireProofForAutoInvoice}
            onClick={() =>
              set("requireProofForAutoInvoice", !a.requireProofForAutoInvoice)
            }
          />
          <ToggleRow
            label="Alert on suspicious events"
            desc="Flag duplicates, disputes, and unusual values for a human."
            on={a.alertOnSuspicious}
            onClick={() => set("alertOnSuspicious", !a.alertOnSuspicious)}
          />
        </section>

        {/* Demo */}
        <section className="rounded-2xl border border-accent/20 bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentSoft text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-ink">
              AI receptionist demo
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Send an <span className="font-mono text-xs">appointment_booked</span>{" "}
            event two ways. The strong one (booking ID + LINE confirmation)
            auto-verifies and updates ROI + invoice; the weak one (no proof) goes
            to review with no ROI or invoice impact.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => runDemo(true)}>
              <Bot className="h-4 w-4" />
              Strong booking (auto-verifies)
            </Button>
            <Button variant="secondary" onClick={() => runDemo(false)}>
              <Bot className="h-4 w-4" />
              Weak booking (flagged)
            </Button>
            <Link
              href="/audit-log"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-ink hover:border-accent/40"
            >
              See audit log
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Eye;
  tone: "muted" | "success" | "warning" | "danger";
}) {
  const toneCls = {
    muted: "text-muted",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <Icon className={`h-4 w-4 ${toneCls}`} />
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  on,
  onClick,
}: {
  label: string;
  desc: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <button
        onClick={onClick}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? "bg-accent" : "bg-border"
        }`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            on ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
