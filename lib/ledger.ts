// =====================================================================
// Signal ledger + billing-cycle snapshots — the billing spine.
// =====================================================================
// Two guarantees that separate a billing system from a dashboard:
//
// 1. APPEND-ONLY + WRITE-TIME IDEMPOTENCY. A signal with a duplicate
//    idempotencyKey is rejected at append time and the existing entry is
//    returned — it is never billed twice, and existing entries are never
//    mutated.
//
// 2. FROZEN SNAPSHOTS. When a billing cycle closes, the exact signal IDs,
//    usage, value, and cost are frozen into a snapshot. Invoices read the
//    snapshot, so a finalized invoice never changes because new signals
//    arrived or a dashboard recomputed something.
//
// Pure functions — no DB, no side effects. The store/API call these.
// =====================================================================

import { UsageEvent } from "./types";

export interface LedgerAppendResult {
  ledger: UsageEvent[];
  accepted: boolean; // false when rejected as a duplicate
  entry: UsageEvent; // the accepted entry, or the existing one on duplicate
  reason?: string;
}

/**
 * Append a signal to the append-only ledger, enforcing idempotency at write
 * time. Returns the existing entry (and accepted=false) on a duplicate key.
 */
export function appendSignal(
  ledger: UsageEvent[],
  signal: UsageEvent
): LedgerAppendResult {
  if (signal.idempotencyKey) {
    const existing = ledger.find(
      (e) => e.idempotencyKey === signal.idempotencyKey
    );
    if (existing) {
      return {
        ledger, // unchanged — never append a duplicate
        accepted: false,
        entry: existing,
        reason: "duplicate idempotencyKey",
      };
    }
  }
  // Append a copy; existing entries are never mutated.
  const entry: UsageEvent = { ...signal };
  return { ledger: [...ledger, entry], accepted: true, entry };
}

export type BillingCycleStatus = "open" | "closed" | "invoiced" | "paid";

export interface BillingCycleSnapshot {
  id: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  closedAt: string;
  status: BillingCycleStatus;
  // The EXACT signals frozen into this cycle — invoices read from these IDs.
  signalIds: string[];
  billableSignalIds: string[];
  usageSnapshot: Record<string, number>; // signalType -> verified quantity
  valueSnapshot: number; // verified business value (JPY)
  billableSnapshot: number; // verified + billable amount (JPY)
  costSnapshot: number; // AI delivery cost allocated to the cycle (JPY)
}

// Only verified (incl. auto-verified, which sets status "verified") signals
// inside the window are eligible.
function eligibleSignals(
  ledger: UsageEvent[],
  clientId: string,
  periodStart: string,
  periodEnd: string
): UsageEvent[] {
  return ledger.filter(
    (e) =>
      e.clientId === clientId &&
      e.status === "verified" &&
      e.timestamp >= periodStart &&
      e.timestamp <= periodEnd
  );
}

/**
 * Freeze a billing cycle. The returned snapshot is a plain value — once
 * stored, it is never recomputed, so the invoice it backs is stable.
 */
export function closeBillingCycle(params: {
  ledger: UsageEvent[];
  clientId: string;
  periodStart: string;
  periodEnd: string;
  costForCycle: number;
}): BillingCycleSnapshot {
  const inWindow = eligibleSignals(
    params.ledger,
    params.clientId,
    params.periodStart,
    params.periodEnd
  );

  const usageSnapshot: Record<string, number> = {};
  let valueSnapshot = 0;
  let billableSnapshot = 0;
  const billableSignalIds: string[] = [];

  for (const e of inWindow) {
    usageSnapshot[e.eventType] = (usageSnapshot[e.eventType] ?? 0) + e.quantity;
    valueSnapshot += e.estimatedValue;
    if (e.billableAmount > 0) {
      billableSnapshot += e.billableAmount;
      billableSignalIds.push(e.id);
    }
  }

  return {
    id: `cycle-${params.clientId}-${params.periodStart.slice(0, 10)}-${Date.now()}`,
    clientId: params.clientId,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    closedAt: new Date().toISOString(),
    status: "closed",
    signalIds: inWindow.map((e) => e.id),
    billableSignalIds,
    usageSnapshot,
    valueSnapshot,
    billableSnapshot,
    costSnapshot: params.costForCycle,
  };
}

// Verified billable outcome counts for the pricing engine, read from a frozen
// snapshot's signal IDs (NOT live data) so invoices stay stable.
export function outcomeCountsFromSnapshot(
  snapshot: BillingCycleSnapshot
): Record<string, number> {
  return { ...snapshot.usageSnapshot };
}
