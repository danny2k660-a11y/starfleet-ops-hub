create table if not exists public.equipment_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  source_type text not null,
  currency_type text,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists idx_equipment_sources_type on public.equipment_sources(source_type);
alter table public.equipment_catalog
  add column if not exists acquisition_requirements jsonb not null default '{}'::jsonb,
  add column if not exists item_level integer,
  add column if not exists bind_type text,
  add column if not exists vendor_name text,
  add column if not exists cost_amount numeric,
  add column if not exists cost_currency text,
  add column if not exists drop_source text;
alter table public.equipment_items
  add column if not exists item_level integer,
  add column if not exists bind_type text,
  add column if not exists source text,
  add column if not exists cost_paid numeric,
  add column if not exists cost_currency text;
alter table public.equipment_sources enable row level security;
drop policy if exists equipment_sources_read_authenticated on public.equipment_sources;
create policy equipment_sources_read_authenticated on public.equipment_sources for select to authenticated using (true);
