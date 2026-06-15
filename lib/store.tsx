"use client";

// =====================================================================
// AgentPayd in-memory store (two-sided, multi-vendor)
// =====================================================================
// React Context + reducer holding all mutable demo state on the client.
// This powers the live loop: simulate work, verify it, invoice it, and
// every page updates instantly. Not persisted — refresh = clean seed.
//
// Real backend later: swap reducer bodies for API/Supabase calls and
// hydrate from the server. Action shapes and selector inputs stay the same.
// =====================================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  ReactNode,
} from "react";
import {
  Agent,
  AuditEntry,
  Client,
  ClientAssumptions,
  ClientInvitation,
  ClientVisibility,
  CostEvent,
  EventStatus,
  Invoice,
  PricingPlan,
  Role,
  UsageEvent,
  USAGE_EVENT_LABELS,
  Vendor,
  VendorInvitation,
} from "./types";
import {
  AutomationSettings,
  DEFAULT_AUTOMATION_SETTINGS,
  assessEvent,
} from "./automation";
import {
  agents as seedAgents,
  clients as seedClients,
  clientInvitations as seedClientInvites,
  costEvents as seedCosts,
  invoices as seedInvoices,
  pricingPlans as seedPlans,
  usageEvents as seedEvents,
  vendorInvitations as seedVendorInvites,
  vendors as seedVendors,
  DEFAULT_VENDOR_ID,
} from "./seed";

export interface AppState {
  role: Role;
  currentVendorId: string; // which vendor the AI Vendor view is scoped to
  currentClientId: string | null; // which client a Business Client is scoped to
  vendors: Vendor[];
  clients: Client[];
  agents: Agent[];
  usageEvents: UsageEvent[];
  costEvents: CostEvent[];
  invoices: Invoice[];
  pricingPlans: PricingPlan[];
  vendorInvitations: VendorInvitation[];
  clientInvitations: ClientInvitation[];
  automation: AutomationSettings;
  auditLog: AuditEntry[];
  toast: string | null;
}

const firstClientForDefaultVendor =
  seedClients.find((c) => c.vendorId === DEFAULT_VENDOR_ID)?.id ?? null;

const initialState: AppState = {
  role: "ai_vendor",
  currentVendorId: DEFAULT_VENDOR_ID,
  currentClientId: firstClientForDefaultVendor,
  vendors: seedVendors,
  clients: seedClients,
  agents: seedAgents,
  usageEvents: seedEvents,
  costEvents: seedCosts,
  invoices: seedInvoices,
  pricingPlans: seedPlans,
  vendorInvitations: seedVendorInvites,
  clientInvitations: seedClientInvites,
  automation: { ...DEFAULT_AUTOMATION_SETTINGS },
  auditLog: [],
  toast: null,
};

export interface SimulatedWork {
  usageEvents: UsageEvent[];
  costEvent: CostEvent;
}

