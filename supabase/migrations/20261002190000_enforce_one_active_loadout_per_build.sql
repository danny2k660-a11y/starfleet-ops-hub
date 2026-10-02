-- Keep Fleet Ops deterministic: a build can have many saved loadouts,
-- but only one may be the active configuration at a time.
-- Resolve any legacy duplicates first, keeping the most recently updated row active.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY build_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.loadouts
  WHERE is_active = true
)
UPDATE public.loadouts l
SET is_active = false
FROM ranked r
WHERE l.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS loadouts_one_active_per_build
  ON public.loadouts (build_id)
  WHERE is_active = true;
