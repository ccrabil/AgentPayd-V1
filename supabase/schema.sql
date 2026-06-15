-- =====================================================================
-- AgentPayd — Supabase / Postgres schema (production data layer)
-- =====================================================================
-- The Pilot Mode app currently persists to localStorage (see
-- lib/store.tsx + lib/persistence.ts). This file is the migration-style
-- schema to switch the service layer to Supabase with no UI changes:
-- the camelCase TypeScript types in lib/types.ts map 1:1 to these tables.
--
-- Run in the Supabase SQL editor. RLS policies are illustrative scaffolds;
-- tighten before any real customer data is stored.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---- Agencies / AI vendors -----------------------------------------
create table if not exists vendors (
  id              text primary key,
  name            text not null,
  industry_focus  text not null,
  account_type    text not null default 'vendor', -- vendor | client | hybrid
  tagline         text,
  invoice_reg_no  text,
  contact_email   text,
  country         text default 'JP',
  service_type    text,
  created_at      timestamptz not null default now()
);

-- ---- Auth-linked users (maps Supabase auth.users -> a role/vendor) --
create table if not exists app_users (
  id          uuid primary key references auth.users on delete cascade,
  vendor_id   text references vendors(id) on delete cascade,
  client_id   text,                                   -- set for business_client users
  role        text not null default 'ai_vendor',      -- agentpayd_admin|ai_vendor|business_client|viewer
  created_at  timestamptz not null default now()
);

-- ---- Business clients ----------------------------------------------
create table if not exists clients (
  id              text primary key,
  vendor_id       text not null references vendors(id) on delete cascade,
  name            text not null,
  industry        text not null,
  logo_initial    text,
  contact_name    text,
  contact_email   text,
  status          text not null default 'active',
  pricing_plan_id text,
  visibility      jsonb not null default
                  '{"showWorkDetail":true,"showAiCost":false,"showVendorMargin":false}',
  created_at      timestamptz not null default now()
);

-- ---- Agents --------------------------------------------------------
create table if not exists agents (
  id                  text primary key,
  vendor_id           text not null references vendors(id) on delete cascade,
  client_id           text not null references clients(id) on delete cascade,
  name                text not null,
  industry            text not null,
  role                text,             -- receptionist|sales|support|recruiter|finance|marketing
  description         text,
  pricing_model       text not null default 'hybrid',
  monthly_cost        numeric default 0,
  fixed_fee           numeric,
  base_fee            numeric,
  billing_rate_outcome numeric,
  billing_rate_action numeric,
  workflow_rate       numeric,
  credit_rate         numeric,
  margin_target_pct   numeric,
  billable_outcome_types jsonb default '[]',
  billing_notes       text,
  currency            text default 'JPY',
  status              text not null default 'active',
  created_at          timestamptz not null default now()
);

-- ---- Usage events (the metered work) -------------------------------
create table if not exists events (
  id                text primary key default gen_random_uuid()::text,
  idempotency_key   text unique,                       -- dedupe for POST /api/events
  vendor_id         text not null references vendors(id) on delete cascade,
  client_id         text not null references clients(id) on delete cascade,
  agent_id          text not null references agents(id) on delete cascade,
  event_type        text not null,
  quantity          integer not null default 1,
  description       text,
  estimated_value   numeric not null default 0,        -- JPY business value
  billable_amount   numeric not null default 0,        -- JPY billed
  staff_minutes_saved integer not null default 0,
  source            text,
  customer_reference text,                              -- NEVER full PII
  proof_note        text,
  status            text not null default 'pending',    -- pending|verified|rejected
  created_at        timestamptz not null default now()
);
create index if not exists events_client_idx on events(client_id);
create index if not exists events_status_idx on events(status);

-- ---- Cost events (AI delivery cost) --------------------------------
create table if not exists cost_events (
  id          text primary key default gen_random_uuid()::text,
  vendor_id   text not null references vendors(id) on delete cascade,
  client_id   text not null references clients(id) on delete cascade,
  agent_id    text not null references agents(id) on delete cascade,
  cost_type   text not null,
  provider    text,
  amount_jpy  numeric not null default 0,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- ---- Outcomes (business results, 1:1 with high-value events) -------
create table if not exists outcomes (
  id              text primary key default gen_random_uuid()::text,
  vendor_id       text not null references vendors(id) on delete cascade,
  client_id       text not null references clients(id) on delete cascade,
  agent_id        text not null references agents(id) on delete cascade,
  outcome_type    text not null,
  estimated_value numeric not null default 0,
  currency        text default 'JPY',
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

-- ---- Invoices + line items -----------------------------------------
create table if not exists invoices (
  id            text primary key,
  vendor_id     text not null references vendors(id) on delete cascade,
  client_id     text not null references clients(id) on delete cascade,
  period_label  text,
  base_fee      numeric default 0,
  usage_amount  numeric default 0,
  booking_amount numeric default 0,
  ai_cost       numeric default 0,
  amount        numeric not null default 0,
  status        text not null default 'Draft',         -- Draft|Sent|Paid|Overdue
  issued_date   timestamptz default now(),
  payment_link  text
);

create table if not exists invoice_line_items (
  id          text primary key default gen_random_uuid()::text,
  invoice_id  text not null references invoices(id) on delete cascade,
  event_id    text references events(id),
  label       text not null,
  amount      numeric not null default 0
);

-- ---- API keys (per agency) -----------------------------------------
create table if not exists api_keys (
  id          text primary key default gen_random_uuid()::text,
  vendor_id   text not null references vendors(id) on delete cascade,
  key_prefix  text not null,                            -- shown in UI
  key_hash    text not null,                            -- store a HASH, never the key
  label       text,
  last_used_at timestamptz,
  created_at  timestamptz not null default now(),
  revoked     boolean not null default false
);

-- ---- LINE connections (integration placeholder) -------------------
create table if not exists line_connections (
  id                  text primary key default gen_random_uuid()::text,
  vendor_id           text not null references vendors(id) on delete cascade,
  channel_id          text,
  channel_secret_hash text,            -- store a HASH, never the secret
  access_token_hash   text,
  webhook_verified    boolean not null default false,
  created_at          timestamptz not null default now()
);

-- ---- Invitations (two-sided adoption) ------------------------------
create table if not exists vendor_invitations (
  id            text primary key default gen_random_uuid()::text,
  client_id     text,
  client_name   text,
  vendor_name   text,
  vendor_email  text,
  industry      text,
  reporting_requirement text,
  status        text not null default 'pending',
  created_at    timestamptz not null default now()
);
create table if not exists client_invitations (
  id            text primary key default gen_random_uuid()::text,
  vendor_id     text references vendors(id) on delete cascade,
  client_name   text,
  client_email  text,
  status        text not null default 'pending',
  created_at    timestamptz not null default now()
);

-- ---- Row Level Security (scaffold) ---------------------------------
alter table clients enable row level security;
alter table agents  enable row level security;
alter table events  enable row level security;
alter table invoices enable row level security;

-- Agency members see their own vendor's rows; business clients see only
-- their own client_id. (Illustrative — refine before production.)
create policy vendor_scope_clients on clients
  using (vendor_id in (select vendor_id from app_users where id = auth.uid()));
create policy client_scope_clients on clients
  using (id in (select client_id from app_users where id = auth.uid()));
