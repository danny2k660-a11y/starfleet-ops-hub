-- Accuracy-first cleanup of malformed legacy catalogue placeholders and exact
-- wiki-backed completion for records where the current source publishes the value.
-- This intentionally does not invent source-limited movement values.

delete from public.sto_ships where name in (
  'Atlantis-class Temporal Destroyer',
  'Fleet Aquarius Light Escort (T6)',
  'Fleet Concorde Operations Command Battlecruiser',
  'Fleet Geneva Science Command Battlecruiser',
  'Fleet Hestia Temporal Escort',
  'Fleet Presidio Tactical Command Battlecruiser',
  'Fleet Prometheus Advanced Heavy Escort',
  'Fleet Saber Escort',
  'Fleet Scott Operations Miracle Worker Cruiser',
  'Fleet Tucker Tactical Miracle Worker Cruiser',
  'Fleet Vo''DevwI Support Carrier'
);

update public.sto_ships
set ship_class='Heavy Raider', faction='Any', tier='T6',
    hull_modifier=1.15, shield_modifier=0.8, turn_rate=20,
    impulse_modifier=0.22, inertia=75,
    fore_weapon_slots=5, aft_weapon_slots=1,
    bridge_officer_stations=jsonb_build_object('stations', jsonb_build_array(
      'Commander Tactical/Intel', 'Lieutenant Commander Universal',
      'Lieutenant Commander Universal', 'Lieutenant Universal/Temporal Operative',
      'Ensign Universal')),
    source_key='community-crosscheck',
    source_url='https://sto.fandom.com/wiki/Terran_Adamant_Heavy_Raider',
    source_reference='Current Official Star Trek Online Wiki page; catalogue cross-check only',
    data_version='wiki-crosscheck-2026', verified_at=null
where name='Adamant Heavy Raider';

update public.sto_ships fleet
set bridge_officer_stations=base.bridge_officer_stations,
    source_key='community-crosscheck',
    source_url='https://sto.fandom.com/wiki/Fleet_Akira_Heavy_Strike_Wing_Escort',
    source_reference='Current Official Star Trek Online Wiki / existing T6 catalogue cross-check',
    data_version='wiki-crosscheck-2026', verified_at=null
from public.sto_ships base
where fleet.name='Fleet Akira Heavy Strike Wing Escort'
  and base.name='Fleet Akira Heavy Strike Wing Escort (T6)'
  and fleet.bridge_officer_stations is null;

update public.sto_ships
set impulse_modifier=0.20, inertia=60,
    source_key='community-crosscheck',
    source_url='https://sto.fandom.com/wiki/Fleet_Nova_Science_Vessel_Retrofit',
    source_reference='Current Official Star Trek Online Wiki',
    data_version='wiki-crosscheck-2026', verified_at=null
where name='Nova Science Vessel Retrofit';

update public.sto_ships
set impulse_modifier=0.20, inertia=70,
    source_key='community-crosscheck',
    source_url='https://sto.fandom.com/wiki/Fleet_Defiant_Tactical_Escort',
    source_reference='Current Official Star Trek Online Wiki',
    data_version='wiki-crosscheck-2026', verified_at=null
where name='Fleet Defiant Tactical Escort Retrofit';

update public.sto_ships
set inertia=70,
    source_key='community-crosscheck',
    source_url='https://sto.fandom.com/wiki/Nausicaan_Scourge_Destroyer_Retrofit',
    source_reference='Current Official Star Trek Online Wiki',
    data_version='wiki-crosscheck-2026', verified_at=null
where name='Nausicaan Scourge Destroyer';
