update public.sto_ships s
set bridge_officer_stations = jsonb_build_object(
 'stations', s.bridge_officer_stations->'stations',
 'slots', (
   select jsonb_agg(jsonb_set(e,'{career}',to_jsonb(case when regexp_replace(e->>'career','^(Commander|Lieutenant Commander|Lieutenant|Ensign) ','')='Universal' then 'Universal' else regexp_replace(e->>'career','^(Commander|Lieutenant Commander|Lieutenant|Ensign) ','') end)) order by (e->>'slot')::int)
   from jsonb_array_elements(s.bridge_officer_stations->'slots') e
 )
)
where s.bridge_officer_stations ? 'slots';

update public.sto_ships
set ship_trait='Wild Weasel',
    special_console='Console - Universal - Agony Redistributor',
    special_weapons='Terran Repeating Warhead Launcher',
    experimental_weapon_slot=true,
    special_mechanics='Combat Cloaking Device; Raider Flanking; Active Sensor Arrays; Gather Intelligence; Expose Vulnerability: Defenses; Expose Vulnerability: Weapon Systems; Expose Vulnerability: Critical Systems',
    source_key='official-sto-2022',
    source_url='https://www.arcgames.com/en/corp-news/detail/11507853-the-12th-anniversary-terran-bundle%21',
    source_reference='Official Star Trek Online 12th Anniversary Terran Bundle announcement',
    data_version='official-sto-2022',
    verified_at=null
where name in ('Adamant Heavy Raider','Terran Adamant Heavy Raider');
