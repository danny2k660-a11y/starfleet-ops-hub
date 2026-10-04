-- Harden operational readiness security and keep the build trigger migration accurate.
ALTER VIEW public.sto_ship_data_quality SET (security_invoker = true);

REVOKE EXECUTE ON FUNCTION public.expand_account_wide_zen_store_ship() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_build_readiness(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_build_character(uuid) FROM anon;

ALTER FUNCTION public.refresh_operational_build_readiness(uuid) SET search_path = public;
ALTER FUNCTION public.refresh_operational_build_readiness_from_loadout() SET search_path = public;
ALTER FUNCTION public.refresh_operational_build_readiness_from_user_ship() SET search_path = public;

-- The live trigger is trg_build_operational_readiness. Keep it enabled; the
-- readiness function itself contains the pg_trigger_depth recursion guard.
ALTER TABLE public.builds DISABLE TRIGGER trg_build_operational_readiness;
ALTER TABLE public.builds ENABLE TRIGGER trg_build_operational_readiness;
