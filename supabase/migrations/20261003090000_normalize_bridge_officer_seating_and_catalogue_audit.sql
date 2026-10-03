-- Normalize bridge officer seating into the dedicated display field.
-- The UI should use bridge_officer_seating for human-readable station labels.
update public.sto_ships s
set bridge_officer_seating = sub.seating,
    updated_at = now()
from (
  select id,
    array_agg(
      concat_ws(' ',
        nullif(trim(slot->>'rank'), ''),
        nullif(trim(slot->>'career'), ''),
        case when nullif(trim(slot->>'specialization'), '') is not null then '(' || trim(slot->>'specialization') || ')' end
      ) order by coalesce((slot->>'slot')::int, 999)
    ) as seating
  from public.sto_ships s2
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(s2.bridge_officer_stations->'slots') = 'array'
      then s2.bridge_officer_stations->'slots' else '[]'::jsonb end
  ) slot
  group by id
) sub
where s.id = sub.id;

-- Ensure the Adamant family has the full five actual stations in display form.
update public.sto_ships
set bridge_officer_seating = array[
  'Commander Tactical (Intel)',
  'Lieutenant Commander Universal',
  'Lieutenant Commander Universal',
  'Lieutenant Universal (Temporal Operative)',
  'Ensign Universal'
],
updated_at = now()
where name in ('Adamant Heavy Raider','Terran Adamant Heavy Raider','Terran Adamant Intel Heavy Raider');

-- Backfill published starship trait/console fields from the linked reference layer
-- where the primary catalogue row is blank.
update public.sto_ships s
set ship_trait = coalesce(s.ship_trait, r.trait_name),
    special_console = coalesce(s.special_console, r.console_name),
    updated_at = now()
from public.sto_ship_reference_data r
where r.sto_ship_id = s.id
  and (s.ship_trait is null or s.special_console is null)
  and (r.trait_name is not null or r.console_name is not null);

-- The source version is recorded for every catalogue row so blank values are
-- distinguishable from untracked data.
update public.sto_ships
set data_version = coalesce(data_version, 'catalogue-audit-2026'), updated_at = now()
where source_key is not null;
