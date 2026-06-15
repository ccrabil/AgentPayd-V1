// =====================================================================
// Automation Mode — verification scoring engine (pure & explainable)
// =====================================================================
// "Automatic where proof is strong, careful where money is involved,
// manual when risk appears." assessEvent() is a pure function: given an
// event's proof signals + context, it returns a fully explainable
// VerificationAssessment (score, decision, proof sources, risk flags, and
// a per-line breakdown of how the score was reached). No side effects.
// =====================================================================

import {
  CRITICAL_RISK_FLAGS,
  DuplicateCheckStatus,
  EventSource,
  ProofSource,
  RiskFlag,
  SourceTrustLevel,
  UsageEvent,
  UsageEventType,
  VerificationAssessment,
  VerificationDecision,
  VerificationMode,
} from "./types";

export interface AutomationSettings {
  verificationMode: VerificationMode;
  confidenceThreshold: number; // auto-verify at/above this (default 80)
  maxAutoBillableValue: number; // JPY; above this, never auto-verify billing
  requireProofForAutoInvoice: boolean;
  alertOnSuspicious: boolean;
  maxNormalValue: number; // JPY; above this = "unusually high value"
}

export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  verificationMode: "manual",
  confidenceThreshold: 80,
  maxAutoBillableValue: 50_000,
  requireProofForAutoInvoice: true,
  alertOnSuspicious: true,
  maxNormalValue: 100_000,
};

// Source → trust level.
const TRUSTED_SOURCES: EventSource[] = ["Booking System", "CRM", "Webhook", "API"];
const KNOWN_SOURCES: EventSource[] = ["LINE", "Website", "Email", "Manual"];

export function sourceTrust(source: EventSource): SourceTrustLevel {
  if (TRUSTED_SOURCES.includes(source)) return "trusted";
  if (KNOWN_SOURCES.includes(source)) return "known";
  return "unknown";
}

const CONFIRMATION_SOURCES: ProofSource[] = [
  "crm_confirmation",
  "booking_system_confirmation",
  "calendar_confirmation",
];

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export interface AssessContext {
  mode: VerificationMode;
  threshold: number;
  maxNormalValue: number;
  isDuplicate: boolean;
}

/**
 * Score and decide on a single event. Pure — returns an assessment, never
 * mutates. The caller (store / API / simulator) applies the decision.
 */
