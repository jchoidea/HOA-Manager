-- HOA Manager database schema
-- Run this in the Supabase SQL editor (or any Postgres instance) once, on setup.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Company-wide settings (single row). Lets you change the dues amount,
-- late fee amount, and grace period without touching code.
-- ---------------------------------------------------------------------------
create table if not exists settings (
  id int primary key default 1,
  monthly_dues_cents int not null default 30000,       -- default $300/mo, edit as needed
  late_fee_cents int not null default 5000,             -- $50 flat late fee
  grace_period_days int not null default 15,            -- days after due date before late fee applies
  due_day_of_month int not null default 1,              -- dues due on the 1st of each month
  company_name text not null default 'Your HOA Management Co.',
  constraint single_row check (id = 1)
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Units (the 12 units) and their owners
-- ---------------------------------------------------------------------------
create table if not exists units (
  id uuid primary key default uuid_generate_v4(),
  unit_number text not null unique,          -- e.g. "Unit 1", "101"
  owner_name text not null,
  owner_email text not null,
  owner_phone text,
  stripe_customer_id text,                    -- set once owner pays or is invited
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Dues charges: one row generated per unit per month.
-- status moves: pending -> paid, or pending -> late -> paid
-- ---------------------------------------------------------------------------
create table if not exists dues_charges (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid not null references units(id) on delete cascade,
  period_month date not null,                 -- first of the month this charge is for, e.g. 2026-09-01
  amount_due_cents int not null,
  due_date date not null,                     -- period_month + configured due day
  late_fee_applied_cents int not null default 0,
  status text not null default 'pending' check (status in ('pending','late','paid','waived')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (unit_id, period_month)
);

create index if not exists idx_dues_charges_status on dues_charges(status);
create index if not exists idx_dues_charges_unit on dues_charges(unit_id);

-- ---------------------------------------------------------------------------
-- Payments: actual money received against a dues charge (via Stripe)
-- ---------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  dues_charge_id uuid references dues_charges(id) on delete set null,
  unit_id uuid not null references units(id) on delete cascade,
  amount_cents int not null,
  method text not null check (method in ('card','ach','manual')),
  stripe_payment_intent_id text,
  status text not null default 'succeeded' check (status in ('pending','succeeded','failed','refunded')),
  received_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_payments_unit on payments(unit_id);

-- ---------------------------------------------------------------------------
-- Vendors + bills: tracks money owed OUT (landscaping, insurance, repairs...)
-- Actual ACH transmission happens via your bank/bill-pay tool; this is the
-- bookkeeping record so you always know what's owed and what's been paid.
-- ---------------------------------------------------------------------------
create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_email text,
  contact_phone text,
  default_category text,             -- e.g. "Landscaping", "Insurance", "Repairs"
  bank_routing_last4 text,           -- optional reference only, never store full account numbers here
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists vendor_bills (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  description text not null,
  amount_cents int not null,
  bill_date date not null default current_date,
  due_date date,
  status text not null default 'unpaid' check (status in ('unpaid','scheduled','paid')),
  paid_at timestamptz,
  payment_reference text,            -- e.g. your bank's ACH confirmation number
  created_at timestamptz not null default now()
);

create index if not exists idx_vendor_bills_status on vendor_bills(status);

-- ---------------------------------------------------------------------------
-- Simple audit log for anything the late-fee cron or admin actions do
-- ---------------------------------------------------------------------------
create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  event text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
