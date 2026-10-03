-- Normalize every ship's actual bridge-officer seating into an explicit slots array.
-- Each slot carries slot number, rank, career, specialization and display label.
update public.sto_ships s
set bridge_officer_stations = jsonb_build_object(
  'slots', (
    select jsonb_agg(
      jsonb_build_object(
        'slot', coalesce((x.value->>'slot')::int, x.ord),
        'rank', coalesce(x.value->>'rank',''),
        'career', case
          when regexp_replace(coalesce(x.value->>'career',''), '^(Commander|Lieutenant Commander|Lieutenant|Ensign)\\s+', '', 'i') = ''
            then coalesce(x.value->>'career','')
          else regexp_replace(coalesce(x.value->>'career',''), '^(Commander|Lieutenant Commander|Lieutenant|Ensign)\\s+', '', 'i')
        end,
        'specialization', nullif(x.value->>'specialization',''),
        'label', concat_ws(' ',
          nullif(x.value->>'rank',''),
          nullif(regexp_replace(coalesce(x.value->>'career',''), '^(Commander|Lieutenant Commander|Lieutenant|Ensign)\\s+', '', 'i'), ''),
          nullif(x.value->>'specialization','')
        )
      ) order by coalesce((x.value->>'slot')::int, x.ord)
    )
    from jsonb_array_elements(s.bridge_officer_stations->'slots') with ordinality x(value, ord)
  )
), updated_at=now()
where jsonb_typeof(s.bridge_officer_stations->'slots')='array';

-- Keep the Adamant variants internally identical for ship-layout fields.
update public.sto_ships t
set bridge_officer_stations=a.bridge_officer_stations,
    fore_weapon_slots=a.fore_weapon_slots,
    aft_weapon_slots=a.aft_weapon_slots,
    experimental_weapon_slot=a.experimental_weapon_slot,
    hangar_bays=a.hangar_bays,
    engineering_console_slots=a.engineering_console_slots,
    science_console_slots=a.science_console_slots,
    tactical_console_slots=a.tactical_console_slots,
    special_console=a.special_console,
    ship_trait=a.ship_trait,
    updated_at=now()
from public.sto_ships a
where a.name='Adamant Heavy Raider'
  and t.name in ('Terran Adamant Heavy Raider','Terran Adamant Intel Heavy Raider');

-- Keep the quality view aware of actual seating rather than merely a non-null JSON field.
create or replace view public.sto_ship_data_quality as
select id,name,tier,source_key,
  (ship_class is not null and faction is not null and tier is not null) as classification_complete,
  (hull_modifier is not null and shield_modifier is not null and turn_rate is not null and impulse_modifier is not null and inertia is not null) as mobility_complete,
  (fore_weapon_slots is not null and aft_weapon_slots is not null and experimental_weapon_slot is not null) as weapons_complete,
  (engineering_console_slots is not null and science_console_slots is not null and tactical_console_slots is not null) as consoles_complete,
  (jsonb_typeof(bridge_officer_stations->'slots')='array' and jsonb_array_length(bridge_officer_stations->'slots') > 0) as bridge_seating_complete,
  (ship_trait is not null or special_console is not null or special_mechanics is not null) as special_data_present,
  (source_key is not null and source_url is not null) as provenance_complete
from public.sto_ships;
