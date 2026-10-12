-- Transactional copy: clone build metadata and loadouts without assigning another character's equipment.
create or replace function public.copy_sto_build_to_ship(
  p_source_build_id uuid,
  p_target_ship_id uuid,
  p_new_name text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_source public.builds%rowtype;
  v_target public.user_ships%rowtype;
  v_new_build_id uuid;
  v_old_loadout record;
  v_new_loadout_id uuid;
  v_old_ground record;
  v_new_ground_id uuid;
  v_same_character boolean;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if nullif(trim(p_new_name), '') is null then raise exception 'A new build name is required'; end if;

  select * into v_source from public.builds
  where id = p_source_build_id and user_id = v_user_id for share;
  if not found then raise exception 'Source build was not found'; end if;

  select * into v_target from public.user_ships
  where id = p_target_ship_id and user_id = v_user_id and ownership_status = 'owned'
  for update;
  if not found then raise exception 'Target ship is not owned by this account'; end if;
  if v_target.id = v_source.user_ship_id then raise exception 'Choose a different ship for the copy'; end if;
  if v_target.character_id is null then raise exception 'Assign the target ship to a character first'; end if;
  if v_target.current_build_id is not null then raise exception 'The target ship already has a build assigned'; end if;

  v_same_character := v_source.character_id = v_target.character_id;

  insert into public.builds (
    user_id, character_id, user_ship_id, ship_instance_id, name, role, status, notes,
    build_domain, captain_setup, acquisition_needs, archived
  ) values (
    v_user_id, v_target.character_id, v_target.id, null, trim(p_new_name), v_source.role, 'draft',
    v_source.notes, v_source.build_domain, v_source.captain_setup,
    coalesce(v_source.acquisition_needs, '[]'::jsonb), false
  ) returning id into v_new_build_id;

  for v_old_loadout in
    select * from public.loadouts
    where build_id = v_source.id and user_id = v_user_id
    order by created_at
  loop
    insert into public.loadouts (user_id, build_id, name, is_active, notes)
    values (v_user_id, v_new_build_id, v_old_loadout.name, v_old_loadout.is_active, v_old_loadout.notes)
    returning id into v_new_loadout_id;

    insert into public.loadout_traits (user_id, loadout_id, trait_id, name, trait_type, slot, notes, domain, trait_category)
    select v_user_id, v_new_loadout_id, trait_id, name, trait_type, slot, notes, domain, trait_category
    from public.loadout_traits where loadout_id = v_old_loadout.id and user_id = v_user_id;

    insert into public.loadout_boffs (user_id, loadout_id, station, officer_name, officer_species, boff_id, specialization, abilities, notes, slot)
    select v_user_id, v_new_loadout_id, station, officer_name, officer_species, boff_id, specialization, abilities, notes, slot
    from public.loadout_boffs where loadout_id = v_old_loadout.id and user_id = v_user_id;

    if v_same_character then
      insert into public.loadout_duty_officers (loadout_id, duty_officer_id, name, department, effect_text, notes)
      select v_new_loadout_id, duty_officer_id, name, department, effect_text, notes
      from public.loadout_duty_officers where loadout_id = v_old_loadout.id;

      insert into public.loadout_equipment (user_id, loadout_id, equipment_id, slot)
      select v_user_id, v_new_loadout_id, equipment_id, slot
      from public.loadout_equipment where loadout_id = v_old_loadout.id and user_id = v_user_id;

      insert into public.loadout_hangar_pets (user_id, loadout_id, hangar_slot, pet_name, quantity, notes, source_reference)
      select v_user_id, v_new_loadout_id, hangar_slot, pet_name, quantity, notes, source_reference
      from public.loadout_hangar_pets where loadout_id = v_old_loadout.id and user_id = v_user_id;
    end if;
  end loop;

  if v_same_character then
    insert into public.build_doffs (build_id, doff_id, name, department, specialization, assignment, notes, active)
    select v_new_build_id, doff_id, name, department, specialization, assignment, notes, active
    from public.build_doffs where build_id = v_source.id;
  end if;

  for v_old_ground in
    select * from public.build_ground_loadouts
    where build_id = v_source.id and user_id = v_user_id
    order by created_at
  loop
    insert into public.build_ground_loadouts (
      user_id, build_id, name, is_active, notes, ground_traits, specializations
    ) values (
      v_user_id, v_new_build_id, v_old_ground.name, v_old_ground.is_active, v_old_ground.notes,
      case when v_same_character then coalesce(v_old_ground.ground_traits, '[]'::jsonb) else '[]'::jsonb end,
      case when v_same_character then coalesce(v_old_ground.specializations, '[]'::jsonb) else '[]'::jsonb end
    ) returning id into v_new_ground_id;

    if v_same_character then
      insert into public.ground_loadout_equipment (loadout_id, equipment_item_id, slot)
      select v_new_ground_id, equipment_item_id, slot
      from public.ground_loadout_equipment where loadout_id = v_old_ground.id;
    end if;
  end loop;

  update public.user_ships
  set current_build_id = v_new_build_id, usage_mode = 'build_created', updated_at = now()
  where id = v_target.id and user_id = v_user_id;

  return v_new_build_id;
end;
$$;

revoke execute on function public.copy_sto_build_to_ship(uuid, uuid, text) from anon;
grant execute on function public.copy_sto_build_to_ship(uuid, uuid, text) to authenticated;
