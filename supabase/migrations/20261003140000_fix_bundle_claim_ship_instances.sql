-- Keep account-level ownership and personal fleet instances in sync.
-- Bundle claims now create user_ships records as well as account ownership.
-- character_id is optional because account-wide unlocks do not belong to one captain.

drop function if exists public.claim_sto_ship_bundle(uuid,timestamptz);

create or replace function public.claim_sto_ship_bundle(p_bundle_id uuid, p_acquired_at timestamptz default now(), p_character_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count integer := 0;
begin
  if v_user is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from public.sto_ship_bundles where id = p_bundle_id) then raise exception 'Bundle not found'; end if;
  if p_character_id is not null and not exists (select 1 from public.characters where id = p_character_id and user_id = v_user) then raise exception 'Character does not belong to this account'; end if;

  insert into public.sto_ship_ownership (user_id, sto_ship_id, ownership_status, acquired_at)
  select v_user, i.sto_ship_id, 'owned', p_acquired_at
  from public.sto_ship_bundle_items i
  where i.bundle_id = p_bundle_id
  on conflict (user_id, sto_ship_id)
  do update set ownership_status='owned', acquired_at=coalesce(excluded.acquired_at, public.sto_ship_ownership.acquired_at);

  insert into public.user_ships (user_id, character_id, sto_ship_id, custom_name, ownership_status, date_acquired)
  select v_user, p_character_id, i.sto_ship_id, s.name, 'owned', p_acquired_at::date
  from public.sto_ship_bundle_items i
  join public.sto_ships s on s.id=i.sto_ship_id
  where i.bundle_id=p_bundle_id
    and not exists (
      select 1 from public.user_ships us
      where us.user_id=v_user
        and us.sto_ship_id=i.sto_ship_id
        and us.character_id is not distinct from p_character_id
        and us.ownership_status='owned'
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.claim_sto_ship_bundle(uuid,timestamptz,uuid) from public;
grant execute on function public.claim_sto_ship_bundle(uuid,timestamptz,uuid) to authenticated;

create or replace function public.sync_account_ship_to_fleet_instance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ownership_status = 'owned' then
    insert into public.user_ships (user_id, character_id, sto_ship_id, custom_name, ownership_status, date_acquired)
    select new.user_id, null, new.sto_ship_id, s.name, 'owned', coalesce(new.acquired_at::date, current_date)
    from public.sto_ships s
    where s.id = new.sto_ship_id
      and not exists (
        select 1 from public.user_ships us
        where us.user_id = new.user_id
          and us.sto_ship_id = new.sto_ship_id
          and us.character_id is null
          and us.ownership_status = 'owned'
      );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_account_ship_to_fleet_instance on public.sto_ship_ownership;
create trigger trg_sync_account_ship_to_fleet_instance
after insert or update of ownership_status on public.sto_ship_ownership
for each row execute function public.sync_account_ship_to_fleet_instance();
