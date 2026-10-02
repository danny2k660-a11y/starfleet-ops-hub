-- Correct current-source URLs to the official STO site root (do not invent article IDs)
-- and populate exact published 2026 stats for the newly added ships where available.
UPDATE public.sto_ships
SET source_url='https://www.playstartrekonline.com/',
    source_reference='Official STO announcement; 2026 release coverage'
WHERE source_key='official-sto-2026';

UPDATE public.sto_ships
SET name='K''vort Temporal Flight Deck Raptor',
    ship_class='Flight Deck Raptor',
    faction='Klingon Empire',
    tier='T6',
    source_key='official-sto-2026',
    source_url='https://www.playstartrekonline.com/',
    source_reference='Official STO Undiscovered announcement; K''vort Temporal Flight Deck Raptor',
    data_version='official-sto-2026'
WHERE lower(name)='k''vort temporal flight-deck cruiser';

UPDATE public.sto_ships
SET hull_modifier=1.25, shield_modifier=1, fore_weapon_slots=5, aft_weapon_slots=3,
    turn_rate=13, impulse_modifier=.17, inertia=50,
    tactical_console_slots=3, engineering_console_slots=5, science_console_slots=3,
    universal_console_slots=1, experimental_weapon_slot=false,
    bridge_officer_stations='[
      {"rank":4,"type":"Engineering","specialization":"Miracle Worker"},
      {"rank":3,"type":"Universal","specialization":""},
      {"rank":3,"type":"Universal","specialization":"Intelligence"},
      {"rank":2,"type":"Universal","specialization":""},
      {"rank":1,"type":"Universal","specialization":""}
    ]'::jsonb,
    special_console='Console - Universal - Escalation Override Assembly',
    special_mechanics='Improved Raider Flanking; Cruiser Communications Array; Cyclical Quantum Slipstream Drive; Miracle Worker',
    source_reference='Official STO May 19, 2026 Damocles announcement',
    data_version='official-sto-2026'
WHERE name='Damocles Class';

UPDATE public.sto_ships
SET hull_modifier=1.6, shield_modifier=1.25, fore_weapon_slots=5, aft_weapon_slots=3,
    turn_rate=5.5, impulse_modifier=.15, inertia=55,
    tactical_console_slots=5, engineering_console_slots=4, science_console_slots=2,
    universal_console_slots=1,
    bridge_officer_stations='[
      {"rank":4,"type":"Tactical","specialization":"Miracle Worker"},
      {"rank":3,"type":"Engineering","specialization":"Temporal Operative"},
      {"rank":3,"type":"Universal","specialization":""},
      {"rank":2,"type":"Tactical","specialization":""},
      {"rank":1,"type":"Science","specialization":""}
    ]'::jsonb,
    special_console='Console - Universal - Rapid Dynamic Hull Regenerator',
    special_mechanics='Innovation; Cyclical Quantum Slipstream Drive; Enhanced Battle Cloak',
    special_weapons='High Energy Pulsating Plasma Drill',
    source_reference='Official STO August 9, 2026 Narada announcement',
    data_version='official-sto-2026'
WHERE name='Narada Miracle Worker Juggernaut';

UPDATE public.sto_ships
SET hull_modifier=1.4, shield_modifier=1, fore_weapon_slots=5, aft_weapon_slots=3,
    turn_rate=15, impulse_modifier=.2, inertia=35, hangar_bays=1,
    tactical_console_slots=3, engineering_console_slots=4, science_console_slots=4,
    bridge_officer_stations='[
      {"rank":4,"type":"Engineering","specialization":"Pilot"},
      {"rank":3,"type":"Universal","specialization":"Command"},
      {"rank":3,"type":"Tactical","specialization":""},
      {"rank":2,"type":"Universal","specialization":""},
      {"rank":1,"type":"Science","specialization":""}
    ]'::jsonb,
    special_console='Console - Universal - Localized Nebula Cloud Generator',
    special_mechanics='Pilot Maneuvers; Cruiser Communications Array',
    source_reference='Official STO September 18, 2026 Constitution Pilot Multi-Mission Cruiser announcement',
    data_version='official-sto-2026'
WHERE name='Constitution Pilot Multi-Mission Cruiser';