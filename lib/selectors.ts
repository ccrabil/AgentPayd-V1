// =====================================================================
// Selectors — derive every metric the UI shows from raw store state.
// =====================================================================
// Business rules enforced here so they're consistent everywhere:
//   • Only VERIFIED usage events count toward value & ROI.
//   • Only VERIFIED events with billableAmount > 0 count toward invoices.
// Aggregate selectors are scoped to the CURRENT vendor (state.currentVendorId);
// per-client selectors take a clientId directly.
// =====================================================================

import { AppState } from "./store";
import {
  Agent,
  Client,
  PricingPlan,
  UsageEvent,
  Vendor,
  calculateRoi,
  grossMargin,
  grossMarginPct,
  isBookingEvent,
  renewalFromRoi,
} from "./types";

// ---- basic lookups ----

export function getVendor(s: AppState, id: string): Vendor | undefined {
  return s.vendors.find((v) => v.id === id);
}
export function getClient(s: AppState, id: string): Client | undefined {
  return s.clients.find((c) => c.id === id);
}
export function getAgent(s: AppState, id: string): Agent | undefined {
  return s.agents.find((a) => a.id === id);
}
export function getPlan(s: AppState, id: string): PricingPlan | undefined {
  return s.pricingPlans.find((p) => p.id === id);
}

// ---- vendor scoping ----

export function currentVendorClients(s: AppState): Client[] {
  return s.clients.filter((c) => c.vendorId === s.currentVendorId);
}
export function currentVendorAgents(s: AppState): Agent[] {
  return s.agents.filter((a) => a.vendorId === s.currentVendorId);
}

