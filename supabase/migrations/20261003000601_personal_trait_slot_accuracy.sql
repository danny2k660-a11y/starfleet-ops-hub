-- Personal ground/space trait accuracy and slot metadata
-- Keeps personal, reputation, active reputation, species/career/faction restrictions
-- distinct from starship traits.

alter table public.trait_catalog
  add column if not exists availability_type text not null default 'general',
  add column if not exists is_active_ability boolean not null default false,
  add column if not exists species_restriction text,
  add column if not exists career_restriction text,
  add column if not exists faction_restriction text;

alter table public.character_traits
  add column if not exists availability_type text not null default 'general',
  add column if not exists slot_group text;

create index if not exists idx_trait_catalog_availability
  on public.trait_catalog(availability_type);

create index if not exists idx_character_traits_slot_group
  on public.character_traits(character_id, slot_group);

update public.trait_catalog
set is_active_ability = (trait_type = 'activereputation')
where is_active_ability is distinct from (trait_type = 'activereputation');

-- Reputation traits are explicitly separated into four slot groups:
-- passive space, passive ground, active space, active ground.
