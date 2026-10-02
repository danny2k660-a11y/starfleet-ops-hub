-- Promote 2026 release identity records to official STO provenance.
-- This still does not set verified_at: the app reserves that field for direct
-- STOWiki verification.
UPDATE public.sto_ships
SET source_key='official-sto-2026',
    source_url='https://www.playstartrekonline.com/',
    source_reference='Official STO 2026 release announcement',
    data_version='official-sto-2026'
WHERE name IN (
  'NP Miracle Worker Light Escort',
  'Andorian Kumari Pilot Light Battlecruiser',
  'NV Multi-Mission Temporal Cruiser',
  'Suurok Intel Science Destroyer',
  'Armstrong Miracle Worker Dreadnought Cruiser',
  'Newton Command Science Carrier',
  'Salcombe Intel Escort',
  'Narada Miracle Worker Juggernaut',
  'NX Escort Refit',
  'Xindi-Primate Ateleth Dreadnought Cruiser',
  'Damocles Class',
  'Constitution Pilot Multi-Mission Cruiser',
  'K''vort Temporal Flight Deck Raptor'
);