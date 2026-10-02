-- Apply only validated ship catalogue imports. Never invent missing values.
create or replace function public.apply_sto_ship_catalog_import(p_import_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_import public.sto_ship_catalog_imports%rowtype;
  v_item jsonb;
  v_count integer := 0;
  v_ship_id uuid;
begin
  select * into v_import
  from public.sto_ship_catalog_imports
  where id = p_import_id
    and imported_by = auth.uid()
  for update;

  if not found then
    raise exception 'Import not found or not owned by current user';
  end if;

  if v_import.status <> 'validated' then
    raise exception 'Only validated imports can be applied';
  end if;

  if v_import.source_key <> 'stowiki' then
    raise exception 'Only STOWiki imports are currently supported';
  end if;

  for v_item in select value from jsonb_array_elements(v_import.payload)
  loop
    select id into v_ship_id
    from public.sto_ships
    where lower(name) = lower(v_item->>'name')
    limit 1;

    if v_ship_id is null then
      insert into public.sto_ships (
        name, ship_class, faction, tier, description,
        base_hull, base_shields, hull_modifier, shield_modifier,
        turn_rate, inertia, impulse_modifier,
        fore_weapon_slots, aft_weapon_slots,
        engineering_console_slots, science_console_slots, tactical_console_slots,
        universal_console_slots, hangar_bays, experimental_weapon_slot,
        bridge_officer_stations, ship_trait, special_console,
        special_mechanics, special_weapons,
        source_key, source_url, source_reference, data_version, verified_at
      )
      values (
        v_item->>'name',
        nullif(v_item->>'ship_class',''),
        nullif(v_item->>'faction',''),
        nullif(v_item->>'tier',''),
        nullif(v_item->>'description',''),
        (v_item->>'base_hull')::numeric,
        (v_item->>'base_shields')::numeric,
        (v_item->>'hull_modifier')::numeric,
        (v_item->>'shield_modifier')::numeric,
        (v_item->>'turn_rate')::numeric,
        (v_item->>'inertia')::numeric,
        (v_item->>'impulse_modifier')::numeric,
        (v_item->>'fore_weapon_slots')::integer,
        (v_item->>'aft_weapon_slots')::integer,
        (v_item->>'engineering_console_slots')::integer,
        (v_item->>'science_console_slots')::integer,
        (v_item->>'tactical_console_slots')::integer,
        (v_item->>'universal_console_slots')::integer,
        (v_item->>'hangar_bays')::integer,
        case when v_item ? 'experimental_weapon_slot' then (v_item->>'experimental_weapon_slot')::boolean else null end,
        case when jsonb_typeof(v_item->'bridge_officer_stations') in ('array','object') then v_item->'bridge_officer_stations' else null end,
        nullif(v_item->>'ship_trait',''),
        nullif(v_item->>'special_console',''),
        nullif(v_item->>'special_mechanics',''),
        nullif(v_item->>'special_weapons',''),
        v_import.source_key,
        v_import.source_url,
        v_item->>'source_reference',
        coalesce(nullif(v_item->>'data_version',''), to_char(current_date, 'YYYY-MM-DD')),
        now()
      )
      returning id into v_ship_id;
    else
      update public.sto_ships
      set
        ship_class = coalesce(nullif(v_item->>'ship_class',''), ship_class),
        faction = coalesce(nullif(v_item->>'faction',''), faction),
        tier = coalesce(nullif(v_item->>'tier',''), tier),
        description = coalesce(nullif(v_item->>'description',''), description),
        base_hull = case when v_item ? 'base_hull' then (v_item->>'base_hull')::numeric else base_hull end,
        base_shields = case when v_item ? 'base_shields' then (v_item->>'base_shields')::numeric else base_shields end,
        hull_modifier = case when v_item ? 'hull_modifier' then (v_item->>'hull_modifier')::numeric else hull_modifier end,
        shield_modifier = case when v_item ? 'shield_modifier' then (v_item->>'shield_modifier')::numeric else shield_modifier end,
        turn_rate = case when v_item ? 'turn_rate' then (v_item->>'turn_rate')::numeric else turn_rate end,
        inertia = case when v_item ? 'inertia' then (v_item->>'inertia')::numeric else inertia end,
        impulse_modifier = case when v_item ? 'impulse_modifier' then (v_item->>'impulse_modifier')::numeric else impulse_modifier end,
        fore_weapon_slots = case when v_item ? 'fore_weapon_slots' then (v_item->>'fore_weapon_slots')::integer else fore_weapon_slots end,
        aft_weapon_slots = case when v_item ? 'aft_weapon_slots' then (v_item->>'aft_weapon_slots')::integer else aft_weapon_slots end,
        engineering_console_slots = case when v_item ? 'engineering_console_slots' then (v_item->>'engineering_console_slots')::integer else engineering_console_slots end,
        science_console_slots = case when v_item ? 'science_console_slots' then (v_item->>'science_console_slots')::integer else science_console_slots end,
        tactical_console_slots = case when v_item ? 'tactical_console_slots' then (v_item->>'tactical_console_slots')::integer else tactical_console_slots end,
        universal_console_slots = case when v_item ? 'universal_console_slots' then (v_item->>'universal_console_slots')::integer else universal_console_slots end,
        hangar_bays = case when v_item ? 'hangar_bays' then (v_item->>'hangar_bays')::integer else hangar_bays end,
        experimental_weapon_slot = case when v_item ? 'experimental_weapon_slot' then (v_item->>'experimental_weapon_slot')::boolean else experimental_weapon_slot end,
        bridge_officer_stations = case when jsonb_typeof(v_item->'bridge_officer_stations') in ('array','object') then v_item->'bridge_officer_stations' else bridge_officer_stations end,
        ship_trait = coalesce(nullif(v_item->>'ship_trait',''), ship_trait),
        special_console = coalesce(nullif(v_item->>'special_console',''), special_console),
        special_mechanics = coalesce(nullif(v_item->>'special_mechanics',''), special_mechanics),
        special_weapons = coalesce(nullif(v_item->>'special_weapons',''), special_weapons),
        source_key = v_import.source_key,
        source_url = v_import.source_url,
        source_reference = coalesce(nullif(v_item->>'source_reference',''), source_reference),
        data_version = coalesce(nullif(v_item->>'data_version',''), data_version, to_char(current_date, 'YYYY-MM-DD')),
        verified_at = now(),
        updated_at = now()
      where id = v_ship_id;
    end if;

    v_count := v_count + 1;
  end loop;

  update public.sto_ship_catalog_imports
  set status = 'applied', applied_at = now()
  where id = p_import_id;

  return v_count;
end;
$$;

revoke all on function public.apply_sto_ship_catalog_import(uuid) from public, anon, authenticated;
grant execute on function public.apply_sto_ship_catalog_import(uuid) to authenticated;
