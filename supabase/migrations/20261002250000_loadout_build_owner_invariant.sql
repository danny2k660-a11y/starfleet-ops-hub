-- Enforce ownership across build/loadout relationships at the database boundary.
create or replace function public.validate_build_loadout_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  build_owner uuid;
begin
  select user_id into build_owner from public.builds where id = new.build_id;
  if build_owner is null or build_owner <> new.user_id then
    raise exception 'Build and loadout must belong to the same user';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_build_loadout_owner() from public, anon, authenticated;

drop trigger if exists trg_validate_build_loadout_owner on public.loadouts;
create trigger trg_validate_build_loadout_owner
before insert or update of build_id, user_id on public.loadouts
for each row execute function public.validate_build_loadout_owner();

create or replace function public.validate_loadout_child_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  loadout_owner uuid;
begin
  select user_id into loadout_owner from public.loadouts where id = new.loadout_id;
  if loadout_owner is null then
    raise exception 'Loadout does not exist';
  end if;
  if exists (select 1 from public.builds b join public.loadouts l on l.build_id=b.id where l.id=new.loadout_id and b.user_id<>loadout_owner) then
    raise exception 'Loadout and build ownership mismatch';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_loadout_child_owner() from public, anon, authenticated;
