-- Security hardening: enforce ownership across foreign-key relationships.
-- RLS protects rows directly, but foreign keys alone do not prevent a user
-- from supplying another user's UUID as a parent reference.
create or replace function public.validate_user_owned_character()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.character_id is not null
     and not exists (
       select 1 from public.characters
       where id = new.character_id and user_id = new.user_id
     ) then
    raise exception 'Character does not belong to this user';
  end if;
  return new;
end;
$$;

create or replace function public.validate_user_owned_build()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ship_instance_id is not null
     and not exists (
       select 1 from public.ship_instances
       where id = new.ship_instance_id and user_id = new.user_id
     ) then
    raise exception 'Ship instance does not belong to this user';
  end if;
  return new;
end;
$$;

create or replace function public.validate_user_owned_loadout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.builds
    where id = new.build_id and user_id = new.user_id
  ) then
    raise exception 'Build does not belong to this user';
  end if;
  return new;
end;
$$;

create or replace function public.validate_user_owned_loadout_equipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.loadouts
    where id = new.loadout_id and user_id = new.user_id
  ) then
    raise exception 'Loadout does not belong to this user';
  end if;

  if not exists (
    select 1 from public.equipment_items
    where id = new.equipment_id and user_id = new.user_id
  ) then
    raise exception 'Equipment item does not belong to this user';
  end if;

  return new;
end;
$$;

create or replace function public.validate_user_owned_loadout_child()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.loadouts
    where id = new.loadout_id and user_id = new.user_id
  ) then
    raise exception 'Loadout does not belong to this user';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_user_owned_character() from public, anon, authenticated;
revoke execute on function public.validate_user_owned_build() from public, anon, authenticated;
revoke execute on function public.validate_user_owned_loadout() from public, anon, authenticated;
revoke execute on function public.validate_user_owned_loadout_equipment() from public, anon, authenticated;
revoke execute on function public.validate_user_owned_loadout_child() from public, anon, authenticated;

drop trigger if exists validate_equipment_character_owner on public.equipment_items;
create trigger validate_equipment_character_owner
before insert or update on public.equipment_items
for each row execute function public.validate_user_owned_character();

drop trigger if exists validate_inventory_character_owner on public.inventory_items;
create trigger validate_inventory_character_owner
before insert or update on public.inventory_items
for each row execute function public.validate_user_owned_character();

drop trigger if exists validate_build_parent_owner on public.builds;
create trigger validate_build_parent_owner
before insert or update on public.builds
for each row execute function public.validate_user_owned_build();

drop trigger if exists validate_loadout_parent_owner on public.loadouts;
create trigger validate_loadout_parent_owner
before insert or update on public.loadouts
for each row execute function public.validate_user_owned_loadout();

drop trigger if exists validate_loadout_equipment_owner on public.loadout_equipment;
create trigger validate_loadout_equipment_owner
before insert or update on public.loadout_equipment
for each row execute function public.validate_user_owned_loadout_equipment();

drop trigger if exists validate_loadout_traits_owner on public.loadout_traits;
create trigger validate_loadout_traits_owner
before insert or update on public.loadout_traits
for each row execute function public.validate_user_owned_loadout_child();

drop trigger if exists validate_loadout_boffs_owner on public.loadout_boffs;
create trigger validate_loadout_boffs_owner
before insert or update on public.loadout_boffs
for each row execute function public.validate_user_owned_loadout_child();
