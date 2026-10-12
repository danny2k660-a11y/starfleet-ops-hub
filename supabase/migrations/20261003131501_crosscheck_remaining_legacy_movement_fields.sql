-- Complete the final source-limited movement fields using exact matching
-- reference-family baselines already present in the catalogue.
-- These records remain unverified by STOWiki and are explicitly provenance-tagged.
update public.sto_ships set inertia=100 where name in ('Aeon Timeship','Ferengi Na''Far','Jem''Hadar Fighter','Rozhenko Timeship','Tholian Widow Fighter','Vaadwaur Pythus Fighter') and inertia is null;
update public.sto_ships set inertia=30 where name in ('Fleet Orion Corsair Flight Deck Carrier Retrofit','Orion Corsair Flight Deck Carrier','Orion Dacoit Flight Deck Carrier') and inertia is null;
update public.sto_ships set inertia=80 where name='Nausicaan Vandal Destroyer' and inertia is null;
update public.sto_ships set inertia=60 where name='Fleet Nimbus Deep Space Science Vessel' and inertia is null;
update public.sto_ships set inertia=70 where name='Tholian Orb Weaver' and inertia is null;
update public.sto_ships set source_key='community-crosscheck',source_url='https://github.com/STOCD/SETS-Data',source_reference='SETS reference-family cross-check; value completed from matching catalogue family',data_version='sets-crosscheck-2026',verified_at=null where name in ('Aeon Timeship','Ferengi Na''Far','Jem''Hadar Fighter','Rozhenko Timeship','Tholian Widow Fighter','Vaadwaur Pythus Fighter','Fleet Orion Corsair Flight Deck Carrier Retrofit','Orion Corsair Flight Deck Carrier','Orion Dacoit Flight Deck Carrier','Nausicaan Vandal Destroyer','Fleet Nimbus Deep Space Science Vessel','Tholian Orb Weaver') and source_key='community-sets-data';
