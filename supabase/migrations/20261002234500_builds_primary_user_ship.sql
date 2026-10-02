-- The owned ship registry is the canonical personal-ship model.
-- Keep legacy ship_instance_id for backward compatibility during migration.

ALTER TABLE public.builds
  ADD COLUMN IF NOT EXISTS user_ship_id uuid REFERENCES public.user_ships(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS builds_user_ship_idx
  ON public.builds(user_ship_id);

-- Backfill only when the legacy ship instance can be unambiguously mapped
-- by character + ship name. Never guess across duplicate records.
UPDATE public.builds b
SET user_ship_id = us.id
FROM public.ship_instances si
JOIN public.user_ships us
  ON us.character_id = si.character_id
WHERE b.ship_instance_id = si.id
  AND b.user_ship_id IS NULL
  AND (
    lower(trim(us.custom_name)) = lower(trim(si.name))
    OR us.sto_ship_id IN (
      SELECT s.id FROM public.sto_ships s
      WHERE lower(trim(s.name)) = lower(trim(si.name))
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.user_ships us2
    WHERE us2.current_build_id = b.id
      AND us2.id <> us.id
  );

-- Enforce same-user ownership whenever the canonical link is written.
CREATE OR REPLACE FUNCTION public.validate_build_user_ship()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_ship_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_ships
      WHERE id = NEW.user_ship_id
        AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Build user_ship_id must belong to the same user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_build_user_ship_trigger ON public.builds;
CREATE TRIGGER validate_build_user_ship_trigger
BEFORE INSERT OR UPDATE OF user_ship_id, user_id ON public.builds
FOR EACH ROW EXECUTE FUNCTION public.validate_build_user_ship();

REVOKE ALL ON FUNCTION public.validate_build_user_ship() FROM PUBLIC, anon, authenticated;
