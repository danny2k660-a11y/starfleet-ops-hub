-- Read-only audit surface for the ship catalogue.
-- It deliberately reports missing data rather than inventing values.

CREATE OR REPLACE VIEW public.sto_ship_catalogue_audit
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.name,
  s.ship_class,
  s.faction,
  s.tier,
  s.source_key,
  s.source_url,
  s.source_reference,
  s.data_version,
  s.verified_at,
  (
    s.ship_class IS NOT NULL
    AND s.faction IS NOT NULL
    AND s.tier IS NOT NULL
  ) AS classification_complete,
  (
    s.hull_modifier IS NOT NULL
    AND s.shield_modifier IS NOT NULL
    AND s.turn_rate IS NOT NULL
    AND s.inertia IS NOT NULL
  ) AS mobility_complete,
  (
    s.fore_weapon_slots IS NOT NULL
    AND s.aft_weapon_slots IS NOT NULL
    AND s.engineering_console_slots IS NOT NULL
    AND s.science_console_slots IS NOT NULL
    AND s.tactical_console_slots IS NOT NULL
  ) AS layout_complete,
  (
    s.bridge_officer_stations IS NOT NULL
    AND jsonb_array_length(
      CASE
        WHEN jsonb_typeof(s.bridge_officer_stations) = 'array'
          THEN s.bridge_officer_stations
        ELSE '[]'::jsonb
      END
    ) > 0
  ) AS seating_complete,
  (
    s.source_reference IS NOT NULL
    AND s.data_version IS NOT NULL
  ) AS provenance_complete,
  (
    s.source_key = 'stowiki'
    AND s.verified_at IS NOT NULL
  ) AS stowiki_verified
FROM public.sto_ships s;

GRANT SELECT ON public.sto_ship_catalogue_audit TO authenticated;
