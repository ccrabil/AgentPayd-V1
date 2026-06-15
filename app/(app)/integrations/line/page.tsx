"use client";

import { useState } from "react";
import { MessageCircle, ShieldAlert, Webhook, Copy } from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { useStore } from "@/lib/store";

const MAPPINGS: { line: string; event: string }[] = [
  { line: "Message “予約したい”", event: "appointment_requested" },
  { line: "Booking confirmation postback", event: "appointment_booked" },
  { line: "Payment confirmation", event: "payment_collected" },
  { line: "Follow-up response", event: "booking_recovered" },
  { line: "No-show reminder confirmation", event: "no_show_prevented" },
];

export default function LineIntegrationPage() {
  const { dispatch } = useStore();
  const [channelId, setChannelId] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const webhookUrl = "https://your-app.vercel.app/api/integrations/line/webhook";

  return (
    <div>
      <Topbar
        title="LINE Integration"
        description="Connect a LINE Official Account so agent outcomes flow into AgentPayd"
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-warning/20 bg-warningSoft px-4 py-3 text-sm text-warning">
          Pilot Mode: this is the technical integration path. The webhook route
          exists as a placeholder; signature verification and a production LINE
          bot are not enabled yet.
        </div>

        {/* Connect */}
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accentSoft text-accent">
              <MessageCircle className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-ink">
              Connect LINE Official Account
            </h2>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Channel ID">
              <TextInput
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="placeholder"
              />
            </Field>
            <Field label="Channel secret" hint="Stored hashed in production">
              <TextInput
                type="password"
                value={channelSecret}
                onChange={(e) => setChannelSecret(e.target.value)}
                placeholder="placeholder"
              />
            </Field>
            <Field label="Channel access token" hint="Stored hashed">
              <TextInput
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="placeholder"
              />
            </Field>
          </div>

          <div className="mt-5">
            <p className="mb-1.5 text-sm font-medium text-ink">Webhook URL</p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-bg px-4 py-3">
              <code className="truncate font-mono text-sm text-ink">
                {webhookUrl}
              </code>
              <button
                onClick={() =>
                  dispatch({ type: "TOAST", message: "Webhook URL copied" })
                }
                className="ml-3 shrink-0 text-muted hover:text-ink"
                aria-label="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              onClick={() =>
                dispatch({
                  type: "TOAST",
                  message: "LINE connection saved (placeholder)",
                })
              }
            >
              Save connection
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch({
                  type: "TOAST",
                  message: "Webhook verification stubbed in Pilot Mode",
                })
              }
            >
              <Webhook className="h-4 w-4" />
              Verify webhook
            </Button>
          </div>
        </section>

        {/* Mappings */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink">
            Event mapping rules
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-medium">LINE signal</th>
                  <th className="px-5 py-3 font-medium">AgentPayd event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MAPPINGS.map((m) => (
                  <tr key={m.event}>
                    <td className="px-5 py-3 text-ink">{m.line}</td>
                    <td className="px-5 py-3">
                      <code className="font-mono text-xs text-accent">
                        {m.event}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            All LINE-derived events are created as{" "}
            <span className="font-mono">pending_verification</span> and must be
            verified before they count toward ROI or invoices.
          </p>
        </section>

        {/* Privacy */}
        <section className="rounded-2xl border border-danger/20 bg-dangerSoft px-5 py-4">
          <div className="flex items-start gap-2.5 text-sm text-danger">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">Privacy:</span> do not collect
              unnecessary personal data. Do not store full medical, legal, or
              customer conversations unless explicitly needed and legally
              allowed. Store a <span className="font-mono">customerReference</span>{" "}
              instead of personal data wherever possible.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
