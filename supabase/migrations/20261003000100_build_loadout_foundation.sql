-- Build/loadout foundation for the STO Command Center
-- Applied to Supabase production on 2026-10-03.
alter table public.builds add column if not exists user_ship_id uuid references public.user_ships(id) on delete set null;

create table if not exists public.loadouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  build_id uuid not null references public.builds(id) on delete cascade,
  name text not null default 'Main Loadout',
  notes text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(build_id,name)
);

create table if not exists public.equipment_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete cascade,
  name text not null,
  category text,
  slot text,
  mark text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loadout_equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loadout_id uuid not null references public.loadouts(id) on delete cascade,
  equipment_id uuid not null references public.equipment_items(id) on delete cascade,
  slot text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(loadout_id,slot)
);

create table if not exists public.loadout_traits (
  id uuid primary key default gen_random_uuid(),
  loadout_id uuid not null references public.loadouts(id) on delete cascade,
  name text not null,
  trait_type text not null default 'starship',
  created_at timestamptz not null default now()
);

create table if not exists public.loadout_boffs (
  id uuid primary key default gen_random_uuid(),
  loadout_id uuid not null references public.loadouts(id) on delete cascade,
  station text not null,
  officer_name text,
  specialization text,
  abilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(loadout_id,station)
);