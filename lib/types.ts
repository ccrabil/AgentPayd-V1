// =====================================================================
// AgentPayd — core data model (two-sided, cross-industry)
// =====================================================================
// Mission: AgentPayd is the monetization and proof-of-value layer between
// AI-agent companies and the businesses that pay them.
//
// Two sides:
//   • AI Vendor      — owns agents, serves many business clients.
//   • Business Client — pays a vendor, wants proof of value. May *require*
//                       its vendors to report through AgentPayd.
//
// This mirrors a future SQL schema (snake_case tables -> camelCase here):
// vendors, business_clients, agents, usage_events, cost_events, outcomes,
// pricing_plans, invoices, vendor_invitations, client_invitations. The
// in-memory store (lib/store.tsx) + selectors (lib/selectors.ts) are the
// only data touchpoints, so swapping in a real backend won't change the UI.
// =====================================================================

// ---------------------------------------------------------------------
// Roles & access
// ---------------------------------------------------------------------

export type Role =
  | "agentpayd_admin" // internal platform owner — sees everything
  | "ai_vendor" // sees their clients, agents, costs, margins, invoices
  | "business_client" // sees only their own work, value, invoice, ROI
  | "viewer"; // limited read-only (finance / client success)

export const ROLE_LABELS: Record<Role, string> = {
  agentpayd_admin: "AgentPayd Admin",
  ai_vendor: "AI Vendor",
  business_client: "Business Client",
  viewer: "Viewer / Finance",
};

export type AccountType = "vendor" | "client" | "hybrid";

// ---------------------------------------------------------------------
// Industries
// ---------------------------------------------------------------------

export type Industry =
  | "Healthcare"
  | "SaaS"
  | "Real Estate"
  | "Legal"
  | "Ecommerce"
  | "Recruiting"
  | "Hospitality"
  | "Logistics";

export const INDUSTRIES: Industry[] = [
  "Healthcare",
  "SaaS",
  "Real Estate",
  "Legal",
  "Ecommerce",
  "Recruiting",
  "Hospitality",
  "Logistics",
];

// ---------------------------------------------------------------------
// Vendors (the AI-agent companies)
// ---------------------------------------------------------------------

export interface Vendor {
  id: string;
  name: string;
  industryFocus: Industry;
  accountType: AccountType;
  tagline: string;
  invoiceRegNo: string; // Japanese qualified-invoice reg. no. (placeholder)
}

// ---------------------------------------------------------------------
// Business clients (the companies that pay vendors)
// ---------------------------------------------------------------------

export type ClientStatus = "active" | "pending";

export type RenewalStatus = "strong" | "needs_attention" | "at_risk";

export const RENEWAL_LABELS: Record<RenewalStatus, string> = {
  strong: "Strong",
  needs_attention: "Needs attention",
  at_risk: "At risk",
};

/**
 * Client visibility controls what a Business Client can see in its portal.
 * Default: work completed, value delivered, invoice amount and ROI — but
 * NOT the vendor's internal margin or cost structure.
 */
export interface ClientVisibility {
  showWorkDetail: boolean;
  showAiCost: boolean;
  showVendorMargin: boolean;
}

export const DEFAULT_VISIBILITY: ClientVisibility = {
  showWorkDetail: true,
  showAiCost: false,
  showVendorMargin: false,
};

// ---------------------------------------------------------------------
// Value calculation — business assumptions provided by the CLIENT.
// These turn verified event counts into explainable JPY value.
// Rates are 0..1 (e.g. showUpRate 0.85 = 85%).
// ---------------------------------------------------------------------
export interface ClientAssumptions {
  averageAppointmentValue: number;
  averageOrderValue: number;
  averageCustomerLifetimeValue: number;
  showUpRate: number;
  conversionRate: number;
  noShowRate: number;
  averageNoShowLoss: number;
  averageLeadValue: number;
  humanHourlyCost: number;
  baselineMonthlyBookings: number;
  baselineMissedInquiries: number;
  baselineRevenue: number;
}

export const DEFAULT_CLIENT_ASSUMPTIONS: ClientAssumptions = {
  averageAppointmentValue: 30000,
  averageOrderValue: 12000,
  averageCustomerLifetimeValue: 80000,
  showUpRate: 0.85,
  conversionRate: 0.25,
  noShowRate: 0.15,
  averageNoShowLoss: 30000,
  averageLeadValue: 8000,
  humanHourlyCost: 2500,
  baselineMonthlyBookings: 200,
  baselineMissedInquiries: 80,
  baselineRevenue: 6000000,
};

