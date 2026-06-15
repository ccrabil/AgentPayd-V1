import {
  Agent,
  AgentRole,
  DEFAULT_CLIENT_ASSUMPTIONS,
  Client,
  ClientInvitation,
  CostEvent,
  DEFAULT_VISIBILITY,
  Invoice,
  Industry,
  PricingPlan,
  UsageEvent,
  UsageEventType,
  Vendor,
  VendorInvitation,
} from "./types";

// =====================================================================
// SEEDED DEMO DATA (multi-vendor, cross-industry)
// =====================================================================
// AgentPayd serves many AI vendors across industries. Cabot Healthcare is
// the default logged-in vendor with rich data; other vendors demonstrate
// that AgentPayd is industry-agnostic, not clinic-only. Use the vendor
// switcher to explore them.
// =====================================================================

function iso(daysAgo: number, hour = 10, minute = 0): string {
  const d = new Date("2026-06-15T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const DEFAULT_VENDOR_ID = "vendor-cabot";

export const vendors: Vendor[] = [
  {
    id: "vendor-cabot",
    name: "Cabot Healthcare AI Demo",
    industryFocus: "Healthcare",
    accountType: "vendor",
    tagline: "AI voice agents for clinics",
    invoiceRegNo: "T1234567890123",
  },
  {
    id: "vendor-realestate",
    name: "Tokyo Real Estate AI Agency",
    industryFocus: "Real Estate",
    accountType: "vendor",
    tagline: "AI lead-qualification & viewing agents",
    invoiceRegNo: "T2234567890123",
  },
  {
    id: "vendor-saas",
    name: "SaaS Success AI",
    industryFocus: "SaaS",
    accountType: "vendor",
    tagline: "AI demo-booking & support agents",
    invoiceRegNo: "T8234567890123",
  },
  {
    id: "vendor-legal",
    name: "Legal Intake AI Studio",
    industryFocus: "Legal",
    accountType: "vendor",
    tagline: "AI client intake for law firms",
    invoiceRegNo: "T3234567890123",
  },
  {
    id: "vendor-ecommerce",
    name: "Ecommerce Support AI Co.",
    industryFocus: "Ecommerce",
    accountType: "vendor",
    tagline: "AI support & recovery agents",
    invoiceRegNo: "T4234567890123",
  },
  {
    id: "vendor-recruiting",
    name: "Recruiting Automation Partner",
    industryFocus: "Recruiting",
    accountType: "vendor",
    tagline: "AI screening & scheduling agents",
    invoiceRegNo: "T5234567890123",
  },
  {
    id: "vendor-restaurant",
    name: "Restaurant Reservation AI",
    industryFocus: "Hospitality",
    accountType: "vendor",
    tagline: "AI reservation & review agents",
    invoiceRegNo: "T6234567890123",
  },
  {
    id: "vendor-logistics",
    name: "Logistics Dispatch AI",
    industryFocus: "Logistics",
    accountType: "vendor",
    tagline: "AI dispatch & delivery agents",
    invoiceRegNo: "T7234567890123",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: "plan-starter",
    name: "Starter",
    baseFeeJpy: 99_000,
    includedEvents: 1_000,
    perExtraEventJpy: 80,
    perBookingJpy: null,
    features: ["1,000 events included", "¥80 per extra event", "Email support"],
  },
  {
    id: "plan-growth",
    name: "Growth",
    baseFeeJpy: 199_000,
    includedEvents: 3_000,
    perExtraEventJpy: 60,
    perBookingJpy: 300,
    features: [
      "3,000 events included",
      "¥60 per extra event",
      "¥300 per successful booking",
      "Priority support",
    ],
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    baseFeeJpy: null,
    includedEvents: null,
    perExtraEventJpy: null,
    perBookingJpy: null,
    custom: true,
    features: [
      "Custom base fee",
      "Usage- + outcome-based",
      "Dedicated support & SLA",
    ],
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function mkClient(
  id: string,
  vendorId: string,
  name: string,
  industry: Industry,
  planId: string,
  contactName: string,
  contactEmail: string
): Client {
  return {
    id,
    vendorId,
    name,
    industry,
    logoInitial: initials(name),
    contactName,
    contactEmail,
    status: "active",
    pricingPlanId: planId,
    visibility: { ...DEFAULT_VISIBILITY },
  };
}

export const clients: Client[] = [
  // Cabot (Healthcare) — rich
  mkClient(
    "client-tokyo-skin",
    "vendor-cabot",
    "Tokyo Skin Clinic",
    "Healthcare",
    "plan-growth",
    "Dr. Aiko Tanaka",
    "ops@tokyoskin.example.jp"
  ),
  mkClient(
    "client-shibuya-dental",
    "vendor-cabot",
    "Shibuya Dental Group",
    "Healthcare",
    "plan-starter",
    "Kenji Watanabe",
    "admin@shibuyadental.example.jp"
  ),
  mkClient(
    "client-minato-beauty",
    "vendor-cabot",
    "Minato Beauty Clinic",
    "Healthcare",
    "plan-growth",
    "Yuki Sato",
    "frontdesk@minatobeauty.example.jp"
  ),
  // SaaS
  mkClient(
    "client-tokyo-saas",
    "vendor-saas",
    "Tokyo SaaS Cloud",
    "SaaS",
    "plan-growth",
    "Jun Takahashi",
    "success@tokyosaas.example.jp"
  ),
  // Real estate
  mkClient(
    "client-meguro-property",
    "vendor-realestate",
    "Meguro Property Group",
    "Real Estate",
    "plan-growth",
    "Haruto Mori",
    "leads@meguroproperty.example.jp"
  ),
  mkClient(
    "client-shibuya-homes",
    "vendor-realestate",
    "Shibuya Luxury Homes",
    "Real Estate",
    "plan-starter",
    "Rin Abe",
    "sales@shibuyahomes.example.jp"
  ),
  // Legal
  mkClient(
    "client-minato-law",
    "vendor-legal",
    "Minato Law Office",
    "Legal",
    "plan-growth",
    "Sora Nakamura",
    "intake@minatolaw.example.jp"
  ),
  // Ecommerce
  mkClient(
    "client-tokyo-fashion",
    "vendor-ecommerce",
    "Tokyo Fashion Store",
    "Ecommerce",
    "plan-starter",
    "Mei Kobayashi",
    "support@tokyofashion.example.jp"
  ),
  // Recruiting
  mkClient(
    "client-tokyo-talent",
    "vendor-recruiting",
    "Tokyo Talent Partners",
    "Recruiting",
    "plan-growth",
    "Daiki Ito",
    "hiring@tokyotalent.example.jp"
  ),
  // Restaurants
  mkClient(
    "client-ginza-dining",
    "vendor-restaurant",
    "Ginza Dining Group",
    "Hospitality",
    "plan-starter",
    "Aoi Yamamoto",
    "reservations@ginzadining.example.jp"
  ),
  // Logistics
  mkClient(
    "client-tokyo-logistics",
    "vendor-logistics",
    "Tokyo Logistics Co.",
    "Logistics",
    "plan-growth",
    "Ren Fujii",
    "dispatch@tokyologistics.example.jp"
  ),
  // Additional clients (second client per vendor, for richer demos)
  mkClient(
    "client-b2b-support",
    "vendor-saas",
    "B2B Support Platform Japan",
    "SaaS",
    "plan-starter",
    "Nao Hayashi",
    "ops@b2bsupport.example.jp"
  ),
  mkClient(
    "client-startup-legal",
    "vendor-legal",
    "Startup Legal Japan",
    "Legal",
    "plan-starter",
    "Yuto Shimizu",
    "intake@startuplegal.example.jp"
  ),
  mkClient(
    "client-premium-skincare",
    "vendor-ecommerce",
    "Premium Skincare Japan",
    "Ecommerce",
    "plan-growth",
    "Saki Inoue",
    "care@premiumskincare.example.jp"
  ),
  mkClient(
    "client-startup-hiring",
    "vendor-recruiting",
    "Startup Hiring Desk",
    "Recruiting",
    "plan-starter",
    "Kaito Matsumoto",
    "talent@startuphiring.example.jp"
  ),
  mkClient(
    "client-shibuya-burger",
    "vendor-restaurant",
    "Shibuya Burger Lab",
    "Hospitality",
    "plan-starter",
    "Hina Okada",
    "book@shibuyaburger.example.jp"
  ),
];

function inferAgentRole(billable: UsageEventType[]): AgentRole {
  const has = (t: UsageEventType) => billable.includes(t);
  if (
    has("call_answered") ||
    has("appointment_booked") ||
    has("reservation_created") ||
    has("customer_call_answered") ||
    has("reminder_sent")
  )
    return "receptionist";
  if (
    has("lead_qualified") ||
    has("viewing_booked") ||
    has("property_match_sent") ||
    has("demo_booked")
  )
    return "sales";
  if (
    has("candidate_screened") ||
    has("interview_booked") ||
    has("cv_processed") ||
    has("shortlist_created")
  )
    return "recruiter";
  return "support";
}

function mkAgent(
  id: string,
  vendorId: string,
  clientId: string,
  name: string,
  industry: Industry,
  description: string,
  billable: UsageEventType[]
): Agent {
  return {
    id,
    vendorId,
    clientId,
    name,
    industry,
    role: inferAgentRole(billable),
    description,
    pricingModel: "hybrid",
    cost: 0,
    billableOutcomeTypes: billable,
    currency: "JPY",
    status: "active",
  };
}

export const agents: Agent[] = [
  mkAgent(
    "agent-voice",
    "vendor-cabot",
    "client-tokyo-skin",
    "Healthcare Voice Agent",
    "Healthcare",
    "Answers patient calls and books appointments",
    ["call_answered", "appointment_booked"]
  ),
  mkAgent(
    "agent-booking",
    "vendor-cabot",
    "client-tokyo-skin",
    "Clinic Booking Agent",
    "Healthcare",
    "Manages bookings and reschedules",
    ["appointment_booked", "appointment_rescheduled"]
  ),
  mkAgent(
    "agent-reminder",
    "vendor-cabot",
    "client-shibuya-dental",
    "Patient Reminder Agent",
    "Healthcare",
    "Sends reminders and recovers no-shows",
    ["reminder_sent"]
  ),
  mkAgent(
    "agent-triage",
    "vendor-cabot",
    "client-minato-beauty",
    "Patient Triage Agent",
    "Healthcare",
    "Runs triage and post-op check-ins",
    ["triage_completed", "post_op_checkin_completed"]
  ),
  mkAgent(
    "agent-saas-support",
    "vendor-saas",
    "client-tokyo-saas",
    "Customer Success Agent",
    "SaaS",
    "Books demos and resolves support tickets",
    ["demo_booked", "support_ticket_resolved"]
  ),
  mkAgent(
    "agent-re-lead",
    "vendor-realestate",
    "client-meguro-property",
    "Lead Qualification Agent",
    "Real Estate",
    "Qualifies leads and books viewings",
    ["lead_qualified", "viewing_booked"]
  ),
  mkAgent(
    "agent-re-match",
    "vendor-realestate",
    "client-shibuya-homes",
    "Property Match Agent",
    "Real Estate",
    "Sends property matches and follow-ups",
    ["property_match_sent", "follow_up_completed"]
  ),
  mkAgent(
    "agent-legal-intake",
    "vendor-legal",
    "client-minato-law",
    "Legal Intake Agent",
    "Legal",
    "Completes intake and books consultations",
    ["intake_completed", "consultation_booked"]
  ),
  mkAgent(
    "agent-ecom-support",
    "vendor-ecommerce",
    "client-tokyo-fashion",
    "Ecommerce Support Agent",
    "Ecommerce",
    "Resolves tickets and recovers carts",
    ["ticket_resolved", "abandoned_cart_recovered"]
  ),
  mkAgent(
    "agent-recruit-screen",
    "vendor-recruiting",
    "client-tokyo-talent",
    "Candidate Screening Agent",
    "Recruiting",
    "Screens candidates and books interviews",
    ["candidate_screened", "interview_booked"]
  ),
  mkAgent(
    "agent-resto-reserve",
    "vendor-restaurant",
    "client-ginza-dining",
    "Reservation Agent",
    "Hospitality",
    "Takes reservations and review requests",
    ["reservation_created", "review_request_sent"]
  ),
  mkAgent(
    "agent-logistics-dispatch",
    "vendor-logistics",
    "client-tokyo-logistics",
    "Dispatch Agent",
    "Logistics",
    "Creates dispatches and resolves delivery issues",
    ["dispatch_created", "delivery_issue_resolved"]
  ),
  mkAgent(
    "agent-b2b-support",
    "vendor-saas",
    "client-b2b-support",
    "Support Desk Agent",
    "SaaS",
    "Resolves support tickets and onboards users",
    ["support_ticket_resolved", "onboarding_completed"]
  ),
  mkAgent(
    "agent-startup-legal",
    "vendor-legal",
    "client-startup-legal",
    "Startup Intake Agent",
    "Legal",
    "Screens cases and collects documents",
    ["case_screened", "document_collected"]
  ),
  mkAgent(
    "agent-premium-skincare",
    "vendor-ecommerce",
    "client-premium-skincare",
    "Recommendation Agent",
    "Ecommerce",
    "Sends product recommendations and resolves tickets",
    ["product_recommendation_sent", "ticket_resolved"]
  ),
  mkAgent(
    "agent-startup-hiring",
    "vendor-recruiting",
    "client-startup-hiring",
    "CV Screening Agent",
    "Recruiting",
    "Processes CVs and builds shortlists",
    ["cv_processed", "shortlist_created"]
  ),
  mkAgent(
    "agent-shibuya-burger",
    "vendor-restaurant",
    "client-shibuya-burger",
    "Booking Agent",
    "Hospitality",
    "Answers customer calls and books tables",
    ["customer_call_answered", "reservation_created"]
  ),
];

// Worked example (the Paid.ai-style receptionist case) so the economics and
// value-receipt pages are populated out of the box. Numbers in JPY.
const _skin = clients.find((c) => c.id === "client-tokyo-skin");
if (_skin) {
  _skin.assumptions = {
    ...DEFAULT_CLIENT_ASSUMPTIONS,
    averageAppointmentValue: 30000,
    showUpRate: 0.85,
    noShowRate: 0.15,
    averageNoShowLoss: 30000,
    averageLeadValue: 8000,
    conversionRate: 0.25,
    averageOrderValue: 12000,
    humanHourlyCost: 2500,
    baselineMonthlyBookings: 200,
    baselineMissedInquiries: 80,
    baselineRevenue: 6000000,
  };
}
const _voice = agents.find((a) => a.id === "agent-voice");
if (_voice) {
  _voice.clientMonthlyFee = 450000;
  _voice.aiModelCost = 30000;
  _voice.toolCost = 20000;
  _voice.humanSupportCost = 70000;
  _voice.maintenanceCost = 30000;
}

// ---------------------------------------------------------------------
// Usage events
// ---------------------------------------------------------------------

let evtSeq = 0;
function evt(
  e: Omit<UsageEvent, "id" | "quantity"> & { quantity?: number }
): UsageEvent {
  evtSeq += 1;
  return {
    id: `evt-${String(evtSeq).padStart(4, "0")}`,
    quantity: 1,
    ...e,
  };
}

// Cabot — rich, with a couple left pending for the verify demo
const cabotEvents: UsageEvent[] = [
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-voice",
    timestamp: iso(1, 9, 12),
    eventType: "call_answered",
    description: "After-hours call answered and routed",
    estimatedValue: 1_800,
    billableAmount: 120,
    staffMinutesSaved: 6,
    source: "LINE",
    status: "verified",
    proofNote: "Call log #A-2231, 2m41s handled end-to-end",
  }),
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-voice",
    timestamp: iso(1, 9, 30),
    eventType: "appointment_booked",
    description: "Booked a laser consultation",
    estimatedValue: 24_000,
    billableAmount: 300,
    staffMinutesSaved: 8,
    source: "Booking System",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-booking",
    timestamp: iso(2, 11, 5),
    eventType: "appointment_booked",
    description: "Booked a returning-patient follow-up",
    estimatedValue: 12_000,
    billableAmount: 300,
    staffMinutesSaved: 7,
    source: "Website",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-booking",
    timestamp: iso(3, 14, 22),
    eventType: "appointment_rescheduled",
    description: "Rescheduled a cancelled slot, filled same day",
    estimatedValue: 9_000,
    billableAmount: 120,
    staffMinutesSaved: 5,
    source: "Booking System",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-voice",
    timestamp: iso(0, 8, 40),
    eventType: "call_answered",
    description: "Morning call answered, pricing question resolved",
    estimatedValue: 1_400,
    billableAmount: 120,
    staffMinutesSaved: 5,
    source: "LINE",
    status: "pending",
  }),
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-shibuya-dental",
    agentId: "agent-reminder",
    timestamp: iso(1, 10, 0),
    eventType: "reminder_sent",
    description: "Sent next-day appointment reminders (batch)",
    estimatedValue: 3_200,
    billableAmount: 80,
    staffMinutesSaved: 12,
    source: "CRM",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-shibuya-dental",
    agentId: "agent-reminder",
    timestamp: iso(2, 10, 0),
    eventType: "reminder_sent",
    description: "Recovered a no-show via reminder",
    estimatedValue: 8_000,
    billableAmount: 80,
    staffMinutesSaved: 4,
    source: "CRM",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-shibuya-dental",
    agentId: "agent-reminder",
    timestamp: iso(0, 12, 0),
    eventType: "reminder_sent",
    description: "Reminder batch for tomorrow's schedule",
    estimatedValue: 2_400,
    billableAmount: 80,
    staffMinutesSaved: 9,
    source: "CRM",
    status: "pending",
  }),
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-minato-beauty",
    agentId: "agent-triage",
    timestamp: iso(1, 13, 15),
    eventType: "triage_completed",
    description: "Pre-treatment triage questionnaire completed",
    estimatedValue: 6_500,
    billableAmount: 200,
    staffMinutesSaved: 10,
    source: "Website",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-cabot",
    clientId: "client-minato-beauty",
    agentId: "agent-triage",
    timestamp: iso(4, 15, 40),
    eventType: "post_op_checkin_completed",
    description: "Post-procedure check-in completed and logged",
    estimatedValue: 5_000,
    billableAmount: 200,
    staffMinutesSaved: 8,
    source: "Booking System",
    status: "verified",
  }),
];

