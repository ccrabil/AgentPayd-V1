"use client";

import Topbar from "@/components/Topbar";
import { useStore } from "@/lib/store";
import { allAgentMetrics, getClient, eventsForAgent } from "@/lib/selectors";
import { formatJPY, formatNumber } from "@/lib/format";
import { AGENT_ROLE_LABELS, PRICING_MODEL_LABELS } from "@/lib/types";

export default function AgentsPage() {
  const { state } = useStore();
  const metrics = allAgentMetrics(state);

  return (
    <div>
      <Topbar
        title="AI Agents"
        description="Each agent's events, revenue, AI cost, margin and top client"
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {metrics.map((m) => {
            const client = getClient(state, m.agent.clientId);
            // top client = the single client this agent serves in the demo,
            // but compute generically in case an agent serves several.
            const byClient = new Map<string, number>();
            eventsForAgent(state, m.agent.id).forEach((e) => {
              byClient.set(
                e.clientId,
                (byClient.get(e.clientId) ?? 0) + e.billableAmount
              );
            });
            const topClientId = [...byClient.entries()].sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0];
            const topClient = topClientId
              ? getClient(state, topClientId)
              : client;

            return (
              <div
                key={m.agent.id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">{m.agent.name}</p>
                    <p className="text-xs text-muted">
                      {m.agent.industry}
                      {m.agent.role
                        ? ` · ${AGENT_ROLE_LABELS[m.agent.role]}`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-medium text-muted">
                    {PRICING_MODEL_LABELS[m.agent.pricingModel]}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Metric label="Events" value={formatNumber(m.eventsProcessed)} />
                  <Metric label="Revenue" value={formatJPY(m.revenue)} />
                  <Metric label="AI cost" value={formatJPY(m.aiCost)} muted />
                  <Metric label="Margin" value={formatJPY(m.margin)} accent />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
                  <span>
                    Top client:{" "}
                    <span className="text-ink">{topClient?.name ?? "—"}</span>
                  </span>
                  <span>
                    Value proven:{" "}
                    <span className="text-ink">
                      {formatJPY(m.verifiedValue)}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold ${
          accent ? "text-accent" : muted ? "text-muted" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