export function assessEvent(
  ev: Pick<
    UsageEvent,
    | "eventType"
    | "source"
    | "estimatedValue"
    | "proofSources"
    | "bookingId"
    | "customerReference"
    | "idempotencyKey"
    | "apiKeyValid"
    | "webhookSignatureVerified"
    | "sensitiveDataDetected"
    | "customerDisputed"
    | "paymentConfirmed"
    | "sourceTrustLevel"
  >,
  ctx: AssessContext
): VerificationAssessment {
  const breakdown: { label: string; points: number }[] = [];
  const add = (label: string, points: number) => {
    if (points !== 0) breakdown.push({ label, points });
  };

  // Normalize proof sources (always include the agent event itself).
  const proofs = new Set<ProofSource>(ev.proofSources ?? []);
  proofs.add("ai_agent_event");
  if (ev.webhookSignatureVerified) proofs.add("webhook_signature_verified");
  const has = (p: ProofSource) => proofs.has(p);

  const trust = ev.sourceTrustLevel ?? sourceTrust(ev.source);
  const riskFlags: RiskFlag[] = [];

  const dupStatus: DuplicateCheckStatus = ctx.isDuplicate
    ? "duplicate"
    : "unique";

  let score = 0;

  // ---- additions ----
  if (ev.apiKeyValid === true) {
    score += 10;
    add("Valid API key", 10);
  }
  if (has("webhook_signature_verified")) {
    score += 15;
    add("Webhook signature verified", 15);
  }
  if (trust !== "unknown") {
    score += 10;
    add("Known source", 10);
  }
  const hasBookingId = Boolean(ev.bookingId);
  if (hasBookingId) {
    score += 20;
    add("Booking ID exists", 20);
  }
  const hasConfirmation = CONFIRMATION_SOURCES.some((c) => has(c));
  if (hasConfirmation) {
    score += 30;
    add("CRM / booking / calendar confirmation", 30);
  }
  if (has("payment_provider_confirmation") || ev.paymentConfirmed) {
    score += 40;
    add("Payment provider confirmation", 40);
  }
  if (has("line_confirmation")) {
    score += 20;
    add("LINE / customer confirmation", 20);
  }
  if (!ctx.isDuplicate) {
    score += 10;
    add("No duplicate idempotency key", 10);
  }
  const valueNormal = ev.estimatedValue <= ctx.maxNormalValue;
  if (valueNormal) {
    score += 10;
    add("Value within normal range", 10);
  }

  // ---- subtractions / risk flags ----
  if (ctx.isDuplicate) {
    score -= 50;
    add("Duplicate event", -50);
    riskFlags.push("duplicate_event");
  }
  const hasExternalProof =
    hasConfirmation ||
    has("payment_provider_confirmation") ||
    has("line_confirmation") ||
    has("webhook_signature_verified") ||
    ev.paymentConfirmed === true;
  if (!hasExternalProof) {
    score -= 25;
    add("Missing external proof", -25);
  }
  if (!valueNormal) {
    score -= 30;
    add("Unusually high value", -30);
    riskFlags.push("unusually_high_value");
  }
  if (trust === "unknown") {
    score -= 20;
    add("Unknown source", -20);
    riskFlags.push("unknown_source");
  }
  if (!ev.customerReference) {
    score -= 10;
    add("Missing customer reference", -10);
    riskFlags.push("missing_customer_reference");
  }
  if (ev.sensitiveDataDetected) {
    score -= 20;
    add("Sensitive data detected", -20);
    riskFlags.push("sensitive_data_detected");
  }

  // ---- non-scoring risk flags ----
  if (ev.apiKeyValid === false) riskFlags.push("invalid_api_key");
  if (ev.customerDisputed) riskFlags.push("customer_disputed");
  const isBooking =
    ev.eventType === "appointment_booked" ||
    ev.eventType === "viewing_booked" ||
    ev.eventType === "consultation_booked" ||
    ev.eventType === "reservation_created";
  const bookingProof =
    hasBookingId || has("booking_system_confirmation") || has("calendar_confirmation");
  if (isBooking && !bookingProof) riskFlags.push("missing_booking_id");
  const isPayment = ev.eventType === "payment_collected";
  const paymentProof = has("payment_provider_confirmation") || ev.paymentConfirmed === true;
  if (isPayment && !paymentProof) riskFlags.push("payment_not_confirmed");

  score = clamp(score);

  if (score < 50) riskFlags.push("low_confidence");

  // ---- decision ----
  const hasCriticalFlag = riskFlags.some((f) => CRITICAL_RISK_FLAGS.includes(f));

  // Event-type gates that block auto-verification regardless of score.
  const bookingGateOk = !isBooking || bookingProof;
  const paymentGateOk = !isPayment || paymentProof;
  const gatesOk = bookingGateOk && paymentGateOk;

  let decision: VerificationDecision;
  let autoVerified = false;
  let reason: string;

  if (ctx.mode === "manual") {
    decision = "manual";
    reason = "Manual Mode — every event requires human verification.";
  } else if (ctx.mode === "assisted") {
    if (score >= ctx.threshold && !hasCriticalFlag && gatesOk) {
      decision = "needs_review";
      reason = `Recommended for approval (confidence ${score}). Assisted Mode never auto-verifies — one click to confirm.`;
    } else if (score >= 50) {
      decision = "needs_review";
      reason = `Needs review (confidence ${score}).`;
    } else {
      decision = "flagged";
      reason = `Flagged (confidence ${score}) — ${describeFlags(riskFlags)}.`;
    }
  } else {
    // autopilot
    if (score >= ctx.threshold && !hasCriticalFlag && gatesOk) {
      decision = "auto_verified";
      autoVerified = true;
      reason = `Auto-verified: confidence ${score} ≥ ${ctx.threshold}, proof present, no critical risk.`;
    } else if (score >= 50) {
      decision = "needs_review";
      reason =
        !gatesOk
          ? `Needs review: high score but missing required proof (${
              isBooking ? "booking confirmation" : "payment confirmation"
            }).`
          : hasCriticalFlag
          ? `Needs review: critical risk flag present (${describeFlags(riskFlags)}).`
          : `Needs review (confidence ${score}).`;
    } else {
      decision = "flagged";
      reason = `Flagged (confidence ${score}) — ${describeFlags(riskFlags)}.`;
    }
  }

  return {
    confidenceScore: score,
    decision,
    proofSources: Array.from(proofs),
    riskFlags,
    duplicateCheckStatus: dupStatus,
    sourceTrustLevel: trust,
    requiresHumanReview: !autoVerified,
    autoVerified,
    breakdown,
    reason,
  };
}

function describeFlags(flags: RiskFlag[]): string {
  const meaningful = flags.filter((f) => f !== "low_confidence");
  if (meaningful.length === 0) return "low confidence";
  return meaningful.join(", ");
}

/**
 * An auto-verified, billable event may create an invoice line item only if
 * confidence is high enough and no critical risk flag exists.
 */
export function canAutoInvoice(
  assessment: VerificationAssessment,
  billableAmount: number,
  settings: AutomationSettings
): boolean {
  if (!assessment.autoVerified) return false;
  if (billableAmount <= 0) return false;
  if (assessment.confidenceScore < settings.confidenceThreshold) return false;
  if (assessment.riskFlags.some((f) => CRITICAL_RISK_FLAGS.includes(f)))
    return false;
  if (
    settings.requireProofForAutoInvoice &&
    assessment.proofSources.length <= 1 // only ai_agent_event
  )
    return false;
  if (billableAmount > settings.maxAutoBillableValue) return false;
  return true;
}

// Is an event "suspicious" (worth alerting the agency)?
export function isSuspicious(assessment: VerificationAssessment): boolean {
  return (
    assessment.decision === "flagged" ||
    assessment.riskFlags.some((f) => CRITICAL_RISK_FLAGS.includes(f))
  );
}
