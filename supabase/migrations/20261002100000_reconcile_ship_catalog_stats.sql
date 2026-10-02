-- Reconcile the live STO ship catalogue with the app's extended ship-stat schema.
-- Safe to apply after the original sto_ships table exists.
ALTER TABLE public.sto_ships
  ADD COLUMN IF NOT EXISTS hull_modifier numeric,
  ADD COLUMN IF NOT EXISTS shield_modifier numeric,
  ADD COLUMN IF NOT EXISTS turn_rate numeric,
  ADD COLUMN IF NOT EXISTS impulse_modifier numeric,
  ADD COLUMN IF NOT EXISTS inertia numeric,
  ADD COLUMN IF NOT EXISTS base_hull integer,
  ADD COLUMN IF NOT EXISTS base_shields integer,
  ADD COLUMN IF NOT EXISTS fore_weapon_slots integer,
  ADD COLUMN IF NOT EXISTS aft_weapon_slots integer,
  ADD COLUMN IF NOT EXISTS experimental_weapon_slot boolean,
  ADD COLUMN IF NOT EXISTS hangar_bays integer,
  ADD COLUMN IF NOT EXISTS engineering_console_slots integer,
  ADD COLUMN IF NOT EXISTS science_console_slots integer,
  ADD COLUMN IF NOT EXISTS tactical_console_slots integer,
  ADD COLUMN IF NOT EXISTS universal_console_slots integer,
  ADD COLUMN IF NOT EXISTS bridge_officer_stations jsonb,
  ADD COLUMN IF NOT EXISTS ship_trait text,
  ADD COLUMN IF NOT EXISTS special_console text,
  ADD COLUMN IF NOT EXISTS special_weapons text,
  ADD COLUMN IF NOT EXISTS special_mechanics text,
  ADD COLUMN IF NOT EXISTS source_reference text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS data_version text;

-- Verified Alliance Rex Pilot Escort catalogue data.
UPDATE public.sto_ships
SET
  hull_modifier = 1.1,
  shield_modifier = 1.2,
  turn_rate = 16,
  impulse_modifier = 0.21,
  inertia = 60,
  fore_weapon_slots = 5,
  aft_weapon_slots = 2,
  experimental_weapon_slot = true,
  hangar_bays = 0,
  engineering_console_slots = 2,
  science_console_slots = 4,
  tactical_console_slots = 5,
  universal_console_slots = 0,
  bridge_officer_stations = '{
    "Commander Tactical": 1,
    "Lieutenant Tactical/Miracle Worker": 1,
    "Lieutenant Commander Engineering/Pilot": 1,
    "Ensign Science": 1,
    "Lieutenant Commander Universal": 1
  }'::jsonb,
  ship_trait = 'Inertial Supremacy',
  special_console = 'Elite Alliance Squadron',
  special_weapons = 'Inertial Polaron Shunt',
  special_mechanics = 'Pilot Maneuvers; Alliance Wingmen; Cloak; Can equip Dual Cannons',
  source_reference = 'Star Trek Online — Alliance Rex Pilot Escort specifications',
  data_version = 'catalog-1'
WHERE lower(name) = lower('Rex Pilot Escort');
