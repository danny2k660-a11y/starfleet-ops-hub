-- Normalize bridge officer seating so the UI receives the actual station labels
-- rather than a wrapper object whose key is displayed as "slots".
-- Example: ["Commander Tactical Intel", "Lieutenant Commander Universal", ...]

update public.sto_ships
set bridge_officer_stations = (
  select coalesce(
    jsonb_agg(
      coalesce(
        x->>'label',
        concat_ws(' ', x->>'rank', x->>'career', x->>'specialization')
      )
      order by coalesce((x->>'slot')::int, 999)
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(bridge_officer_stations->'slots') as e(x)
),
updated_at = now()
where jsonb_typeof(bridge_officer_stations) = 'object'
  and bridge_officer_stations ? 'slots';