// Lighter cross-industry events so other vendors' dashboards look alive
const crossIndustryEvents: UsageEvent[] = [
  evt({
    vendorId: "vendor-saas",
    clientId: "client-tokyo-saas",
    agentId: "agent-saas-support",
    timestamp: iso(1, 10, 0),
    eventType: "support_ticket_resolved",
    description: "Resolved a billing support ticket",
    estimatedValue: 1_500,
    billableAmount: 300,
    staffMinutesSaved: 10,
    source: "Email",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-saas",
    clientId: "client-tokyo-saas",
    agentId: "agent-saas-support",
    timestamp: iso(2, 11, 0),
    eventType: "demo_booked",
    description: "Booked a product demo with a qualified lead",
    estimatedValue: 18_000,
    billableAmount: 600,
    staffMinutesSaved: 14,
    source: "Website",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-realestate",
    clientId: "client-meguro-property",
    agentId: "agent-re-lead",
    timestamp: iso(1, 11, 0),
    eventType: "lead_qualified",
    description: "Qualified an inbound buyer lead",
    estimatedValue: 15_000,
    billableAmount: 400,
    staffMinutesSaved: 18,
    source: "Website",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-realestate",
    clientId: "client-meguro-property",
    agentId: "agent-re-lead",
    timestamp: iso(2, 14, 0),
    eventType: "viewing_booked",
    description: "Booked a property viewing",
    estimatedValue: 30_000,
    billableAmount: 1_000,
    staffMinutesSaved: 20,
    source: "CRM",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-realestate",
    clientId: "client-shibuya-homes",
    agentId: "agent-re-match",
    timestamp: iso(1, 9, 0),
    eventType: "property_match_sent",
    description: "Sent curated property matches",
    estimatedValue: 6_000,
    billableAmount: 200,
    staffMinutesSaved: 12,
    source: "Email",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-legal",
    clientId: "client-minato-law",
    agentId: "agent-legal-intake",
    timestamp: iso(1, 10, 30),
    eventType: "intake_completed",
    description: "Completed new-client intake",
    estimatedValue: 20_000,
    billableAmount: 500,
    staffMinutesSaved: 25,
    source: "Website",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-legal",
    clientId: "client-minato-law",
    agentId: "agent-legal-intake",
    timestamp: iso(2, 16, 0),
    eventType: "consultation_booked",
    description: "Booked a paid consultation",
    estimatedValue: 25_000,
    billableAmount: 2_000,
    staffMinutesSaved: 20,
    source: "Booking System",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-ecommerce",
    clientId: "client-tokyo-fashion",
    agentId: "agent-ecom-support",
    timestamp: iso(1, 13, 0),
    eventType: "ticket_resolved",
    description: "Resolved an order-status ticket",
    estimatedValue: 1_500,
    billableAmount: 120,
    staffMinutesSaved: 10,
    source: "Email",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-ecommerce",
    clientId: "client-tokyo-fashion",
    agentId: "agent-ecom-support",
    timestamp: iso(2, 15, 0),
    eventType: "abandoned_cart_recovered",
    description: "Recovered an abandoned cart",
    estimatedValue: 9_800,
    billableAmount: 300,
    staffMinutesSaved: 6,
    source: "Website",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-recruiting",
    clientId: "client-tokyo-talent",
    agentId: "agent-recruit-screen",
    timestamp: iso(1, 11, 30),
    eventType: "candidate_screened",
    description: "Screened a software-engineer candidate",
    estimatedValue: 12_000,
    billableAmount: 400,
    staffMinutesSaved: 22,
    source: "CRM",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-recruiting",
    clientId: "client-tokyo-talent",
    agentId: "agent-recruit-screen",
    timestamp: iso(3, 10, 0),
    eventType: "interview_booked",
    description: "Booked a first-round interview",
    estimatedValue: 18_000,
    billableAmount: 800,
    staffMinutesSaved: 15,
    source: "Booking System",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-restaurant",
    clientId: "client-ginza-dining",
    agentId: "agent-resto-reserve",
    timestamp: iso(1, 18, 0),
    eventType: "reservation_created",
    description: "Created a dinner reservation for 4",
    estimatedValue: 4_000,
    billableAmount: 150,
    staffMinutesSaved: 5,
    source: "LINE",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-restaurant",
    clientId: "client-ginza-dining",
    agentId: "agent-resto-reserve",
    timestamp: iso(2, 12, 0),
    eventType: "review_request_sent",
    description: "Sent a post-visit review request",
    estimatedValue: 1_200,
    billableAmount: 80,
    staffMinutesSaved: 3,
    source: "Email",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-logistics",
    clientId: "client-tokyo-logistics",
    agentId: "agent-logistics-dispatch",
    timestamp: iso(1, 8, 0),
    eventType: "dispatch_created",
    description: "Created a same-day delivery dispatch",
    estimatedValue: 5_500,
    billableAmount: 180,
    staffMinutesSaved: 14,
    source: "CRM",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-logistics",
    clientId: "client-tokyo-logistics",
    agentId: "agent-logistics-dispatch",
    timestamp: iso(2, 9, 30),
    eventType: "delivery_issue_resolved",
    description: "Resolved a failed-delivery exception",
    estimatedValue: 7_200,
    billableAmount: 220,
    staffMinutesSaved: 16,
    source: "API",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-saas",
    clientId: "client-b2b-support",
    agentId: "agent-b2b-support",
    timestamp: iso(1, 14, 0),
    eventType: "support_ticket_resolved",
    description: "Resolved an integration support ticket",
    estimatedValue: 1_600,
    billableAmount: 120,
    staffMinutesSaved: 11,
    source: "API",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-legal",
    clientId: "client-startup-legal",
    agentId: "agent-startup-legal",
    timestamp: iso(1, 15, 30),
    eventType: "case_screened",
    description: "Screened an incorporation matter",
    estimatedValue: 14_000,
    billableAmount: 500,
    staffMinutesSaved: 20,
    source: "Website",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-ecommerce",
    clientId: "client-premium-skincare",
    agentId: "agent-premium-skincare",
    timestamp: iso(1, 16, 0),
    eventType: "product_recommendation_sent",
    description: "Sent a personalized skincare recommendation",
    estimatedValue: 7_500,
    billableAmount: 200,
    staffMinutesSaved: 7,
    source: "Website",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-recruiting",
    clientId: "client-startup-hiring",
    agentId: "agent-startup-hiring",
    timestamp: iso(1, 12, 0),
    eventType: "cv_processed",
    description: "Processed and tagged an inbound CV",
    estimatedValue: 6_000,
    billableAmount: 150,
    staffMinutesSaved: 12,
    source: "Email",
    status: "verified",
  }),
  evt({
    vendorId: "vendor-restaurant",
    clientId: "client-shibuya-burger",
    agentId: "agent-shibuya-burger",
    timestamp: iso(1, 19, 0),
    eventType: "customer_call_answered",
    description: "Answered a booking enquiry call",
    estimatedValue: 2_200,
    billableAmount: 90,
    staffMinutesSaved: 4,
    source: "LINE",
    status: "verified",
  }),
];

