-- Record STOWiki as the primary ship-definition provenance for the catalogue.
-- Acquisition/store data remains a separate layer and must not be inferred from ship specs.

CREATE TABLE IF NOT EXISTS public.sto_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  name text NOT NULL,
  base_url text NOT NULL,
  source_type text NOT NULL DEFAULT 'wiki',
  purpose text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  verified_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sto_data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read STO data sources" ON public.sto_data_sources;
CREATE POLICY "Authenticated users can read STO data sources"
  ON public.sto_data_sources FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.sto_data_sources
  (source_key, name, base_url, source_type, purpose, notes)
VALUES
  (
    'stowiki',
    'Star Trek Online Wiki',
    'https://stowiki.net/wiki/Main_Page',
    'wiki',
    'Primary ship-definition source for STO Command Center',
    'Use for ship specifications and ship-page facts. Acquisition availability, prices, bundles and account ownership remain separate audited records.'
  )
ON CONFLICT (source_key) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  source_type = EXCLUDED.source_type,
  purpose = EXCLUDED.purpose,
  notes = EXCLUDED.notes,
  updated_at = now();

-- Replace legacy Fandom provenance on the four core records with the chosen
-- STOWiki source. No numerical/statistical fields are changed by this migration.
UPDATE public.sto_ships
SET source_reference = 'STOWiki; https://stowiki.net/wiki/Thrai_Dreadnought_Warbird',
    data_version = 'stowiki-2026-10'
WHERE name = 'Thrai Dreadnought Warbird';

UPDATE public.sto_ships
SET source_reference = 'STOWiki; https://stowiki.net/wiki/Legendary_Scimitar_Intel_Dreadnought_Warbird',
    data_version = 'stowiki-2026-10'
WHERE name = 'Legendary Scimitar Intel Dreadnought Warbird';

UPDATE public.sto_ships
SET source_reference = 'STOWiki; https://stowiki.net/wiki/Alliance_Rex_Pilot_Escort',
    data_version = 'stowiki-2026-10'
WHERE name = 'Alliance Rex Pilot Escort';

UPDATE public.sto_ships
SET source_reference = 'STOWiki; https://stowiki.net/wiki/Hur%27q_Vedcrid_Hive_Dreadnought_Carrier',
    data_version = 'stowiki-2026-10'
WHERE name = 'Hur''q Vedcrid Hive Dreadnought Carrier';
