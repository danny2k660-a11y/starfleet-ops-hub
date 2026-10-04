create or replace function public.sync_doff_catalog_to_duty_officer_catalog()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  insert into public.duty_officer_catalog (
    id,name,department,specialization,rarity,duty_type,ability_text,effect_text,
    source_type,source_name,source_reference,data_quality_status,data_quality_notes,properties
  )
  values (
    new.id,new.name,new.department,new.specialization,null,
    case when new.domain='ground' then 'Ground' when new.domain='space' then 'Space' else new.domain end,
    coalesce(new.ability_data->0->>'description',''),
    coalesce(new.ability_data->0->>'description',''),
    new.source_type,new.source_name,new.source_reference,new.data_quality_status,new.data_quality_notes,
    jsonb_build_object('source_catalog','doff_catalog','ability_data',new.ability_data,'domain',new.domain)
  )
  on conflict (id) do update set
    name=excluded.name,department=excluded.department,specialization=excluded.specialization,
    duty_type=excluded.duty_type,ability_text=excluded.ability_text,effect_text=excluded.effect_text,
    source_type=excluded.source_type,source_name=excluded.source_name,source_reference=excluded.source_reference,
    data_quality_status=excluded.data_quality_status,data_quality_notes=excluded.data_quality_notes,properties=excluded.properties;
  return new;
end;
$function$;

drop trigger if exists trg_sync_doff_catalog_to_duty_officer_catalog on public.doff_catalog;
create trigger trg_sync_doff_catalog_to_duty_officer_catalog
after insert or update on public.doff_catalog
for each row
execute function public.sync_doff_catalog_to_duty_officer_catalog();
