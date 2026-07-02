-- Seekant Electricals — Ghana ecosystem enhancements
-- Run once in the Supabase SQL editor, after supabase/schema.sql.
-- Every change here is additive (new columns with safe defaults) so it is
-- safe to run against a database that already has live data.

-- ---------- shop contact details + optional VAT on settings ----------
alter table public.pos_settings
  add column if not exists shop_phone text not null default '',
  add column if not exists shop_address text not null default '',    -- e.g. Ghana Post GPS digital address or shop location
  add column if not exists tin text not null default '',             -- GRA Taxpayer Identification Number
  add column if not exists tax_label text not null default 'VAT',
  add column if not exists tax_rate numeric(5,2) not null default 0; -- percent; 0 = tax disabled (not VAT-registered)

-- ---------- tax amount captured per sale ----------
alter table public.pos_sales
  add column if not exists tax numeric(12,2) not null default 0;

-- Note: tax_rate is a configurable percentage, not a hardcoded GRA rate —
-- confirm the correct VAT/NHIL/GETFund/levy rate for your business with
-- the Ghana Revenue Authority or your accountant before enabling it.