export interface Client {
  id: string;
  vendorId: string;
  name: string;
  industry: Industry;
  logoInitial: string;
  contactName: string;
  contactEmail: string;
  status: ClientStatus;
  pricingPlanId: string;
  visibility: ClientVisibility;
  assumptions?: ClientAssumptions;
}

// ---------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------

export type PricingModel =
  | "fixed"
  | "per_agent"
  | "per_workflow"
  | "per_action"
  | "per_outcome"
  | "usage"
  | "hybrid"
  | "credits";

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  fixed: "Fixed subscription",
  per_agent: "Per agent",
  per_workflow: "Per workflow",
  per_action: "Per action",
  per_outcome: "Per outcome",
  usage: "Usage-based",
  hybrid: "Hybrid (fixed + usage)",
  credits: "Credits (placeholder)",
};

// Functional category of an agent (what job it does), independent of the
// client's industry. Optional so cross-industry agents aren't forced into it.
export type AgentRole =
  | "receptionist"
  | "sales"
  | "support"
  | "recruiter"
  | "finance"
  | "marketing";

export const AGENT_ROLES: AgentRole[] = [
  "receptionist",
  "sales",
  "support",
  "recruiter",
  "finance",
  "marketing",
];

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  receptionist: "Receptionist",
  sales: "Sales",
  support: "Support",
  recruiter: "Recruiter",
  finance: "Finance",
  marketing: "Marketing",
};

export interface Agent {
  id: string;
  vendorId: string;
  name: string;
  clientId: string;
  industry: Industry;
  role?: AgentRole;
  description: string;
  pricingModel: PricingModel;
  cost: number; // legacy monthly reference fee (JPY)
  // Optional per-agent pricing (Paid.ai-style); used as available.
  monthlyCost?: number;
  clientMonthlyFee?: number; // what the client pays the agency / month
  aiModelCost?: number; // monthly AI/model cost
  toolCost?: number; // voice / LINE / tool / integration cost
  humanSupportCost?: number; // agency human support cost
  maintenanceCost?: number; // ongoing technical/maintenance cost
  fixedFee?: number;
  baseFee?: number;
  billingRatePerOutcome?: number;
  billingRatePerAction?: number;
  workflowRate?: number;
  creditRate?: number;
  marginTargetPct?: number;
  billableOutcomeTypes: string[];
  billingNotes?: string;
  currency: "JPY";
  status: "active" | "paused";
}

// ---------------------------------------------------------------------
// Universal event types (cross-industry)
// ---------------------------------------------------------------------

export type UsageEventType =
  // Healthcare
  | "call_answered"
  | "appointment_booked"
  | "appointment_rescheduled"
  | "triage_completed"
  | "reminder_sent"
  | "staff_handoff"
  | "post_op_checkin_completed"
  | "record_updated"
  // SaaS
  | "demo_booked"
  | "support_ticket_resolved"
  | "onboarding_completed"
  | "churn_risk_detected"
  // Real estate
  | "lead_qualified"
  | "viewing_booked"
  | "property_match_sent"
  | "follow_up_completed"
  // Legal
  | "intake_completed"
  | "consultation_booked"
  | "document_collected"
  | "case_screened"
  // Ecommerce
  | "ticket_resolved"
  | "refund_request_processed"
  | "product_recommendation_sent"
  | "abandoned_cart_recovered"
  // Recruiting
  | "candidate_screened"
  | "interview_booked"
  | "cv_processed"
  | "shortlist_created"
  // Restaurants / hospitality
  | "reservation_created"
  | "customer_call_answered"
  | "catering_request_qualified"
  | "review_request_sent"
  // Logistics
  | "dispatch_created"
  | "delivery_issue_resolved"
  | "route_updated"
  | "proof_of_delivery_processed"
  // Cross-channel / LINE
  | "appointment_requested"
  | "payment_collected"
  | "booking_recovered"
  | "no_show_prevented";

