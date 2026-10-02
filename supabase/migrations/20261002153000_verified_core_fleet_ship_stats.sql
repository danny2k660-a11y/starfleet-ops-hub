-- Verified core fleet ship specifications.
-- Values are sourced from documented STO ship specifications; unknown fields remain NULL.
-- This migration enriches existing catalogue records without changing personal ship instances.

UPDATE public.sto_ships
SET
  hull_modifier = 1.15,
  shield_modifier = 0.8,
  turn_rate = 20,
  impulse_modifier = 0.22,
  inertia = 75,
  fore_weapon_slots = 5,
  aft_weapon_slots = 1,
  experimental_weapon_slot = true,
  hangar_bays = 0,
  engineering_console_slots = 3,
  science_console_slots = 3,
  tactical_console_slots = 5,
  universal_console_slots = 0,
  bridge_officer_stations = '{
    "Commander Tactical/Intelligence": 1,
    "Ensign Universal": 1,
    "Lieutenant Universal/Temporal Operative": 1,
    "Lieutenant Commander Universal": 2
  }'::jsonb,
  special_mechanics = 'Raider Flanking; Battle Cloak; Active Sensor Arrays; Can equip Dual Cannons',
  source_reference = 'Official Star Trek Online Wiki — Terran Adamant Heavy Raider; Arc Games 12th Anniversary Terran Bundle',
  data_version = 'catalog-verified-2'
WHERE lower(name) = lower('Terran Adamant Heavy Raider');

UPDATE public.sto_ships
SET
  hull_modifier = 1.4,
  shield_modifier = 1.15,
  turn_rate = 7.5,
  impulse_modifier = 0.15,
  inertia = 30,
  fore_weapon_slots = 5,
  aft_weapon_slots = 3,
  experimental_weapon_slot = false,
  hangar_bays = 1,
  engineering_console_slots = 3,
  science_console_slots = 3,
  tactical_console_slots = 5,
  universal_console_slots = 0,
  bridge_officer_stations = '{
    "Commander Tactical/Intelligence": 1,
    "Lieutenant Commander Engineering/Command": 1,
    "Lieutenant Commander Universal": 1,
    "Lieutenant Universal": 1,
    "Ensign Universal": 1
  }'::jsonb,
  ship_trait = 'Adaptive Hull Plating',
  special_mechanics = 'Scimitar Battle Cloak; Cloaked Barrage; Secondary Shields; Launch Romulan Drone Ship; Carrier Commands; Can equip Dual Cannons',
  source_reference = 'Official Star Trek Online Wiki — Legendary Scimitar Intel Dreadnought Warbird; STO Zone bridge officer configuration',
  data_version = 'catalog-verified-2'
WHERE lower(name) = lower('Legendary Scimitar Intel Dreadnought Warbird');

UPDATE public.sto_ships
SET
  hull_modifier = 1.45,
  shield_modifier = 1.1,
  turn_rate = 8.5,
  impulse_modifier = 0.15,
  inertia = 35,
  fore_weapon_slots = 5,
  aft_weapon_slots = 3,
  experimental_weapon_slot = false,
  hangar_bays = 1,
  engineering_console_slots = 5,
  science_console_slots = 2,
  tactical_console_slots = 4,
  universal_console_slots = 0,
  bridge_officer_stations = '{
    "Commander Engineering": 1,
    "Lieutenant Commander Tactical/Temporal Operative": 1,
    "Lieutenant Engineering/Command": 1,
    "Lieutenant Science": 1,
    "Lieutenant Universal": 1
  }'::jsonb,
  special_console = 'Secondary Shield Projector',
  special_mechanics = 'Romulan Battle Cloak; Launch Kaleh Fighters; Carrier Commands; Singularity Core abilities',
  source_reference = 'Official Star Trek Online Wiki — Thrai Dreadnought Warbird',
  data_version = 'catalog-verified-2'
WHERE lower(name) = lower('Thrai Dreadnought Warbird');

UPDATE public.sto_ships
SET
  hull_modifier = 1.7,
  shield_modifier = 0.8,
  turn_rate = 8,
  impulse_modifier = 0.16,
  inertia = 30,
  fore_weapon_slots = 4,
  aft_weapon_slots = 3,
  experimental_weapon_slot = false,
  hangar_bays = 2,
  engineering_console_slots = 5,
  science_console_slots = 2,
  tactical_console_slots = 4,
  universal_console_slots = 0,
  bridge_officer_stations = '{
    "Commander Engineering/Command": 1,
    "Lieutenant Commander Tactical": 1,
    "Lieutenant Commander Universal": 1,
    "Lieutenant Science": 1,
    "Ensign Engineering": 1
  }'::jsonb,
  special_mechanics = 'Launch Hur''q Swarmer Fighters; Carrier Commands; Subsystem Targeting; Inspiration abilities; Can equip Dual Cannons',
  source_reference = 'Official Star Trek Online Wiki — Hur''q Vedcrid Hive Dreadnought Carrier; Star Trek Online official ship announcement',
  data_version = 'catalog-verified-2'
WHERE lower(name) = lower('Hur''q Vedcrid Hive Dreadnought Carrier');
