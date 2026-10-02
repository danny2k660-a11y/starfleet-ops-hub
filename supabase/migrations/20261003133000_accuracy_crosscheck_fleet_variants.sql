-- Accuracy-first catalogue cross-checks.
-- These values come from exact fleet-variant pages where available.
-- They are intentionally NOT marked STOWiki-verified.

update public.sto_ships
set tactical_console_slots=5,
    engineering_console_slots=3,
    science_console_slots=3,
    universal_console_slots=0,
    source_key='community-crosscheck',
    source_url='https://sto.fandom.com/wiki/Fleet_Akira_Heavy_Strike_Wing_Escort_%28T6%29',
    source_reference='Official Star Trek Online Wiki mirror: exact Fleet Akira Heavy Strike Wing Escort (T6) page',
    data_version='wiki-crosscheck-2026',
    verified_at=null
where name='Fleet Akira Heavy Strike Wing Escort';

update public.sto_ships
set tactical_console_slots=4,
    engineering_console_slots=4,
    science_console_slots=3,
    universal_console_slots=1,
    source_key='community-crosscheck',
    source_url='https://sto.fandom.com/wiki/Fleet_Saber_Miracle_Worker_Escort',
    source_reference='Official Star Trek Online Wiki mirror: exact Fleet Saber Miracle Worker Escort page',
    data_version='wiki-crosscheck-2026',
    verified_at=null
where name='Fleet Saber Miracle Worker Escort';

update public.sto_ships
set tactical_console_slots=5,
    engineering_console_slots=3,
    science_console_slots=3,
    universal_console_slots=0,
    source_key='community-crosscheck',
    source_url='https://sto.fandom.com/wiki/Fleet_Hephaestus_Advanced_Escort_%28T6%29',
    source_reference='Official Star Trek Online Wiki mirror: exact Fleet Hephaestus Advanced Escort (T6) page',
    data_version='wiki-crosscheck-2026',
    verified_at=null
where name='Fleet Hephaestus Advanced Escort (T6)';

-- Do not retain inferred Fleet Command Battlecruiser modifiers.
-- The exact non-fleet Concorde/Geneva/Presidio pages are not sufficient evidence
-- for the Fleet variants, so those fields remain source-limited rather than guessed.
update public.sto_ships
set hull_modifier=null,
    shield_modifier=null,
    turn_rate=null,
    impulse_modifier=null,
    inertia=null,
    source_key='community-crosscheck',
    source_url='https://stowiki.net/wiki/Category:Playable_starships',
    source_reference='Catalogue identification only; detailed Fleet variant stats require exact source verification',
    data_version='catalogue-crosscheck-2026',
    verified_at=null
where name in (
  'Fleet Concorde Operations Command Battlecruiser',
  'Fleet Geneva Science Command Battlecruiser',
  'Fleet Presidio Tactical Command Battlecruiser'
);
