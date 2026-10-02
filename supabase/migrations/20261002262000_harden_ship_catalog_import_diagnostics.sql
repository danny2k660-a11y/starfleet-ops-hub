-- Strengthen catalogue import diagnostics and validation.
-- Rejections carry a useful reason so the mobile review screen can explain exactly what failed.

alter table public.sto_ship_catalog_imports
  add column if not exists error_message text;

create index if not exists sto_ship_catalog_imports_review_idx
  on public.sto_ship_catalog_imports(status, created_at desc);

create or replace function public.validate_sto_ship_catalog_import(p_import_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_import public.sto_ship_catalog_imports%rowtype;
  v_count integer;
  v_bad integer;
  v_duplicate integer;
  v_reason text;
begin
  select * into v_import
  from public.sto_ship_catalog_imports
  where id = p_import_id and imported_by = auth.uid();

  if v_import.id is null then
    raise exception 'Ship catalogue import not found';
  end if;

  update public.sto_ship_catalog_imports
    set error_message = null
  where id = p_import_id;

  if v_import.source_key <> 'stowiki' then
    v_reason := 'Only STOWiki imports are accepted by the verified catalogue pipeline.';
  elsif v_import.source_url is null
     or v_import.source_url !~ '^https://stowiki\\.net(/|$)' then
    v_reason := 'Source URL must be an HTTPS STOWiki URL.';
  elsif jsonb_typeof(v_import.payload) <> 'array' then
    v_reason := 'Import payload must be a JSON array of ship records.';
  else
    select count(*) into v_count from jsonb_array_elements(v_import.payload);
    if v_count = 0 then
      v_reason := 'Import payload contains no ship records.';
    else
      select count(*) into v_bad
      from jsonb_array_elements(v_import.payload) item
      where jsonb_typeof(item) <> 'object'
         or nullif(trim(item->>'name'), '') is null
         or nullif(trim(item->>'ship_class'), '') is null
         or nullif(trim(item->>'faction'), '') is null
         or nullif(trim(item->>'tier'), '') is null
         or nullif(trim(item->>'source_reference'), '') is null
         or (item ? 'hull_modifier' and jsonb_typeof(item->'hull_modifier') <> 'number')
         or (item ? 'shield_modifier' and jsonb_typeof(item->'shield_modifier') <> 'number')
         or (item ? 'weapon_layout' and jsonb_typeof(item->'weapon_layout') <> 'string')
         or (item ? 'console_count' and jsonb_typeof(item->'console_count') <> 'number');

      if v_bad > 0 then
        v_reason := 'One or more records is missing a required field or contains an incorrectly typed optional field.';
      else
        select count(*) into v_duplicate
        from (
          select lower(trim(value->>'name')) as ship_name
          from jsonb_array_elements(v_import.payload)
          group by lower(trim(value->>'name'))
          having count(*) > 1
        ) duplicates;

        if v_duplicate > 0 then
          v_reason := 'Import contains duplicate ship names. Remove duplicates before applying it.';
        end if;
      end if;
    end if;
  end if;

  if v_reason is not null then
    update public.sto_ship_catalog_imports
      set status='rejected', error_message=v_reason
    where id=p_import_id;
    return 'rejected';
  end if;

  update public.sto_ship_catalog_imports
    set status='validated', error_message=null
  where id=p_import_id;
  return 'validated';
end;
$$;

revoke all on function public.validate_sto_ship_catalog_import(uuid) from public, anon;
grant execute on function public.validate_sto_ship_catalog_import(uuid) to authenticated;
