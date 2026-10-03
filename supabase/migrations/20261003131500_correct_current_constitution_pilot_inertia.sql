-- Current official STO patch correction (2026-09-24): the Constitution Pilot
-- Multi-Mission Cruiser inertia was increased from 35 to 55.
update public.sto_ships
set inertia=55,
    data_version='official-sto-2026-2026-09-24-patch'
where name='Constitution Pilot Multi-Mission Cruiser'
  and source_key='official-sto-2026';
