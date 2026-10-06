create table if not exists public.catalog_validation_runs (
  id uuid primary key default gen_random_uuid(),
  dataset text not null,
  total_rows integer not null,
  verified_rows integer not null,
  review_rows integer not null,
  missing_description_rows integer not null default 0,
  missing_source_rows integer not null default 0,
  duplicate_key_rows integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists catalog_validation_runs_dataset_idx
  on public.catalog_validation_runs(dataset, created_at desc);

insert into public.catalog_validation_runs
(dataset,total_rows,verified_rows,review_rows,missing_description_rows,missing_source_rows,duplicate_key_rows,notes)
select 'equipment',count(*)::int,count(*) filter(where data_quality_status='verified')::int,count(*) filter(where data_quality_status<>'verified' or data_quality_status is null)::int,count(*) filter(where nullif(trim(description),'') is null)::int,count(*) filter(where nullif(trim(source_reference),'') is null)::int,0,'Current STOCD/SETS-Data equipment catalogue validation snapshot'
from public.equipment_catalog
union all
select 'traits',count(*)::int,count(*) filter(where data_quality_status='verified')::int,count(*) filter(where data_quality_status<>'verified' or data_quality_status is null)::int,count(*) filter(where nullif(trim(description),'') is null)::int,count(*) filter(where nullif(trim(source_reference),'') is null)::int,coalesce((select sum(c-1)::int from (select lower(trim(name)) n,count(*) c from public.trait_catalog group by 1 having count(*)>1) d),0),'Current STOCD/SETS-Data trait catalogue validation snapshot'
from public.trait_catalog
union all
select 'boff_abilities',count(*)::int,count(*) filter(where data_quality_status='verified')::int,count(*) filter(where data_quality_status<>'verified' or data_quality_status is null)::int,count(*) filter(where nullif(trim(description),'') is null)::int,count(*) filter(where nullif(trim(source_reference),'') is null)::int,0,'Current STOCD/SETS-Data BOFF ability catalogue validation snapshot'
from public.boff_ability_catalog
union all
select 'doffs',count(*)::int,count(*) filter(where data_quality_status='verified')::int,count(*) filter(where data_quality_status<>'verified' or data_quality_status is null)::int,count(*) filter(where ability_data is null)::int,count(*) filter(where nullif(trim(source_reference),'') is null)::int,0,'Current STOCD/SETS-Data DOFF catalogue validation snapshot'
from public.doff_catalog;