// =====================================================================
// Pricing engine — PURE & deterministic.
// =====================================================================
// (frozen usage + pricing package + overrides + performance rules)
//   → invoice line items
// No DB calls, no side effects. Same inputs always produce the same
// invoice — which is what makes billing auditable and testable.
// Combines every billing component: setup, platform, seat, activity,
// outcome, workflow, usage, overage, credit top-up, discount, tax,
// with per-outcome performance multipliers and client overrides.
// =====================================================================

export type PricingModelV2 =
  | "fixed"
  | "per_agent"
  | "per_workflow"
  | "per_action"
  | "per_outcome"
  | "usage"
  | "hybrid"
  | "credits"
  | "fte_equivalent";

export type BillingComponent =
  | "setup_fee"
  | "platform_fee"
  | "seat_fee"
  | "activity_fee"
  | "outcome_fee"
  | "workflow_fee"
  | "usage_fee"
  | "overage_fee"
  | "credit_topup"
  | "discount"
  | "tax";

export interface PricingPackageV2 {
  pricingModel: PricingModelV2;
  currency: string;
  setupFee: number;
  platformFeeMonthly: number;
  seatFee: number;
  includedSeats: number;
  includedSignals: number;
  baseFee: number;
  overageRate: number;
  activityRates: Record<string, number>;
  outcomeRates: Record<string, number>;
  workflowRates: Record<string, number>;
  usageRates: Record<string, number>;
}

export interface ClientPricingOverrideV2 {
  customSetupFee?: number;
  customPlatformFeeMonthly?: number;
  customSeatFee?: number;
  customOutcomeRates?: Record<string, number>;
  customActivityRates?: Record<string, number>;
  discountPercent?: number;
}

export interface PerformanceMultiplier {
  label: string;
  signalType: string; // outcome type the multiplier applies to ("*" = all)
  multiplier: number;
}

export interface InvoiceComputationInput {
  pkg: PricingPackageV2;
  isFirstCycle: boolean;
  seats: number;
  activityCounts: Record<string, number>; // verified billable activity signals
  outcomeCounts: Record<string, number>; // verified billable outcome signals
  workflowCounts: Record<string, number>;
  usageAmounts: Record<string, number>;
  totalSignals: number; // for overage vs includedSignals
  creditTopUps?: number;
  performanceMultipliers?: PerformanceMultiplier[];
  override?: ClientPricingOverrideV2;
  taxRatePercent?: number; // placeholder, e.g. 10
}

export interface InvoiceLine {
  component: BillingComponent;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ComputedInvoice {
  lineItems: InvoiceLine[];
  subtotal: number;
  tax: number;
  total: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function computeInvoice(input: InvoiceComputationInput): ComputedInvoice {
  const { pkg, override } = input;
  const lines: InvoiceLine[] = [];

  // Apply client overrides on top of the package defaults.
  const setupFee = override?.customSetupFee ?? pkg.setupFee;
  const platformFee = override?.customPlatformFeeMonthly ?? pkg.platformFeeMonthly;
  const seatFee = override?.customSeatFee ?? pkg.seatFee;
  const outcomeRates = { ...pkg.outcomeRates, ...(override?.customOutcomeRates ?? {}) };
  const activityRates = { ...pkg.activityRates, ...(override?.customActivityRates ?? {}) };

  const push = (
    component: BillingComponent,
    description: string,
    quantity: number,
    unitPrice: number
  ) => {
    const total = round(quantity * unitPrice);
    if (total !== 0) lines.push({ component, description, quantity, unitPrice, total });
  };

  // 1. Setup fee — first billing cycle only.
  if (input.isFirstCycle && setupFee > 0) {
    push("setup_fee", "Setup fee (first cycle)", 1, setupFee);
  }

  // 2. Platform / fixed fee.
  if (platformFee > 0) {
    push("platform_fee", "Platform fee", 1, platformFee);
  } else if (
    (pkg.pricingModel === "fixed" || pkg.pricingModel === "fte_equivalent") &&
    pkg.baseFee > 0
  ) {
    push("platform_fee", "Fixed monthly fee", 1, pkg.baseFee);
  }

  // 3. Seat fee — only seats beyond included.
  const billableSeats = Math.max(0, input.seats - pkg.includedSeats);
  if (seatFee > 0 && billableSeats > 0) {
    push("seat_fee", "Seats", billableSeats, seatFee);
  }

  // 4. Activity-based fees.
  for (const [type, rate] of Object.entries(activityRates)) {
    const qty = input.activityCounts[type] ?? 0;
    if (qty > 0 && rate > 0) push("activity_fee", `Activity: ${type}`, qty, rate);
  }

  // 5. Outcome-based fees (with performance multipliers).
  for (const [type, rate] of Object.entries(outcomeRates)) {
    const qty = input.outcomeCounts[type] ?? 0;
    if (qty <= 0 || rate <= 0) continue;
    const mult = (input.performanceMultipliers ?? [])
      .filter((m) => m.signalType === type || m.signalType === "*")
      .reduce((acc, m) => acc * m.multiplier, 1);
    const unit = round(rate * mult);
    const label =
      mult !== 1 ? `Outcome: ${type} (×${mult} performance)` : `Outcome: ${type}`;
    push("outcome_fee", label, qty, unit);
  }

  // 6. Workflow fees.
  for (const [type, rate] of Object.entries(pkg.workflowRates)) {
    const qty = input.workflowCounts[type] ?? 0;
    if (qty > 0 && rate > 0) push("workflow_fee", `Workflow: ${type}`, qty, rate);
  }

  // 7. Usage fees.
  for (const [type, rate] of Object.entries(pkg.usageRates)) {
    const amt = input.usageAmounts[type] ?? 0;
    if (amt > 0 && rate > 0) push("usage_fee", `Usage: ${type}`, amt, rate);
  }

  // 8. Overage — signals beyond the included allowance.
  const overage = Math.max(0, input.totalSignals - pkg.includedSignals);
  if (overage > 0 && pkg.overageRate > 0) {
    push("overage_fee", "Signal overage", overage, pkg.overageRate);
  }

  // 9. Credit top-up (appears as a positive line item).
  if (input.creditTopUps && input.creditTopUps > 0) {
    push("credit_topup", "Credit top-up", 1, input.creditTopUps);
  }

  // Running subtotal before discount.
  let subtotal = round(lines.reduce((s, l) => s + l.total, 0));

  // 10. Discount (percentage of subtotal).
  const discountPct = override?.discountPercent ?? 0;
  if (discountPct > 0) {
    const amount = round(-subtotal * (discountPct / 100));
    lines.push({
      component: "discount",
      description: `Discount (${discountPct}%)`,
      quantity: 1,
      unitPrice: amount,
      total: amount,
    });
    subtotal = round(subtotal + amount);
  }

  // 11. Tax placeholder.
  const taxRate = input.taxRatePercent ?? 0;
  const tax = round(subtotal * (taxRate / 100));
  const total = round(subtotal + tax);

  return { lineItems: lines, subtotal, tax, total };
}
