# AgentPayd

**AgentPayd is the monetization and proof-of-value layer between AI-agent companies and the businesses that pay them.**

> Prove your AI is worth paying for.

AI vendors use AgentPayd to prove value and get paid. Businesses use AgentPayd
to verify that AI vendors actually delivered results — one neutral platform both
sides can trust. It is billing + metering + cost-tracking + ROI-proof
infrastructure for AI agents, demoed across 8 industries.

---

## Two-sided adoption

- **Vendor-led:** an AI vendor signs up → creates an agent → adds a client →
  sends events → sees revenue, cost, margin, value, invoices, renewal risk.
- **Client-mandated:** a business client signs up → requires its AI vendor to
  report through AgentPayd (`/require-reporting`) → vendor accepts and connects →
  client sees proof before approving the invoice.

## Roles (mock auth, sidebar switcher)

AgentPayd Admin · AI Vendor · Business Client · Viewer / Finance. Business Client
is scoped to its own portal and never sees other clients or vendor margin.

## Core loop

```
AI agent does work → AgentPayd tracks work → calculates cost → proves value
→ explains invoice → supports the renewal decision
```

Rules: only VERIFIED events count toward value & ROI; only VERIFIED + BILLABLE
count toward invoices. Vendor margin is hidden from clients by default.

---

## Tech

Next.js 14 (App Router) · TypeScript (strict) · Tailwind · lucide-react.
Client-side reactive store (`lib/store.tsx`) drives a live demo loop — simulate
work, verify, invoice, and every page updates instantly. Seeded data only; no
real payments, no PII. State resets on refresh.

## Cross-industry seed data

8 vendors (Healthcare, SaaS, Real Estate, Legal, Ecommerce, Recruiting,
Hospitality, Logistics), 17 business clients, 18 agents, 30 usage events, 21 cost
events. Switch vendors with the sidebar VendorSwitcher.

## Routes

Vendor app (`app/(app)/`): `/dashboard`, `/clients`, `/agents`, `/events`,
`/verify`, `/pricing-plans`, `/invoices`, `/value-proof`, `/investor`,
`/onboarding` (with "Who are you?"), `/require-reporting`, `/demo-simulator`,
`/healthcare-demo`, `/api-docs`, `/settings`.
Client-facing (top-level): `/client-portal/[clientId]`, `/reports/[clientId]`.

## API (documented at `/api-docs`)

`POST /api/events` · `POST /api/costs` · `POST /api/outcomes` ·
`POST /api/invoices/generate` · `GET /api/vendors/:id/dashboard` ·
`GET /api/clients/:id/value-receipt` · `GET /api/clients/:id/invoice` ·
`POST /api/client-invitations` · `POST /api/vendor-invitations`.
Integration methods: API, webhooks, manual entry, CSV import (placeholder).

## Demo Simulator (`/demo-simulator`)

8 buttons (Healthcare Call, SaaS Support Ticket, Real Estate Lead, Legal Intake,
Ecommerce Support Ticket, Recruiting Screening, Restaurant Reservation, Logistics
Dispatch). Each creates usage + cost + outcome, with value, time saved, invoice
impact, and ROI update.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## What still needs a real backend

Persistence (swap store/seed for a DB — the data model mirrors a SQL schema),
real auth (replace the role switcher with sessions + middleware), real payments
(Stripe / PayPay behind the payment-link field), the documented API endpoints,
and server-side PDF for the value receipt.

---

## Pilot Mode (real first-client readiness)

**Persistence:** pilot input (clients, agents, events, invoices) is saved to
`localStorage` and survives refresh — temporary Pilot Mode storage. The
production path is Supabase: see `supabase/schema.sql` (full migration-style
schema) and `lib/persistence.ts` (service-layer seam). "Reset to demo data" is
in Settings.

**New routes**
- `/signup` — AI agency signup (mock auth) → creates a vendor → onboarding.
- `/developers` — API key, `POST /api/events` contract, curl, idempotency, security warning, supported types.
- `/import` — CSV import with parser, preview, validation → pending events.
- `/integrations/line` — LINE connect placeholders, webhook URL, event-mapping rules, privacy warning.
- `/pilot-readiness` — Ready/Partial/Missing checklist for a first agency pilot.

**API**
- `POST /api/events` — real route handler with bearer-key auth (401 on bad key),
  idempotency (`idempotencyKey` dedupe), validation (unknown type, negative
  values, missing/foreign client/agent), and `pending_verification` default.
  Demo key: `ap_demo_pilot_key_2026`.
- `POST /api/integrations/line/webhook` — placeholder that maps LINE signals to
  pending events; stores only a `customerReference`, never conversations.

**Pricing models:** fixed, per_agent, per_workflow, per_action, per_outcome,
usage, hybrid, credits (placeholder). Per-agent rate fields are on the Agent
model for schema-readiness.

