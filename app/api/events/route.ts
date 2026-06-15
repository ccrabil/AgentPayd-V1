// =====================================================================
// POST /api/events — ingest an AI-agent outcome event
// =====================================================================
// Real Next.js route handler with auth, validation, and idempotency.
// Pilot Mode stores accepted events in a server-side in-memory map (per
// runtime); in production this writes to the `events` table (see
// supabase/schema.sql). API-submitted events are always created as
// `pending_verification` and do NOT count toward ROI/invoices until a
// vendor verifies them in the app.
// =====================================================================

import { NextResponse } from "next/server";
import { clients, agents } from "@/lib/seed";
import { USAGE_EVENT_TYPES, UsageEventType } from "@/lib/types";

// Demo API key for the pilot. In production, look up a hashed key in the
// `api_keys` table and scope the request to that key's vendor.
const DEMO_API_KEY = "ap_demo_pilot_key_2026";

// Idempotency + storage (per server runtime; resets on redeploy).
const seenEvents = new Map<string, Record<string, unknown>>();

interface EventBody {
  idempotencyKey?: string;
  clientId?: string;
  agentId?: string;
  eventType?: string;
  description?: string;
  estimatedValue?: number;
  billable?: boolean;
  billingRate?: number;
  source?: string;
  customerReference?: string;
  proofNote?: string;
}

function err(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  // 1. Auth
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== DEMO_API_KEY) {
    return err(401, "Unauthorized: missing or invalid API key");
  }

  // 2. Parse
  let body: EventBody;
  try {
    body = (await req.json()) as EventBody;
  } catch {
    return err(400, "Invalid JSON body");
  }

  // 3. Idempotency — return the existing event, never duplicate
  if (body.idempotencyKey && seenEvents.has(body.idempotencyKey)) {
    return NextResponse.json(
      { event: seenEvents.get(body.idempotencyKey), idempotent: true },
      { status: 200 }
    );
  }

  // 4. Required fields
  if (!body.clientId) return err(400, "Missing clientId");
  if (!body.agentId) return err(400, "Missing agentId");
  if (!body.eventType) return err(400, "Missing eventType");

  // 5. Known event type
  if (!USAGE_EVENT_TYPES.includes(body.eventType as UsageEventType)) {
    return err(400, `Unknown eventType: ${body.eventType}`);
  }

  // 6. Non-negative values
  if (typeof body.estimatedValue === "number" && body.estimatedValue < 0) {
    return err(400, "estimatedValue must be >= 0");
  }
  if (typeof body.billingRate === "number" && body.billingRate < 0) {
    return err(400, "billingRate must be >= 0");
  }

  // 7. Referential integrity (validated against seeded pilot data)
  const client = clients.find((c) => c.id === body.clientId);
  if (!client) return err(400, `Unknown clientId: ${body.clientId}`);
  const agent = agents.find((a) => a.id === body.agentId);
  if (!agent) return err(400, `Unknown agentId: ${body.agentId}`);
  if (agent.clientId !== body.clientId) {
    return err(400, "Agent does not belong to the specified client");
  }

  // 8. Create — always pending_verification
  const event = {
    id: `evt-api-${Date.now()}`,
    idempotencyKey: body.idempotencyKey ?? null,
    vendorId: agent.vendorId,
    clientId: body.clientId,
    agentId: body.agentId,
    eventType: body.eventType,
    description: body.description ?? "",
    estimatedValue: body.estimatedValue ?? 0,
    billable: body.billable ?? false,
    billingRate: body.billingRate ?? 0,
    source: body.source ?? "API",
    customerReference: body.customerReference ?? null,
    proofNote: body.proofNote ?? null,
    status: "pending_verification",
    createdAt: new Date().toISOString(),
  };

  if (body.idempotencyKey) seenEvents.set(body.idempotencyKey, event);

  return NextResponse.json(
    {
      event,
      note: "Event accepted as pending_verification. It will not count toward ROI or invoices until a vendor verifies it.",
    },
    { status: 201 }
  );
}

// Convenience: GET returns the endpoint contract (handy for docs/testing).
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/events",
    auth: "Authorization: Bearer <API_KEY>",
    requiredFields: ["clientId", "agentId", "eventType"],
    note: "Events are created as pending_verification.",
  });
}
