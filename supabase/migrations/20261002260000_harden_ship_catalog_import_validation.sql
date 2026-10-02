-- Harden the ship catalogue import pipeline.
-- Imports are validated before they can ever be considered for application.
-- No catalogue row is created from an unvalidated payload.

create or replace function public.validate_sto_ship_catalog_import(p_import_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_import public.sto_ship_catalog_imports%rowtype;
  v_item jsonb;
  v_count integer;
  v_bad integer;
begin
  select *
    into v_import
  from public.sto_ship_catalog_imports
  where id = p_import_id
    and imported_by = auth.uid();

  if v_import.id is null then
    raise exception 'Ship catalogue import not found';
  end if;

  if v_import.source_key <> 'stowiki' then
    update public.sto_ship_catalog_imports
      set status = 'rejected'
    where id = p_import_id;
    return 'rejected';
  end if;

  if v_import.source_url is null
     or v_import.source_url not like 'https://stowiki.net/%' then
    update public.sto_ship_catalog_imports
      set status = 'rejected'
    where id = p_import_id;
    return 'rejected';
  end if;

  if jsonb_typeof(v_import.payload) <> 'array' then
    update public.sto_ship_catalog_imports
      set status = 'rejected'
    where id = p_import_id;
    return 'rejected';
  end if;

  select count(*) into v_count
  from jsonb_array_elements(v_import.payload);

  if v_count = 0 then
    update public.sto_ship_catalog_imports
      set status = 'rejected'
    where id = p_import_id;
    return 'rejected';
  end if;

  select count(*) into v_bad
  from jsonb_array_elements(v_import.payload) item
  where jsonb_typeof(item) <> 'object'
     or nullif(trim(item->>'name'), '') is null
     or nullif(trim(item->>'ship_class'), '') is null
     or nullif(trim(item->>'faction'), '') is null
     or nullif(trim(item->>'tier'), '') is null
     or nullif(trim(item->>'source_reference'), '') is null;

  if v_bad > 0 then
    update public.sto_ship_catalog_imports
      set status = 'rejected'
    where id = p_import_id;
    return 'rejected';
  end if;

  update public.sto_ship_catalog_imports
    set status = 'validated'
  where id = p_import_id;

  return 'validated';
end;
$$;

revoke all on function public.validate_sto_ship_catalog_import(uuid)
  from public, anon;

grant execute on function public.validate_sto_ship_catalog_import(uuid)
  to authenticated;
