-- User-entered carrier hangar pet assignments. Names are not inferred from incomplete catalogue data.
create table if not exists public.loadout_hangar_pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  loadout_id uuid not null references public.loadouts(id) on delete cascade,
  hangar_slot text not null,
  pet_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (loadout_id, hangar_slot)
);

alter table public.loadout_hangar_pets enable row level security;
drop policy if exists loadout_hangar_pets_owner_all on public.loadout_hangar_pets;
create policy loadout_hangar_pets_owner_all
  on public.loadout_hangar_pets for all to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.loadouts l where l.id = loadout_id and l.user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.loadouts l where l.id = loadout_id and l.user_id = auth.uid())
  );

grant select, insert, update, delete on public.loadout_hangar_pets to authenticated;
create index if not exists loadout_hangar_pets_loadout_idx
  on public.loadout_hangar_pets(user_id, loadout_id);
drop trigger if exists loadout_hangar_pets_updated_at on public.loadout_hangar_pets;
create trigger loadout_hangar_pets_updated_at
  before update on public.loadout_hangar_pets
  for each row execute function public.update_updated_at_column();
