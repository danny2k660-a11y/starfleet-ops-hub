-- Keep the STO catalogue empty until verified ship data is imported.
-- The original development migration inserted fake test ships; remove them so
-- the production catalogue never presents fictional STO records as real ships.
DELETE FROM public.sto_ships
WHERE data_version = 'test'
  AND source_reference = 'Test data — not official';
