create table if not exists public.loadout_traits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  loadout_id uuid not null references public.loadouts(id) on delete cascade,
  trait_type text not null check (trait_type in ('personal_space','starship','reputation','active_space','ground','other')),
  name text not null,
  slot text,
  notes text,
  created_at timestamptz not null default now(),
  unique(loadout_id, trait_type, slot)
);
alter table public.loadout_traits enable row level security;
grant select, insert, update, delete on public.loadout_traits to authenticated;
drop policy if exists "own loadout traits" on public.loadout_traits;
create policy "own loadout traits" on public.loadout_traits for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists loadout_traits_loadout_idx on public.loadout_traits(loadout_id);
create index if not exists loadout_traits_user_idx on public.loadout_traits(user_id);

create table if not exists public.loadout_boffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  loadout_id uuid not null references public.loadouts(id) on delete cascade,
  station text not null,
  officer_name text,
  officer_species text,
  specialization text,
  abilities jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  unique(loadout_id, station)
);
alter table public.loadout_boffs enable row level security;
grant select, insert, update, delete on public.loadout_boffs to authenticated;
drop policy if exists "own loadout boffs" on public.loadout_boffs;
create policy "own loadout boffs" on public.loadout_boffs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists loadout_boffs_loadout_idx on public.loadout_boffs(loadout_id);
create index if not exists loadout_boffs_user_idx on public.loadout_boffs(user_id);
