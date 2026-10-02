-- Accuracy-first enrichment for the 2026 Kelvin Timeline ships.
-- Values are corroborated against current release/community references.
-- These records remain unverified by STOWiki, so verified_at is intentionally unchanged.

update public.sto_ships
set hull_modifier=1.45, shield_modifier=1.1, turn_rate=9, impulse_modifier=0.19, inertia=60,
    fore_weapon_slots=4, aft_weapon_slots=4, hangar_bays=1,
    experimental_weapon_slot=false,
    special_mechanics='Innovation; Cyclical Quantum Slipstream Drive; Weapon System Efficiency; Shield Frequency Modulation; Attract Fire; Cruiser Communications Array',
    source_reference='Official STO 2026 Kelvin Timeline bundle; current community cross-check for numerical fields. Not STOWiki-verified.'
where name='Armstrong Miracle Worker Dreadnought Cruiser';

update public.sto_ships
set hull_modifier=1.4, shield_modifier=1.25, turn_rate=8, impulse_modifier=0.19, inertia=30,
    fore_weapon_slots=3, aft_weapon_slots=3, hangar_bays=2,
    experimental_weapon_slot=false,
    special_mechanics='Inspiration; Subsystem Targeting; Sensor Analysis; Cruiser Communications Array; 2 Hangar Bays',
    special_console='Shared Targeting Network',
    source_reference='Official STO 2026 Kelvin Timeline bundle; current community cross-check for numerical fields. Not STOWiki-verified.'
where name='Newton Command Science Carrier';

update public.sto_ships
set hull_modifier=1.0, shield_modifier=1.0, turn_rate=17, impulse_modifier=0.23, inertia=75,
    fore_weapon_slots=5, aft_weapon_slots=2, experimental_weapon_slot=true,
    special_mechanics='Active Sensor Arrays; Cloaking Device; Intel',
    special_console='Sigma Strategem',
    source_reference='Official STO 2026 Kelvin Timeline bundle; current community cross-check for numerical fields. Not STOWiki-verified.'
where name='Salcombe Intel Escort';

update public.sto_ships
set hull_modifier=1.2, shield_modifier=1.1, turn_rate=21, impulse_modifier=0.19, inertia=60,
    fore_weapon_slots=5, aft_weapon_slots=2, experimental_weapon_slot=true, hangar_bays=1,
    tactical_console_slots=5, engineering_console_slots=4, science_console_slots=2,
    bridge_officer_stations='{"Commander":"Tactical/Temporal Operative","LtCommander":"Engineering/Command; Universal (2 stations)","Lieutenant":"Science","Ensign":"Tactical"}'::jsonb,
    special_console='Hunting Pack Escorts',
    ship_trait='Imperial Pressure',
    special_weapons='Rapid Fire Disruptor Heavy Emitter',
    special_mechanics='Molecular Reconstruction; Cloaking Device; Flight Deck Raptor; 1 Hangar Bay',
    source_reference='Official STO Undiscovered event announcement plus current community cross-check. Not STOWiki-verified.'
where name='K''vort Temporal Flight Deck Raptor';
