-- Evaluate auth.uid() once per statement instead of once per scanned row.
drop policy if exists "own characters" on public.characters;
create policy "own characters" on public.characters for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own user ships" on public.user_ships;
create policy "own user ships" on public.user_ships for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own ships" on public.ship_instances;
create policy "own ships" on public.ship_instances for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own builds" on public.builds;
create policy "own builds" on public.builds for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own sto ship ownership" on public.sto_ship_ownership;
create policy "own sto ship ownership" on public.sto_ship_ownership for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage own ship imports" on public.sto_ship_catalog_imports;
create policy "Users can manage own ship imports" on public.sto_ship_catalog_imports for all to authenticated
  using ((select auth.uid()) = imported_by) with check ((select auth.uid()) = imported_by);

drop policy if exists "own inventory" on public.inventory_items;
create policy "own inventory" on public.inventory_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists equipment_owner_all on public.equipment_items;
create policy equipment_owner_all on public.equipment_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own projects" on public.projects;
create policy "own projects" on public.projects for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own project tasks" on public.project_tasks;
create policy "own project tasks" on public.project_tasks for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );

drop policy if exists "own resource balances" on public.resource_balances;
create policy "own resource balances" on public.resource_balances for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists build_versions_select_own on public.build_versions;
create policy build_versions_select_own on public.build_versions for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.builds b where b.id = build_id and b.user_id = (select auth.uid()))
  );
drop policy if exists build_versions_insert_own on public.build_versions;
create policy build_versions_insert_own on public.build_versions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.builds b where b.id = build_id and b.user_id = (select auth.uid()))
  );

drop policy if exists user_audit_log_select_own on public.user_audit_log;
create policy user_audit_log_select_own on public.user_audit_log for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists user_audit_log_insert_own on public.user_audit_log;
create policy user_audit_log_insert_own on public.user_audit_log for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists character_bridge_officers_owner_all on public.character_bridge_officers;
create policy character_bridge_officers_owner_all on public.character_bridge_officers for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );

drop policy if exists loadout_hangar_pets_owner_all on public.loadout_hangar_pets;
create policy loadout_hangar_pets_owner_all on public.loadout_hangar_pets for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.loadouts l where l.id = loadout_id and l.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.loadouts l where l.id = loadout_id and l.user_id = (select auth.uid()))
  );

drop policy if exists character_reputations_owner_all on public.character_reputations;
create policy character_reputations_owner_all on public.character_reputations for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );

drop policy if exists character_boffs_owner_all on public.character_boffs;
create policy character_boffs_owner_all on public.character_boffs for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );

drop policy if exists character_duty_officers_owner_all on public.character_duty_officers;
create policy character_duty_officers_owner_all on public.character_duty_officers for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );

drop policy if exists character_doffs_owner_all on public.character_doffs;
create policy character_doffs_owner_all on public.character_doffs for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );

drop policy if exists character_trait_slot_unlocks_owner_all on public.character_trait_slot_unlocks;
create policy character_trait_slot_unlocks_owner_all on public.character_trait_slot_unlocks for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );

drop policy if exists loadout_duty_officers_owner_all on public.loadout_duty_officers;
create policy loadout_duty_officers_owner_all on public.loadout_duty_officers for all to authenticated
  using (exists (select 1 from public.loadouts l where l.id = loadout_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from public.loadouts l where l.id = loadout_id and l.user_id = (select auth.uid())));

drop policy if exists build_doffs_owner_all on public.build_doffs;
create policy build_doffs_owner_all on public.build_doffs for all to authenticated
  using (exists (select 1 from public.builds b where b.id = build_id and b.user_id = (select auth.uid())))
  with check (exists (select 1 from public.builds b where b.id = build_id and b.user_id = (select auth.uid())));

drop policy if exists build_ground_loadouts_owner_all on public.build_ground_loadouts;
create policy build_ground_loadouts_owner_all on public.build_ground_loadouts for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.builds b where b.id = build_id and b.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.builds b where b.id = build_id and b.user_id = (select auth.uid()))
  );

drop policy if exists ground_loadout_equipment_owner_all on public.ground_loadout_equipment;
create policy ground_loadout_equipment_owner_all on public.ground_loadout_equipment for all to authenticated
  using (
    exists (select 1 from public.build_ground_loadouts gl where gl.id = loadout_id and gl.user_id = (select auth.uid()))
    and exists (select 1 from public.equipment_items ei where ei.id = equipment_item_id and ei.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.build_ground_loadouts gl where gl.id = loadout_id and gl.user_id = (select auth.uid()))
    and exists (select 1 from public.equipment_items ei where ei.id = equipment_item_id and ei.user_id = (select auth.uid()))
  );

drop policy if exists character_ship_unlocks_owner_all on public.character_ship_unlocks;
create policy character_ship_unlocks_owner_all on public.character_ship_unlocks for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid()))
  );
