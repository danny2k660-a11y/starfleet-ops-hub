-- Prevent build-readiness trigger recursion and make ground builds compatible with space readiness checks.
CREATE OR REPLACE FUNCTION public.refresh_operational_build_readiness(p_build_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  v_build public.builds%rowtype;
  v_ship public.user_ships%rowtype;
  v_active_loadout public.loadouts%rowtype;
  v_catalog public.sto_ships%rowtype;
  v_expected_equipment integer := 0;
  v_expected_stations integer := 0;
  v_expected_traits integer := 4;
  v_equipment_count integer := 0;
  v_trait_count integer := 0;
  v_boff_count integer := 0;
  v_passed integer := 0;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN; END IF;
  SELECT * INTO v_build FROM public.builds WHERE id=p_build_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_build.build_domain = 'ground' THEN
    UPDATE public.builds SET completion_percent=0,is_complete=false,last_validated_at=now(),updated_at=now() WHERE id=p_build_id;
    RETURN;
  END IF;

  SELECT * INTO v_ship FROM public.user_ships WHERE id=v_build.user_ship_id;
  IF v_ship.id IS NOT NULL THEN
    SELECT * INTO v_catalog FROM public.sto_ships WHERE id=v_ship.sto_ship_id;
    IF coalesce(v_ship.t6x2_upgraded,false) THEN v_expected_traits := 6;
    ELSIF coalesce(v_ship.t6x_upgraded,false) THEN v_expected_traits := 5;
    END IF;
  END IF;

  IF v_catalog.id IS NOT NULL THEN
    v_expected_equipment := coalesce(v_catalog.fore_weapon_slots,0)+coalesce(v_catalog.aft_weapon_slots,0)+coalesce(v_catalog.engineering_console_slots,0)+coalesce(v_catalog.science_console_slots,0)+coalesce(v_catalog.tactical_console_slots,0)+coalesce(v_catalog.universal_console_slots,0)+coalesce(v_catalog.hangar_bays,0)+4+case when coalesce(v_catalog.experimental_weapon_slot,false) then 1 else 0 end;
    v_expected_stations := case
      when jsonb_typeof(v_catalog.bridge_officer_stations)='array' then jsonb_array_length(v_catalog.bridge_officer_stations)
      when jsonb_typeof(v_catalog.bridge_officer_stations)='object' then (select count(*) from jsonb_object_keys(v_catalog.bridge_officer_stations))
      else 0 end;
  END IF;

  SELECT * INTO v_active_loadout FROM public.loadouts WHERE build_id=p_build_id AND is_active=true ORDER BY updated_at DESC LIMIT 1;
  IF v_active_loadout.id IS NOT NULL THEN
    SELECT count(*) INTO v_equipment_count FROM public.loadout_equipment WHERE loadout_id=v_active_loadout.id;
    SELECT count(*) INTO v_trait_count FROM public.loadout_traits WHERE loadout_id=v_active_loadout.id AND lower(coalesce(trait_type,''))='starship';
    SELECT count(*) INTO v_boff_count FROM public.loadout_boffs WHERE loadout_id=v_active_loadout.id;
  END IF;

  INSERT INTO public.build_readiness_checks(build_id,check_key,passed,detail,checked_at)
  VALUES
    (p_build_id,'captain',coalesce(v_build.character_id is not null and v_ship.character_id=v_build.character_id,false),case when coalesce(v_build.character_id is not null and v_ship.character_id=v_build.character_id,false) then 'Character is linked to the same owned ship.' else 'Build must be linked to the character that owns the ship.' end,now()),
    (p_build_id,'build',coalesce(v_ship.id is not null and coalesce(v_ship.usage_mode,'')='build_created',false),case when coalesce(v_ship.id is not null and coalesce(v_ship.usage_mode,'')='build_created',false) then 'Owned ship is explicitly in build mode.' else 'Owned ship is not in build mode.' end,now()),
    (p_build_id,'active_loadout',v_active_loadout.id is not null,case when v_active_loadout.id is not null then 'An active loadout exists.' else 'Create and activate a loadout.' end,now()),
    (p_build_id,'equipment',coalesce(v_expected_equipment>0 and v_equipment_count>=v_expected_equipment,false),case when v_expected_equipment=0 then 'Ship catalogue equipment slots are not populated, so equipment readiness cannot be verified.' else format('%s of %s catalogue equipment slots recorded.',v_equipment_count,v_expected_equipment) end,now()),
    (p_build_id,'traits',coalesce(v_trait_count>=v_expected_traits,false),format('%s of %s available starship trait slots recorded.',v_trait_count,v_expected_traits),now()),
    (p_build_id,'bridge_crew',coalesce(v_expected_stations>0 and v_boff_count>=v_expected_stations,false),case when v_expected_stations=0 then 'Ship catalogue bridge seating is not populated, so crew readiness cannot be verified.' else format('%s of %s catalogue bridge stations configured.',v_boff_count,v_expected_stations) end,now())
  ON CONFLICT(build_id,check_key) DO UPDATE SET passed=excluded.passed,detail=excluded.detail,checked_at=excluded.checked_at;

  SELECT count(*) INTO v_passed FROM public.build_readiness_checks WHERE build_id=p_build_id AND passed=true;
  UPDATE public.builds SET completion_percent=round((v_passed::numeric/6)*100),is_complete=(v_passed=6),last_validated_at=now(),updated_at=now() WHERE id=p_build_id;
END;
$function$;

DROP TRIGGER IF EXISTS trg_build_readiness_builds ON public.builds;
DROP TRIGGER IF EXISTS trg_build_operational_readiness ON public.builds;