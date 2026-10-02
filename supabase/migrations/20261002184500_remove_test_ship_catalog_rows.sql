-- Keep the production STO catalogue free of fictional placeholder records.
-- The catalogue is intentionally empty until verified STO data is imported.
DELETE FROM public.sto_ships
WHERE source_reference = 'Test data — not official'
  AND data_version = 'test';

-- Helpful indexes for the catalogue browser and ship-class/faction filters.
CREATE INDEX IF NOT EXISTS sto_ships_faction_idx ON public.sto_ships (faction);
CREATE INDEX IF NOT EXISTS sto_ships_tier_idx ON public.sto_ships (tier);
CREATE INDEX IF NOT EXISTS sto_ships_class_idx ON public.sto_ships (ship_class);
