-- Expand the trait catalogue so personal, species, reputation and active-reputation traits remain distinguishable.
alter table public.trait_catalog
  add column if not exists species_restriction text,
  add column if not exists reputation_tier integer,
  add column if not exists is_active_ability boolean not null default false;

alter table public.character_traits
  add column if not exists slot_group text;

create index if not exists idx_trait_catalog_domain_type
  on public.trait_catalog(domain, trait_type);

create index if not exists idx_character_traits_slot_group
  on public.character_traits(character_id, slot_group, slot_index);
