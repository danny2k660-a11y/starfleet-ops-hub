-- Make the canonical owned-ship record authoritative for readiness.
-- Legacy ship_instances are no longer required when a build has a valid user_ship link.
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
  (us.id IS NOT NULL AND us.character_id IS NOT NULL AND us.ownership_status = 'owned') AS ship_instance_complete,
  (s.id IS NOT NULL) AS catalogue_link_complete,
  (s.source_key = 'stowiki' AND s.verified_at IS NOT NULL) AS ship_definition_verified,
  (SELECT count(*) FROM public.loadouts l WHERE l.build_id = b.id AND l.user_id = b.user_id) AS loadout_count,
  (SELECT count(*) FROM public.loadouts l WHERE l.build_id = b.id AND l.user_id = b.user_id AND l.is_active) AS active_loadout_count
FROM public.builds b
LEFT JOIN LATERAL (
  SELECT us1.*
  FROM public.user_ships us1
  WHERE us1.user_id = b.user_id
    AND (us1.id = b.user_ship_id OR us1.current_build_id = b.id)
  ORDER BY (us1.id = b.user_ship_id) DESC, us1.updated_at DESC, us1.id
  LIMIT 1
) us ON true
LEFT JOIN public.sto_ships s ON s.id = us.sto_ship_id;
GRANT SELECT ON public.sto_build_readiness_audit TO authenticated;