export const USAGE_EVENT_LABELS: Record<UsageEventType, string> = {
  call_answered: "Call answered",
  appointment_booked: "Appointment booked",
  appointment_rescheduled: "Appointment rescheduled",
  triage_completed: "Triage completed",
  reminder_sent: "Reminder sent",
  staff_handoff: "Staff handoff",
  post_op_checkin_completed: "Post-op check-in completed",
  record_updated: "Record updated",
  demo_booked: "Demo booked",
  support_ticket_resolved: "Support ticket resolved",
  onboarding_completed: "Onboarding completed",
  churn_risk_detected: "Churn risk detected",
  lead_qualified: "Lead qualified",
  viewing_booked: "Viewing booked",
  property_match_sent: "Property match sent",
  follow_up_completed: "Follow-up completed",
  intake_completed: "Intake completed",
  consultation_booked: "Consultation booked",
  document_collected: "Document collected",
  case_screened: "Case screened",
  ticket_resolved: "Ticket resolved",
  refund_request_processed: "Refund request processed",
  product_recommendation_sent: "Product recommendation sent",
  abandoned_cart_recovered: "Abandoned cart recovered",
  candidate_screened: "Candidate screened",
  interview_booked: "Interview booked",
  cv_processed: "CV processed",
  shortlist_created: "Shortlist created",
  reservation_created: "Reservation created",
  customer_call_answered: "Customer call answered",
  catering_request_qualified: "Catering request qualified",
  review_request_sent: "Review request sent",
  dispatch_created: "Dispatch created",
  delivery_issue_resolved: "Delivery issue resolved",
  route_updated: "Route updated",
  proof_of_delivery_processed: "Proof of delivery processed",
  appointment_requested: "Appointment requested",
  payment_collected: "Payment collected",
  booking_recovered: "Booking recovered",
  no_show_prevented: "No-show prevented",
};

export const USAGE_EVENT_TYPES = Object.keys(
  USAGE_EVENT_LABELS
) as UsageEventType[];

// Event types that represent a high-value "booking"/conversion outcome,
// billed at the per-booking rate and surfaced separately on invoices.
export const BOOKING_EVENT_TYPES: UsageEventType[] = [
  "appointment_booked",
  "demo_booked",
  "viewing_booked",
  "consultation_booked",
  "interview_booked",
  "reservation_created",
];

export function isBookingEvent(t: UsageEventType): boolean {
  return BOOKING_EVENT_TYPES.includes(t);
}

// Which event types belong to which industry (used by the simulator and
// onboarding to show relevant options).
export const INDUSTRY_EVENTS: Record<Industry, UsageEventType[]> = {
  Healthcare: [
    "call_answered",
    "appointment_booked",
    "triage_completed",
    "reminder_sent",
  ],
  SaaS: [
    "demo_booked",
    "support_ticket_resolved",
    "onboarding_completed",
    "churn_risk_detected",
  ],
  "Real Estate": [
    "lead_qualified",
    "viewing_booked",
    "property_match_sent",
    "follow_up_completed",
  ],
  Legal: [
    "intake_completed",
    "consultation_booked",
    "document_collected",
    "case_screened",
  ],
  Ecommerce: [
    "ticket_resolved",
    "refund_request_processed",
    "product_recommendation_sent",
    "abandoned_cart_recovered",
  ],
  Recruiting: [
    "candidate_screened",
    "interview_booked",
    "cv_processed",
    "shortlist_created",
  ],
  Hospitality: [
    "reservation_created",
    "customer_call_answered",
    "catering_request_qualified",
    "review_request_sent",
  ],
  Logistics: [
    "dispatch_created",
    "delivery_issue_resolved",
    "route_updated",
    "proof_of_delivery_processed",
  ],
};

export type EventSource =
  | "LINE"
  | "Website"
  | "CRM"
  | "Booking System"
  | "Email"
  | "API"
  | "Webhook"
  | "Manual";

export const EVENT_SOURCES: EventSource[] = [
  "LINE",
  "Website",
  "CRM",
  "Booking System",
  "Email",
  "API",
  "Webhook",
  "Manual",
];

export type EventStatus = "pending" | "verified" | "rejected";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  pending: "Pending verification",
  verified: "Verified",
  rejected: "Rejected",
};

/**
 * A UsageEvent is the atomic unit of proof + billing: one thing an agent
 * did, with an estimated business value and a billable amount. A vendor
 * verifies (or rejects) it.
 *   • Only VERIFIED events count toward value & ROI.
 *   • Only VERIFIED + BILLABLE events count toward invoices.
 * Privacy: no PII / medical / case / financial documents are stored.
 */
