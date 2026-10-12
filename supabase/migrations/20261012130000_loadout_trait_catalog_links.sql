-- Link saved build traits to the shared trait catalogue and permit multiple traits per loadout.
alter table public.loadout_traits
  add column if not exists trait_id uuid references public.trait_catalog(id) on delete set null,
  add column if not exists domain text,
  add column if not exists trait_category text;

alter table public.loadout_traits
  drop constraint if exists loadout_traits_loadout_id_trait_type_slot_key;

create unique index if not exists loadout_traits_unique_catalog_trait
  on public.loadout_traits(loadout_id, trait_id)
  where trait_id is not null;

create index if not exists loadout_traits_loadout_type_idx
  on public.loadout_traits(loadout_id, trait_type);
