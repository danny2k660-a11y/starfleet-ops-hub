-- Verified core catalogue records for the ships already central to the STO Command Center.
-- Stats are sourced from published STO ship information; unknown fields remain NULL
-- rather than being guessed. Personal ship instances remain in user_ships.

INSERT INTO public.sto_ships (
  name, ship_class, faction, tier,
  hull_modifier, shield_modifier, turn_rate, impulse_modifier, inertia,
  fore_weapon_slots, aft_weapon_slots, experimental_weapon_slot, hangar_bays,
  engineering_console_slots, science_console_slots, tactical_console_slots, universal_console_slots,
  bridge_officer_stations, ship_trait, special_console, special_weapons, special_mechanics,
  description, source_reference, data_version
) VALUES
(
  'Alliance Rex Pilot Escort', 'Pilot Escort', 'Any', 'T6',
  1.1, 1.2, 16, 0.21, 60,
  5, 2, true, 0,
  2, 4, 5, 0,
  '["Commander Tactical","Lieutenant Tactical / Miracle Worker","Lieutenant Commander Engineering / Pilot","Ensign Science","Lieutenant Commander Universal"]'::jsonb,
  'Inertial Supremacy',
  'Elite Alliance Squadron',
  'Inertial Polaron Shunt',
  'Pilot Maneuvers; Alliance Wingmen; Cloak; Dual Cannons',
  'Alliance event Pilot Escort with Alliance Wingmen and Pilot Maneuvers.',
  'Star Trek Online official anniversary announcement; https://www.playstartrekonline.com/en/news/article/11561963',
  'verified-2026-10'
),
(
  'Hur''q Vedcrid Hive Dreadnought Carrier', 'Dreadnought Carrier / Engineering Carrier', 'Any', 'T6',
  1.7, 0.8, 8, 0.16, 30,
  4, 3, false, 2,
  5, 2, 4, 0,
  '["Lieutenant Commander Tactical","Ensign Engineering","Commander Engineering / Command","Lieutenant Science","Lieutenant Commander Universal"]'::jsonb,
  'Repulsive',
  'Energy Nullifier Disperser',
  NULL,
  'Carrier Commands; Inspiration Abilities; Subsystem Targeting; 2 Hangar Bays',
  'Hur''q Dreadnought Carrier / Engineering Carrier hybrid.',
  'Star Trek Online official ship announcement; https://www.playstartrekonline.com/en/news/article/11000293',
  'verified-2026-10'
),
(
  'Thrai Dreadnought Warbird', 'Dreadnought Warbird', 'Romulan', 'T6',
  1.45, 1.1, 8.5, 0.15, 35,
  5, 3, false, 1,
  5, 2, 4, 0,
  '["Lieutenant Commander Tactical / Temporal Operative","Lieutenant Engineering / Command","Commander Engineering","Lieutenant Science","Lieutenant Universal"]'::jsonb,
  'Layered Shielding',
  'Secondary Shield Projector',
  NULL,
  'Romulan Battle Cloak; Singularity Core; Carrier Commands; 1 Hangar Bay',
  '23rd-century Romulan Dreadnought Warbird.',
  'Star Trek Online wiki; https://sto.fandom.com/wiki/Thrai_Dreadnought_Warbird',
  'verified-2026-10'
),
(
  'Legendary Scimitar Intel Dreadnought Warbird', 'Dreadnought Warbird', 'Any', 'T6',
  1.4, 1.15, 7.5, 0.15, 30,
  5, 3, false, 1,
  3, 3, 5, 0,
  '["Commander Tactical / Intelligence","Lieutenant Commander Engineering / Command","Lieutenant Commander Universal","Lieutenant Universal","Ensign Universal"]'::jsonb,
  'Super Charged Weapons',
  'Cloaked Barrage; Secondary Shields; Singularity Detector Unit; Adaptive Emergency Systems; Violent Dampening Wave; Fleet Weapon Acceleration',
  NULL,
  'Scimitar Battle Cloak; Gather Intelligence; Carrier Commands; 1 Romulan Drone Ship Hangar; Singularity Core',
  'Legendary Scimitar Intel Dreadnought Warbird.',
  'Star Trek Online wiki; https://sto.fandom.com/wiki/Legendary_Scimitar_Intel_Dreadnought_Warbird',
  'verified-2026-10'
)
ON CONFLICT DO NOTHING;
