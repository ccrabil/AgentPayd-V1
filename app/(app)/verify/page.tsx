"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  X,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Bot,
  Sparkles,
} from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { TextInput, Field } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import { pendingEvents, getClient, getAgent } from "@/lib/selectors";
import { assessEvent, AssessContext } from "@/lib/automation";
import { formatJPY, formatDateTime } from "@/lib/format";
import {
  CRITICAL_RISK_FLAGS,
  DECISION_LABELS,
  PROOF_SOURCE_LABELS,
  ProofSource,
  RISK_FLAG_LABELS,
  RiskFlag,
  USAGE_EVENT_LABELS,
  UsageEvent,
  VERIFICATION_MODE_LABELS,
  VerificationAssessment,
} from "@/lib/types";

export default function VerifyPage() {
  const { state, dispatch } = useStore();
  const pending = pendingEvents(state);
  const a = state.automation;

  const ctx = (e: UsageEvent): AssessContext => ({
    mode: a.verificationMode,
    threshold: a.confidenceThreshold,
    maxNormalValue: a.maxNormalValue,
    isDuplicate: e.duplicateCheckStatus === "duplicate",
  });

  // Bucket pending events by decision under current settings.
  const buckets = useMemo(() => {
    const auto: UsageEvent[] = [];
    const review: UsageEvent[] = [];
    const flagged: UsageEvent[] = [];
    pending.forEach((e) => {
      const r = assessEvent(e, ctx(e));
      if (r.decision === "auto_verified") auto.push(e);
      else if (r.decision === "flagged") flagged.push(e);
      else review.push(e);
    });
    return { auto, review, flagged };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, a]);

  function approveRecommended() {
    let n = 0;
    pending.forEach((e) => {
      const r = assessEvent(e, ctx(e));
      const critical = r.riskFlags.some((f) => CRITICAL_RISK_FLAGS.includes(f));
      if (r.confidenceScore >= a.confidenceThreshold && !critical) {
        dispatch({
          type: "VERIFY_EVENT",
          id: e.id,
          billableAmount: e.billableAmount,
        });
        n++;
      }
    });
    dispatch({
      type: "TOAST",
      message: n ? `${n} recommended events verified` : "No recommended events",
    });
  }

  return (
    <div>
      <Topbar
        title="Verification Queue"
        description="Only verified outcomes count toward ROI. Only verified + billable outcomes count toward invoices."
        action={
          <Link
            href="/automation"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-ink hover:border-accent/40"
          >
            <Sparkles className="h-4 w-4" />
            {VERIFICATION_MODE_LABELS[a.verificationMode]} mode
          </Link>
        }
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {pending.length === 0 ? (
          <EmptyState
            icon={BadgeCheck}
            title="Nothing pending verification"
            description="All caught up. New events land here for review before they count toward ROI or invoices."
          />
        ) : (
          <>
            {a.verificationMode === "assisted" && buckets.auto.length === 0 && (
              <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accentSoft px-4 py-3">
                <p className="text-sm text-ink">
                  Assisted Mode recommends approvals but never auto-verifies.
                </p>
                <Button onClick={approveRecommended}>
                  <Check className="h-4 w-4" />
                  Approve all recommended
                </Button>
              </div>
            )}

            <QueueGroup
              title="Needs review"
              icon={Eye}
              tone="warning"
              events={buckets.review}
              ctxFor={ctx}
            />
            <QueueGroup
              title="Flagged"
              icon={AlertTriangle}
              tone="danger"
              events={buckets.flagged}
              ctxFor={ctx}
            />
            {a.verificationMode !== "autopilot" && (
              <QueueGroup
                title="Recommended for approval"
                icon={ShieldCheck}
                tone="success"
                events={buckets.auto}
                ctxFor={ctx}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function QueueGroup({
  title,
  icon: Icon,
  tone,
  events,
  ctxFor,
}: {
  title: string;
  icon: typeof Eye;
  tone: "success" | "warning" | "danger";
  events: UsageEvent[];
  ctxFor: (e: UsageEvent) => AssessContext;
}) {
  if (events.length === 0) return null;
  const toneCls = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${toneCls}`} />
        <h2 className="text-sm font-semibold text-ink">
          {title}{" "}
          <span className="text-muted">({events.length})</span>
        </h2>
      </div>
      <div className="space-y-4">
        {events.map((e) => (
          <VerifyCard key={e.id} eventId={e.id} ctxFor={ctxFor} />
        ))}
      </div>
    </section>
  );
}

function VerifyCard({
  eventId,
  ctxFor,
}: {
  eventId: string;
  ctxFor: (e: UsageEvent) => AssessContext;
}) {
  const { state, dispatch } = useStore();
  const event = state.usageEvents.find((e) => e.id === eventId)!;
  const client = getClient(state, event.clientId);
  const agent = getAgent(state, event.agentId);
  const assessment = assessEvent(event, ctxFor(event));

  const [open, setOpen] = useState(false);
  const [verifiedValue, setVerifiedValue] = useState(
    String(event.estimatedValue)
  );
  const [billable, setBillable] = useState(event.billableAmount > 0);
  const [billingRate, setBillingRate] = useState(
    String(event.billableAmount || 0)
  );
  const [proofNote, setProofNote] = useState(event.proofNote ?? "");

  function approve() {
    dispatch({
      type: "VERIFY_EVENT",
      id: event.id,
      verifiedValue: Number(verifiedValue) || 0,
      billableAmount: billable ? Number(billingRate) || 0 : 0,
      proofNote: proofNote || undefined,
    });
    dispatch({ type: "TOAST", message: "Outcome verified" });
  }
  function reject() {
    dispatch({ type: "REJECT_EVENT", id: event.id });
    dispatch({ type: "TOAST", message: "Outcome rejected" });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium text-ink">{event.description}</p>
          <p className="mt-0.5 text-xs text-muted">
            {client?.name} · {agent?.name} ·{" "}
            {USAGE_EVENT_LABELS[event.eventType]} · {event.source} ·{" "}
            {formatDateTime(event.timestamp)}
          </p>
        </div>
        <ConfidenceChip assessment={assessment} />
      </div>

      {/* Proof + risk row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {assessment.proofSources
          .filter((p) => p !== "ai_agent_event")
          .map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 rounded-md border border-success/20 bg-successSoft px-2 py-0.5 text-[11px] font-medium text-success"
            >
              <ShieldCheck className="h-3 w-3" />
              {PROOF_SOURCE_LABELS[p as ProofSource]}
            </span>
          ))}
        {assessment.riskFlags.map((f) => (
          <span
            key={f}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
              CRITICAL_RISK_FLAGS.includes(f)
                ? "border-danger/20 bg-dangerSoft text-danger"
                : "border-warning/20 bg-warningSoft text-warning"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            {RISK_FLAG_LABELS[f as RiskFlag]}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted">{assessment.reason}</p>

      {/* Explainable detail */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
        {open ? "Hide" : "Why this score?"}
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-4 rounded-xl border border-border bg-bg p-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Confidence calculation
            </p>
            <ul className="space-y-1">
              {assessment.breakdown.map((b, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted">{b.label}</span>
                  <span
                    className={
                      b.points >= 0 ? "text-success" : "text-danger"
                    }
                  >
                    {b.points >= 0 ? "+" : ""}
                    {b.points}
                  </span>
                </li>
              ))}
              <li className="mt-1 flex items-center justify-between border-t border-border pt-1 text-xs font-semibold">
                <span className="text-ink">Total</span>
                <span className="text-ink">{assessment.confidenceScore}</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2 text-xs">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Decision &amp; impact
            </p>
            <Row label="Decision" value={DECISION_LABELS[assessment.decision]} />
            <Row
              label="Source trust"
              value={assessment.sourceTrustLevel}
            />
            <Row
              label="Duplicate check"
              value={assessment.duplicateCheckStatus}
            />
            <Row
              label="ROI impact"
              value={
                assessment.decision === "flagged"
                  ? "None until verified"
                  : "Adds verified value"
              }
            />
            <Row
              label="Invoice impact"
              value={
                event.billableAmount > 0
                  ? `Eligible line item ${formatJPY(event.billableAmount)}`
                  : "Proof only (not billable)"
              }
            />
          </div>
        </div>
      )}

      {/* Manual controls */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Verified value (¥)">
          <TextInput
            type="number"
            value={verifiedValue}
            onChange={(e) => setVerifiedValue(e.target.value)}
          />
        </Field>
        <Field label="Billable?">
          <select
            value={billable ? "yes" : "no"}
            onChange={(e) => setBillable(e.target.value === "yes")}
            className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="yes">Yes — counts toward invoice</option>
            <option value="no">No — proof only</option>
          </select>
        </Field>
        <Field label="Billing rate (¥)">
          <TextInput
            type="number"
            value={billingRate}
            onChange={(e) => setBillingRate(e.target.value)}
            disabled={!billable}
          />
        </Field>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="danger" onClick={reject}>
          <X className="h-4 w-4" />
          Reject
        </Button>
        <Button onClick={approve}>
          <Check className="h-4 w-4" />
          Approve &amp; verify
        </Button>
      </div>
    </div>
  );
}

function ConfidenceChip({
  assessment,
}: {
  assessment: VerificationAssessment;
}) {
  const s = assessment.confidenceScore;
  const cls =
    s >= 80
      ? "border-success/20 bg-successSoft text-success"
      : s >= 50
      ? "border-warning/20 bg-warningSoft text-warning"
      : "border-danger/20 bg-dangerSoft text-danger";
  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 ${cls}`}
    >
      <Bot className="h-4 w-4" />
      <div className="leading-tight">
        <p className="text-sm font-bold">{s}</p>
        <p className="text-[10px] uppercase tracking-wider">confidence</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
