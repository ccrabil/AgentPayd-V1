// =====================================================================
// POST /api/integrations/line/webhook — LINE webhook (PLACEHOLDER)
// =====================================================================
// Technical path only — not a production LINE bot. In production:
//  1. Verify the X-Line-Signature HMAC with the channel secret.
//  2. Map message / postback / follow events into AgentPayd events.
//  3. Store ONLY minimal outcome/proof data + a customerReference —
//     never full conversations or unnecessary personal data.
//  4. Create every LINE-derived event as pending_verification.
// =====================================================================

import { NextResponse } from "next/server";

// Mapping rules from LINE signals → AgentPayd event types.
const LINE_EVENT_MAP: Record<string, string> = {
  "予約したい": "appointment_requested",
  booking_confirmation_postback: "appointment_booked",
  payment_confirmation: "payment_collected",
  follow_up_response: "booking_recovered",
  no_show_reminder_confirmation: "no_show_prevented",
};

export async function POST(req: Request) {
  // PLACEHOLDER: signature verification is not implemented in Pilot Mode.
  const signature = req.headers.get("x-line-signature");
  if (!signature) {
    // In production this would be a hard 401; here we note it and continue
    // so the path can be exercised in a demo.
    // return NextResponse.json({ error: "Missing X-Line-Signature" }, { status: 401 });
  }

  let body: { events?: Array<Record<string, unknown>> } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Map incoming LINE events → pending AgentPayd events (not stored here).
  const mapped = (body.events ?? []).map((e) => {
    const text = String(
      (e as { message?: { text?: string } }).message?.text ?? ""
    );
    const type = (e as { type?: string }).type ?? "";
    const mappedType =
      LINE_EVENT_MAP[text] ??
      LINE_EVENT_MAP[type] ??
      "appointment_requested";
    return {
      eventType: mappedType,
      status: "pending_verification",
      // Store a reference, NOT the message contents.
      customerReference: "line_user_ref",
    };
  });

  return NextResponse.json({
    received: mapped.length,
    mapped,
    note: "Placeholder. Events would be created as pending_verification. No conversation content is stored.",
  });
}