export const usageEvents: UsageEvent[] = [...cabotEvents, ...crossIndustryEvents];

// ---------------------------------------------------------------------
// Cost events
// ---------------------------------------------------------------------

let costSeq = 0;
function cost(c: Omit<CostEvent, "id">): CostEvent {
  costSeq += 1;
  return { id: `cost-${String(costSeq).padStart(4, "0")}`, ...c };
}

export const costEvents: CostEvent[] = [
  cost({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-voice",
    timestamp: iso(1, 9, 13),
    costType: "telephony",
    provider: "Twilio",
    amountJpy: 18,
    metadata: { seconds: 161 },
  }),
  cost({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-voice",
    timestamp: iso(1, 9, 13),
    costType: "speech_to_text",
    provider: "Deepgram",
    amountJpy: 9,
  }),
  cost({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-voice",
    timestamp: iso(1, 9, 13),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 14,
  }),
  cost({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-voice",
    timestamp: iso(1, 9, 13),
    costType: "text_to_speech",
    provider: "ElevenLabs",
    amountJpy: 11,
  }),
  cost({
    vendorId: "vendor-cabot",
    clientId: "client-tokyo-skin",
    agentId: "agent-booking",
    timestamp: iso(2, 11, 6),
    costType: "cloud_compute",
    provider: "AWS",
    amountJpy: 6,
  }),
  cost({
    vendorId: "vendor-cabot",
    clientId: "client-shibuya-dental",
    agentId: "agent-reminder",
    timestamp: iso(1, 10, 1),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 22,
  }),
  cost({
    vendorId: "vendor-cabot",
    clientId: "client-shibuya-dental",
    agentId: "agent-reminder",
    timestamp: iso(2, 10, 1),
    costType: "telephony",
    provider: "Twilio",
    amountJpy: 34,
  }),
  cost({
    vendorId: "vendor-cabot",
    clientId: "client-minato-beauty",
    agentId: "agent-triage",
    timestamp: iso(1, 13, 16),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 16,
  }),
  cost({
    vendorId: "vendor-cabot",
    clientId: "client-minato-beauty",
    agentId: "agent-triage",
    timestamp: iso(4, 15, 41),
    costType: "human_handoff",
    provider: "Internal",
    amountJpy: 40,
  }),
  // cross-industry costs
  cost({
    vendorId: "vendor-saas",
    clientId: "client-tokyo-saas",
    agentId: "agent-saas-support",
    timestamp: iso(1, 10, 1),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 24,
  }),
  cost({
    vendorId: "vendor-realestate",
    clientId: "client-meguro-property",
    agentId: "agent-re-lead",
    timestamp: iso(1, 11, 1),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 52,
  }),
  cost({
    vendorId: "vendor-legal",
    clientId: "client-minato-law",
    agentId: "agent-legal-intake",
    timestamp: iso(1, 10, 31),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 68,
  }),
  cost({
    vendorId: "vendor-ecommerce",
    clientId: "client-tokyo-fashion",
    agentId: "agent-ecom-support",
    timestamp: iso(1, 13, 1),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 24,
  }),
  cost({
    vendorId: "vendor-recruiting",
    clientId: "client-tokyo-talent",
    agentId: "agent-recruit-screen",
    timestamp: iso(1, 11, 31),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 44,
  }),
  cost({
    vendorId: "vendor-restaurant",
    clientId: "client-ginza-dining",
    agentId: "agent-resto-reserve",
    timestamp: iso(1, 18, 1),
    costType: "telephony",
    provider: "Twilio",
    amountJpy: 12,
  }),
  cost({
    vendorId: "vendor-logistics",
    clientId: "client-tokyo-logistics",
    agentId: "agent-logistics-dispatch",
    timestamp: iso(1, 8, 1),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 30,
  }),
  cost({
    vendorId: "vendor-saas",
    clientId: "client-b2b-support",
    agentId: "agent-b2b-support",
    timestamp: iso(1, 14, 1),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 20,
  }),
  cost({
    vendorId: "vendor-legal",
    clientId: "client-startup-legal",
    agentId: "agent-startup-legal",
    timestamp: iso(1, 15, 31),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 55,
  }),
  cost({
    vendorId: "vendor-ecommerce",
    clientId: "client-premium-skincare",
    agentId: "agent-premium-skincare",
    timestamp: iso(1, 16, 1),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 18,
  }),
  cost({
    vendorId: "vendor-recruiting",
    clientId: "client-startup-hiring",
    agentId: "agent-startup-hiring",
    timestamp: iso(1, 12, 1),
    costType: "llm_cost",
    provider: "OpenAI",
    amountJpy: 26,
  }),
  cost({
    vendorId: "vendor-restaurant",
    clientId: "client-shibuya-burger",
    agentId: "agent-shibuya-burger",
    timestamp: iso(1, 19, 1),
    costType: "telephony",
    provider: "Twilio",
    amountJpy: 10,
  }),
];

