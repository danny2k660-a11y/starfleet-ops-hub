-- Complete catalogue and roster tables referenced by the UI and later migrations.
-- Idempotent so this can also repair deployments created from the earlier partial migration set.

create table if not exists public.boff_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null default 'Space',
  ability_data jsonb not null default '[]'::jsonb,
  account_unlock boolean,
  acquisition_method text,
  canonical_key text,
  career text,
  character_bound boolean,
  currency_cost numeric,
  currency_type text,
  data_quality_notes text,
  data_quality_status text,
  data_version text,
  faction_restriction text,
  gender_restriction text,
  item_family text,
  level_requirement integer,
  properties jsonb,
  rank text,
  reputation_name text,
  source_group text,
  source_name text,
  source_reference text,
  source_type text,
  specialization text,
  species_restriction text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doff_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  specialization text,
  rank text,
  domain text,
  ability_data jsonb,
  source_type text,
  source_name text,
  source_reference text,
  data_quality_status text,
  data_quality_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.duty_officer_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  specialization text,
  rarity text,
  duty_type text,
  ability_text text,
  effect_text text,
  acquisition_method text,
  currency_cost numeric,
  currency_type text,
  career_restriction text,
  faction_restriction text,
  species_restriction text,
  source_group text,
  source_name text,
  source_reference text,
  source_type text,
  data_quality_status text,
  data_quality_notes text,
  properties jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boff_ability_catalog (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  name text not null,
  region text,
  career text,
  description text,
  description_long text,
  rank1 text,
  rank2 text,
  rank3 text,
  rank1_info text,
  rank2_info text,
  rank3_info text,
  source_reference text,
  data_version text,
  data_quality_status text not null default 'unverified',
  data_quality_notes text,
  properties jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_boffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  boff_id uuid not null references public.boff_catalog(id) on delete cascade,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique(character_id, boff_id)
);

create table if not exists public.character_duty_officers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  duty_officer_id uuid not null references public.duty_officer_catalog(id) on delete cascade,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique(character_id, duty_officer_id)
);

create table if not exists public.character_doffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  doff_id uuid not null references public.doff_catalog(id) on delete cascade,
  active boolean not null default true,
  notes text,
  created_at timestamptz default now(),
  unique(character_id, doff_id)
);

create table if not exists public.character_trait_slot_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  slot_group text not null,
  source text not null,
  unlocked boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loadout_duty_officers (
  id uuid primary key default gen_random_uuid(),
  loadout_id uuid not null references public.loadouts(id) on delete cascade,
  duty_officer_id uuid references public.duty_officer_catalog(id) on delete set null,
  name text not null,
  department text,
  effect_text text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.build_doffs (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds(id) on delete cascade,
  doff_id uuid references public.doff_catalog(id) on delete set null,
  name text not null,
  department text,
  specialization text,
  assignment text,
  notes text,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.build_ground_loadouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  build_id uuid not null references public.builds(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  notes text,
  ground_traits jsonb not null default '[]'::jsonb,
  specializations jsonb not null default '[]'::jsonb,
  weapon_1 jsonb,
  weapon_2 jsonb,
  armor jsonb,
  personal_shield jsonb,
  kit jsonb,
  kit_modules jsonb,
  devices jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.boff_catalog enable row level security;
alter table public.doff_catalog enable row level security;
alter table public.duty_officer_catalog enable row level security;
alter table public.boff_ability_catalog enable row level security;
alter table public.character_boffs enable row level security;
alter table public.character_duty_officers enable row level security;
alter table public.character_doffs enable row level security;
alter table public.character_trait_slot_unlocks enable row level security;
alter table public.loadout_duty_officers enable row level security;
alter table public.build_doffs enable row level security;
alter table public.build_ground_loadouts enable row level security;

grant select on public.boff_catalog, public.doff_catalog, public.duty_officer_catalog, public.boff_ability_catalog to authenticated;
grant all on public.boff_catalog, public.doff_catalog, public.duty_officer_catalog, public.boff_ability_catalog to service_role;
grant select, insert, update, delete on public.character_boffs, public.character_duty_officers, public.character_doffs, public.character_trait_slot_unlocks, public.loadout_duty_officers, public.build_doffs, public.build_ground_loadouts to authenticated;
grant all on public.character_boffs, public.character_duty_officers, public.character_doffs, public.character_trait_slot_unlocks, public.loadout_duty_officers, public.build_doffs, public.build_ground_loadouts to service_role;

drop policy if exists boff_catalog_read_authenticated on public.boff_catalog;
create policy boff_catalog_read_authenticated on public.boff_catalog for select to authenticated using (true);
drop policy if exists "authenticated can read doff catalog" on public.doff_catalog;
create policy "authenticated can read doff catalog" on public.doff_catalog for select to authenticated using (true);
drop policy if exists "Authenticated users can view duty officer catalogue" on public.duty_officer_catalog;
create policy "Authenticated users can view duty officer catalogue" on public.duty_officer_catalog for select to authenticated using (true);
drop policy if exists "Authenticated users can read BOFF ability catalogue" on public.boff_ability_catalog;
create policy "Authenticated users can read BOFF ability catalogue" on public.boff_ability_catalog for select to authenticated using (true);

drop policy if exists character_boffs_own on public.character_boffs;
drop policy if exists "users own character boffs" on public.character_boffs;
drop policy if exists character_boffs_owner_all on public.character_boffs;
create policy character_boffs_owner_all on public.character_boffs for all to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()))
  with check (user_id = auth.uid() and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));

