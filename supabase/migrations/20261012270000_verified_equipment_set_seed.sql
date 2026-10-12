-- Seed only set bonuses checked against the current community STO Wiki on 2026-10-12.
-- Unknown sets remain unseeded instead of being guessed.

update public.equipment_catalog
set set_name = 'Prevailing Regalia'
where category = 'Ship Equipment'
  and name like 'Prevailing %'
  and set_name is null;

update public.equipment_catalog
set set_name = 'Task Force Ordnances'
where set_name is null
  and name in (
    'Console - Universal - Ordnance Accelerator',
    'Wide-Angle Advanced Inhibiting Chroniton Torpedo Launcher Mk XII',
    'Advanced Inhibiting Chroniton Rapid Mine Launcher Mk XII'
  );

insert into public.sto_equipment_set_bonuses
  (set_name, piece_threshold, bonus_name, bonus_description, source_reference, verified, data_version, verified_at)
values
  (
    'Prevailing Regalia', 2, 'Well-Rounded',
    '+15 Starship Hull Capacity, +15 Starship Control Expertise, and +15 Starship Weapon Specialization.',
    'https://stowiki.net/wiki/Prevailing_Innervated_Impulse_Engines', true, 'stowiki-2026-10-12', now()
  ),
  (
    'Prevailing Regalia', 3, 'Coagulative Particle Resilience',
    'When damaged by energy damage, gain +1.5 Bonus Energy Damage Resistance Rating for 1.5 seconds, stacking up to 10 times. At 10 stacks, gain +100 Bonus Energy Damage Resistance Rating for 5 seconds. Can occur once every 30 seconds. The wiki notes that the current in-game description of +25 is inaccurate.',
    'https://stowiki.net/wiki/Prevailing_Innervated_Impulse_Engines', true, 'stowiki-2026-10-12', now()
  ),
  (
    'Prevailing Regalia', 4, 'Overwhelming Tactics',
    'Target a foe within 10 km; 0.1-second activation and 1-minute recharge. Reduces the target''s all damage by 50% for 10 seconds.',
    'https://stowiki.net/wiki/Prevailing_Innervated_Impulse_Engines', true, 'stowiki-2026-10-12', now()
  ),
  (
    'Task Force Ordnances', 2, 'Task Force Tunings',
    '+10% Chroniton Weapon Damage, +10% Polaron Energy Weapon Damage, +10% Phaser Energy Weapon Damage, and +10% Flight Turn Rate.',
    'https://stowiki.net/wiki/Advanced_Gamma_Inhibiting_Chronition_Mine_Launcher', true, 'stowiki-2026-10-12', now()
  ),
  (
    'Task Force Ordnances', 3, 'Deep Space Mine',
    'Upgrades the next attack with an Advanced Gamma Chroniton Weapon within 30 seconds: spawns nine mines lasting 90 seconds. Mines respawn 5 seconds after detonation, deal kinetic damage with 20% shield penetration, and their explosions reduce flight speed and turn rate for 14 seconds.',
    'https://stowiki.net/wiki/Advanced_Gamma_Inhibiting_Chronition_Mine_Launcher', true, 'stowiki-2026-10-12', now()
  )
on conflict (set_name, piece_threshold, bonus_name) do update set
  bonus_description = excluded.bonus_description,
  source_reference = excluded.source_reference,
  verified = excluded.verified,
  data_version = excluded.data_version,
  verified_at = excluded.verified_at;
