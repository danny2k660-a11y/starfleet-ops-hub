create or replace function public.expand_account_wide_zen_store_ship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if exists (
    select 1 from public.sto_ship_reference_data r
    where r.sto_ship_id = new.sto_ship_id
      and coalesce(r.source, '') in ('C Store', 'C Store (Mudd)')
  ) then
    insert into public.user_ships (
      user_id, character_id, sto_ship_id, custom_name, upgrades,
      current_build_id, theme_id, notes, ownership_status, date_acquired,
      t6_upgraded, t6x_upgraded, t6x2_upgraded
    )
    select new.user_id,c.id,new.sto_ship_id,new.custom_name,new.upgrades,
           null,new.theme_id,new.notes,new.ownership_status,new.date_acquired,
           new.t6_upgraded,new.t6x_upgraded,new.t6x2_upgraded
    from public.characters c
    where c.user_id=new.user_id
      and c.id<>new.character_id
      and not exists (
        select 1 from public.user_ships existing
        where existing.user_id=new.user_id
          and existing.character_id=c.id
          and existing.sto_ship_id=new.sto_ship_id
      );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_expand_account_wide_zen_store_ship on public.user_ships;
create trigger trg_expand_account_wide_zen_store_ship
after insert on public.user_ships
for each row execute function public.expand_account_wide_zen_store_ship();

grant execute on function public.expand_account_wide_zen_store_ship() to authenticated;