// ---------------------------------------------------------------------
// Automation Mode — verification modes, proof, risk, confidence
// ---------------------------------------------------------------------

export type VerificationMode = "manual" | "assisted" | "autopilot";

export const VERIFICATION_MODE_LABELS: Record<VerificationMode, string> = {
  manual: "Manual",
  assisted: "Assisted",
  autopilot: "Autopilot",
};

export type ProofSource =
  | "ai_agent_event"
  | "crm_confirmation"
  | "booking_system_confirmation"
  | "calendar_confirmation"
  | "line_confirmation"
  | "payment_provider_confirmation"
  | "manual_note"
  | "csv_import"
  | "webhook_signature_verified";

export const PROOF_SOURCE_LABELS: Record<ProofSource, string> = {
  ai_agent_event: "AI agent event",
  crm_confirmation: "CRM confirmation",
  booking_system_confirmation: "Booking system confirmation",
  calendar_confirmation: "Calendar confirmation",
  line_confirmation: "LINE confirmation",
  payment_provider_confirmation: "Payment provider confirmation",
  manual_note: "Manual note",
  csv_import: "CSV import",
  webhook_signature_verified: "Webhook signature verified",
};

export type RiskFlag =
  | "duplicate_event"
  | "missing_booking_id"
  | "missing_customer_reference"
  | "unusually_high_value"
  | "unknown_source"
  | "low_confidence"
  | "invalid_api_key"
  | "payment_not_confirmed"
  | "customer_disputed"
  | "sensitive_data_detected";

export const RISK_FLAG_LABELS: Record<RiskFlag, string> = {
  duplicate_event: "Duplicate event",
  missing_booking_id: "Missing booking ID",
  missing_customer_reference: "Missing customer reference",
  unusually_high_value: "Unusually high value",
  unknown_source: "Unknown source",
  low_confidence: "Low confidence",
  invalid_api_key: "Invalid API key",
  payment_not_confirmed: "Payment not confirmed",
  customer_disputed: "Customer disputed",
  sensitive_data_detected: "Sensitive data detected",
};

// Critical flags block auto-invoicing even at high confidence.
export const CRITICAL_RISK_FLAGS: RiskFlag[] = [
  "duplicate_event",
  "invalid_api_key",
  "customer_disputed",
  "payment_not_confirmed",
  "sensitive_data_detected",
];

export type DuplicateCheckStatus = "unique" | "duplicate" | "unchecked";

export type SourceTrustLevel = "trusted" | "known" | "unknown";

export type VerificationDecision =
  | "auto_verified"
  | "needs_review"
  | "flagged"
  | "manual";

export const DECISION_LABELS: Record<VerificationDecision, string> = {
  auto_verified: "Auto-verified",
  needs_review: "Needs review",
  flagged: "Flagged",
  manual: "Manual review",
};

/**
 * The result of the scoring engine — fully explainable. `breakdown` lists
 * each (+/-) contribution so the UI can show *why* a score was reached.
 */
export interface VerificationAssessment {
  confidenceScore: number;
  decision: VerificationDecision;
  proofSources: ProofSource[];
  riskFlags: RiskFlag[];
  duplicateCheckStatus: DuplicateCheckStatus;
  sourceTrustLevel: SourceTrustLevel;
  requiresHumanReview: boolean;
  autoVerified: boolean;
  breakdown: { label: string; points: number }[];
  reason: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventId: string;
  eventLabel: string;
  clientId: string;
  action: VerificationDecision | "verified" | "rejected";
  by: "human" | "system";
  confidenceScore?: number;
  proofSources?: ProofSource[];
  riskFlags?: RiskFlag[];
  invoiceImpact: boolean; // did this make a billable line item eligible?
  roiImpact: boolean; // did this change verified value / ROI?
  reason: string;
}

