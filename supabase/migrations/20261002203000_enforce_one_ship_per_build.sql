-- A build is the primary configuration for at most one owned ship.
-- The UI already clears old links before assigning a build; this constraint
-- makes that invariant true even when data is changed outside the UI.
CREATE UNIQUE INDEX IF NOT EXISTS user_ships_one_current_ship_per_build
  ON public.user_ships (current_build_id)
  WHERE current_build_id IS NOT NULL;

-- Keep the upgrade flags monotonic at the database boundary as well.
CREATE OR REPLACE FUNCTION public.validate_user_ship()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.characters
    WHERE id = NEW.character_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Character does not belong to this user';
  END IF;

  IF NEW.current_build_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.builds
       WHERE id = NEW.current_build_id AND user_id = NEW.user_id
     ) THEN
    RAISE EXCEPTION 'Build does not belong to this user';
  END IF;

  IF NEW.ownership_status NOT IN ('owned','wishlist','retired') THEN
    RAISE EXCEPTION 'Invalid ownership status';
  END IF;

  IF NEW.t6x2_upgraded THEN NEW.t6x_upgraded := true; END IF;
  IF NEW.t6x_upgraded THEN NEW.t6_upgraded := true; END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_user_ship() FROM PUBLIC, anon, authenticated;
