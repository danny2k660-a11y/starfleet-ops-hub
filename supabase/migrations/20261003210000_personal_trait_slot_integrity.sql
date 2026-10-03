-- Keep personal ground/space trait slots character-scoped and collision-free.
create unique index if not exists character_traits_active_slot_unique
  on public.character_traits(character_id, domain, slot_index)
  where active = true and slot_index is not null;

create index if not exists character_traits_character_domain_active_idx
  on public.character_traits(character_id, domain, active);

create index if not exists trait_catalog_type_domain_name_idx
  on public.trait_catalog(trait_type, domain, name);
