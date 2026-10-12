-- Track per-character unlocks granted by ships without treating them as equipped items.
create table if not exists public.character_ship_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  sto_ship_id uuid not null references public.sto_ships(id) on delete cascade,
  unlock_type text not null check (unlock_type in ('ship_trait','console','special_weapon')),
  name text not null,
  source_name text,
  created_at timestamptz not null default now(),
  unique (user_id, character_id, sto_ship_id, unlock_type, name)
);

alter table public.character_ship_unlocks enable row level security;
grant select, insert, update, delete on public.character_ship_unlocks to authenticated;
drop policy if exists "character ship unlocks own rows" on public.character_ship_unlocks;
drop policy if exists "users own character ship unlocks" on public.character_ship_unlocks;
drop policy if exists character_ship_unlocks_owner_all on public.character_ship_unlocks;
create policy character_ship_unlocks_owner_all
  on public.character_ship_unlocks for all to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = auth.uid()
    )
  );

create index if not exists character_ship_unlocks_user_character_idx
  on public.character_ship_unlocks(user_id, character_id);
create index if not exists character_ship_unlocks_ship_idx
  on public.character_ship_unlocks(sto_ship_id);

comment on table public.character_ship_unlocks is
  'Records ship-granted traits, consoles and special weapons as unlocked/available; does not imply equipped status.';
