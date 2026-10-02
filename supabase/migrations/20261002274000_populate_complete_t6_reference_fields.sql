-- Populate the complete imported T6 reference records with the numeric/layout
-- fields that are present in the upstream dataset. Provenance remains community,
-- so verified_at is intentionally untouched.
UPDATE public.sto_ships s
SET base_hull=v.base_hull,
    hull_modifier=v.hull_modifier,
    shield_modifier=v.shield_modifier,
    turn_rate=v.turn_rate,
    impulse_modifier=v.impulse_modifier,
    inertia=v.inertia,
    fore_weapon_slots=v.fore_weapon_slots,
    aft_weapon_slots=v.aft_weapon_slots,
    experimental_weapon_slot=v.experimental_weapon_slot,
    hangar_bays=v.hangar_bays,
    tactical_console_slots=v.tactical_console_slots,
    engineering_console_slots=v.engineering_console_slots,
    science_console_slots=v.science_console_slots,
    universal_console_slots=v.universal_console_slots,
    bridge_officer_stations=v.bridge_officer_stations::jsonb
FROM (VALUES

) AS v(name,base_hull,hull_modifier,shield_modifier,turn_rate,impulse_modifier,inertia,fore_weapon_slots,aft_weapon_slots,experimental_weapon_slot,hangar_bays,tactical_console_slots,engineering_console_slots,science_console_slots,universal_console_slots,bridge_officer_stations)
WHERE lower(s.name)=lower(v.name)
  AND s.source_key='community-stoshipdb';