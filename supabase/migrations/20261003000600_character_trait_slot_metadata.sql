alter table public.character_traits
  add column if not exists availability_type text not null default 'general';

alter table public.character_traits
  add column if not exists slot_group text;

create index if not exists character_traits_character_domain_category_idx
  on public.character_traits(character_id, domain, trait_category);

create index if not exists character_traits_character_slot_idx
  on public.character_traits(character_id, slot_group, slot_index);
