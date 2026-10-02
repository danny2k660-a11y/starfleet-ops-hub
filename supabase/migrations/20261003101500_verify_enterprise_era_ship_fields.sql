-- Accuracy pass: 2026 Enterprise-era ships.
-- Values are corroborated against the official STO release material and independent 2026 cross-checks.
-- verified_at remains NULL because these records are not STOWiki-verified.
UPDATE public.sto_ships
SET hull_modifier=1.1, shield_modifier=.9, turn_rate=21, impulse_modifier=.21, inertia=75,
    fore_weapon_slots=5, aft_weapon_slots=1, experimental_weapon_slot=true,
    bridge_officer_stations='[{"rank":4,"department":"Universal","specialization":"Miracle Worker"},{"rank":3,"department":"Tactical","specialization":null},{"rank":3,"department":"Universal","specialization":null},{"rank":2,"department":"Engineering","specialization":"Command"},{"rank":1,"department":"Science","specialization":null}]'::jsonb,
    source_reference='Official STO 16th Anniversary Enterprise Bundle + 2026 community cross-check. Not STOWiki-verified.',
    data_version='2026-current-corroborated'
WHERE name='NP Miracle Worker Light Escort';

UPDATE public.sto_ships
SET hull_modifier=1.2, shield_modifier=1.15, turn_rate=11, impulse_modifier=.16, inertia=55,
    fore_weapon_slots=5, aft_weapon_slots=3,
    bridge_officer_stations='[{"rank":4,"department":"Engineering","specialization":"Pilot"},{"rank":3,"department":"Universal","specialization":"Command"},{"rank":3,"department":"Tactical","specialization":null},{"rank":2,"department":"Science","specialization":null},{"rank":1,"department":"Universal","specialization":null}]'::jsonb,
    source_reference='Official STO 16th Anniversary Enterprise Bundle + 2026 community cross-check. Not STOWiki-verified.',
    data_version='2026-current-corroborated'
WHERE name='Andorian Kumari Pilot Light Battlecruiser';

UPDATE public.sto_ships
SET hull_modifier=1.375, shield_modifier=1.0, turn_rate=12, impulse_modifier=.15, inertia=50,
    fore_weapon_slots=4, aft_weapon_slots=4, hangar_bays=1,
    bridge_officer_stations='[{"rank":4,"department":"Engineering","specialization":"Temporal"},{"rank":3,"department":"Universal","specialization":null},{"rank":3,"department":"Tactical","specialization":"Miracle Worker"},{"rank":2,"department":"Tactical","specialization":null},{"rank":1,"department":"Science","specialization":null}]'::jsonb,
    source_reference='Official STO 16th Anniversary Enterprise Bundle + 2026 community cross-check. Not STOWiki-verified.',
    data_version='2026-current-corroborated'
WHERE name='NV Multi-Mission Temporal Cruiser';

UPDATE public.sto_ships
SET hull_modifier=1.1, shield_modifier=1.35, turn_rate=8, impulse_modifier=.20, inertia=75,
    fore_weapon_slots=4, aft_weapon_slots=3, experimental_weapon_slot=true,
    bridge_officer_stations='[{"rank":4,"department":"Science","specialization":"Intelligence"},{"rank":3,"department":"Engineering","specialization":null},{"rank":3,"department":"Tactical","specialization":"Command"},{"rank":2,"department":"Universal","specialization":null},{"rank":1,"department":"Science","specialization":null}]'::jsonb,
    special_weapons='Experimental Hyperexcited Ion Stream Projector',
    source_reference='Official STO 16th Anniversary Bundle + 2026 patch correction for experimental weapon + 2026 community cross-check. Not STOWiki-verified.',
    data_version='2026-current-corroborated'
WHERE name='Suurok Intel Science Destroyer';