export function agentsForClient(s: AppState, clientId: string): Agent[] {
  return s.agents.filter((a) => a.clientId === clientId);
}
export function eventsForClient(s: AppState, clientId: string): UsageEvent[] {
  return s.usageEvents
    .filter((e) => e.clientId === clientId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}
export function eventsForAgent(s: AppState, agentId: string): UsageEvent[] {
  return s.usageEvents
    .filter((e) => e.agentId === agentId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}
export function pendingEvents(s: AppState): UsageEvent[] {
  return s.usageEvents
    .filter(
      (e) => e.status === "pending" && e.vendorId === s.currentVendorId
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

// ---- money / cost roll-ups ----

export function aiCostForClient(s: AppState, clientId: string): number {
  return s.costEvents
    .filter((c) => c.clientId === clientId)
    .reduce((sum, c) => sum + c.amountJpy, 0);
}
export function aiCostForAgent(s: AppState, agentId: string): number {
  return s.costEvents
    .filter((c) => c.agentId === agentId)
    .reduce((sum, c) => sum + c.amountJpy, 0);
}

export function revenueForClient(s: AppState, clientId: string): number {
  const client = getClient(s, clientId);
  const plan = client ? getPlan(s, client.pricingPlanId) : undefined;
  const base = plan?.baseFeeJpy ?? 0;
  const usage = eventsForClient(s, clientId)
    .filter((e) => e.status === "verified" && e.billableAmount > 0)
    .reduce((sum, e) => sum + e.billableAmount, 0);
  return base + usage;
}

export function verifiedValueForClient(s: AppState, clientId: string): number {
  return eventsForClient(s, clientId)
    .filter((e) => e.status === "verified")
    .reduce((sum, e) => sum + e.estimatedValue, 0);
}
export function verifiedValueForAgent(s: AppState, agentId: string): number {
  return eventsForAgent(s, agentId)
    .filter((e) => e.status === "verified")
    .reduce((sum, e) => sum + e.estimatedValue, 0);
}
export function revenueForAgent(s: AppState, agentId: string): number {
  return eventsForAgent(s, agentId)
    .filter((e) => e.status === "verified" && e.billableAmount > 0)
    .reduce((sum, e) => sum + e.billableAmount, 0);
}

export function staffMinutesSavedForClient(
  s: AppState,
  clientId: string
): number {
  return eventsForClient(s, clientId)
    .filter((e) => e.status === "verified")
    .reduce((sum, e) => sum + e.staffMinutesSaved, 0);
}

export interface ClientMetrics {
  client: Client;
  agentCount: number;
  monthlyEvents: number;
  verifiedEvents: number;
  revenue: number;
  aiCost: number;
  margin: number;
  marginPct: number;
  verifiedValue: number;
  roi: number;
  renewal: ReturnType<typeof renewalFromRoi>;
  staffMinutesSaved: number;
}

export function clientMetrics(s: AppState, clientId: string): ClientMetrics {
  const client = getClient(s, clientId)!;
  const evts = eventsForClient(s, clientId);
  const verified = evts.filter((e) => e.status === "verified");
  const revenue = revenueForClient(s, clientId);
  const aiCost = aiCostForClient(s, clientId);
  const verifiedValue = verifiedValueForClient(s, clientId);
  const roi = calculateRoi(verifiedValue, revenue);
  return {
    client,
    agentCount: agentsForClient(s, clientId).length,
    monthlyEvents: evts.length,
    verifiedEvents: verified.length,
    revenue,
    aiCost,
    margin: grossMargin(revenue, aiCost),
    marginPct: grossMarginPct(revenue, aiCost),
    verifiedValue,
    roi,
    renewal: renewalFromRoi(roi),
    staffMinutesSaved: staffMinutesSavedForClient(s, clientId),
  };
}

export function allClientMetrics(s: AppState): ClientMetrics[] {
  return currentVendorClients(s).map((c) => clientMetrics(s, c.id));
}

export interface AgentMetrics {
  agent: Agent;
  eventsProcessed: number;
  revenue: number;
  aiCost: number;
  margin: number;
  verifiedValue: number;
}

export function agentMetrics(s: AppState, agentId: string): AgentMetrics {
  const agent = getAgent(s, agentId)!;
  const evts = eventsForAgent(s, agentId);
  const revenue = revenueForAgent(s, agentId);
  const aiCost = aiCostForAgent(s, agentId);
  return {
    agent,
    eventsProcessed: evts.length,
    revenue,
    aiCost,
    margin: grossMargin(revenue, aiCost),
    verifiedValue: verifiedValueForAgent(s, agentId),
  };
}

export function allAgentMetrics(s: AppState): AgentMetrics[] {
  return currentVendorAgents(s).map((a) => agentMetrics(s, a.id));
}

// ---- usage-event helpers ----

export function countEventType(
  s: AppState,
  type: string,
  clientId?: string
): number {
  return s.usageEvents.filter(
    (e) =>
      e.status === "verified" &&
      e.eventType === type &&
      (!clientId || e.clientId === clientId)
  ).length;
}

// Count of booking-style outcomes (industry-neutral) for a vendor or client.
export function bookingsCreated(s: AppState, clientId?: string): number {
  return s.usageEvents.filter(
    (e) =>
      e.status === "verified" &&
      isBookingEvent(e.eventType) &&
      (clientId ? e.clientId === clientId : e.vendorId === s.currentVendorId)
  ).length;
}

// ---- vendor-wide aggregates (scoped to current vendor) ----

export interface VendorTotals {
  totalRevenue: number;
  totalAiCost: number;
  grossMargin: number;
  grossMarginPct: number;
  activeClients: number;
  activeAgents: number;
  totalUsageEvents: number;
  verifiedEvents: number;
  bookingsCreated: number;
  staffHoursSaved: number;
  verifiedValue: number;
  avgRoi: number;
  invoicesGenerated: number;
  paidInvoices: number;
  pendingInvoices: number;
  clientsLosingMoney: number;
  renewalRisk: number;
  mrr: number;
}

export function vendorTotals(s: AppState): VendorTotals {
  const metrics = allClientMetrics(s);
  const vendorId = s.currentVendorId;
  const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
  const totalAiCost = metrics.reduce((sum, m) => sum + m.aiCost, 0);
  const verifiedValue = metrics.reduce((sum, m) => sum + m.verifiedValue, 0);
  const staffMinutes = metrics.reduce(
    (sum, m) => sum + m.staffMinutesSaved,
    0
  );
  const rois = metrics.filter((m) => m.roi > 0).map((m) => m.roi);
  const avgRoi =
    rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : 0;

  const vendorInvoices = s.invoices.filter((i) => i.vendorId === vendorId);
  const vendorEvents = s.usageEvents.filter((e) => e.vendorId === vendorId);

  const mrr = currentVendorClients(s)
    .filter((c) => c.status === "active")
    .reduce((sum, c) => {
      const plan = getPlan(s, c.pricingPlanId);
      return sum + (plan?.baseFeeJpy ?? 0);
    }, 0);

  return {
    totalRevenue,
    totalAiCost,
    grossMargin: totalRevenue - totalAiCost,
    grossMarginPct: grossMarginPct(totalRevenue, totalAiCost),
    activeClients: currentVendorClients(s).filter(
      (c) => c.status === "active"
    ).length,
    activeAgents: currentVendorAgents(s).length,
    totalUsageEvents: vendorEvents.length,
    verifiedEvents: vendorEvents.filter((e) => e.status === "verified").length,
    bookingsCreated: bookingsCreated(s),
    staffHoursSaved: staffMinutes / 60,
    verifiedValue,
    avgRoi,
    invoicesGenerated: vendorInvoices.length,
    paidInvoices: vendorInvoices.filter((i) => i.status === "Paid").length,
    pendingInvoices: vendorInvoices.filter(
      (i) => i.status === "Sent" || i.status === "Overdue"
    ).length,
    clientsLosingMoney: metrics.filter((m) => m.margin < 0).length,
    renewalRisk: metrics.filter((m) => m.renewal !== "strong").length,
    mrr,
  };
}

export function topClientByMargin(s: AppState): ClientMetrics | null {
  const m = allClientMetrics(s);
  if (m.length === 0) return null;
  return [...m].sort((a, b) => b.margin - a.margin)[0];
}
export function topAgentByMargin(s: AppState): AgentMetrics | null {
  const m = allAgentMetrics(s);
  if (m.length === 0) return null;
  return [...m].sort((a, b) => b.margin - a.margin)[0];
}
export function mostExpensiveAgent(s: AppState): AgentMetrics | null {
  const m = allAgentMetrics(s);
  if (m.length === 0) return null;
  return [...m].sort((a, b) => b.aiCost - a.aiCost)[0];
}

export function invoicesForClient(s: AppState, clientId: string) {
  return s.invoices
    .filter((i) => i.clientId === clientId)
    .sort(
      (a, b) =>
        new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime()
    );
}

export function billableEventsForClient(
  s: AppState,
  clientId: string
): UsageEvent[] {
  return s.usageEvents.filter(
    (e) =>
      e.clientId === clientId &&
      e.status === "verified" &&
      e.billableAmount > 0
  );
}

// ---- invoice preview math ----

export interface InvoicePreview {
  clientId: string;
  periodLabel: string;
  baseFee: number;
  billableEvents: UsageEvent[];
  usageAmount: number;
  bookingAmount: number;
  aiCost: number;
  total: number;
  margin: number;
}

export function buildInvoicePreview(
  s: AppState,
  clientId: string,
  selectedEventIds: string[]
): InvoicePreview {
  const client = getClient(s, clientId);
  const plan = client ? getPlan(s, client.pricingPlanId) : undefined;
  const baseFee = plan?.baseFeeJpy ?? 0;

  const billableEvents = s.usageEvents.filter(
    (e) =>
      e.clientId === clientId &&
      e.status === "verified" &&
      e.billableAmount > 0 &&
      selectedEventIds.includes(e.id)
  );

  const bookingAmount = billableEvents
    .filter((e) => isBookingEvent(e.eventType))
    .reduce((sum, e) => sum + e.billableAmount, 0);
  const usageAmount = billableEvents
    .filter((e) => !isBookingEvent(e.eventType))
    .reduce((sum, e) => sum + e.billableAmount, 0);

  const aiCost = aiCostForClient(s, clientId);
  const total = baseFee + usageAmount + bookingAmount;

  return {
    clientId,
    periodLabel: "June 2026",
    baseFee,
    billableEvents,
    usageAmount,
    bookingAmount,
    aiCost,
    total,
    margin: total - aiCost,
  };
}
