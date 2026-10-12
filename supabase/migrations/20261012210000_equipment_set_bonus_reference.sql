-- Verified set bonus reference data. No unverified or guessed bonuses are seeded.
create table if not exists public.sto_equipment_set_bonuses (
  id uuid primary key default gen_random_uuid(),
  set_name text not null,
  piece_threshold integer not null check (piece_threshold >= 2),
  bonus_name text not null,
  bonus_description text not null,
  source_reference text not null,
  verified boolean not null default false,
  data_version text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (set_name, piece_threshold, bonus_name)
);

alter table public.sto_equipment_set_bonuses enable row level security;
drop policy if exists sto_equipment_set_bonuses_read_verified on public.sto_equipment_set_bonuses;
create policy sto_equipment_set_bonuses_read_verified
  on public.sto_equipment_set_bonuses for select to authenticated
  using (verified = true and source_reference <> '');

revoke insert, update, delete on public.sto_equipment_set_bonuses from authenticated;
grant select on public.sto_equipment_set_bonuses to authenticated;
create index if not exists sto_equipment_set_bonuses_lookup_idx
  on public.sto_equipment_set_bonuses(set_name, piece_threshold) where verified = true;
