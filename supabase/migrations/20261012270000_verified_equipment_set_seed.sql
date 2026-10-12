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

-- Record unique set-piece identity so alternate variants do not inflate the count.
update public.equipment_catalog
set set_piece = case
  when name ilike '%Deflector Array%' then 'Deflector'
  when name ilike '%Impulse Engines%' then 'Impulse Engines'
  when name ilike '%Resilient Shield Array%' then 'Shield'
  when name ilike '%Warp Core%' or name ilike '%Singularity Core%' then 'Core'
  else set_piece
end
where set_name = 'Prevailing Regalia' and set_piece is null;

update public.equipment_catalog
set set_piece = case
  when name = 'Console - Universal - Ordnance Accelerator' then 'Console'
  when name ilike '%Inhibiting Chroniton%' then 'Projectile'
  else set_piece
end
where set_name = 'Task Force Ordnances' and set_piece is null;

update public.equipment_catalog
set set_name = 'Morphogenic Armaments',
    set_piece = case
      when name ilike 'Morphogenic Polaron Energy Weapon%' then 'Energy Weapon'
      when name ilike 'Morphogenic Polaron Energy Torpedo Launcher%' then 'Torpedo'
      when name ilike 'Console - Tactical - Morphogenic Matrix Controller%' then 'Console'
      else set_piece
    end,
    source_reference = coalesce(source_reference, 'https://sto.fandom.com/wiki/Morphogenic_Armaments'),
    source_type = coalesce(source_type, 'community_wiki'),
    data_quality_status = coalesce(data_quality_status, 'verified'),
    data_version = coalesce(data_version, 'community-wiki-2026-10-12'),
    verified_at = coalesce(verified_at, now())
where name ilike '%Morphogenic%'
  and (set_name is null or set_name = 'Morphogenic Armaments');

update public.equipment_catalog
set set_name = 'Lorca''s Ambition',
    set_piece = case
      when name ilike 'Console - Tactical - Lorca''s Custom Fire Controls%' then 'Console'
      when name ilike 'Dark Matter Quantum Torpedo Launcher%' then 'Torpedo'
      else set_piece
    end,
    source_reference = coalesce(source_reference, 'https://sto.fandom.com/wiki/Lorca%27s_Ambition'),
    source_type = coalesce(source_type, 'community_wiki'),
    data_quality_status = coalesce(data_quality_status, 'verified'),
    data_version = coalesce(data_version, 'community-wiki-2026-10-12'),
    verified_at = coalesce(verified_at, now())
where name ilike '%Lorca''s Custom Fire Controls%'
   or name ilike 'Dark Matter Quantum Torpedo Launcher%';

insert into public.sto_equipment_set_bonuses
  (set_name, piece_threshold, bonus_name, bonus_description, source_reference, verified, data_version, verified_at)
values
  (
    'Morphogenic Armaments', 2, 'Morphogenic Efficiency',
    'Reduces recharge time by 15% for Fire at Will, Beam Overload, Scatter Volley, Rapid Fire, Torpedo Spread, Torpedo High Yield, Mine Pattern Alpha and Mine Pattern Beta.',
    'https://sto.fandom.com/wiki/Morphogenic_Armaments', true, 'community-wiki-2026-10-12', now()
  ),
  (
    'Morphogenic Armaments', 3, 'Hyperactive Morphogenic Enhancements',
    'Activating set-linked firing modes grants a 45-second buff that stacks up to three times: Fire at Will or Beam Overload grants +2% Critical Chance per stack (max 6%); Scatter Volley or Rapid Fire grants +10% Critical Severity per stack (max 30%); Torpedo Spread, High Yield, Mine Pattern Alpha or Beta grants +7.5% Weapon Damage per stack (max 22.5%).',
    'https://sto.fandom.com/wiki/Morphogenic_Armaments', true, 'community-wiki-2026-10-12', now()
  ),
  (
    'Lorca''s Ambition', 2, 'War Discretion',
    'On a critical hit, gain +1% Critical Severity for 20 seconds, stacking up to 25 times.',
    'https://sto.fandom.com/wiki/Lorca%27s_Ambition', true, 'community-wiki-2026-10-12', now()
  ),
  (
    'Lorca''s Ambition', 3, 'But That''s Just the Beginning',
    'Automatically launches one Dark Matter Quantum Torpedo at enemies below 50% health; at most one torpedo per second and no more than one per enemy.',
    'https://sto.fandom.com/wiki/Lorca%27s_Ambition', true, 'community-wiki-2026-10-12', now()
  )
on conflict (set_name, piece_threshold, bonus_name) do update set
  bonus_description = excluded.bonus_description,
  source_reference = excluded.source_reference,
  verified = excluded.verified,
  data_version = excluded.data_version,
  verified_at = excluded.verified_at;
