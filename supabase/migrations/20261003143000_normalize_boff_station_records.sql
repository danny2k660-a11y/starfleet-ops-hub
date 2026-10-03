-- Normalize bridge-officer station records after the ship-detail UI switched to
-- the structured `bridge_officer_stations.slots` format.
-- Sources: current STO wiki pages for the explicitly corrected records.

update public.sto_ships
set bridge_officer_stations=jsonb_build_object('slots',jsonb_build_array(
  jsonb_build_object('rank','Lieutenant Commander','slot',1,'label','Lieutenant Commander Tactical/Command','career','Tactical','specialization','Command'),
  jsonb_build_object('rank','Lieutenant','slot',2,'label','Lieutenant Tactical','career','Tactical','specialization',null),
  jsonb_build_object('rank','Commander','slot',3,'label','Commander Engineering','career','Engineering','specialization',null),
  jsonb_build_object('rank','Lieutenant','slot',4,'label','Lieutenant Science','career','Science','specialization',null),
  jsonb_build_object('rank','Lieutenant Commander','slot',5,'label','Lieutenant Commander Universal','career','Universal','specialization',null)
))
where name in ('Orion Blackguard Flight Deck Assault Carrier','Fleet Orion Blackguard Flight Deck Assault Carrier','Tellarite Pralim Flight Deck Assault Carrier');

update public.sto_ships
set bridge_officer_stations=jsonb_build_object('slots',jsonb_build_array(
  jsonb_build_object('rank','Commander','slot',1,'label','Commander Tactical/Pilot','career','Tactical','specialization','Pilot'),
  jsonb_build_object('rank','Lieutenant Commander','slot',2,'label','Lieutenant Commander Engineering','career','Engineering','specialization',null),
  jsonb_build_object('rank','Lieutenant Commander','slot',3,'label','Lieutenant Commander Science','career','Science','specialization',null),
  jsonb_build_object('rank','Lieutenant Commander','slot',4,'label','Lieutenant Commander Universal/Intel','career','Universal','specialization','Intel')
))
where name='Undine Cheirax Bio-Warship';

update public.sto_ships
set bridge_officer_stations=jsonb_build_object('slots',jsonb_build_array(
  jsonb_build_object('rank','Commander','slot',1,'label','Commander Tactical','career','Tactical','specialization',null),
  jsonb_build_object('rank','Lieutenant','slot',2,'label','Lieutenant Engineering','career','Engineering','specialization',null),
  jsonb_build_object('rank','Lieutenant Commander','slot',3,'label','Lieutenant Commander Science','career','Science','specialization',null),
  jsonb_build_object('rank','Lieutenant Commander','slot',4,'label','Lieutenant Commander Universal','career','Universal','specialization',null)
))
where name='Undine Nicor Bio-Warship';

update public.sto_ships
set bridge_officer_stations=jsonb_build_object('slots',jsonb_build_array(
  jsonb_build_object('rank','Lieutenant Commander','slot',1,'label','Lieutenant Commander Tactical','career','Tactical','specialization',null),
  jsonb_build_object('rank','Commander','slot',2,'label','Commander Engineering/Command','career','Engineering','specialization','Command'),
  jsonb_build_object('rank','Lieutenant','slot',3,'label','Lieutenant Engineering','career','Engineering','specialization',null),
  jsonb_build_object('rank','Lieutenant','slot',4,'label','Lieutenant Science/Command','career','Science','specialization','Command'),
  jsonb_build_object('rank','Lieutenant','slot',5,'label','Lieutenant Universal','career','Universal','specialization',null)
))
where name='Vastam Tactical Command Warbird';

-- Shuttles do not have normal ship bridge-officer seating.
update public.sto_ships
set bridge_officer_stations=jsonb_build_object('slots',jsonb_build_array())
where name in ('Kivra Shuttle','Tiercel Shuttle','Type-8 Shuttlecraft');

-- Nandi and Na'Qjej legitimately have six BOff seats. Normalize their career
-- field separately from the displayed rank/label.
update public.sto_ships
set bridge_officer_stations=jsonb_set(
  bridge_officer_stations,'{slots}',
  (select jsonb_agg(
     jsonb_set(x,'{career}',to_jsonb(
       case
         when x->>'label' ilike '%Tactical%' then 'Tactical'
         when x->>'label' ilike '%Engineering%' then 'Engineering'
         when x->>'label' ilike '%Science%' then 'Science'
         when x->>'label' ilike '%Universal%' then 'Universal'
         else x->>'career'
       end))
     order by (x->>'slot')::int
   ) from jsonb_array_elements(bridge_officer_stations->'slots') x)
)
where name in ('Na''Qjej Intel Battlecruiser','Ferengi Nandi Warship');
