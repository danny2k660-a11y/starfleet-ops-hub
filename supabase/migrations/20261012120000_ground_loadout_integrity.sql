-- Persist the ground-specific trait and specialization selections used by the UI.
alter table public.build_ground_loadouts
  add column if not exists ground_traits jsonb not null default '[]'::jsonb,
  add column if not exists specializations jsonb not null default '[]'::jsonb;

create table if not exists public.ground_loadout_equipment (
  id uuid primary key default gen_random_uuid(),
  loadout_id uuid not null references public.build_ground_loadouts(id) on delete cascade,
  equipment_item_id uuid not null references public.equipment_items(id) on delete cascade,
  slot text not null,
  created_at timestamptz default now(),
  unique (loadout_id, slot)
);

alter table public.ground_loadout_equipment enable row level security;
drop policy if exists "own ground loadout equipment" on public.ground_loadout_equipment;
drop policy if exists "ground loadout equipment owner" on public.ground_loadout_equipment;
drop policy if exists "Users can manage own ground loadout equipment" on public.ground_loadout_equipment;
drop policy if exists "owners manage ground equipment" on public.ground_loadout_equipment;
drop policy if exists ground_loadout_equipment_owner_all on public.ground_loadout_equipment;
create policy ground_loadout_equipment_owner_all
  on public.ground_loadout_equipment for all to authenticated
  using (
    exists (
      select 1 from public.build_ground_loadouts gl
      where gl.id = loadout_id and gl.user_id = auth.uid()
    )
    and exists (
      select 1 from public.equipment_items ei
      where ei.id = equipment_item_id and ei.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.build_ground_loadouts gl
      where gl.id = loadout_id and gl.user_id = auth.uid()
    )
    and exists (
      select 1 from public.equipment_items ei
      where ei.id = equipment_item_id and ei.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.ground_loadout_equipment to authenticated;
create index if not exists ground_loadout_equipment_loadout_idx
  on public.ground_loadout_equipment(loadout_id);

