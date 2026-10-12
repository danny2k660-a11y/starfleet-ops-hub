-- Keep internal catalogue audit runs server-only and index new foreign-key access paths.
alter table public.catalog_validation_runs enable row level security;
revoke all on table public.catalog_validation_runs from public, anon, authenticated;
grant all on table public.catalog_validation_runs to service_role;
drop policy if exists catalog_validation_runs_deny_client on public.catalog_validation_runs;
create policy catalog_validation_runs_deny_client on public.catalog_validation_runs
  for all to anon, authenticated using (false) with check (false);

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

create index if not exists build_doffs_doff_fk_idx on public.build_doffs(doff_id);
create index if not exists build_ground_loadouts_build_fk_idx on public.build_ground_loadouts(build_id);
create index if not exists builds_ship_instance_fk_idx on public.builds(ship_instance_id);
create index if not exists character_boffs_user_fk_idx on public.character_boffs(user_id);
create index if not exists character_doffs_doff_fk_idx on public.character_doffs(doff_id);
create index if not exists character_traits_user_fk_idx on public.character_traits(user_id);
create index if not exists equipment_items_character_fk_idx on public.equipment_items(character_id);
create index if not exists ground_loadout_equipment_item_fk_idx on public.ground_loadout_equipment(equipment_item_id);
create index if not exists loadout_boffs_user_fk_idx on public.loadout_boffs(user_id);
create index if not exists loadout_equipment_equipment_fk_idx on public.loadout_equipment(equipment_id);
create index if not exists loadout_equipment_user_fk_idx on public.loadout_equipment(user_id);
create index if not exists loadout_traits_user_fk_idx on public.loadout_traits(user_id);
create index if not exists loadouts_user_fk_idx on public.loadouts(user_id);
create index if not exists ship_instances_character_fk_idx on public.ship_instances(character_id);
create index if not exists ship_instances_ship_class_fk_idx on public.ship_instances(ship_class_id);
create index if not exists ship_instances_user_fk_idx on public.ship_instances(user_id);
create index if not exists sto_project_tasks_user_fk_idx on public.sto_project_tasks(user_id);
create index if not exists sto_projects_character_fk_idx on public.sto_projects(character_id);
create index if not exists sto_resource_balances_character_fk_idx on public.sto_resource_balances(character_id);
create index if not exists sto_ship_bundle_items_ship_fk_idx on public.sto_ship_bundle_items(sto_ship_id);
create index if not exists sto_ship_catalog_imports_imported_by_fk_idx on public.sto_ship_catalog_imports(imported_by);
create index if not exists sto_ship_ownership_source_fk_idx on public.sto_ship_ownership(acquisition_source_id);
create index if not exists user_ships_ship_fk_idx on public.user_ships(sto_ship_id);
