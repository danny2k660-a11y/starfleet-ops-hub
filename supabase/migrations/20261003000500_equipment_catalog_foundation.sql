create table if not exists public.equipment_catalog (
  id uuid primary key default gen_random_uuid(),
  canonical_key text,
  name text not null,
  category text not null,
  domain text not null default 'space',
  slot text,
  weapon_type text,
  energy_type text,
  mark_level integer,
  rarity text,
  source_type text,
  source_name text,
  source_group text,
  reputation_name text,
  currency_type text,
  set_name text,
  set_piece text,
  upgradeable boolean not null default true,
  max_mark integer,
  faction_restriction text,
  career_restriction text,
  species_restriction text,
  unique_item boolean not null default false,
  description text,
  modifiers jsonb not null default '[]'::jsonb,
  properties jsonb not null default '{}'::jsonb,
  source_reference text,
  data_version text,
  verified_at timestamptz,
  data_quality_status text,
  data_quality_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_equipment_catalog_canonical_key on public.equipment_catalog(canonical_key);
create index if not exists idx_equipment_catalog_name on public.equipment_catalog(name);
create index if not exists idx_equipment_catalog_category on public.equipment_catalog(category);
create index if not exists idx_equipment_catalog_domain on public.equipment_catalog(domain);
create index if not exists idx_equipment_catalog_source_type on public.equipment_catalog(source_type);
create index if not exists idx_equipment_catalog_set_name on public.equipment_catalog(set_name);

alter table public.equipment_catalog enable row level security;
drop policy if exists equipment_catalog_read_authenticated on public.equipment_catalog;
create policy equipment_catalog_read_authenticated on public.equipment_catalog
  for select to authenticated using (true);

alter table public.equipment_items
  add column if not exists catalog_item_id uuid references public.equipment_catalog(id) on delete set null,
  add column if not exists rarity text,
  add column if not exists mods text,
  add column if not exists quantity integer not null default 1;

create index if not exists idx_equipment_items_catalog on public.equipment_items(catalog_item_id);