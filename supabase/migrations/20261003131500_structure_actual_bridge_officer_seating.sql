-- Store actual BOFF seat rank/career/specialization in structured JSON.
-- Existing stations text is retained for compatibility.
update public.sto_ships s
set bridge_officer_stations = jsonb_build_object('stations', x.labels, 'slots', x.slots)
from (
  select s2.id,
    jsonb_agg(v.label order by b.ord) labels,
    jsonb_agg(jsonb_build_object('slot',b.ord,'rank',v.rank,'career',v.career,'specialization',v.specialization,'label',v.label) order by b.ord) slots
  from public.sto_ships s2
  join lateral jsonb_array_elements(coalesce((select r.raw_data->'boffs' from public.sto_ship_reference_data r where r.sto_ship_id=s2.id and r.raw_data->'boffs' is not null order by r.updated_at desc nulls last limit 1),'[]'::jsonb)) with ordinality b(v,ord) on true
  cross join lateral (select case when b.v #>> '{}' like 'Commander %' then 'Commander' when b.v #>> '{}' like 'Lieutenant Commander %' then 'Lieutenant Commander' when b.v #>> '{}' like 'Lieutenant %' then 'Lieutenant' when b.v #>> '{}' like 'Ensign %' then 'Ensign' end rank, trim(regexp_replace(b.v #>> '{}','^(Commander|Lieutenant Commander|Lieutenant|Ensign)\\s*','')) remainder, b.v #>> '{}' label) p
  cross join lateral (select p.rank,p.label,case when position('/' in p.remainder)>0 then trim(split_part(p.remainder,'/',1)) when position('-' in p.remainder)>0 then trim(split_part(p.remainder,'-',1)) else p.remainder end career,case when position('/' in p.remainder)>0 then trim(split_part(p.remainder,'/',2)) when position('-' in p.remainder)>0 then trim(split_part(p.remainder,'-',2)) else null end specialization) v
  group by s2.id
) x where s.id=x.id;

update public.sto_ships s
set bridge_officer_stations = jsonb_build_object('stations', vals.labels, 'slots', vals.slots)
from (
  select s2.id,jsonb_agg(t.label order by a.ord) labels,jsonb_agg(jsonb_build_object('slot',a.ord,'rank',t.rank,'career',t.career,'specialization',t.specialization,'label',t.label) order by a.ord) slots
  from public.sto_ships s2
  cross join lateral jsonb_array_elements_text(s2.bridge_officer_stations->'stations') with ordinality a(label,ord)
  cross join lateral (select a.label,case when a.label like 'Commander %' then 'Commander' when a.label like 'Lieutenant Commander %' then 'Lieutenant Commander' when a.label like 'Lieutenant %' then 'Lieutenant' when a.label like 'Ensign %' then 'Ensign' end rank,trim(regexp_replace(a.label,'^(Commander|Lieutenant Commander|Lieutenant|Ensign)\\s*','')) remainder) p
  cross join lateral (select p.label,p.rank,case when position('/' in p.remainder)>0 then trim(split_part(p.remainder,'/',1)) when position('-' in p.remainder)>0 then trim(split_part(p.remainder,'-',1)) else p.remainder end career,case when position('/' in p.remainder)>0 then trim(split_part(p.remainder,'/',2)) when position('-' in p.remainder)>0 then trim(split_part(p.remainder,'-',2)) else null end specialization) t
  where s2.bridge_officer_stations ? 'stations' and not (s2.bridge_officer_stations ? 'slots')
  group by s2.id
) vals where s.id=vals.id;