drop policy if exists "Users manage their own character duty officers" on public.character_duty_officers;
drop policy if exists character_duty_officers_owner_all on public.character_duty_officers;
create policy character_duty_officers_owner_all on public.character_duty_officers for all to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()))
  with check (user_id = auth.uid() and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));

drop policy if exists "owners manage character doffs" on public.character_doffs;
drop policy if exists character_doffs_owner_all on public.character_doffs;
create policy character_doffs_owner_all on public.character_doffs for all to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()))
  with check (user_id = auth.uid() and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));

drop policy if exists character_trait_slot_unlocks_owner on public.character_trait_slot_unlocks;
drop policy if exists character_trait_slot_unlocks_owner_delete on public.character_trait_slot_unlocks;
drop policy if exists character_trait_slot_unlocks_owner_insert on public.character_trait_slot_unlocks;
drop policy if exists character_trait_slot_unlocks_owner_select on public.character_trait_slot_unlocks;
drop policy if exists character_trait_slot_unlocks_owner_update on public.character_trait_slot_unlocks;
drop policy if exists character_trait_slot_unlocks_owner_all on public.character_trait_slot_unlocks;
create policy character_trait_slot_unlocks_owner_all on public.character_trait_slot_unlocks for all to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()))
  with check (user_id = auth.uid() and exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));

drop policy if exists "Users manage their own loadout duty officers" on public.loadout_duty_officers;
drop policy if exists loadout_duty_officers_owner_all on public.loadout_duty_officers;
create policy loadout_duty_officers_owner_all on public.loadout_duty_officers for all to authenticated
  using (exists (select 1 from public.loadouts l where l.id = loadout_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.loadouts l where l.id = loadout_id and l.user_id = auth.uid()));

drop policy if exists "owners manage build doffs" on public.build_doffs;
drop policy if exists build_doffs_owner_all on public.build_doffs;
create policy build_doffs_owner_all on public.build_doffs for all to authenticated
  using (exists (select 1 from public.builds b where b.id = build_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.builds b where b.id = build_id and b.user_id = auth.uid()));

drop policy if exists "owners manage ground loadouts" on public.build_ground_loadouts;
drop policy if exists build_ground_loadouts_owner_all on public.build_ground_loadouts;
create policy build_ground_loadouts_owner_all on public.build_ground_loadouts for all to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.builds b where b.id = build_id and b.user_id = auth.uid()))
  with check (user_id = auth.uid() and exists (select 1 from public.builds b where b.id = build_id and b.user_id = auth.uid()));

create index if not exists boff_catalog_name_idx on public.boff_catalog(lower(name));
create index if not exists doff_catalog_name_idx on public.doff_catalog(lower(name));
create index if not exists duty_officer_catalog_name_idx on public.duty_officer_catalog(lower(name));
create index if not exists boff_ability_catalog_name_idx on public.boff_ability_catalog(lower(name));
create index if not exists character_boffs_user_idx on public.character_boffs(user_id);
create index if not exists character_boffs_character_idx on public.character_boffs(character_id);
create index if not exists character_duty_officers_user_idx on public.character_duty_officers(user_id);
create index if not exists character_duty_officers_character_idx on public.character_duty_officers(character_id);
create index if not exists character_doffs_user_idx on public.character_doffs(user_id);
create index if not exists character_doffs_character_idx on public.character_doffs(character_id);
create unique index if not exists character_trait_slot_unlocks_character_slot_unique on public.character_trait_slot_unlocks(character_id, slot_group);
create unique index if not exists character_trait_slot_unlocks_character_slot_unique on public.character_trait_slot_unlocks(character_id, slot_group);
create index if not exists character_trait_slot_unlocks_user_character_idx on public.character_trait_slot_unlocks(user_id, character_id);
create index if not exists loadout_duty_officers_loadout_idx on public.loadout_duty_officers(loadout_id);
create index if not exists build_doffs_build_idx on public.build_doffs(build_id);
create index if not exists build_doffs_doff_idx on public.build_doffs(doff_id);
create index if not exists build_ground_loadouts_user_build_idx on public.build_ground_loadouts(user_id, build_id);
create unique index if not exists build_ground_loadouts_one_active_per_build on public.build_ground_loadouts(build_id) where is_active = true;

drop trigger if exists boff_catalog_updated_at on public.boff_catalog;
create trigger boff_catalog_updated_at before update on public.boff_catalog for each row execute function public.update_updated_at_column();
drop trigger if exists doff_catalog_updated_at on public.doff_catalog;
create trigger doff_catalog_updated_at before update on public.doff_catalog for each row execute function public.update_updated_at_column();
drop trigger if exists duty_officer_catalog_updated_at on public.duty_officer_catalog;
create trigger duty_officer_catalog_updated_at before update on public.duty_officer_catalog for each row execute function public.update_updated_at_column();
drop trigger if exists boff_ability_catalog_updated_at on public.boff_ability_catalog;
create trigger boff_ability_catalog_updated_at before update on public.boff_ability_catalog for each row execute function public.update_updated_at_column();
drop trigger if exists character_trait_slot_unlocks_updated_at on public.character_trait_slot_unlocks;
create trigger character_trait_slot_unlocks_updated_at before update on public.character_trait_slot_unlocks for each row execute function public.update_updated_at_column();
drop trigger if exists build_ground_loadouts_updated_at on public.build_ground_loadouts;
create trigger build_ground_loadouts_updated_at before update on public.build_ground_loadouts for each row execute function public.update_updated_at_column();