export interface UsageEvent {
  id: string;
  vendorId: string;
  clientId: string;
  agentId: string;
  timestamp: string;
  eventType: UsageEventType;
  quantity: number;
  description: string;
  estimatedValue: number; // JPY of business value delivered
  billableAmount: number; // JPY the vendor bills for this event
  staffMinutesSaved: number;
  source: EventSource;
  customerName?: string;
  proofNote?: string;
  status: EventStatus;
  // ---- Automation Mode (all optional; populated by the scoring engine) ----
  verificationMode?: VerificationMode;
  confidenceScore?: number;
  proofSources?: ProofSource[];
  autoVerified?: boolean;
  riskFlags?: RiskFlag[];
  duplicateCheckStatus?: DuplicateCheckStatus;
  sourceTrustLevel?: SourceTrustLevel;
  requiresHumanReview?: boolean;
  bookingId?: string;
  customerReference?: string;
  idempotencyKey?: string;
  apiKeyValid?: boolean;
  webhookSignatureVerified?: boolean;
  sensitiveDataDetected?: boolean;
  customerDisputed?: boolean;
  paymentConfirmed?: boolean;
}

// ---------------------------------------------------------------------
// Cost & outcome events
// ---------------------------------------------------------------------

export type CostType =
  | "llm_cost"
  | "voice_processing"
  | "speech_to_text"
  | "text_to_speech"
  | "telephony"
  | "cloud_compute"
  | "tool_integration"
  | "agency_service"
  | "human_handoff";

export const COST_TYPE_LABELS: Record<CostType, string> = {
  llm_cost: "LLM inference",
  voice_processing: "Voice processing",
  speech_to_text: "Speech-to-text",
  text_to_speech: "Text-to-speech",
  telephony: "Telephony",
  cloud_compute: "Cloud compute",
  tool_integration: "Tool / integration",
  agency_service: "Agency / service",
  human_handoff: "Human handoff",
};

export interface CostEvent {
  id: string;
  vendorId: string;
  clientId: string;
  agentId: string;
  timestamp: string;
  costType: CostType;
  provider: string;
  amountJpy: number;
  metadata?: Record<string, string | number>;
}

/**
 * An Outcome is a business result attributed to agent work (often 1:1 with
 * a high-value usage event). Tracked via POST /api/outcomes. In this MVP
 * outcomes are represented inline on verified usage events; the Outcome
 * type documents the shape the API accepts.
 */
export interface Outcome {
  id: string;
  vendorId: string;
  clientId: string;
  agentId: string;
  outcomeType: UsageEventType;
  estimatedValue: number;
  currency: "JPY";
  timestamp: string;
  metadata?: Record<string, string | number>;
}

// ---------------------------------------------------------------------
// Pricing plans
// ---------------------------------------------------------------------

export interface PricingPlan {
  id: string;
  name: string;
  baseFeeJpy: number | null;
  includedEvents: number | null;
  perExtraEventJpy: number | null;
  perBookingJpy: number | null;
  features: string[];
  custom?: boolean;
}

// ---------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export interface Invoice {
  id: string;
  vendorId: string;
  clientId: string;
  periodLabel: string;
  baseFee: number;
  usageAmount: number;
  bookingAmount: number;
  aiCost: number;
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
  eventIds: string[];
  paymentLink: string | null;
}

// ---------------------------------------------------------------------
// Invitations (two-sided adoption)
// ---------------------------------------------------------------------

export type InvitationStatus = "pending" | "accepted" | "declined";

/**
 * A Business Client requiring / inviting an AI Vendor to report through
 * AgentPayd (client-mandated adoption).
 */
export interface VendorInvitation {
  id: string;
  clientId: string | null; // the inviting business client (if onboarded)
  clientName: string;
  vendorName: string;
  vendorEmail: string;
  industry: Industry;
  reportingRequirement: string;
  trackWorkCompleted: boolean;
  trackOutcomes: boolean;
  trackInvoiceJustification: boolean;
  trackRoi: boolean;
  status: InvitationStatus;
  createdAt: string;
}

/**
 * An AI Vendor inviting a Business Client to view value reports
 * (vendor-led adoption).
 */
export interface ClientInvitation {
  id: string;
  vendorId: string;
  clientName: string;
  clientEmail: string;
  status: InvitationStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------
// Shared calculation helpers (single source of truth)
// ---------------------------------------------------------------------

export function calculateRoi(valueCreated: number, cost: number): number {
  if (cost <= 0) return 0;
  return valueCreated / cost;
}

export function grossMargin(revenue: number, cost: number): number {
  return revenue - cost;
}

export function grossMarginPct(revenue: number, cost: number): number {
  if (revenue <= 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

export function renewalFromRoi(roi: number): RenewalStatus {
  if (roi >= 3) return "strong";
  if (roi >= 1.5) return "needs_attention";
  return "at_risk";
}
