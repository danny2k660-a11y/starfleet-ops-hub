-- Read-only readiness summary for the active build/loadout workflow.
-- This is an audit, not a DPS score: it only reports structural completeness.

CREATE OR REPLACE VIEW public.sto_build_readiness_audit
WITH (security_invoker = true)
AS
SELECT
  b.id AS build_id,
  b.user_id,
  b.name AS build_name,
  b.status,
  us.id AS user_ship_id,
  us.custom_name AS ship_name,
  us.sto_ship_id,
  s.name AS catalogue_ship_name,
  s.source_key,
  s.verified_at,
  (
    us.id IS NOT NULL
    AND us.character_id IS NOT NULL
  ) AS ship_instance_complete,
  (
    s.id IS NOT NULL
  ) AS catalogue_link_complete,
  (
    s.source_key = 'stowiki'
    AND s.verified_at IS NOT NULL
  ) AS ship_definition_verified,
  (
    SELECT count(*) FROM public.loadouts l
    WHERE l.build_id = b.id
      AND l.user_id = b.user_id
  ) AS loadout_count,
  (
    SELECT count(*) FROM public.loadouts l
    WHERE l.build_id = b.id
      AND l.user_id = b.user_id
      AND l.is_active
  ) AS active_loadout_count
FROM public.builds b
LEFT JOIN public.user_ships us
  ON us.current_build_id = b.id
 AND us.user_id = b.user_id
LEFT JOIN public.sto_ships s
  ON s.id = us.sto_ship_id;

GRANT SELECT ON public.sto_build_readiness_audit TO authenticated;
