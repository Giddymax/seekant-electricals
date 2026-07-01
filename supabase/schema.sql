-- Seekant Electricals POS schema
-- Run this once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------- users (POS accounts) ----------
create table if not exists public.pos_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  password_hash text not null,           -- plaintext OK for local POS parity; move to hash if needed
  role text not null check (role in ('admin','staff')),
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- settings (single row keyed by id=1) ----------
create table if not exists public.pos_settings (
  id smallint primary key default 1,
  company_name text not null default 'Seekant Electricals',
  sidebar_copy text not null default 'Electrical supplies, lighting, wiring and appliance retail management',
  receipt_title text not null default 'Electrical Sales Receipt',
  receipt_prefix text not null default 'SEL',
  receipt_footer text not null default 'Thank you for choosing Seekant Electricals.',
  document_title text not null default 'Seekant Electricals',
  updated_at timestamptz not null default now(),
  constraint pos_settings_singleton check (id = 1)
);

-- ---------- device authorization ----------
create table if not exists public.pos_device_auth (
  device_id text primary key,
  trusted boolean not null default true,
  authorized_at timestamptz not null default now()
);

-- ---------- products ----------
create table if not exists public.pos_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text default '',
  category text not null,
  dosage_form text default '',
  strength text default '',
  manufacturer text default '',
  batch_number text default '',
  barcode text default '',
  cost_price numeric(12,2) not null default 0,
  price numeric(12,2) not null default 0,
  quantity integer not null default 0,
  reorder_level integer not null default 10,
  image text default '',                 -- data URL or Supabase Storage path
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pos_products_category_idx on public.pos_products (category);
create index if not exists pos_products_name_idx on public.pos_products (name);

-- ---------- sales ----------
create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  customer_name text not null default 'Walk-in Customer',
  customer_phone text default '-',
  payment_method text not null default 'cash',
  served_by text not null,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  change_due numeric(12,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists pos_sales_created_at_idx on public.pos_sales (created_at desc);

-- ---------- part payments (audit trail) ----------
create table if not exists public.pos_part_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales (id) on delete cascade,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

-- ---------- seed initial settings row + admin ----------
insert into public.pos_settings (id) values (1) on conflict (id) do nothing;

insert into public.pos_users (name, username, password_hash, role, locked)
values ('Seekant Admin', 'admin', 'admin123', 'admin', true)
on conflict (username) do nothing;

insert into public.pos_users (name, username, password_hash, role, locked)
values ('Sales Counter', 'staff', 'staff123', 'staff', false)
on conflict (username) do nothing;

-- ---------- Row Level Security ----------
-- This app authenticates users via a custom cookie in the Next.js layer,
-- not Supabase Auth, so we leave RLS off and rely on server-side access only.
-- If you switch to Supabase Auth you should enable RLS and add policies.
alter table public.pos_users disable row level security;
alter table public.pos_settings disable row level security;
alter table public.pos_products disable row level security;
alter table public.pos_sales disable row level security;
alter table public.pos_part_payments disable row level security;
alter table public.pos_device_auth disable row level security;
