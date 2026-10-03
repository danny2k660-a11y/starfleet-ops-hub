-- Fill missing ship trait/console fields from the existing reference layer.
-- Existing stronger values are preserved.
update public.sto_ships s
set ship_trait=coalesce(s.ship_trait,r.trait_name),
    special_console=coalesce(s.special_console,r.console_name),
    updated_at=now()
from public.sto_ship_reference_data r
where r.sto_ship_id=s.id
  and (s.ship_trait is null or s.special_console is null)
  and (r.trait_name is not null or r.console_name is not null);