type Action =
  | { type: "SET_ROLE"; role: Role }
  | { type: "SET_CURRENT_VENDOR"; vendorId: string }
  | { type: "SET_CURRENT_CLIENT"; clientId: string }
  | { type: "ADD_CLIENT"; client: Client }
  | { type: "ADD_AGENT"; agent: Agent }
  | { type: "ADD_USAGE_EVENT"; event: UsageEvent }
  | {
      type: "VERIFY_EVENT";
      id: string;
      verifiedValue?: number;
      billableAmount?: number;
      proofNote?: string;
    }
  | { type: "REJECT_EVENT"; id: string }
  | { type: "ADD_COST_EVENT"; cost: CostEvent }
  | { type: "ADD_INVOICE"; invoice: Invoice }
  | { type: "SET_INVOICE_STATUS"; id: string; status: Invoice["status"] }
  | { type: "SET_INVOICE_PAYMENT_LINK"; id: string; link: string }
  | { type: "SIMULATE_WORK"; payload: SimulatedWork }
  | {
      type: "SET_CLIENT_VISIBILITY";
      clientId: string;
      visibility: Partial<ClientVisibility>;
    }
  | { type: "ADD_VENDOR_INVITATION"; invitation: VendorInvitation }
  | { type: "SET_VENDOR_INVITATION_STATUS"; id: string; status: VendorInvitation["status"] }
  | { type: "ADD_CLIENT_INVITATION"; invitation: ClientInvitation }
  | { type: "ADD_VENDOR"; vendor: Vendor }
  | {
      type: "SET_CLIENT_ASSUMPTIONS";
      clientId: string;
      assumptions: ClientAssumptions;
    }
  | { type: "SET_AGENT_FINANCIALS"; agentId: string; financials: Partial<Agent> }
  | { type: "SET_AUTOMATION_SETTINGS"; settings: Partial<AutomationSettings> }
  | {
      type: "ADD_AUTOMATED_EVENTS";
      events: UsageEvent[];
      costEvent?: CostEvent;
      auditEntries: AuditEntry[];
    }
  | { type: "RUN_AUTOPILOT" }
  | { type: "HYDRATE"; state: AppState }
  | { type: "RESET_DEMO" }
  | { type: "TOAST"; message: string | null };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      // Replace the whole tree from persisted storage (Pilot Mode).
      return { ...action.state, toast: null };
    case "RESET_DEMO":
      return { ...initialState };
    case "ADD_VENDOR":
      return {
        ...state,
        vendors: [...state.vendors, action.vendor],
        currentVendorId: action.vendor.id,
      };
    case "SET_ROLE":
      return { ...state, role: action.role };
    case "SET_CURRENT_VENDOR": {
      const firstClient =
        state.clients.find((c) => c.vendorId === action.vendorId)?.id ?? null;
      return {
        ...state,
        currentVendorId: action.vendorId,
        currentClientId: firstClient,
      };
    }
    case "SET_CURRENT_CLIENT":
      return { ...state, currentClientId: action.clientId };
    case "ADD_CLIENT":
      return { ...state, clients: [...state.clients, action.client] };
    case "ADD_AGENT":
      return { ...state, agents: [...state.agents, action.agent] };
    case "ADD_USAGE_EVENT":
      return { ...state, usageEvents: [action.event, ...state.usageEvents] };
    case "SET_AUTOMATION_SETTINGS":
      return {
        ...state,
        automation: { ...state.automation, ...action.settings },
      };
    case "SET_CLIENT_ASSUMPTIONS":
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.clientId
            ? { ...c, assumptions: action.assumptions }
            : c
        ),
      };
    case "SET_AGENT_FINANCIALS":
      return {
        ...state,
        agents: state.agents.map((ag) =>
          ag.id === action.agentId ? { ...ag, ...action.financials } : ag
        ),
      };
    case "ADD_AUTOMATED_EVENTS":
      return {
        ...state,
        usageEvents: [...action.events, ...state.usageEvents],
        costEvents: action.costEvent
          ? [action.costEvent, ...state.costEvents]
          : state.costEvents,
        auditLog: [...action.auditEntries, ...state.auditLog],
      };
    case "RUN_AUTOPILOT": {
      const keys = new Set(
        state.usageEvents
          .map((e) => e.idempotencyKey)
          .filter((k): k is string => Boolean(k))
      );
      const newAudit: AuditEntry[] = [];
      const usageEvents = state.usageEvents.map((e) => {
        if (e.status !== "pending") return e;
        // Re-assess each pending event under the current settings.
        const seen = e.idempotencyKey ? keys.has(e.idempotencyKey) : false;
        const a = assessEvent(e, {
          mode: state.automation.verificationMode,
          threshold: state.automation.confidenceThreshold,
          maxNormalValue: state.automation.maxNormalValue,
          isDuplicate: e.duplicateCheckStatus === "duplicate" || false,
        });
        void seen;
        const updated: UsageEvent = {
          ...e,
          verificationMode: state.automation.verificationMode,
          confidenceScore: a.confidenceScore,
          proofSources: a.proofSources,
          riskFlags: a.riskFlags,
          autoVerified: a.autoVerified,
          requiresHumanReview: a.requiresHumanReview,
          duplicateCheckStatus: a.duplicateCheckStatus,
          sourceTrustLevel: a.sourceTrustLevel,
          status: a.autoVerified ? ("verified" as EventStatus) : e.status,
        };
        if (a.autoVerified) {
          newAudit.push({
            id: `audit-${e.id}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            eventId: e.id,
            eventLabel: USAGE_EVENT_LABELS[e.eventType] ?? e.eventType,
            clientId: e.clientId,
            action: "auto_verified",
            by: "system",
            confidenceScore: a.confidenceScore,
            proofSources: a.proofSources,
            riskFlags: a.riskFlags,
            invoiceImpact: e.billableAmount > 0,
            roiImpact: true,
            reason: a.reason,
          });
        }
        return updated;
      });
      return { ...state, usageEvents, auditLog: [...newAudit, ...state.auditLog] };
    }
    case "VERIFY_EVENT": {
      const target = state.usageEvents.find((e) => e.id === action.id);
      const audit: AuditEntry[] = target
        ? [
            {
              id: `audit-${action.id}-${Date.now()}`,
              timestamp: new Date().toISOString(),
              eventId: action.id,
              eventLabel:
                USAGE_EVENT_LABELS[target.eventType] ?? target.eventType,
              clientId: target.clientId,
              action: "verified",
              by: "human",
              confidenceScore: target.confidenceScore,
              proofSources: target.proofSources,
              riskFlags: target.riskFlags,
              invoiceImpact:
                (action.billableAmount ?? target.billableAmount) > 0,
              roiImpact: true,
              reason: "Manually verified by agency.",
            },
          ]
        : [];
      return {
        ...state,
        auditLog: [...audit, ...state.auditLog],
        usageEvents: state.usageEvents.map((e) =>
          e.id === action.id
            ? {
                ...e,
                status: "verified" as EventStatus,
                estimatedValue: action.verifiedValue ?? e.estimatedValue,
                billableAmount: action.billableAmount ?? e.billableAmount,
                proofNote: action.proofNote ?? e.proofNote,
              }
            : e
        ),
      };
    }
    case "REJECT_EVENT": {
      const target = state.usageEvents.find((e) => e.id === action.id);
      const audit: AuditEntry[] = target
        ? [
            {
              id: `audit-${action.id}-${Date.now()}`,
              timestamp: new Date().toISOString(),
              eventId: action.id,
              eventLabel:
                USAGE_EVENT_LABELS[target.eventType] ?? target.eventType,
              clientId: target.clientId,
              action: "rejected",
              by: "human",
              confidenceScore: target.confidenceScore,
              proofSources: target.proofSources,
              riskFlags: target.riskFlags,
              invoiceImpact: false,
              roiImpact: false,
              reason: "Manually rejected by agency.",
            },
          ]
        : [];
      return {
        ...state,
        auditLog: [...audit, ...state.auditLog],
        usageEvents: state.usageEvents.map((e) =>
          e.id === action.id ? { ...e, status: "rejected" as EventStatus } : e
        ),
      };
    }
    case "ADD_COST_EVENT":
      return { ...state, costEvents: [action.cost, ...state.costEvents] };
    case "ADD_INVOICE":
      return { ...state, invoices: [action.invoice, ...state.invoices] };
    case "SET_INVOICE_STATUS":
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.id ? { ...i, status: action.status } : i
        ),
      };
    case "SET_INVOICE_PAYMENT_LINK":
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.id ? { ...i, paymentLink: action.link } : i
        ),
      };
    case "SIMULATE_WORK":
      return {
        ...state,
        usageEvents: [...action.payload.usageEvents, ...state.usageEvents],
        costEvents: [action.payload.costEvent, ...state.costEvents],
      };
    case "SET_CLIENT_VISIBILITY":
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.clientId
            ? { ...c, visibility: { ...c.visibility, ...action.visibility } }
            : c
        ),
      };
    case "ADD_VENDOR_INVITATION":
      return {
        ...state,
        vendorInvitations: [action.invitation, ...state.vendorInvitations],
      };
    case "SET_VENDOR_INVITATION_STATUS":
      return {
        ...state,
        vendorInvitations: state.vendorInvitations.map((v) =>
          v.id === action.id ? { ...v, status: action.status } : v
        ),
      };
    case "ADD_CLIENT_INVITATION":
      return {
        ...state,
        clientInvitations: [action.invitation, ...state.clientInvitations],
      };
    case "TOAST":
      return { ...state, toast: action.message };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** The currently-scoped vendor (Cabot by default). */
  vendor: Vendor;
}

const StoreContext = createContext<StoreContextValue | null>(null);

// Pilot Mode persistence: state is saved to localStorage so real pilot
// input survives a refresh. TEMPORARY — the Supabase service layer in
// lib/persistence.ts + supabase/schema.sql is the production path.
const STORAGE_KEY = "agentpayd_pilot_state_v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage AFTER mount (initial render uses seed on both
  // server and client, so there is no hydration mismatch).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed && Array.isArray(parsed.vendors)) {
          dispatch({ type: "HYDRATE", state: parsed });
        }
      }
    } catch {
      /* ignore corrupt storage; fall back to seed */
    }
  }, []);

  // Persist on every change (skip the transient toast field).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const { toast, ...persistable } = state;
      void toast;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      /* storage full or unavailable — ignore */
    }
  }, [state]);

  const vendor =
    state.vendors.find((v) => v.id === state.currentVendorId) ??
    state.vendors[0];
  const value = useMemo(() => ({ state, dispatch, vendor }), [state, vendor]);
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}
