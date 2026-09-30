create table if not exists public.loadout_equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  loadout_id uuid not null references public.loadouts(id) on delete cascade,
  equipment_id uuid not null references public.equipment_items(id) on delete cascade,
  slot text not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  unique(loadout_id, slot)
);
alter table public.loadout_equipment enable row level security;
grant select, insert, update, delete on public.loadout_equipment to authenticated;
drop policy if exists "own loadout equipment" on public.loadout_equipment;
create policy "own loadout equipment" on public.loadout_equipment
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists loadout_equipment_loadout_idx on public.loadout_equipment(loadout_id);
create index if not exists loadout_equipment_user_idx on public.loadout_equipment(user_id);