export const invoices: Invoice[] = [
  {
    id: "INV-2026-0001",
    vendorId: "vendor-cabot",
    clientId: "client-minato-beauty",
    periodLabel: "June 2026",
    baseFee: 199_000,
    usageAmount: 400,
    bookingAmount: 0,
    aiCost: 56,
    amount: 199_400,
    status: "Sent",
    issuedDate: iso(3, 9, 0),
    eventIds: [],
    paymentLink: null,
  },
];

// Demo invitations illustrating both adoption paths.
export const vendorInvitations: VendorInvitation[] = [
  {
    id: "vinv-0001",
    clientId: null,
    clientName: "Tokyo Skin Clinic",
    vendorName: "Cabot Healthcare AI Demo",
    vendorEmail: "billing@cabot-ai.example.jp",
    industry: "Healthcare",
    reportingRequirement:
      "Report all AI voice-agent work, value, and invoices through AgentPayd before monthly invoices are approved.",
    trackWorkCompleted: true,
    trackOutcomes: true,
    trackInvoiceJustification: true,
    trackRoi: true,
    status: "accepted",
    createdAt: iso(20, 9, 0),
  },
];

export const clientInvitations: ClientInvitation[] = [];

// Back-compat: some code references a singleton `vendor`. This is the
// default logged-in vendor (Cabot).
export const vendor = vendors[0];
