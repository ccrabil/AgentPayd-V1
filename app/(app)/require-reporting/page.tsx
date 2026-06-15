"use client";

import { useState } from "react";
import { ClipboardCheck, Send, Check, X, Building2 } from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { Field, TextInput, TextArea, Select } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { Pill } from "@/components/ui/StatusBadge";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { INDUSTRIES, Industry, VendorInvitation } from "@/lib/types";

/**
 * Client-mandated adoption: a Business Client invites / requires an AI
 * Vendor to report AI work, value, and invoices through AgentPayd. Vendors
 * accept the request and start reporting.
 */
export default function RequireReportingPage() {
  const { state, dispatch } = useStore();

  const [clientName, setClientName] = useState("Tokyo Skin Clinic");
  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [industry, setIndustry] = useState<Industry>("Healthcare");
  const [requirement, setRequirement] = useState(
    "Report all AI work, value, and invoices through AgentPayd before monthly invoices are approved."
  );
  const [track, setTrack] = useState({
    work: true,
    outcomes: true,
    invoice: true,
    roi: true,
  });

  function invite() {
    if (!vendorName || !vendorEmail) return;
    const inv: VendorInvitation = {
      id: `vinv-${Date.now()}`,
      clientId: null,
      clientName: clientName || "Your company",
      vendorName,
      vendorEmail,
      industry,
      reportingRequirement: requirement,
      trackWorkCompleted: track.work,
      trackOutcomes: track.outcomes,
      trackInvoiceJustification: track.invoice,
      trackRoi: track.roi,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_VENDOR_INVITATION", invitation: inv });
    dispatch({ type: "TOAST", message: "Reporting request sent to vendor" });
    setVendorName("");
    setVendorEmail("");
  }

  const trackToggles: { key: keyof typeof track; label: string }[] = [
    { key: "work", label: "Work completed" },
    { key: "outcomes", label: "Outcomes" },
    { key: "invoice", label: "Invoice justification" },
    { key: "roi", label: "ROI" },
  ];

  return (
    <div>
      <Topbar
        title="Require Vendor Reporting"
        description="Invite your AI vendor to report AI work, value, and invoices through AgentPayd"
      />

      <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-5 lg:px-8">
        {/* Invite form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-1 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentSoft text-accent">
                <Building2 className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold text-ink">
                Invite an AI vendor
              </h2>
            </div>
            <p className="mb-5 text-sm text-muted">
              Require the AI vendors you pay to prove their work and value on one
              neutral platform.
            </p>

            <div className="space-y-4">
              <Field label="Your company name">
                <TextInput
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Vendor company name">
                  <TextInput
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Cabot Healthcare AI Demo"
                  />
                </Field>
                <Field label="Vendor contact email">
                  <TextInput
                    type="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="billing@vendor.jp"
                  />
                </Field>
              </div>
              <Field label="Industry">
                <Select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as Industry)}
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="What should be tracked?">
                <div className="flex flex-wrap gap-2">
                  {trackToggles.map((t) => {
                    const active = track[t.key];
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() =>
                          setTrack((s) => ({ ...s, [t.key]: !s[t.key] }))
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-accent/40 bg-accentSoft text-accent"
                            : "border-border bg-bg text-muted hover:text-ink"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Reporting requirement">
                <TextArea
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={invite} disabled={!vendorName || !vendorEmail}>
                <Send className="h-4 w-4" />
                Send reporting request
              </Button>
            </div>
          </div>
        </div>

        {/* How it works + requests list */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-accent/20 bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold text-ink">How it works</h3>
            <ol className="mt-3 space-y-2 text-sm text-muted">
              <li>1. You require your vendor to report through AgentPayd.</li>
              <li>2. The vendor accepts and connects their AI agent.</li>
              <li>3. They send usage, cost, and outcome events.</li>
              <li>4. Your client portal becomes active with proof and ROI.</li>
            </ol>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">
              Reporting requests
            </h3>
            {state.vendorInvitations.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No requests yet"
                description="Invite a vendor to start requiring reporting."
              />
            ) : (
              <div className="space-y-2">
                {state.vendorInvitations.map((inv) => (
                  <InvitationCard key={inv.id} id={inv.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvitationCard({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const inv = state.vendorInvitations.find((v) => v.id === id)!;

  const tone =
    inv.status === "accepted"
      ? "success"
      : inv.status === "declined"
      ? "danger"
      : "warning";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{inv.vendorName}</p>
        <Pill
          tone={tone as "success" | "danger" | "warning"}
          label={inv.status}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {inv.clientName} · {inv.industry} · {formatDate(inv.createdAt)}
      </p>
      <p className="mt-2 text-xs text-muted">{inv.reportingRequirement}</p>
      {inv.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              dispatch({
                type: "SET_VENDOR_INVITATION_STATUS",
                id: inv.id,
                status: "accepted",
              });
              dispatch({
                type: "TOAST",
                message: "Vendor accepted — reporting connected (demo)",
              });
            }}
          >
            <Check className="h-4 w-4" />
            Vendor accepts
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              dispatch({
                type: "SET_VENDOR_INVITATION_STATUS",
                id: inv.id,
                status: "declined",
              })
            }
          >
            <X className="h-4 w-4" />
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}
