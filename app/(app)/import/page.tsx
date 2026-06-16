"use client";

import { useState } from "react";
import { Upload, Check, AlertTriangle, FileText } from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { useStore } from "@/lib/store";
import {
  USAGE_EVENT_TYPES,
  UsageEventType,
  EventSource,
} from "@/lib/types";

const EXPECTED = [
  "date",
  "clientId",
  "agentId",
  "eventType",
  "description",
  "estimatedValue",
  "billable",
  "billingRate",
  "source",
  "customerReference",
  "proofNote",
];

const SAMPLE = `date,clientId,agentId,eventType,description,estimatedValue,billable,billingRate,source,customerReference,proofNote
2026-06-14,client-tokyo-skin,agent-voice,appointment_booked,Booked laser consult,24000,true,300,CRM,cust_001,Confirmed in CRM
2026-06-14,client-tokyo-skin,agent-voice,call_answered,After-hours call,1800,true,120,LINE,cust_002,Call log A-99`;

interface ParsedRow {
  raw: Record<string, string>;
  valid: boolean;
  errors: string[];
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => (raw[h] = (cells[i] ?? "").trim()));
    const errors: string[] = [];
    if (!raw.clientId) errors.push("missing clientId");
    if (!raw.agentId) errors.push("missing agentId");
    if (!USAGE_EVENT_TYPES.includes(raw.eventType as UsageEventType))
      errors.push("unknown eventType");
    if (raw.estimatedValue && Number(raw.estimatedValue) < 0)
      errors.push("negative estimatedValue");
    return { raw, valid: errors.length === 0, errors };
  });
}

export default function ImportPage() {
  const { state, dispatch } = useStore();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setRows(parseCsv(String(reader.result)));
    reader.readAsText(file);
  }

  function loadSample() {
    setFileName("sample.csv");
    setRows(parseCsv(SAMPLE));
  }

  function importValid() {
    const valid = rows.filter((r) => r.valid);
    valid.forEach((r, i) => {
      const client = state.clients.find((c) => c.id === r.raw.clientId);
      dispatch({
        type: "ADD_USAGE_EVENT",
        event: {
          id: `evt-csv-${Date.now()}-${i}`,
          vendorId: client?.vendorId ?? state.currentVendorId,
          clientId: r.raw.clientId,
          agentId: r.raw.agentId,
          timestamp: r.raw.date
            ? new Date(r.raw.date).toISOString()
            : new Date().toISOString(),
          eventType: r.raw.eventType as UsageEventType,
          quantity: 1,
          description: r.raw.description || "Imported event",
          estimatedValue: Number(r.raw.estimatedValue) || 0,
          billableAmount:
            r.raw.billable === "true" ? Number(r.raw.billingRate) || 0 : 0,
          staffMinutesSaved: 0,
          source: (r.raw.source as EventSource) || "Manual",
          customerName: r.raw.customerReference || undefined,
          proofNote: r.raw.proofNote || undefined,
          status: "pending",
        },
      });
    });
    dispatch({
      type: "TOAST",
      message: `${valid.length} rows imported as pending events`,
    });
    setRows([]);
    setFileName("");
  }

  const validCount = rows.filter((r) => r.valid).length;

  return (
    <div>
      <Topbar
        title="CSV Import"
        description="Bulk-import outcomes from a spreadsheet — rows become pending events"
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Expected format */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Expected columns</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXPECTED.map((c) => (
              <code
                key={c}
                className="rounded-md border border-border bg-bg px-2 py-0.5 font-mono text-xs text-ink"
              >
                {c}
              </code>
            ))}
          </div>
        </section>

        {/* Upload */}
        <section className="rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accentSoft text-accent">
            <Upload className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm text-ink">Upload a CSV file</p>
          <p className="text-xs text-muted">or load the sample to preview</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-ink hover:border-accent/40">
              <FileText className="h-4 w-4" />
              Choose file
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={onFile}
                className="hidden"
              />
            </label>
            <Button variant="secondary" onClick={loadSample}>
              Load sample
            </Button>
          </div>
          {fileName && (
            <p className="mt-3 text-xs text-muted">Loaded: {fileName}</p>
          )}
        </section>

        {/* Preview */}
        {rows.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">
                Preview ({validCount}/{rows.length} valid)
              </h2>
              <Button onClick={importValid} disabled={validCount === 0}>
                <Check className="h-4 w-4" />
                Import {validCount} valid rows
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Agent</th>
                      <th className="px-4 py-3 font-medium">Event</th>
                      <th className="px-4 py-3 font-medium">Value</th>
                      <th className="px-4 py-3 font-medium">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-surface2">
                        <td className="px-4 py-3">
                          {r.valid ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <Check className="h-3.5 w-3.5" /> ok
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-danger">
                              <AlertTriangle className="h-3.5 w-3.5" /> error
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink">{r.raw.clientId}</td>
                        <td className="px-4 py-3 text-muted">{r.raw.agentId}</td>
                        <td className="px-4 py-3 text-muted">{r.raw.eventType}</td>
                        <td className="px-4 py-3 text-ink">
                          {r.raw.estimatedValue}
                        </td>
                        <td className="px-4 py-3 text-xs text-danger">
                          {r.errors.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
