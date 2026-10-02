-- Register the community catalogue used to make the ship browser complete.
-- These records are provenance-tracked but deliberately remain unverified until
-- individually corroborated against STOWiki.
INSERT INTO public.sto_data_sources
  (source_key,name,base_url,source_type,purpose,notes)
VALUES (
  'community-stoshipdb',
  'STO Ship DB / wkrick',
  'https://github.com/wkrick/stoshipdb',
  'community',
  'Reference catalogue for T6 ship identities, classes and factions.',
  'The upstream project reports 492 matched ships as of 2025-11-11 and says its data is based on Fleffle''s Sortable/Filterable T6 Ship List v2. This source is not treated as STOWiki verification.'
)
ON CONFLICT (source_key) DO UPDATE SET
  name=EXCLUDED.name, base_url=EXCLUDED.base_url, source_type=EXCLUDED.source_type,
  purpose=EXCLUDED.purpose, notes=EXCLUDED.notes, updated_at=now();

UPDATE public.sto_ships
SET source_reference='Community STO Ship DB; https://github.com/wkrick/stoshipdb/blob/main/src/assets/shipdata.json',
    data_version='community-stoshipdb-2025-11-11'
WHERE source_key='community-stoshipdb';