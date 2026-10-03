-- STO Command Center build/loadout foundation hardening
alter table public.builds add column if not exists user_ship_id uuid references public.user_ships(id) on delete set null;

create index if not exists idx_user_ships_character_owned on public.user_ships(user_id,character_id,ownership_status);
create index if not exists idx_builds_user_ship on public.builds(user_ship_id);
create index if not exists idx_loadouts_build on public.loadouts(build_id);
create index if not exists idx_equipment_character on public.equipment_items(user_id,character_id);
create index if not exists idx_loadout_equipment_loadout on public.loadout_equipment(loadout_id);
create index if not exists idx_loadout_traits_loadout on public.loadout_traits(loadout_id);
create index if not exists idx_loadout_boffs_loadout on public.loadout_boffs(loadout_id);

alter table public.loadouts enable row level security;
alter table public.equipment_items enable row level security;
alter table public.loadout_equipment enable row level security;
alter table public.loadout_traits enable row level security;
alter table public.loadout_boffs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='loadouts' and policyname='loadouts_owner_all') then
    create policy loadouts_owner_all on public.loadouts for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='equipment_items' and policyname='equipment_owner_all') then
    create policy equipment_owner_all on public.equipment_items for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='loadout_equipment' and policyname='loadout_equipment_owner_all') then
    create policy loadout_equipment_owner_all on public.loadout_equipment for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='loadout_traits' and policyname='loadout_traits_owner_all') then
    create policy loadout_traits_owner_all on public.loadout_traits for all using (exists (select 1 from public.loadouts l where l.id=loadout_id and l.user_id=auth.uid())) with check (exists (select 1 from public.loadouts l where l.id=loadout_id and l.user_id=auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='loadout_boffs' and policyname='loadout_boffs_owner_all') then
    create policy loadout_boffs_owner_all on public.loadout_boffs for all using (exists (select 1 from public.loadouts l where l.id=loadout_id and l.user_id=auth.uid())) with check (exists (select 1 from public.loadouts l where l.id=loadout_id and l.user_id=auth.uid()));
  end if;
end $$;