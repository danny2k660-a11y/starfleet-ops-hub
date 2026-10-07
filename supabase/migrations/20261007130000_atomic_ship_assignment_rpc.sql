-- Keep account ownership and character assignments atomic.
create or replace function public.claim_ship_assignments(
  p_ship_id uuid, p_character_ids uuid[], p_acquisition_source_id uuid default null, p_acquisition_group text default null
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer := 0;
  v_added integer := 0;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if p_ship_id is null or coalesce(array_length(p_character_ids, 1), 0) = 0 then raise exception 'A ship and at least one character are required'; end if;
  if exists (
    select 1 from unnest(p_character_ids) as c(id)
    left join public.characters c2 on c2.id = c.id and c2.user_id = v_user_id
    where c2.id is null
  ) then raise exception 'One or more characters do not belong to the current user'; end if;
  if not exists (select 1 from public.sto_ships where id = p_ship_id) then raise exception 'Ship does not exist in the catalogue'; end if;

  insert into public.sto_ship_ownership (user_id, sto_ship_id, ownership_status, acquisition_source_id, acquired_at, notes)
  values (v_user_id, p_ship_id, 'owned', p_acquisition_source_id, now(), 'Owned ship; character assignment managed separately')
  on conflict (user_id, sto_ship_id) do update set
    ownership_status='owned',
    acquisition_source_id=coalesce(excluded.acquisition_source_id, public.sto_ship_ownership.acquisition_source_id),
    acquired_at=coalesce(public.sto_ship_ownership.acquired_at, excluded.acquired_at),
    updated_at=now();

  update public.user_ships
  set ownership_status='owned',
      acquisition_source_id=coalesce(p_acquisition_source_id, acquisition_source_id),
      acquisition_group=coalesce(p_acquisition_group, acquisition_group),
      usage_mode=case when usage_mode='retired' then 'build_pending' else usage_mode end
  where user_id=v_user_id and sto_ship_id=p_ship_id and character_id=any(p_character_ids);
  get diagnostics v_count = row_count;

  insert into public.user_ships (user_id, character_id, sto_ship_id, ownership_status, acquisition_source_id, acquisition_group, usage_mode)
  select v_user_id, c.id, p_ship_id, 'owned', p_acquisition_source_id, p_acquisition_group, 'build_pending'
  from unnest(p_character_ids) as c(id)
  where not exists (
    select 1 from public.user_ships us
    where us.user_id=v_user_id and us.character_id=c.id and us.sto_ship_id=p_ship_id
  )
  on conflict (user_id, character_id, sto_ship_id) do nothing;
  get diagnostics v_added = row_count;
  return v_count + v_added;
end;
$$;

revoke execute on function public.claim_ship_assignments(uuid, uuid[], uuid, text) from anon;
grant execute on function public.claim_ship_assignments(uuid, uuid[], uuid, text) to authenticated;
