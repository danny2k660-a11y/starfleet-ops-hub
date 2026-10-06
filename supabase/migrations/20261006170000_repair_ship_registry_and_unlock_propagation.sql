-- Repair the ship ownership model and make ship-derived unlocks first-class character assets.
-- Account ownership lives in sto_ship_ownership; user_ships is a per-character assignment table.

create table if not exists public.character_ship_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  sto_ship_id uuid not null references public.sto_ships(id) on delete cascade,
  unlock_type text not null check (unlock_type in ('ship_trait','console','special_weapon')),
  name text not null,
  source_name text,
  created_at timestamptz not null default now(),
  unique (user_id, character_id, sto_ship_id, unlock_type, name)
);

create index if not exists character_ship_unlocks_character_idx
  on public.character_ship_unlocks(character_id);
create index if not exists character_ship_unlocks_ship_idx
  on public.character_ship_unlocks(sto_ship_id);

alter table public.character_ship_unlocks enable row level security;
drop policy if exists "character ship unlocks own rows" on public.character_ship_unlocks;
create policy "character ship unlocks own rows"
  on public.character_ship_unlocks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.character_ship_unlocks to authenticated;

-- Older versions created a character_id-null user_ship whenever account ownership
-- was recorded. That row is not a captain assignment and caused fleet inflation.
drop trigger if exists trg_sync_account_ship_to_fleet_instance on public.sto_ship_ownership;
drop function if exists public.sync_account_ship_to_fleet_instance();

-- Preserve account ownership discovered from any legitimate owned fleet row.
insert into public.sto_ship_ownership (user_id, sto_ship_id, ownership_status, acquired_at, notes)
select distinct us.user_id, us.sto_ship_id, 'owned', now(), 'Reconciled from character ship registry'
from public.user_ships us
where us.ownership_status = 'owned'
on conflict (user_id, sto_ship_id)
do update set ownership_status = 'owned';

-- Retire account-level placeholder rows instead of treating them as ships owned by
-- a captain. This avoids destructive FK failures when historical builds/loadouts exist.
update public.user_ships
set ownership_status = 'retired',
    usage_mode = 'retired',
    notes = concat_ws(E'\\n', notes, 'Retired by ship-registry repair: account-level ownership placeholder')
where character_id is null
  and ownership_status = 'owned';

-- Keep only one active assignment per user/character/ship. Prefer the row with a
-- linked build, then the newest row. Older duplicates are retained as retired
-- history rather than being destructively deleted.
with ranked as (
  select id,
         row_number() over (
           partition by user_id, character_id, sto_ship_id
           order by (current_build_id is not null) desc, created_at desc nulls last, id desc
         ) as rn
  from public.user_ships
  where character_id is not null
    and ownership_status = 'owned'
)
update public.user_ships us
set ownership_status = 'retired',
    usage_mode = 'retired',
    notes = concat_ws(E'\\n', us.notes, 'Retired duplicate assignment by ship-registry repair')
from ranked r
where us.id = r.id
  and r.rn > 1;

create index if not exists user_ships_character_ship_active_idx
  on public.user_ships(user_id, character_id, sto_ship_id)
  where ownership_status = 'owned';
