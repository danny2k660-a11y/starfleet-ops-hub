-- Fix the readiness trigger for loadouts.
-- loadouts rows have build_id/loadout id; they do not have loadout_id.
CREATE OR REPLACE FUNCTION public.refresh_operational_build_readiness_from_loadout()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_build_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'builds' THEN
    v_build_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'loadouts' THEN
    v_build_id := COALESCE(NEW.build_id, OLD.build_id);
  ELSE
    SELECT build_id INTO v_build_id
    FROM public.loadouts
    WHERE id = COALESCE(NEW.loadout_id, OLD.loadout_id);
  END IF;

  IF v_build_id IS NOT NULL THEN
    PERFORM public.refresh_operational_build_readiness(v_build_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
