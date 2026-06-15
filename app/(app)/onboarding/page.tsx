"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Mail, Sparkles } from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { Field, TextInput, TextArea, Select } from "@/components/ui/Field";
import { useStore } from "@/lib/store";
import {
  AgentRole,
  AGENT_ROLES,
  AGENT_ROLE_LABELS,
  DEFAULT_VISIBILITY,
  Industry,
  INDUSTRIES,
  PricingModel,
  PRICING_MODEL_LABELS,
  USAGE_EVENT_LABELS,
  USAGE_EVENT_TYPES,
} from "@/lib/types";

export default function OnboardingPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<
    "vendor" | "client" | "hybrid"
  >("vendor");

  // client fields
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<Industry>("Healthcare");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [planId, setPlanId] = useState(state.pricingPlans[0]?.id ?? "");

  // agent fields
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentRole, setAgentRole] = useState<AgentRole>("receptionist");
  const [pricingModel, setPricingModel] = useState<PricingModel>("hybrid");
  const [cost, setCost] = useState("0");
  const [billableTypes, setBillableTypes] = useState<string[]>([
    "appointment_booked",
  ]);
  const [billingRules, setBillingRules] = useState("");

  const [newClientId, setNewClientId] = useState<string | null>(null);

  function createClient() {
    const id = `client-${Date.now()}`;
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    dispatch({
      type: "ADD_CLIENT",
      client: {
        id,
        vendorId: state.currentVendorId,
        name: name || "New Client",
        industry,
        logoInitial: initials || "NC",
        contactName,
        contactEmail,
        status: "active",
        pricingPlanId: planId,
        visibility: { ...DEFAULT_VISIBILITY },
      },
    });
    setNewClientId(id);
    setStep(2);
  }

  function createAgent() {
    if (!newClientId) return;
    dispatch({
      type: "ADD_AGENT",
      agent: {
        id: `agent-${Date.now()}`,
        vendorId: state.currentVendorId,
        name: agentName || `${industry} Agent`,
        clientId: newClientId,
        industry,
        role: agentRole,
        description: agentDescription || `AI agent for ${name}`,
        pricingModel,
        cost: Number(cost) || 0,
        billableOutcomeTypes: billableTypes,
        billingNotes: billingRules || undefined,
        currency: "JPY",
        status: "active",
      },
    });
    dispatch({ type: "TOAST", message: "Client and agent onboarded" });
    setStep(3);
  }

  function toggleBillable(type: string) {
    setBillableTypes((s) =>
      s.includes(type) ? s.filter((t) => t !== type) : [...s, type]
    );
  }

  return (
    <div>
      <Topbar
        title="Onboard Client"
        description="Create a client, deploy an AI agent, and set billing rules"
      />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        {step >= 1 && <Stepper step={step} />}

        {step === 0 && (
          <div className="mt-2">
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Who are you?
            </h2>
            <p className="mt-1 text-sm text-muted">
              AgentPayd works for both sides of the AI-agent relationship.
            </p>
            <div className="mt-5 space-y-3">
              <WhoCard
                title="I sell AI agents to clients"
                desc="Create an AI Vendor account — track work, prove value, invoice clients, protect margins."
                onClick={() => {
                  setAccountType("vendor");
                  setStep(1);
                }}
              />
              <WhoCard
                title="I pay AI vendors and want proof of value"
                desc="Create a Business Client account — require your vendors to report work, value, and invoices."
                onClick={() => router.push("/require-reporting")}
              />
              <WhoCard
                title="I am both"
                desc="A hybrid account — sell AI agents and verify the vendors you pay."
                onClick={() => {
                  setAccountType("hybrid");
                  setStep(1);
                }}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Create client</h2>
            <p className="mt-1 text-sm text-muted">
              This is your AI vendor&apos;s customer (e.g. a clinic).
            </p>
            <div className="mt-5 space-y-4">
              <Field label="Client name">
                <TextInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tokyo Skin Clinic"
                />
              </Field>
              <Field label="Industry">
                <Select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as Industry)}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact name">
                  <TextInput
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Dr. Tanaka"
                  />
                </Field>
                <Field label="Contact email">
                  <TextInput
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="ops@clinic.jp"
                  />
                </Field>
              </div>
              <Field label="Pricing plan">
                <Select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                >
                  {state.pricingPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={createClient} disabled={!name}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Add AI agent</h2>
            <p className="mt-1 text-sm text-muted">
              Deploy an agent for {name} and define how it bills.
            </p>
            <div className="mt-5 space-y-4">
              <Field label="Agent name">
                <TextInput
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Healthcare Voice Agent"
                />
              </Field>
              <Field label="Agent type">
                <Select
                  value={agentRole}
                  onChange={(e) => setAgentRole(e.target.value as AgentRole)}
                >
                  {AGENT_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {AGENT_ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="What it does">
                  <TextInput
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="e.g. Answers calls, books appointments"
                  />
                </Field>
                <Field label="Pricing model">
                  <Select
                    value={pricingModel}
                    onChange={(e) =>
                      setPricingModel(e.target.value as PricingModel)
                    }
                  >
                    {(Object.keys(PRICING_MODEL_LABELS) as PricingModel[]).map(
                      (m) => (
                        <option key={m} value={m}>
                          {PRICING_MODEL_LABELS[m]}
                        </option>
                      )
                    )}
                  </Select>
                </Field>
              </div>
              <Field label="Monthly agent cost (¥)" hint="Internal reference cost">
                <TextInput
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </Field>
              <Field label="Billable outcome types">
                <div className="flex flex-wrap gap-2">
                  {USAGE_EVENT_TYPES.map((type) => {
                    const active = billableTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleBillable(type)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-accent/40 bg-accentSoft text-accent"
                            : "border-border bg-bg text-muted hover:text-ink"
                        }`}
                      >
                        {USAGE_EVENT_LABELS[type]}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Billing rules">
                <TextArea
                  value={billingRules}
                  onChange={(e) => setBillingRules(e.target.value)}
                  placeholder="e.g. Base fee + ¥300 per confirmed booking; ¥80 per reminder."
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={createAgent} disabled={billableTypes.length === 0}>
                Create agent <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 rounded-2xl border border-accent/20 bg-surface p-8 text-center shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accentSoft text-accent">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-ink">
              {name} is onboarded
            </h2>
            <p className="mt-1 text-sm text-muted">
              Their AI agent is live. Add usage events, verify outcomes, and
              generate the first invoice.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Button
                variant="secondary"
                onClick={() => {
                  dispatch({
                    type: "ADD_CLIENT_INVITATION",
                    invitation: {
                      id: `cinv-${Date.now()}`,
                      vendorId: state.currentVendorId,
                      clientName: name || "New Client",
                      clientEmail: contactEmail || "client@example.jp",
                      status: "pending",
                      createdAt: new Date().toISOString(),
                    },
                  });
                  dispatch({
                    type: "TOAST",
                    message: "Client invited to view value reports",
                  });
                }}
              >
                <Mail className="h-4 w-4" />
                Invite client
              </Button>
              <Button
                onClick={() =>
                  newClientId &&
                  router.push(`/client-portal/${newClientId}`)
                }
              >
                <Sparkles className="h-4 w-4" />
                Open client portal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["Create client", "Add AI agent", "Done"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-accent text-white"
                  : active
                  ? "bg-accentSoft text-accent ring-1 ring-accent/40"
                  : "bg-white/5 text-muted"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            <span
              className={`hidden text-sm sm:block ${
                active ? "text-ink" : "text-muted"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="h-px flex-1 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function WhoCard({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-5 text-left shadow-card transition-colors hover:border-accent/40"
    >
      <div>
        <p className="text-base font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{desc}</p>
      </div>
      <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted" />
    </button>
  );
}
