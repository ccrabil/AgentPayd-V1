"use client";

import { useState } from "react";
import { Plus, Activity } from "lucide-react";
import Topbar from "@/components/Topbar";
import Button from "@/components/ui/Button";
import { EventStatusBadge } from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import AddEventModal from "@/components/AddEventModal";
import { useStore } from "@/lib/store";
import { getClient, getAgent } from "@/lib/selectors";
import { formatJPY, formatDateTime } from "@/lib/format";
import { USAGE_EVENT_LABELS } from "@/lib/types";

export default function EventsPage() {
  const { state } = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  const events = [...state.usageEvents].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div>
      <Topbar
        title="Usage Events"
        description="Every metered action your AI agents performed"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add event
          </Button>
        }
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {events.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No usage events yet"
            description="Add an event manually, or run the Healthcare Demo to simulate a patient call."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add event
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Agent</th>
                    <th className="px-5 py-3 font-medium">Event type</th>
                    <th className="px-5 py-3 font-medium">Qty</th>
                    <th className="px-5 py-3 font-medium">Billable</th>
                    <th className="px-5 py-3 font-medium">Est. value</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((e) => {
                    const client = getClient(state, e.clientId);
                    const agent = getAgent(state, e.agentId);
                    return (
                      <tr key={e.id} className="hover:bg-surface2">
                        <td className="px-5 py-4 whitespace-nowrap text-muted">
                          {formatDateTime(e.timestamp)}
                        </td>
                        <td className="px-5 py-4 text-ink">{client?.name}</td>
                        <td className="px-5 py-4 text-muted">{agent?.name}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-md border border-border bg-bg px-2 py-0.5 font-mono text-xs text-ink">
                            {USAGE_EVENT_LABELS[e.eventType]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-ink">{e.quantity}</td>
                        <td className="px-5 py-4 text-ink">
                          {e.billableAmount > 0
                            ? formatJPY(e.billableAmount)
                            : "—"}
                        </td>
                        <td className="px-5 py-4 font-semibold text-ink">
                          {formatJPY(e.estimatedValue)}
                        </td>
                        <td className="px-5 py-4">
                          <EventStatusBadge status={e.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AddEventModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
