-- Keep internal catalogue audit runs server-only and index new foreign-key access paths.
alter table public.catalog_validation_runs enable row level security;
revoke all on table public.catalog_validation_runs from public, anon, authenticated;
grant all on table public.catalog_validation_runs to service_role;

create index if not exists projects_character_fk_idx on public.projects(character_id);
create index if not exists project_tasks_user_idx on public.project_tasks(user_id);
create index if not exists resource_balances_character_fk_idx on public.resource_balances(character_id);
create index if not exists inventory_items_character_fk_idx on public.inventory_items(character_id);
create index if not exists character_ship_unlocks_character_fk_idx on public.character_ship_unlocks(character_id);
create index if not exists character_bridge_officers_character_fk_idx on public.character_bridge_officers(character_id);
create index if not exists build_versions_user_created_idx on public.build_versions(user_id, created_at desc);
create index if not exists loadout_hangar_pets_loadout_fk_idx on public.loadout_hangar_pets(loadout_id);
create index if not exists character_reputations_character_fk_idx on public.character_reputations(character_id);

drop policy if exists "users own character boffs" on public.character_boffs;
drop policy if exists equipment_owner on public.equipment_items;
drop policy if exists "owners manage ground equipment" on public.ground_loadout_equipment;
