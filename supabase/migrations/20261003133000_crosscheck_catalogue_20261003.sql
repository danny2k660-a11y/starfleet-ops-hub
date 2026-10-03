-- Cross-reference pass: preserve source-limited fields where the current reference
-- renders only a template; populate only values directly exposed by the reference.

update public.sto_ships set inertia=50, source_key='stowiki-crosscheck', source_url='https://sto.fandom.com/wiki/Fleet_Comet_Reconnaissance_Science_Vessel', source_reference='Official Star Trek Online Wiki', data_version='wiki-crosscheck-2026', verified_at=null where name='Fleet Comet Reconnaissance Science Vessel' and inertia is null;
update public.sto_ships set inertia=40, source_key='stowiki-crosscheck', source_url='https://sto.fandom.com/wiki/Fleet_Olympic_Research_Science_Vessel_Retrofit', source_reference='Official Star Trek Online Wiki', data_version='wiki-crosscheck-2026', verified_at=null where name='Fleet Olympic Research Science Vessel Retrofit' and inertia is null;
update public.sto_ships set inertia=40, source_key='stowiki-crosscheck', source_url='https://sto.fandom.com/wiki/Fleet_Olympic_Research_Science_Vessel_Retrofit', source_reference='Official Star Trek Online Wiki Olympic-class comparison', data_version='wiki-crosscheck-2026', verified_at=null where name='Olympic Research Science Vessel Retrofit' and inertia is null;
update public.sto_ships set inertia=100, source_key='stowiki-crosscheck', source_url='https://sto.fandom.com/wiki/Jem%27Hadar_Fighter', source_reference='Official Star Trek Online Wiki', data_version='wiki-crosscheck-2026', verified_at=null where name='Jem''Hadar Fighter' and inertia is null;
update public.sto_ships set impulse_modifier=0.20, source_key='stowiki-crosscheck', source_url='https://sto.fandom.com/wiki/Jem%27Hadar_Fighter', source_reference='Official Star Trek Online Wiki', data_version='wiki-crosscheck-2026', verified_at=null where name='Jem''Hadar Fighter' and impulse_modifier is null;
update public.sto_ships set inertia=100, source_key='stowiki-crosscheck', source_url='https://sto.fandom.com/wiki/Small_Craft', source_reference='Official Star Trek Online Wiki', data_version='wiki-crosscheck-2026', verified_at=null where name in ('Aeon Timeship','Ferengi Na''Far','Rozhenko Timeship','Tholian Widow Fighter','Vaadwaur Pythus Fighter') and inertia is null;

update public.sto_ships s
set ship_class = trim(both '"' from split_part(trim(both '[]' from r.raw_data->>'type'), '","', 1)),
    faction = r.raw_data->>'factionlede'
from public.sto_ship_reference_data r
where r.sto_ship_id=s.id and (s.ship_class is null or s.faction is null)
  and r.raw_data ? 'type' and r.raw_data ? 'factionlede';
