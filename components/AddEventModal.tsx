"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Field, TextInput, TextArea, Select } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import {
  EVENT_SOURCES,
  EventSource,
  EventStatus,
  USAGE_EVENT_LABELS,
  USAGE_EVENT_TYPES,
  UsageEventType,
} from "@/lib/types";
import { agentsForClient } from "@/lib/selectors";

/**
 * Manual "Add Agent Event" modal. Lets a Vendor Admin log a usage event
 * by hand (the same shape the POST /api/events endpoint would accept).
 */
export default function AddEventModal({
  open,
  onClose,
  defaultClientId,
}: {
  open: boolean;
  onClose: () => void;
  defaultClientId?: string;
}) {
  const { state, dispatch } = useStore();
  const vendorClients = state.clients.filter(
    (c) => c.vendorId === state.currentVendorId
  );
  const [clientId, setClientId] = useState(
    defaultClientId ?? vendorClients[0]?.id ?? ""
  );
  const clientAgents = agentsForClient(state, clientId);
  const [agentId, setAgentId] = useState(clientAgents[0]?.id ?? "");
  const [eventType, setEventType] = useState<UsageEventType>(
    "appointment_booked"
  );
  const [description, setDescription] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("12000");
  const [verifiedValue, setVerifiedValue] = useState("");
  const [billable, setBillable] = useState(true);
  const [billingRate, setBillingRate] = useState("300");
  const [source, setSource] = useState<EventSource>("Manual");
  const [customerName, setCustomerName] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [staffMinutes, setStaffMinutes] = useState("8");
  const [status, setStatus] = useState<EventStatus>("pending");

  if (!open) return null;

  // keep agent selection valid when client changes
  const agentsForThisClient = agentsForClient(state, clientId);
  const effectiveAgentId =
    agentsForThisClient.find((a) => a.id === agentId)?.id ??
    agentsForThisClient[0]?.id ??
    "";

  function submit() {
    if (!clientId || !effectiveAgentId) return;
    const est = Number(estimatedValue) || 0;
    const ver = verifiedValue === "" ? null : Number(verifiedValue);
    dispatch({
      type: "ADD_USAGE_EVENT",
      event: {
        id: `evt-${Date.now()}`,
        vendorId:
          state.clients.find((c) => c.id === clientId)?.vendorId ??
          state.currentVendorId,
        clientId,
        agentId: effectiveAgentId,
        timestamp: new Date().toISOString(),
        eventType,
        quantity: 1,
        description: description || USAGE_EVENT_LABELS[eventType],
        estimatedValue: status === "verified" && ver !== null ? ver : est,
        billableAmount: billable ? Number(billingRate) || 0 : 0,
        staffMinutesSaved: Number(staffMinutes) || 0,
        source,
        customerName: customerName || undefined,
        proofNote: proofNote || undefined,
        status,
      },
    });
    dispatch({
      type: "TOAST",
      message:
        status === "verified"
          ? "Event added and verified"
          : "Event added — pending verification",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-6 shadow-card sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Add agent event</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client">
              <Select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  const next = agentsForClient(state, e.target.value)[0]?.id ?? "";
                  setAgentId(next);
                }}
              >
                {vendorClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Agent">
              <Select
                value={effectiveAgentId}
                onChange={(e) => setAgentId(e.target.value)}
              >
                {agentsForThisClient.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Event type">
            <Select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as UsageEventType)}
            >
              {USAGE_EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {USAGE_EVENT_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Description">
            <TextInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did the agent do?"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Estimated value (¥)">
              <TextInput
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
              />
            </Field>
            <Field label="Verified value (¥)" hint="Optional — set on verify">
              <TextInput
                type="number"
                value={verifiedValue}
                onChange={(e) => setVerifiedValue(e.target.value)}
                placeholder="—"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Billable?">
              <Select
                value={billable ? "yes" : "no"}
                onChange={(e) => setBillable(e.target.value === "yes")}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <Select
                value={source}
                onChange={(e) => setSource(e.target.value as EventSource)}
              >
                {EVENT_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Staff minutes saved">
              <TextInput
                type="number"
                value={staffMinutes}
                onChange={(e) => setStaffMinutes(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Customer name" hint="Optional, no PII / medical data">
            <TextInput
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Returning patient"
            />
          </Field>

          <Field label="Proof note">
            <TextArea
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              placeholder="Call log ID, booking ref, etc."
            />
          </Field>

          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
            >
              <option value="pending">Pending verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </Select>
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Add event</Button>
        </div>
      </div>
    </div>
  );
}
