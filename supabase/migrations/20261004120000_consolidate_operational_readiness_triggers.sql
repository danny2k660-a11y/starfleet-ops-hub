-- Keep one operational-readiness trigger per source table.
-- The duplicate legacy triggers caused the same readiness function to execute twice.
drop trigger if exists trg_build_readiness_boffs on public.loadout_boffs;
drop trigger if exists trg_build_readiness_equipment on public.loadout_equipment;
drop trigger if exists trg_build_readiness_traits on public.loadout_traits;
drop trigger if exists trg_build_readiness_loadouts on public.loadouts;
drop trigger if exists trg_build_readiness_user_ships on public.user_ships;

-- Retain the current operational triggers:
-- trg_build_operational_readiness
-- trg_loadout_boffs_operational_readiness
-- trg_loadout_equipment_operational_readiness
-- trg_loadout_traits_operational_readiness
-- trg_loadout_operational_readiness
-- trg_user_ship_operational_readiness