**Value Receipt:** the ROI report now includes a plain-language Value Receipt
("Your AI receptionist completed N verified outcomes… Verified value: ¥X.
Invoice: ¥Y.").

---

## Automation Mode (automated verification)

"Automatic where proof is strong, careful where money is involved, manual when
risk appears." The scoring engine (`lib/automation.ts`) is a **pure, explainable
function** — every point is traceable.

**Three modes** (set at `/automation`): Manual (every event reviewed), Assisted
(scores + recommends, human confirms / bulk-approves), Autopilot (high-confidence
auto-verifies; risky events go to review/flagged).

**Confidence score** (0–100): +10 valid API key, +15 webhook signature, +10
known source, +20 booking ID, +30 CRM/booking/calendar confirmation, +40 payment
provider confirmation, +20 LINE/customer confirmation, +10 no duplicate, +10
value in range; −50 duplicate, −25 missing proof, −30 unusually high value, −20
unknown source, −10 missing customer reference, −20 sensitive data.
≥80 auto-verify · 50–79 review · <50 flagged.

**Safety gates:** critical risk flags (duplicate, invalid API key, customer
disputed, payment not confirmed, sensitive data) block auto-invoicing even at
high confidence. Appointment events need a booking ID / calendar / booking-system
confirmation; payment events need payment-provider confirmation — these block
auto-verification regardless of score.

**Pages:** `/automation` (mode, threshold, max auto-billable value, require-proof
and alert toggles, live "would auto-verify" preview, Run Autopilot, AI-receptionist
strong/weak demo). `/verify` is now a grouped, explainable queue (auto / review /
flagged) with confidence, proof sources, risk flags, reason, and a "Why this
score?" breakdown showing every point + invoice/ROI impact. `/audit-log` records
who/what verified each event, manual vs automatic, confidence, proof, and
invoice/ROI impact.

Only verified (incl. auto-verified) outcomes count toward ROI; only verified +
billable count toward invoices.

---

## Value calculation (transparent ROI — no black-box)

AgentPayd combines numbers from **both sides** to value verified work:
- **Client business assumptions** (`ClientAssumptions`): avg appointment/order value, show-up / no-show / conversion rates, no-show loss, lead value, customer LTV, human hourly cost, baselines.
- **Agency cost & pricing** (on each Agent): client monthly fee, AI/model cost, tool/LINE cost, human support cost, maintenance cost.

`lib/value.ts` turns verified event counts × assumptions into value, and always
returns the per-line formula. Formulas: `clientROI = verifiedValue /
clientMonthlyFee`, `netClientValue = verifiedValue − clientMonthlyFee`,
`agencyGrossMargin = invoiceAmount − totalDeliveryCost`, `agencyMarginPercent =
grossMargin / invoiceAmount`.

**`/economics`** — pick a client, edit both sides, and see the value calculation
line-by-line (e.g. `52 × ¥30,000 × 85% show-up = ¥1,326,000`) plus ROI and margin
with their inputs shown. **`/test-scenarios`** — a standalone calculator to
sanity-check the math from hand-entered counts. The agency never types a value;
it always comes from counted outcomes × the client's own assumptions.

---

## Design: Tesla-like light theme (v2)

The app is now light-first — bright, minimal, premium fintech. All colour comes
from semantic Tailwind tokens (`tailwind.config.ts`) so the whole app themes from
one place: background `#F7F8FA`, cards `#FFFFFF`, text `#111827`/`#6B7280`,
borders `#E5E7EB`, accent `#2563EB`, success `#16A34A`, warning `#D97706`, danger
`#DC2626`. Shadows are soft (no dark glow); code surfaces use light gray. A dark
mode can be reintroduced later via the `dark:` class without touching pages.

---

## Pricing engine (billing spine)

`lib/pricing.ts` — pure, deterministic `computeInvoice()` that turns frozen usage
+ a pricing package + client overrides + performance multipliers into invoice
line items. Combines every billing component: setup, platform, seat, activity,
outcome, workflow, usage, overage, credit top-up, discount, and tax placeholder.
No DB calls, no side effects — same inputs always produce the same invoice, which
is what makes billing auditable. Verified against test scenarios A, B, C, E, H,
the duplicate guard, and overrides (all pass).

---

## Signal ledger + billing cycles (the billing spine)

`lib/ledger.ts` gives AgentPayd the two properties that make it a billing system,
not a dashboard:

1. Append-only with write-time idempotency — `appendSignal()` rejects a duplicate
   `idempotencyKey` at insert and returns the existing entry, so nothing is billed
   twice and existing entries are never mutated. `ADD_USAGE_EVENT` now goes through it.
2. Frozen snapshots — `closeBillingCycle()` freezes the exact verified signal IDs,
   usage, value, billable amount, and cost for a period. Invoices read the snapshot,
   so a finalized cycle never changes when new signals arrive.

`/billing-cycles` closes the current month into a frozen snapshot and walks it
through closed → invoiced → paid. Proven by a standalone test run (idempotency,
append-only, verified-only counting, and snapshot immutability all pass).
