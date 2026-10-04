-- Restrict readiness SECURITY DEFINER RPCs to signed-in users and pin trigger helper search_path.
REVOKE EXECUTE ON FUNCTION public.expand_account_wide_zen_store_ship() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expand_account_wide_zen_store_ship() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.refresh_build_readiness(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_build_readiness(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.validate_build_character(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_build_character(uuid) TO authenticated;

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
