// =====================================================================
// Value calculation engine — EXPLAINABLE by design.
// =====================================================================
// "Do not let the agency make up value numbers." This combines the
// CLIENT's business assumptions with the AGENCY's costs and the count of
// VERIFIED events to produce value, ROI, and margin — and always returns
// the per-line formula so the UI can show exactly how each number was
// reached. No black-box ROI.
// =====================================================================

import {
  Agent,
  ClientAssumptions,
  DEFAULT_CLIENT_ASSUMPTIONS,
  UsageEvent,
  UsageEventType,
} from "./types";

export interface ValueLine {
  label: string;
  count: number;
  formula: string;
  value: number;
}

export interface ValueBreakdown {
  lines: ValueLine[];
  total: number;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const yen = (n: number) => `¥${Math.round(n).toLocaleString("en-US")}`;

// How each event type converts to business value, using client assumptions.
export function computeVerifiedValue(
  events: UsageEvent[],
  assumptions: ClientAssumptions = DEFAULT_CLIENT_ASSUMPTIONS
): ValueBreakdown {
  const verified = events.filter((e) => e.status === "verified");
  const count = (types: UsageEventType[]) =>
    verified.filter((e) => types.includes(e.eventType)).length;

  const a = assumptions;
  const lines: ValueLine[] = [];

  const booked = count([
    "appointment_booked",
    "reservation_created",
    "consultation_booked",
    "viewing_booked",
  ]);
  if (booked > 0) {
    const v = booked * a.averageAppointmentValue * a.showUpRate;
    lines.push({
      label: "Appointments booked",
      count: booked,
      formula: `${booked} × ${yen(a.averageAppointmentValue)} × ${pct(a.showUpRate)} show-up`,
      value: v,
    });
  }

  const recovered = count(["booking_recovered"]);
  if (recovered > 0) {
    const v = recovered * a.averageAppointmentValue * a.showUpRate;
    lines.push({
      label: "Bookings recovered",
      count: recovered,
      formula: `${recovered} × ${yen(a.averageAppointmentValue)} × ${pct(a.showUpRate)} show-up`,
      value: v,
    });
  }

  const noShow = count(["no_show_prevented"]);
  if (noShow > 0) {
    const v = noShow * a.averageNoShowLoss;
    lines.push({
      label: "No-shows prevented",
      count: noShow,
      formula: `${noShow} × ${yen(a.averageNoShowLoss)} avg no-show loss`,
      value: v,
    });
  }

  const leads = count(["lead_qualified"]);
  if (leads > 0) {
    const v = leads * a.averageLeadValue;
    lines.push({
      label: "Leads qualified",
      count: leads,
      formula: `${leads} × ${yen(a.averageLeadValue)} avg lead value`,
      value: v,
    });
  }

  const payments = count(["payment_collected"]);
  if (payments > 0) {
    const v = payments * a.averageOrderValue;
    lines.push({
      label: "Payments collected",
      count: payments,
      formula: `${payments} × ${yen(a.averageOrderValue)} avg order value`,
      value: v,
    });
  }

  const orders = count(["abandoned_cart_recovered"]);
  if (orders > 0) {
    const v = orders * a.averageOrderValue;
    lines.push({
      label: "Carts recovered",
      count: orders,
      formula: `${orders} × ${yen(a.averageOrderValue)} avg order value`,
      value: v,
    });
  }

  // Any other verified events fall back to their recorded estimated value,
  // so nothing is silently dropped.
  const accountedTypes: UsageEventType[] = [
    "appointment_booked",
    "reservation_created",
    "consultation_booked",
    "viewing_booked",
    "booking_recovered",
    "no_show_prevented",
    "lead_qualified",
    "payment_collected",
    "abandoned_cart_recovered",
  ];
  const otherEvents = verified.filter(
    (e) => !accountedTypes.includes(e.eventType)
  );
  if (otherEvents.length > 0) {
    const v = otherEvents.reduce((s, e) => s + e.estimatedValue, 0);
    lines.push({
      label: "Other verified outcomes",
      count: otherEvents.length,
      formula: `Sum of recorded value for ${otherEvents.length} other outcomes`,
      value: v,
    });
  }

  const total = lines.reduce((s, l) => s + l.value, 0);
  return { lines, total };
}

// ---- Agency cost & margin -------------------------------------------
export interface CostBreakdown {
  aiModelCost: number;
  toolCost: number;
  humanSupportCost: number;
  maintenanceCost: number;
  total: number;
}

export function agentDeliveryCost(agent: Agent): CostBreakdown {
  const aiModelCost = agent.aiModelCost ?? 0;
  const toolCost = agent.toolCost ?? 0;
  const humanSupportCost = agent.humanSupportCost ?? 0;
  const maintenanceCost = agent.maintenanceCost ?? 0;
  return {
    aiModelCost,
    toolCost,
    humanSupportCost,
    maintenanceCost,
    total: aiModelCost + toolCost + humanSupportCost + maintenanceCost,
  };
}

export function sumDeliveryCost(agents: Agent[]): CostBreakdown {
  return agents.reduce<CostBreakdown>(
    (acc, ag) => {
      const c = agentDeliveryCost(ag);
      return {
        aiModelCost: acc.aiModelCost + c.aiModelCost,
        toolCost: acc.toolCost + c.toolCost,
        humanSupportCost: acc.humanSupportCost + c.humanSupportCost,
        maintenanceCost: acc.maintenanceCost + c.maintenanceCost,
        total: acc.total + c.total,
      };
    },
    { aiModelCost: 0, toolCost: 0, humanSupportCost: 0, maintenanceCost: 0, total: 0 }
  );
}

export interface Economics {
  verifiedValue: number;
  valueBreakdown: ValueBreakdown;
  clientMonthlyFee: number;
  clientRoi: number; // verifiedValue / clientMonthlyFee
  netClientValue: number; // verifiedValue - clientMonthlyFee
  invoiceAmount: number;
  deliveryCost: CostBreakdown;
  agencyGrossMargin: number; // invoiceAmount - deliveryCost.total
  agencyMarginPercent: number; // grossMargin / invoiceAmount
}

/**
 * Combine client assumptions + agency costs + verified events into the full,
 * explainable economics for one client.
 */
export function computeEconomics(params: {
  events: UsageEvent[];
  assumptions: ClientAssumptions;
  agents: Agent[];
  invoiceAmount: number;
}): Economics {
  const valueBreakdown = computeVerifiedValue(params.events, params.assumptions);
  const verifiedValue = valueBreakdown.total;
  const clientMonthlyFee = params.agents.reduce(
    (s, ag) => s + (ag.clientMonthlyFee ?? 0),
    0
  );
  const deliveryCost = sumDeliveryCost(params.agents);
  const agencyGrossMargin = params.invoiceAmount - deliveryCost.total;
  return {
    verifiedValue,
    valueBreakdown,
    clientMonthlyFee,
    clientRoi: clientMonthlyFee > 0 ? verifiedValue / clientMonthlyFee : 0,
    netClientValue: verifiedValue - clientMonthlyFee,
    invoiceAmount: params.invoiceAmount,
    deliveryCost,
    agencyGrossMargin,
    agencyMarginPercent:
      params.invoiceAmount > 0 ? agencyGrossMargin / params.invoiceAmount : 0,
  };
}
