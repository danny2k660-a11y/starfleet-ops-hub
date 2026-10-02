-- Add explicit provenance fields to every shared ship definition.
-- This lets the catalogue distinguish verified STOWiki records from legacy
-- placeholders without guessing missing statistics.

ALTER TABLE public.sto_ships
  ADD COLUMN IF NOT EXISTS source_key TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

UPDATE public.sto_ships
SET source_key = 'stowiki',
    source_url = 'https://stowiki.net/wiki/Main_Page'
WHERE source_key IS NULL
  AND source_reference ILIKE '%stowiki%';

UPDATE public.sto_ships
SET source_key = 'stowiki',
    source_url = 'https://stowiki.net/wiki/Main_Page'
WHERE source_key IS NULL
  AND data_version = 'stowiki-2026-10';

UPDATE public.sto_ships
SET verified_at = now()
WHERE source_key = 'stowiki'
  AND verified_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sto_ships_source_key
  ON public.sto_ships(source_key);

CREATE INDEX IF NOT EXISTS idx_sto_ships_verified_at
  ON public.sto_ships(verified_at);
