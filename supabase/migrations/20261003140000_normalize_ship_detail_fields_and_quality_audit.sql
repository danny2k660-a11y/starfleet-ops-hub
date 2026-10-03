-- Normalize empty ship-detail values and expose a single audit view for the app.
update public.sto_ships
set ship_trait=nullif(btrim(ship_trait),''),
    special_console=nullif(btrim(special_console),''),
    special_mechanics=nullif(btrim(special_mechanics),'');

create or replace view public.sto_ship_data_quality as
select id,name,tier,source_key,
  (ship_class is not null and faction is not null and tier is not null) as classification_complete,
  (hull_modifier is not null and shield_modifier is not null and turn_rate is not null and impulse_modifier is not null and inertia is not null) as mobility_complete,
  (fore_weapon_slots is not null and aft_weapon_slots is not null and experimental_weapon_slot is not null) as weapons_complete,
  (engineering_console_slots is not null and science_console_slots is not null and tactical_console_slots is not null) as consoles_complete,
  (bridge_officer_stations is not null) as bridge_seating_complete,
  (ship_trait is not null or special_console is not null or special_mechanics is not null) as special_data_present,
  (source_key is not null and source_url is not null) as provenance_complete
from public.sto_ships;
