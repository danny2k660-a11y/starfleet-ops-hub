-- These legacy/admin RPCs are no longer called by the client application.
-- Keep them unavailable through the exposed REST RPC surface.
revoke execute on function public.claim_sto_ship_bundle(uuid,timestamptz,uuid) from anon, authenticated;
revoke execute on function public.apply_sto_ship_catalog_import(uuid) from anon, authenticated;
revoke execute on function public.validate_sto_ship_catalog_import(uuid) from anon, authenticated;
revoke execute on function public.refresh_build_readiness(uuid) from anon, authenticated;
revoke execute on function public.validate_build_character(uuid) from anon, authenticated;
