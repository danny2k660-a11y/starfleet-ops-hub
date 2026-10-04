-- The recursion guard lives inside refresh_operational_build_readiness,
-- so the operational readiness trigger must remain enabled.
DROP TRIGGER IF EXISTS trg_build_operational_readiness ON public.builds;
CREATE TRIGGER trg_build_operational_readiness
AFTER INSERT OR UPDATE ON public.builds
FOR EACH ROW
EXECUTE FUNCTION public.refresh_operational_build_readiness_from_loadout();
