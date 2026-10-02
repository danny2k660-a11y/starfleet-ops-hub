-- Expand the STO ship catalogue from the pinned STOCD SETS-Data snapshot.
-- Source snapshot: STOCD/SETS-Data commit 1cea315ea0399fca6cf717d72b3695d9be8ab258 (2026-09-30).
-- This source is a community-maintained cache derived from official STO wiki data.
-- It is catalogue/reference provenance, not direct STOWiki verification.

create extension if not exists http with schema extensions;

insert into public.sto_data_sources (
  source_key, name, base_url, source_type, purpose, active, verified_at, notes
)
values (
  'community-sets-data',
  'STOCD SETS ship data',
  'https://github.com/STOCD/SETS-Data',
  'community',
  'Comprehensive ship catalogue derived from official STO wiki data by the open-source SETS project.',
  true,
  now(),
  'Pinned snapshot 1cea315ea0399fca6cf717d72b3695d9be8ab258. Individual ship records are not direct STOWiki verification.'
)
on conflict (source_key) do nothing;

with payload as (
  select (extensions.http_get('https://raw.githubusercontent.com/STOCD/SETS-Data/1cea315ea0399fca6cf717d72b3695d9be8ab258/cargo/ship_list.json')).content::jsonb as j
), src as (
  select x from payload, lateral jsonb_array_elements(payload.j) x
), norm as (
  select
    x->>'Page' page,
    (x->'type'->>0) ship_class,
    x->>'factionlede' faction,
    (x->>'tier')::int tier_num,
    (x->>'hull')::numeric base_hull,
    (x->>'hullmod')::numeric hull_modifier,
    (x->>'shieldmod')::numeric shield_modifier,
    (x->>'turnrate')::numeric turn_rate,
    (x->>'impulse')::numeric impulse_modifier,
    (x->>'inertia')::numeric inertia,
    (x->>'fore')::int fore_weapon_slots,
    (x->>'aft')::int aft_weapon_slots,
    ((x->>'experimental')::int=1) experimental_weapon_slot,
    (x->>'hangars')::int hangar_bays,
    (x->>'consoleseng')::int engineering_console_slots,
    (x->>'consolessci')::int science_console_slots,
    (x->>'consolestac')::int tactical_console_slots,
    jsonb_build_object('stations',x->'boffs') bridge_officer_stations,
    nullif(x->>'uniconsole','') special_console,
    (x->'abilities')::text special_mechanics
  from src
)
insert into public.sto_ships (
  name,ship_class,faction,tier,hull_modifier,shield_modifier,turn_rate,impulse_modifier,inertia,base_hull,
  fore_weapon_slots,aft_weapon_slots,experimental_weapon_slot,hangar_bays,
  engineering_console_slots,science_console_slots,tactical_console_slots,
  bridge_officer_stations,special_console,special_mechanics,
  source_reference,data_version,source_key,source_url,verified_at
)
select
  n.page,n.ship_class,n.faction,'T'||n.tier_num,n.hull_modifier,n.shield_modifier,n.turn_rate,n.impulse_modifier,n.inertia,n.base_hull,
  n.fore_weapon_slots,n.aft_weapon_slots,n.experimental_weapon_slot,n.hangar_bays,
  n.engineering_console_slots,n.science_console_slots,n.tactical_console_slots,
  n.bridge_officer_stations,n.special_console,n.special_mechanics,
  n.page,'sets-data-2026-09','community-sets-data',
  'https://raw.githubusercontent.com/STOCD/SETS-Data/1cea315ea0399fca6cf717d72b3695d9be8ab258/cargo/ship_list.json',null
from norm n
where not exists (select 1 from public.sto_ships sh where lower(sh.name)=lower(n.page));

with payload as (
  select (extensions.http_get('https://raw.githubusercontent.com/STOCD/SETS-Data/1cea315ea0399fca6cf717d72b3695d9be8ab258/cargo/ship_list.json')).content::jsonb as j
), src as (
  select x from payload, lateral jsonb_array_elements(payload.j) x
), norm as (
  select
    x->>'Page' page,(x->>'tier')::int tier_num,(x->>'hull')::numeric base_hull,(x->>'hullmod')::numeric hull_modifier,
    (x->>'shieldmod')::numeric shield_modifier,(x->>'turnrate')::numeric turn_rate,(x->>'impulse')::numeric impulse_modifier,
    (x->>'inertia')::numeric inertia,(x->>'fore')::int fore_weapon_slots,(x->>'aft')::int aft_weapon_slots,
    ((x->>'experimental')::int=1) experimental_weapon_slot,(x->>'hangars')::int hangar_bays,
    (x->>'consoleseng')::int engineering_console_slots,(x->>'consolessci')::int science_console_slots,
    (x->>'consolestac')::int tactical_console_slots,jsonb_build_object('stations',x->'boffs') bridge_officer_stations,
    nullif(x->>'uniconsole','') special_console,(x->'abilities')::text special_mechanics
  from src
)
update public.sto_ships sh set
  tier=coalesce(sh.tier,'T'||n.tier_num),base_hull=coalesce(sh.base_hull,n.base_hull),
  hull_modifier=coalesce(sh.hull_modifier,n.hull_modifier),shield_modifier=coalesce(sh.shield_modifier,n.shield_modifier),
  turn_rate=coalesce(sh.turn_rate,n.turn_rate),impulse_modifier=coalesce(sh.impulse_modifier,n.impulse_modifier),
  inertia=coalesce(sh.inertia,n.inertia),fore_weapon_slots=coalesce(sh.fore_weapon_slots,n.fore_weapon_slots),
  aft_weapon_slots=coalesce(sh.aft_weapon_slots,n.aft_weapon_slots),experimental_weapon_slot=coalesce(sh.experimental_weapon_slot,n.experimental_weapon_slot),
  hangar_bays=coalesce(sh.hangar_bays,n.hangar_bays),engineering_console_slots=coalesce(sh.engineering_console_slots,n.engineering_console_slots),
  science_console_slots=coalesce(sh.science_console_slots,n.science_console_slots),tactical_console_slots=coalesce(sh.tactical_console_slots,n.tactical_console_slots),
  bridge_officer_stations=coalesce(sh.bridge_officer_stations,n.bridge_officer_stations),
  special_console=coalesce(sh.special_console,n.special_console),special_mechanics=coalesce(sh.special_mechanics,n.special_mechanics),updated_at=now()
from norm n where lower(sh.name)=lower(n.page);
