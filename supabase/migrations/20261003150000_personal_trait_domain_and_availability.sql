-- Personal trait accuracy model: separate Ground/Space domains and availability pools.
alter table public.trait_catalog
  add column if not exists availability_type text not null default 'general';

alter table public.character_traits
  add column if not exists availability_type text not null default 'general';

alter table public.characters
  add column if not exists elite_captain boolean not null default false;

create index if not exists idx_trait_catalog_availability_type
  on public.trait_catalog(availability_type);

create index if not exists idx_character_traits_domain_category
  on public.character_traits(character_id, domain, trait_category);
