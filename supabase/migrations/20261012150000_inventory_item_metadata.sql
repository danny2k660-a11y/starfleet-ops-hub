-- Keep stored inventory separate from equipped character equipment while retaining useful gear metadata.
alter table public.inventory_items
  add column if not exists slot text,
  add column if not exists rarity text,
  add column if not exists mark text,
  add column if not exists source text;

create index if not exists inventory_items_user_character_idx
  on public.inventory_items(user_id, character_id);
