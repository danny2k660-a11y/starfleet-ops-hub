-- Accuracy-first catalogue normalization.
--
-- 1. Converts SETS bridge seating to concrete slot-by-slot stations.
-- 2. Converts legacy aggregate seating text to concrete slots.
-- 3. Completes Adamant and Fleet Akira detailed fields from current wiki data.
-- 4. Corrects current official Empersa/Narada/Constitution data.
-- 5. Fills missing special-console/mechanics values only when the pinned SETS
--    source explicitly provides them. No values are inferred from ship class.

-- SETS-derived slot seating
with payload as (
  select (extensions.http_get('https://raw.githubusercontent.com/STOCD/SETS-Data/1cea315ea0399fca6cf717d72b3695d9be8ab258/cargo/ship_list.json')).content::jsonb j
), sets as (
  select x->>'name' name, x->'boffs' boffs
  from payload cross join lateral jsonb_array_elements(j) x
  where jsonb_typeof(x->'boffs')='array' and jsonb_array_length(x->'boffs')=5
)
update public.sto_ships s
set bridge_officer_stations=jsonb_build_object('stations',sets.boffs)
from sets where s.name=sets.name;

-- Legacy aggregate seating -> concrete slot names.
with parsed as (
  select s.id, array_agg(trim(u.token) order by u.ord) tokens
  from public.sto_ships s
  join public.sto_ship_reference_data r on r.sto_ship_id=s.id
  cross join lateral unnest(string_to_array(r.seats_text, ',')) with ordinality u(token,ord)
  where s.bridge_officer_stations ? 'reference_seating' and r.seats_text is not null
  group by s.id
), normalized as (
  select id,jsonb_agg(case left(token,1)
    when '4' then 'Commander ' || substring(token from 3)
    when '3' then 'Lieutenant Commander ' || substring(token from 3)
    when '2' then 'Lieutenant ' || substring(token from 3)
    when '1' then 'Ensign ' || substring(token from 3)
  end) stations
  from parsed cross join lateral unnest(tokens) z(token) group by id
)
update public.sto_ships s set bridge_officer_stations=jsonb_build_object('stations',normalized.stations)
from normalized where s.id=normalized.id;

-- SETS special fields only where the current record is blank.
with payload as (
  select (extensions.http_get('https://raw.githubusercontent.com/STOCD/SETS-Data/1cea315ea0399fca6cf717d72b3695d9be8ab258/cargo/ship_list.json')).content::jsonb j
), sets as (select x->>'name' name,x from payload cross join lateral jsonb_array_elements(j) x)
update public.sto_ships s
set special_console=case when s.special_console is null and nullif(sets.x->>'uniconsole','') is not null then sets.x->>'uniconsole' else s.special_console end,
    special_mechanics=case when s.special_mechanics is null and jsonb_typeof(sets.x->'abilities')='array' and jsonb_array_length(sets.x->'abilities')>0 then trim(both '[]' from (sets.x->'abilities')::text) else s.special_mechanics end
from sets where lower(s.name)=lower(sets.name);

-- Adamant
update public.sto_ships set hull_modifier=1.15,shield_modifier=.8,turn_rate=20,impulse_modifier=.22,inertia=75,fore_weapon_slots=5,aft_weapon_slots=1,experimental_weapon_slot=true,hangar_bays=0,engineering_console_slots=3,science_console_slots=3,tactical_console_slots=5,universal_console_slots=0,bridge_officer_stations=jsonb_build_object('stations',jsonb_build_array('Commander Tactical/Intel','Lieutenant Commander Universal','Lieutenant Commander Universal','Lieutenant Universal/Temporal Operative','Ensign Universal')),ship_trait='Wild Weasel',special_console='Agony Redistributor',special_weapons='Terran Repeating Warhead Launcher',special_mechanics='Raider Flanking; Battle Cloak; Active Sensor Arrays; Warp Signature Masking; Can Equip Dual Cannons',source_key='stowiki-catalogue',source_url='https://stowiki.net/wiki/Terran_Adamant_Heavy_Raider',source_reference='STOWiki detailed ship page; current published ship data',data_version='stowiki-crosscheck-2026',verified_at=now() where name='Adamant Heavy Raider';

-- Current official corrections
update public.sto_ships set inertia=35,source_key='official-sto-2026',source_url='https://www.playstartrekonline.com/',source_reference='Official STO 2026 Constitution Pilot Multi-Mission Cruiser announcement; corrected inertia value',data_version='official-sto-2026',verified_at=null where name='Constitution Pilot Multi-Mission Cruiser';
update public.sto_ships set shield_modifier=1.25,source_key='official-sto-2026',source_url='https://www.playstartrekonline.com/',source_reference='Official STO Narada Miracle Worker Juggernaut announcement; corrected shield modifier',data_version='official-sto-2026',verified_at=null where name='Narada Miracle Worker Juggernaut';
update public.sto_ships set experimental_weapon_slot=false,ship_trait='Hyper-Generative Repair Matrix',special_mechanics='Innovation; Cyclical Quantum Slipstream Drive; Alliance Wingmates; Can Equip Dual Cannons',special_weapons='Empersa Array - Antiproton Overcharge Lance',source_key='official-sto-2026',source_url='https://www.playstartrekonline.com/',source_reference='Official STO Anniversary XVI ship announcement',data_version='official-sto-2026',verified_at=null where name='Empress Miracle Worker Alliance Juggernaut';

-- Fleet Akira T6
update public.sto_ships set hull_modifier=1.173333,shield_modifier=.99,turn_rate=15,impulse_modifier=.20,inertia=60,fore_weapon_slots=4,aft_weapon_slots=3,experimental_weapon_slot=true,hangar_bays=1,engineering_console_slots=3,science_console_slots=3,tactical_console_slots=5,universal_console_slots=0,bridge_officer_stations=jsonb_build_object('stations',jsonb_build_array('Commander Tactical','Lieutenant Commander Engineering/Pilot','Lieutenant Commander Universal','Lieutenant Tactical','Ensign Science')),special_mechanics='Launch Peregrine Fighters; Carrier Commands; Can Equip Dual Cannons',special_weapons='Experimental Hyperexcited Ion Stream Projector',source_key='stowiki-catalogue',source_url='https://stowiki.net/wiki/Fleet_Akira_Heavy_Strike_Wing_Escort_(T6)',source_reference='STOWiki detailed ship page',data_version='stowiki-crosscheck-2026',verified_at=now() where name='Fleet Akira Heavy Strike Wing Escort';

-- Normalize JSON-array mechanics strings produced by earlier SETS imports.
update public.sto_ships s set special_mechanics=q.mechanics from (select id,string_agg(value,'; ' order by ord) mechanics from public.sto_ships cross join lateral jsonb_array_elements_text(special_mechanics::jsonb) with ordinality a(value,ord) where special_mechanics like '[%' group by id) q where s.id=q.id;
